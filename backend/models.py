from sqlalchemy import Column, Integer, String, Boolean, DECIMAL, SmallInteger, DateTime, Text, ForeignKey, CheckConstraint
from sqlalchemy.sql import func
from db import Base


class DeviceMetadata(Base):
    __tablename__ = "device_metadata"

    device_id    = Column(String(50), primary_key=True)
    location_lat = Column(DECIMAL(10, 8), nullable=False)
    location_lng = Column(DECIMAL(11, 8), nullable=False)
    status       = Column(String(20), default="active")
    battery_pct  = Column(SmallInteger)
    installed_at = Column(DateTime(timezone=True), server_default=func.now())
    description  = Column(Text)


class WasteData(Base):
    __tablename__ = "waste_data"

    id        = Column(Integer, primary_key=True, autoincrement=True)
    device_id = Column(String(50), ForeignKey("device_metadata.device_id", ondelete="CASCADE"))
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)

    # Per-category fill levels
    organic_fill_pct    = Column(SmallInteger)
    recyclable_fill_pct = Column(SmallInteger)
    hazardous_fill_pct  = Column(SmallInteger)

    # Per-category weights
    organic_weight_kg    = Column(DECIMAL(6, 2))
    recyclable_weight_kg = Column(DECIMAL(6, 2))
    hazardous_weight_kg  = Column(DECIMAL(6, 2))

    # AI Classification
    waste_type = Column(String(20))
    confidence = Column(DECIMAL(4, 3))

    __table_args__ = (
        CheckConstraint("organic_fill_pct >= 0 AND organic_fill_pct <= 100",       name="chk_organic_fill"),
        CheckConstraint("recyclable_fill_pct >= 0 AND recyclable_fill_pct <= 100", name="chk_recyclable_fill"),
        CheckConstraint("hazardous_fill_pct >= 0 AND hazardous_fill_pct <= 100",   name="chk_hazardous_fill"),
        CheckConstraint("waste_type IN ('organic', 'recyclable', 'hazardous')",    name="chk_waste_type"),
        CheckConstraint("confidence >= 0 AND confidence <= 1",                     name="chk_confidence"),
    )
