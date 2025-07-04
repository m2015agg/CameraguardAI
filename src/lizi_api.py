from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import json
from datetime import datetime
import logging
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your Next.js app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def determine_log_name(logger_name: str) -> str:
    """Determine the log category based on the logger name."""
    logger_name = logger_name.lower()
    if 'watcher' in logger_name:
        return 'watchers'
    elif 'watched' in logger_name:
        return 'watched'
    else:
        return 'info'

def get_logs_for_container(container_name: str) -> list:
    """Get logs for a specific container by name."""
    try:
        logger.info(f"Getting logs for container {container_name}")
        result = subprocess.run(
            ['docker', 'logs', '--tail', '100', '--timestamps', container_name],
            capture_output=True,
            text=True,
            check=True
        )
        
        logs = result.stdout
        logger.info(f"Raw log content for container {container_name}: {repr(logs)}")
        logger.info(f"Retrieved {len(logs.split('\n'))} log lines from container {container_name}")
        
        parsed_logs = []
        for line in logs.split('\n'):
            if not line.strip():
                continue

            logger.info(f"Processing line: {repr(line)}")
            parts = line.split(" - ", 3)
            if len(parts) == 4:
                timestamp, logger_name, level, message = parts
                name = determine_log_name(logger_name)
                parsed_logs.append({
                    "timestamp": timestamp,
                    "level": level.lower(),
                    "message": message,
                    "name": name
                })
                logger.info(f"Successfully parsed regular log entry: timestamp={timestamp}, name={name}, level={level}")
            else:
                # If can't parse, add as raw log
                parsed_logs.append({
                    "timestamp": datetime.now().isoformat(),
                    "level": "info",
                    "message": line,
                    "name": "info"
                })
                logger.info(f"Added unparseable log as raw entry: {line}")
        
        return parsed_logs
        
    except Exception as e:
        logger.error(f"Error getting logs for container {container_name}: {str(e)}")
        logger.error(traceback.format_exc())
        return []

@app.get("/logs")
async def get_logs():
    try:
        logger.info("Fetching logs...")
        container_name = 'cameraguardai-lizi-1'
        all_logs = get_logs_for_container(container_name)
        all_logs.sort(key=lambda x: x["timestamp"])
        logger.info(f"DEBUG: all_logs = {all_logs}")  # Use logger instead of print
        logger.info(f"Successfully parsed {len(all_logs)} total log entries")
        return all_logs
    except Exception as e:
        logger.error(f"Error in get_logs: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000) 