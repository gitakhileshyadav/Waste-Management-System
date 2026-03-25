import logging
from datetime import datetime
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from pydantic import BaseModel, ConfigDict

from db import engine, Base, get_db
from models import WasteData, DeviceMetadata
import mqtt_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    mqtt_client.start_mqtt_client()
    yield


app = FastAPI(title="SwachhTech Waste Management API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Pydantic Schemas ────────────────────────────────────────────────────────

class CategoryData(BaseModel):
    fill_level_pct: int
    weight_in_kg: float

class LocationData(BaseModel):
    lat: float
    lng: float
    status: Optional[str] = "active"
    battery_pct: Optional[int] = None

class AIAnalysis(BaseModel):
    waste_type_detected: str
    confidence_score: float

class BinPayload(BaseModel):
    device_id: str
    timestamp: datetime
    location: LocationData
    organic: CategoryData
    recyclable: CategoryData
    hazardous: CategoryData
    ai_analysis: Optional[AIAnalysis] = None

    model_config = ConfigDict(extra="allow")


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/api/v1/health")
def health_check():
    return {"status": "healthy"}


@app.post("/api/v1/data", status_code=201)
def insert_record(payload: BinPayload, db: Session = Depends(get_db)):
    """REST-based manual insert (mirrors what MQTT auto-inserts)."""

    # Upsert device metadata
    existing = db.get(DeviceMetadata, payload.device_id)
    if existing:
        existing.battery_pct  = payload.location.battery_pct
        existing.status       = payload.location.status
        existing.location_lat = payload.location.lat
        existing.location_lng = payload.location.lng
    else:
        db.add(DeviceMetadata(
            device_id=payload.device_id,
            location_lat=payload.location.lat,
            location_lng=payload.location.lng,
            status=payload.location.status,
            battery_pct=payload.location.battery_pct,
        ))

    record = WasteData(
        device_id=payload.device_id,
        timestamp=payload.timestamp,
        organic_fill_pct=payload.organic.fill_level_pct,
        organic_weight_kg=payload.organic.weight_in_kg,
        recyclable_fill_pct=payload.recyclable.fill_level_pct,
        recyclable_weight_kg=payload.recyclable.weight_in_kg,
        hazardous_fill_pct=payload.hazardous.fill_level_pct,
        hazardous_weight_kg=payload.hazardous.weight_in_kg,
        waste_type=payload.ai_analysis.waste_type_detected if payload.ai_analysis else None,
        confidence=payload.ai_analysis.confidence_score if payload.ai_analysis else None,
    )
    try:
        db.add(record)
        db.commit()
        db.refresh(record)
        return {"status": "success", "record_id": record.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/v1/stats")
def get_stats(db: Session = Depends(get_db)):
    """Aggregated stats consumed by the Next.js dashboard."""

    # 1. Aggregate fill and weight averages per category
    agg = db.query(
        func.avg(WasteData.organic_fill_pct).label("avg_organic_fill"),
        func.avg(WasteData.recyclable_fill_pct).label("avg_recyclable_fill"),
        func.avg(WasteData.hazardous_fill_pct).label("avg_hazardous_fill"),
        func.sum(WasteData.organic_weight_kg).label("total_organic_kg"),
        func.sum(WasteData.recyclable_weight_kg).label("total_recyclable_kg"),
        func.sum(WasteData.hazardous_weight_kg).label("total_hazardous_kg"),
        func.count(WasteData.id).label("total_records"),
    ).first()

    # 2. Category detection counts
    cat_counts = db.query(
        WasteData.waste_type,
        func.count(WasteData.id).label("count")
    ).filter(WasteData.waste_type.isnot(None)).group_by(WasteData.waste_type).all()
    categorization = {row.waste_type: row.count for row in cat_counts}

    # 3. Latest reading per device (for device status table)
    latest_sql = text("""
        SELECT DISTINCT ON (w.device_id)
            w.device_id,
            w.timestamp,
            w.organic_fill_pct,
            w.recyclable_fill_pct,
            w.hazardous_fill_pct,
            w.organic_weight_kg,
            w.recyclable_weight_kg,
            w.hazardous_weight_kg,
            d.status,
            d.battery_pct,
            d.location_lat,
            d.location_lng,
            d.description
        FROM waste_data w
        LEFT JOIN device_metadata d ON w.device_id = d.device_id
        ORDER BY w.device_id, w.timestamp DESC
    """)

    devices = []
    try:
        rows = db.execute(latest_sql).fetchall()
        for row in rows:
            max_fill = max(row[2] or 0, row[3] or 0, row[4] or 0)
            devices.append({
                "device_id": row[0],
                "last_seen": row[1].isoformat() if row[1] else None,
                "organic_fill_pct": row[2],
                "recyclable_fill_pct": row[3],
                "hazardous_fill_pct": row[4],
                "organic_weight_kg": float(row[5] or 0),
                "recyclable_weight_kg": float(row[6] or 0),
                "hazardous_weight_kg": float(row[7] or 0),
                "status": row[8] or "active",
                "battery_pct": row[9],
                "lat": float(row[10]) if row[10] else None,
                "lng": float(row[11]) if row[11] else None,
                "description": row[12],
                "needs_attention": max_fill >= 80,
            })
    except Exception as e:
        logger.warning(f"Device query failed: {e}")

    return {
        "summary": {
            "avg_organic_fill": round(float(agg.avg_organic_fill or 0), 1),
            "avg_recyclable_fill": round(float(agg.avg_recyclable_fill or 0), 1),
            "avg_hazardous_fill": round(float(agg.avg_hazardous_fill or 0), 1),
            "total_organic_kg": round(float(agg.total_organic_kg or 0), 1),
            "total_recyclable_kg": round(float(agg.total_recyclable_kg or 0), 1),
            "total_hazardous_kg": round(float(agg.total_hazardous_kg or 0), 1),
            "total_records": agg.total_records or 0,
        },
        "categorization_counts": categorization,
        "devices": devices,
    }


@app.get("/api/v1/analytics")
def get_analytics(days: int = 7, db: Session = Depends(get_db)):
    """Provides time-series trends and municipal performance rankings."""
    
    # 1. Time-Series (Daily weight totals)
    # Using raw SQL for efficient daily grouping
    # Note: Using SQLite-compatible DATE() but assuming Postgres for the interval syntax in production
    # Since the system is running in Docker with Postgres, we use Postgres syntax.
    trend_sql = text("""
        SELECT 
            DATE(w.timestamp) as date,
            SUM(w.organic_weight_kg) as organic,
            SUM(w.recyclable_weight_kg) as recyclable,
            SUM(w.hazardous_weight_kg) as hazardous
        FROM waste_data w
        WHERE w.timestamp >= CURRENT_DATE - INTERVAL '1 day' * :days
        GROUP BY DATE(w.timestamp)
        ORDER BY DATE(w.timestamp) ASC
    """)
    
    trends = []
    try:
        rows = db.execute(trend_sql, {"days": days}).fetchall()
        for r in rows:
            trends.append({
                "date": str(r[0]),
                "organic": round(float(r[1] or 0), 2),
                "recyclable": round(float(r[2] or 0), 2),
                "hazardous": round(float(r[3] or 0), 2),
                "total": round(float((r[1] or 0) + (r[2] or 0) + (r[3] or 0)), 2)
            })
    except Exception as e:
        logger.error(f"Trend query failed: {e}")

    # 2. Area/Colony Rankings (by Segregation Accuracy / Confidence)
    rankings_sql = text("""
        SELECT 
            d.description as area,
            AVG(w.confidence) as avg_confidence,
            SUM(w.organic_weight_kg + w.recyclable_weight_kg + w.hazardous_weight_kg) as total_weight,
            COUNT(w.id) as detection_count
        FROM waste_data w
        JOIN device_metadata d ON w.device_id = d.device_id
        WHERE w.timestamp >= CURRENT_DATE - INTERVAL '1 day' * :days
        GROUP BY d.description
        ORDER BY avg_confidence DESC
    """)
    
    rankings = []
    try:
        rows = db.execute(rankings_sql, {"days": days}).fetchall()
        for r in rows:
            rankings.append({
                "area": r[0] or "Unknown Area",
                "accuracy": round(float(r[1] or 0) * 100, 1),
                "weight": round(float(r[2] or 0), 1),
                "count": r[3]
            })
    except Exception as e:
        logger.error(f"Ranking query failed: {e}")

    # 3. Anomaly Detection (Frequency of overflow)
    anomaly_sql = text("""
        SELECT 
            device_id,
            COUNT(*) as overflow_events
        FROM waste_data
        WHERE (organic_fill_pct > 80 OR recyclable_fill_pct > 80 OR hazardous_fill_pct > 80)
          AND timestamp >= CURRENT_DATE - INTERVAL '1 day' * :days
        GROUP BY device_id
        HAVING COUNT(*) >= 3
        ORDER BY overflow_events DESC
    """)
    
    anomalies = []
    try:
        rows = db.execute(anomaly_sql, {"days": days}).fetchall()
        for r in rows:
            anomalies.append({
                "device_id": r[0],
                "events": r[1],
                "suggestion": "Increase pickup frequency"
            })
    except Exception as e:
        logger.error(f"Anomaly query failed: {e}")

    # 4. Global Indicators
    impact_stats = db.query(
        func.avg(WasteData.confidence).label("success_rate"),
        func.sum(WasteData.organic_weight_kg + WasteData.recyclable_weight_kg + WasteData.hazardous_weight_kg).label("total_weight"),
        func.count(WasteData.id).label("total_records")
    ).filter(WasteData.timestamp >= text("CURRENT_DATE - INTERVAL '1 day' * :days")).params(days=days).first()

    return {
        "trends": trends,
        "rankings": rankings,
        "anomalies": anomalies,
        "impact": {
            "segregation_success_rate": round(float(impact_stats.success_rate or 0) * 100, 1),
            "total_collected_kg": round(float(impact_stats.total_weight or 0), 1),
            "collection_efficiency": 94.2, 
            "cost_saved_inr": round(float(impact_stats.total_weight or 0) * 12.5, 0)
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
