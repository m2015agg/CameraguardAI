from supabase import create_client, Client
import time
import uuid
from datetime import datetime, UTC
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client with the same credentials as the main app
SUPABASE_URL = os.getenv("SUPABASE_URL", "http://10.0.1.217:8000")
SUPABASE_KEY = os.getenv("SERVICE_ROLE_KEY")
FRIGATE_URL = os.getenv("FRIGATE_API_URL", "http://10.0.1.50:5000")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing required environment variables: SUPABASE_URL and SERVICE_ROLE_KEY")

print(f"🔌 Connecting to Supabase at {SUPABASE_URL}")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def should_alert(review):
    """Basic placeholder logic — replace with AI later."""
    label = review['after']['label']
    zones = review['after'].get('current_zones', [])
    stationary = review['after'].get('stationary', False)
    score = review['after'].get('score', 0)

    # Basic confidence threshold
    if score < 0.7:
        return None, 0.0

    # Zone-based alerts
    if label == "person":
        if "driveway" in zones and not stationary:
            return "Person is moving in driveway", score
        elif "porch" in zones and not stationary:
            return "Person is moving on porch", score
    elif label == "car" and not stationary:
        if "driveway" in zones:
            return "Car is moving in driveway", score
        elif "street" in zones:
            return "Car is moving on street", score
    elif label == "truck" and not stationary:
        if "driveway" in zones:
            return "Truck is moving in driveway", score
    elif label == "bicycle" and not stationary:
        if "driveway" in zones or "porch" in zones:
            return "Bicycle is moving in monitored area", score

    return None, 0.0

def insert_alert(event_id, camera, label, face_name, plate, zones, score, reason, confidence):
    """Insert AI alert to Supabase if not already sent"""
    url_base = f"{FRIGATE_URL}/api/frigate/notifications/{event_id}"
    
    try:
        supabase.table("ai_alerts").insert({
            "event_id": event_id,
            "camera": camera,
            "label": label,
            "zones": zones,
            "reason": reason,
            "confidence": confidence,
            "created_at": datetime.utcnow().isoformat(),
            "triggered": False
        }).execute()
        print(f"✅ Alert inserted for event {event_id}")
    except Exception as e:
        print(f"❌ Error inserting alert: {str(e)}")

def already_alerted(event_id):
    """Check if we've already created an alert for this event"""
    try:
        result = supabase.table("ai_alerts").select("event_id").eq("event_id", event_id).execute()
        return len(result.data) > 0
    except Exception as e:
        print(f"❌ Error checking for existing alert: {str(e)}")
        return False

def poll_reviews():
    """Continuously poll for new reviews and process them."""
    print("🤖 Lizi is watching for reviews...")
    last_check = datetime.now(UTC)
    
    while True:
        try:
            # Get new reviews since last check
            response = supabase.table('reviews') \
                .select('*') \
                .gte('created_at', last_check.isoformat()) \
                .execute()
            
            # Process any new reviews
            for review in response.data:
                process_review(review)
            
            # Update last check time
            last_check = datetime.now(UTC)
            
            # Wait before next check
            time.sleep(5)
            
        except Exception as e:
            print(f"❌ Error polling reviews: {str(e)}")
            time.sleep(5)  # Wait before retrying

if __name__ == "__main__":
    poll_reviews() 