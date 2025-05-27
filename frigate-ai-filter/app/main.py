import json
import time
import paho.mqtt.client as mqtt
from db import init_db
from viewer import start_viewer
import threading
import os

# Load MQTT config
config_path = os.environ.get("MQTT_CONFIG", "config/mqtt_config.json")
with open(config_path, 'r') as f:
    mqtt_config = json.load(f)

conn = init_db()
cursor = conn.cursor()

def on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())
        after = data.get("after", {})
        cursor.execute('''
            INSERT OR IGNORE INTO events (
                id, label, camera, zone, entered_zones,
                start_time, end_time, has_snapshot, has_clip, score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            after.get("id"),
            after.get("label"),
            after.get("camera"),
            after.get("current_zones", [None])[0],
            ",".join(after.get("entered_zones", [])),
            after.get("start_time"),
            after.get("end_time"),
            int(after.get("has_snapshot", False)),
            int(after.get("has_clip", False)),
            after.get("score", 0.0)
        ))
        conn.commit()
        print(f"Stored event {after.get('id')}")
    except Exception as e:
        print("Error processing message:", e)

def mqtt_listener():
    client = mqtt.Client()
    if mqtt_config.get("username"):
        client.username_pw_set(mqtt_config["username"], mqtt_config["password"])
    client.on_message = on_message
    client.connect(mqtt_config["host"], mqtt_config["port"])
    client.subscribe(mqtt_config["topic"])
    client.loop_forever()

if __name__ == "__main__":
    threading.Thread(target=start_viewer).start()
    mqtt_listener() 