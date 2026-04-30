import os
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime
import enum

# In production, this would be a Postgres URL from environment variables.
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/hcp_crm")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class SentimentEnum(str, enum.Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"

class HCP(Base):
    __tablename__ = "hcps"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    specialty = Column(String)
    organization = Column(String)
    location = Column(String)

class Interaction(Base):
    __tablename__ = "interactions"
    id = Column(Integer, primary_key=True, index=True)
    hcp_id = Column(Integer, ForeignKey("hcps.id"))
    date = Column(String)
    time = Column(String)
    interaction_type = Column(String) # Lunch meeting, Office visit, etc.
    attendees = Column(Text)
    topics_discussed = Column(Text)
    materials_shared = Column(Text)
    sentiment = Column(String, default="neutral")
    outcomes = Column(Text)
    samples_distributed = Column(Text)
    follow_up_actions = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)
    # Seed data
    db = SessionLocal()
    if db.query(HCP).count() == 0:
        hcp1 = HCP(name="Dr. Sarah Smith", specialty="Cardiology", organization="Westside Clinic", location="New York")
        hcp2 = HCP(name="Dr. James Wilson", specialty="Oncology", organization="City Hospital", location="Boston")
        db.add_all([hcp1, hcp2])
        db.commit()
    db.close()
