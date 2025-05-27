import json
import time
import paho.mqtt.client as mqtt
from db import add_event
from viewer import start_viewer
import threading
import os

# Load MQTT config
config_path = os.environ.get("MQTT_CONFIG", "config/mqtt_config.json")
with open(config_path, 'r') as f:
    mqtt_config = json.load(f)

def on_message(client, userdata, msg):
    try:
        print(f"Received message on topic {msg.topic}")
        data = json.loads(msg.payload.decode())
        print(f"Message payload: {json.dumps(data, indent=2)}")
        after = data.get("after", {})
        current_zones = after.get("current_zones", [])
        zone = current_zones[0] if current_zones else None
        event_data = {
            'label': after.get("label"),
            'sub_label': after.get("sub_label"),
            'camera': after.get("camera"),
            'zone': zone,
            'entered_zones': ",".join(after.get("entered_zones", [])),
            'start_time': after.get("start_time"),
            'end_time': after.get("end_time"),
            'has_snapshot': after.get("has_snapshot", False),
            'has_clip': after.get("has_clip", False),
            'score': after.get("score", 0.0),
            'top_score': after.get("top_score", 0.0),
            'false_positive': after.get("false_positive", False),
            'box': json.dumps(after.get("box", [])),
            'area': after.get("area", 0),
            'ratio': after.get("ratio", 0.0),
            'region': json.dumps(after.get("region", [])),
            'stationary': after.get("stationary", False),
            'motionless_count': after.get("motionless_count", 0),
            'position_changes': after.get("position_changes", 0),
            'attributes': json.dumps(after.get("attributes", {})),
            'full_json': after
        }
        add_event(event_data)
        print(f"Stored event for camera {after.get('camera')}")
    except Exception as e:
        print("Error processing message:", e)
        print("Message payload was:", msg.payload.decode())

def mqtt_listener():
    print("Starting MQTT listener...")
    client = mqtt.Client()
    if mqtt_config.get("username"):
        print(f"Using MQTT authentication with username: {mqtt_config['username']}")
        client.username_pw_set(mqtt_config["username"], mqtt_config["password"])
    
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("Connected to MQTT broker successfully!")
        else:
            print(f"Failed to connect to MQTT broker with code: {rc}")
    
    def on_disconnect(client, userdata, rc):
        print(f"Disconnected from MQTT broker with code: {rc}")
    
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message
    
    print(f"Connecting to MQTT broker at {mqtt_config['host']}:{mqtt_config['port']}")
    client.connect(mqtt_config["host"], mqtt_config["port"])
    print(f"Subscribing to topic: {mqtt_config['topic']}")
    client.subscribe(mqtt_config["topic"])
    client.loop_forever()

if __name__ == "__main__":
    threading.Thread(target=start_viewer).start()
    mqtt_listener() 