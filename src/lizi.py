"""
Lizi Alert Manager (MQTT Version)
--------------------------------
This script manages security camera alerts by subscribing to MQTT events
and creating/updating alerts based on detection logic.
"""

import os
import json
import time
import logging
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("/app/logs/lizi.log"),
        logging.StreamHandler()
    ]
)

# Create separate loggers
logger = logging.getLogger('lizi')
watcher_logger = logging.getLogger('watchers')
watched_logger = logging.getLogger('watched')

# Configure httpx logger to use watchers name
httpx_logger = logging.getLogger('httpx')
httpx_logger.name = 'watchers'

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv('SUPABASE_URL', 'http://10.0.1.217:8000'),
    os.getenv('SERVICE_ROLE_KEY')
)

logger.info("Environment variables loaded:")
logger.info(f"SUPABASE_URL: {os.getenv('SUPABASE_URL', 'http://10.0.1.217:8000')}")
logger.info(f"SERVICE_ROLE_KEY: {'Present' if os.getenv('SERVICE_ROLE_KEY') else 'Missing'}")

if not os.getenv('SUPABASE_URL') or not os.getenv('SERVICE_ROLE_KEY'):
    raise ValueError("Missing SUPABASE_URL or SERVICE_ROLE_KEY")

logger.info(f"🔌 Connecting to Supabase at {os.getenv('SUPABASE_URL', 'http://10.0.1.217:8000')}")

def should_create_alert(review):
    """
    Determine if an alert should be created based on Frigate's categorization.
    
    Args:
        review (dict): Review event data from Frigate MQTT
        
    Returns:
        tuple: (bool, dict) - (should_create_alert, reasoning)
        
    Frigate Categorization:
    - If Frigate marks it as an alert (is_alert: true), store it
    - If Frigate marks it as a detection (is_alert: false), store it as detection
    - We store both types for potential future evaluation
    """
    reasoning = {
        "decision": None,
        "frigate_categorization": None,
        "criteria_checked": [],
        "details": {}
    }
    
    # Check Frigate's categorization
    is_frigate_alert = review.get('is_alert', False)
    reasoning["frigate_categorization"] = "alert" if is_frigate_alert else "detection"
    reasoning["criteria_checked"].append("frigate_categorization")
    
    # Check if review has zones (optional - for information only)
    zones = review.get('zones', [])
    reasoning["criteria_checked"].append("zones")
    reasoning["details"]["zones"] = f"Found {len(zones)} zones: {zones}" if zones else "No zones detected"
    
    # Check if review has either snapshot or clip (required for storage)
    snapshot_url = review.get('snapshot_url')
    clip_url = review.get('clip_url')
    
    if not snapshot_url and not clip_url:
        reasoning["decision"] = False
        reasoning["criteria_checked"].append("media")
        reasoning["details"]["media"] = "No snapshot or clip URL found"
        return False, reasoning
    
    reasoning["criteria_checked"].append("media")
    reasoning["details"]["media"] = {
        "snapshot_url": snapshot_url,
        "clip_url": clip_url
    }
    
    # Store both alerts and detections for evaluation
    reasoning["decision"] = True
    reasoning["details"]["summary"] = f"Storing {reasoning['frigate_categorization']} for evaluation"
    
    return True, reasoning

def create_alert(review):
    """
    Create a new alert record in the database based on Frigate review data.
    
    Args:
        review (dict): Review event data from Frigate MQTT
        
    Returns:
        dict: Created alert data if successful, None if failed
        
    Alert Data Structure:
    - event_id: Reference to the original review
    - camera: Camera identifier
    - label: Primary detected object
    - zones: Affected security zones
    - reason: Alert description
    - confidence: Detection confidence score
    - created_at: Timestamp
    - triggered: Alert trigger status (false - waiting for evaluation)
    - frigate_categorization: 'alert' or 'detection' from Frigate
    - full_review_payload: Complete review data for analysis
    - update_count: Number of updates (starts at 0)
    """
    try:
        # Get the first object as the primary label
        objects = review.get('objects', [])
        primary_object = objects[0] if objects else None
        
        # Get the first detection score if available
        detections = review.get('metadata', {}).get('detections', [])
        confidence = detections[0].get('score', 0.0) if detections else 0.0
        
        # Determine Frigate categorization
        is_frigate_alert = review.get('is_alert', False)
        frigate_categorization = "alert" if is_frigate_alert else "detection"
        
        # Prepare alert data with all necessary fields
        alert_data = {
            "event_id": review['review_id'],
            "camera": review['camera'],
            "label": primary_object,
            "zones": review.get('zones', []),
            "reason": review.get('reason', f'{frigate_categorization.title()} detected'),
            "confidence": confidence,
            "created_at": datetime.utcnow().isoformat(),
            "triggered": False,  # Will be set by evaluation script later
            "frigate_categorization": frigate_categorization,
            "full_review_payload": review,  # Store complete review data
            "update_count": 0  # Initialize update counter
        }
        
        # Insert alert into database
        result = supabase.table('ai_alerts').insert(alert_data).execute()
        watched_logger.info(f"Stored {frigate_categorization} for review {review['review_id']} from camera {review['camera']}")
        return result.data[0] if result.data else None
        
    except Exception as e:
        logger.error(f"Error creating alert: {e}")
        return None

def update_alert(alert_id, review):
    """
    Update an existing alert with new information from a review update.
    
    Args:
        alert_id (str): ID of the alert to update
        review (dict): Updated review data
        
    Update Fields:
    - updated_at: Timestamp of the update
    - latest_review_type: Type of the latest review (new, update, end)
    - latest_review_timestamp: Timestamp of the latest review
    - additional_objects: New objects detected
    - additional_zones: New zones affected
    - update_count: Incremented counter
    - ended_at: Set when review_type is 'end'
    - full_review_payload: Updated with latest review data
    """
    try:
        # Get current alert to increment update count
        current_alert = supabase.table('ai_alerts').select('update_count').eq('id', alert_id).execute()
        current_update_count = current_alert.data[0]['update_count'] if current_alert.data else 0
        
        # Prepare update data
        update_data = {
            "updated_at": datetime.utcnow().isoformat(),
            "latest_review_type": review.get('review_type'),
            "latest_review_timestamp": review.get('created_at'),
            "update_count": current_update_count + 1,
            "full_review_payload": review  # Store latest review data
        }
        
        # Set ended_at when review ends
        if review.get('review_type') == 'end':
            update_data["ended_at"] = datetime.utcnow().isoformat()
        
        # Add new objects if detected
        if review.get('objects'):
            update_data["additional_objects"] = review['objects']
        # Add new zones if detected
        if review.get('zones'):
            update_data["additional_zones"] = review['zones']
            
        # Update alert in database
        supabase.table('ai_alerts').update(update_data).eq('id', alert_id).execute()
        watched_logger.info(f"Updated alert {alert_id} for {review.get('review_type')} review {review['review_id']} from camera {review['camera']} (update #{current_update_count + 1})")
        
    except Exception as e:
        logger.error(f"Error updating alert: {e}")

def update_review_status(review_id, status, reasoning=None):
    """
    Update the status of a review after processing.
    
    Args:
        review_id (str): ID of the review to update
        status (str): New status ('yes', 'no', or 'processed')
        reasoning (dict): JSON blob explaining the decision
    """
    try:
        update_data = {'status': status}
        if reasoning:
            update_data['reasoning'] = reasoning
        
        supabase.table('reviews').update(update_data).eq('review_id', review_id).execute()
        logger.info(f"Updated review {review_id} status to {status}")
        if reasoning:
            logger.info(f"Reasoning: {reasoning}")
    except Exception as e:
        logger.error(f"Error updating review status: {e}")

def process_review(review):
    """
    Process a review and create or update alerts as needed.
    
    Args:
        review (dict): Review data from the database
    """
    try:
        review_id = review.get('review_id', 'unknown')
        camera = review.get('camera', 'unknown')
        review_type = review.get('review_type', 'unknown')
        
        watched_logger.info(f"Processing {review_type} review {review_id} from camera {camera}")
        
        # Check if an alert already exists for this review_id
        existing_alert_result = supabase.table('ai_alerts').select('id').eq('event_id', review_id).execute()
        existing_alert = existing_alert_result.data[0] if existing_alert_result.data else None
        
        if existing_alert:
            # Alert already exists - update it with new review data
            watched_logger.info(f"Updating existing alert for review {review_id}")
            update_alert(existing_alert['id'], review)
            
            # Update review status to indicate it was processed
            update_review_status(review_id, 'yes', {
                "decision": True,
                "message": f"Updated existing alert for {review_type} review",
                "alert_id": existing_alert['id'],
                "processed_at": datetime.utcnow().isoformat()
            })
        else:
            # No existing alert - check if we should create one
            should_create, reasoning = should_create_alert(review)
            
            # Add processing timestamp and review lifecycle info
            reasoning["processed_at"] = datetime.utcnow().isoformat()
            reasoning["review_id"] = review_id
            reasoning["camera"] = camera
            reasoning["review_type"] = review_type
            
            if should_create:
                result = create_alert(review)
                if result:
                    reasoning["alert_created"] = True
                    reasoning["alert_id"] = result.get('id') if result else None
                    update_review_status(review_id, 'yes', reasoning)
                else:
                    reasoning["alert_created"] = False
                    reasoning["error"] = "Failed to create alert in database"
                    update_review_status(review_id, 'no', reasoning)
            else:
                # No alert created - just update review status
                update_review_status(review_id, 'no', reasoning)
                
    except Exception as e:
        logger.error(f"Error processing review: {e}")
        error_reasoning = {
            "decision": False,
            "error": str(e),
            "processed_at": datetime.utcnow().isoformat(),
            "review_id": review.get('review_id'),
            "camera": review.get('camera'),
            "review_type": review.get('review_type')
        }
        update_review_status(review.get('review_id'), 'no', error_reasoning)

def poll_reviews():
    """Continuously poll for new reviews and process them."""
    logger.info("🤖 Lizi is watching for reviews...")
    last_check = None  # None means first run after restart
    
    while True:
        try:
            current_time = datetime.now(timezone.utc)
            if last_check is None:
                logger.info("First run after restart: processing ALL waiting reviews.")
                response = supabase.table('reviews') \
                    .select('*') \
                    .eq('status', 'waiting') \
                    .execute()
            else:
                logger.info(f"Checking for reviews between {last_check.isoformat()} and {current_time.isoformat()}")
                # Convert UTC to Central Time for database comparison
                central_tz = timezone(timedelta(hours=-6))  # CST is UTC-6
                last_check_central = last_check.astimezone(central_tz)
                response = supabase.table('reviews') \
                    .select('*') \
                    .eq('status', 'waiting') \
                    .gte('created_at', last_check_central.strftime('%Y-%m-%d %H:%M:%S')) \
                    .execute()
            # Log the number of reviews found
            if response.data:
                logger.info(f"Found {len(response.data)} new reviews")
                for review in response.data:
                    logger.info(f"Processing review {review.get('review_id', 'unknown')} from camera {review.get('camera', 'unknown')}")
                    process_review(review)
            else:
                logger.info("No new reviews found")
            # Update last check time
            last_check = current_time
            time.sleep(5)
        except Exception as e:
            logger.error(f"❌ Error polling reviews: {str(e)}")
            time.sleep(5)  # Wait before retrying

if __name__ == "__main__":
    logger.info("Starting Lizi Alert Manager...")
    poll_reviews() 