import os
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/frigate_events")

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    label = Column(String(64))
    sub_label = Column(String(64))
    camera = Column(String(64))
    zone = Column(String(64))
    entered_zones = Column(String(256))
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    has_snapshot = Column(Boolean)
    has_clip = Column(Boolean)
    score = Column(Float)
    top_score = Column(Float)
    false_positive = Column(Boolean)
    box = Column(String(128))
    area = Column(Integer)
    ratio = Column(Float)
    region = Column(String(128))
    stationary = Column(Boolean)
    motionless_count = Column(Integer)
    position_changes = Column(Integer)
    attributes = Column(String(256))
    created_at = Column(DateTime, default=datetime.utcnow)
    full_json = Column(JSONB)

# Create tables
Base.metadata.create_all(bind=engine)

def get_latest_events(limit=50):
    session = SessionLocal()
    try:
        events = session.query(Event).order_by(Event.start_time.desc()).limit(limit).all()
        # Return as list of tuples for compatibility with viewer.py
        return [(
            e.id, e.label, e.sub_label, e.camera, e.zone, e.entered_zones, e.start_time, e.end_time,
            e.has_snapshot, e.has_clip, e.score, e.top_score, e.false_positive, e.box, e.area, e.ratio,
            e.region, e.stationary, e.motionless_count, e.position_changes, e.attributes, e.created_at, e.full_json
        ) for e in events]
    finally:
        session.close()

def add_event(event_data):
    session = SessionLocal()
    try:
        event = Event(**event_data)
        session.add(event)
        session.commit()
        return event.id
    finally:
        session.close() 