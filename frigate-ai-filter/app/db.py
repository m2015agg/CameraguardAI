import sqlite3
import json
import os

def init_db():
    # Create data directory if it doesn't exist
    data_dir = '/app/data'
    os.makedirs(data_dir, exist_ok=True)
    
    # Use absolute path for database file
    db_path = os.path.join(data_dir, 'events.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create events table with additional fields
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            label TEXT,
            sub_label TEXT,
            camera TEXT,
            zone TEXT,
            entered_zones TEXT,
            start_time REAL,
            end_time REAL,
            has_snapshot INTEGER,
            has_clip INTEGER,
            score REAL,
            top_score REAL,
            false_positive INTEGER,
            box TEXT,  -- Stored as JSON string
            area INTEGER,
            ratio REAL,
            region TEXT,  -- Stored as JSON string
            stationary INTEGER,
            motionless_count INTEGER,
            position_changes INTEGER,
            attributes TEXT,  -- Stored as JSON string
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    return conn

def insert_event(event_data):
    db_path = '/app/events.db'
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute('''
        INSERT INTO events (
            label, camera, zone, entered_zones,
            start_time, end_time, has_snapshot, has_clip, score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        event_data.get('label'),
        event_data.get('camera'),
        event_data.get('zone'),
        event_data.get('entered_zones'),
        event_data.get('start_time'),
        event_data.get('end_time'),
        int(event_data.get('has_snapshot', False)),
        int(event_data.get('has_clip', False)),
        event_data.get('score', 0.0)
    ))
    conn.commit()
    conn.close()

def get_latest_events(limit=100):
    data_dir = '/app/data'
    db_path = os.path.join(data_dir, 'events.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM events 
        ORDER BY start_time DESC 
        LIMIT ?
    ''', (limit,))
    events = cursor.fetchall()
    conn.close()
    return events 