import sqlite3
import json

def init_db():
    conn = sqlite3.connect('events.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            label TEXT,
            camera TEXT,
            zone TEXT,
            entered_zones TEXT,
            start_time DATETIME,
            end_time DATETIME,
            has_snapshot INTEGER,
            has_clip INTEGER,
            score REAL
        )
    ''')
    conn.commit()
    return conn

def insert_event(event_data):
    conn = sqlite3.connect('events.db')
    c = conn.cursor()
    c.execute('INSERT INTO events (event_data) VALUES (?)', (json.dumps(event_data),))
    conn.commit()
    conn.close()

def get_latest_events(limit=100):
    conn = sqlite3.connect('events.db')
    c = conn.cursor()
    c.execute('SELECT event_data FROM events ORDER BY timestamp DESC LIMIT ?', (limit,))
    events = [json.loads(row[0]) for row in c.fetchall()]
    conn.close()
    return events 