from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
import datetime

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(String, index=True)
    original_text = Column(String)
    masked_text = Column(String)
    detected_entities = Column(String) # Storing as JSON string
    processing_time_ms = Column(Float)
