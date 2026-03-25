import os
import json
import logging
from datetime import datetime
import paho.mqtt.client as mqtt
from sqlalchemy.orm import Session
from models import WasteData, DeviceMetadata
from db import SessionLocal

logger = logging.getLogger(__name__)

# MQTT config loaded from environment (see root .env file)
MQTT_BROKER   = os.getenv("MQTT_BROKER")
MQTT_PORT     = int(os.getenv("MQTT_PORT", 1883))
MQTT_USERNAME = os.getenv("MQTT_USERNAME")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD")
MQTT_TOPIC    = "waste_management/+/status"


def start_mqtt_client():
    client = mqtt.Client()
    if MQTT_USERNAME and MQTT_PASSWORD:
        client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    if MQTT_PORT == 8883:
        client.tls_set()
    client.on_connect = on_connect
    client.on_message = on_message
    try:
        logger.info(f"Connecting to MQTT Broker {MQTT_BROKER}:{MQTT_PORT}...")
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
        logger.info("MQTT loop started successfully.")
    except Exception as e:
        logger.error(f"Failed to connect to MQTT broker: {e}")


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        logger.info(f"Connected to MQTT broker! Subscribing to: {MQTT_TOPIC}")
        client.subscribe(MQTT_TOPIC)
    else:
        logger.error(f"MQTT connection failed, rc={rc}")


def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        logger.info(f"Received MQTT payload on {msg.topic}")
        process_payload(payload)
    except json.JSONDecodeError:
        logger.error(f"Bad JSON payload: {msg.payload}")
    except Exception as e:
        logger.error(f"Error processing MQTT message: {e}")


def process_payload(payload: dict):
    db: Session = SessionLocal()
    try:
        device_id = payload.get("device_id")
        timestamp_str = payload.get("timestamp")

        # Per-category blocks
        organic    = payload.get("organic", {})
        recyclable = payload.get("recyclable", {})
        hazardous  = payload.get("hazardous", {})

        # Location / device state
        location   = payload.get("location", {})
        battery    = location.get("battery_pct")
        status     = location.get("status", "active")
        lat        = location.get("lat")
        lng        = location.get("lng")
        area_name  = location.get("area")

        # AI classification
        ai         = payload.get("ai_analysis", {})
        waste_type = ai.get("waste_type_detected")
        confidence = ai.get("confidence_score")

        # Parse timestamp safely
        try:
            timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            timestamp = datetime.now()

        # Upsert device metadata
        if lat and lng:
            existing = db.get(DeviceMetadata, device_id)
            if existing:
                existing.battery_pct  = battery
                existing.status       = status
                existing.location_lat = lat
                existing.location_lng = lng
                if area_name:
                    existing.description = area_name
            else:
                db.add(DeviceMetadata(
                    device_id=device_id,
                    location_lat=lat,
                    location_lng=lng,
                    status=status,
                    battery_pct=battery,
                    description=area_name
                ))

        # Insert telemetry row
        record = WasteData(
            device_id=device_id,
            timestamp=timestamp,
            organic_fill_pct=organic.get("fill_level_pct"),
            organic_weight_kg=organic.get("weight_in_kg"),
            recyclable_fill_pct=recyclable.get("fill_level_pct"),
            recyclable_weight_kg=recyclable.get("weight_in_kg"),
            hazardous_fill_pct=hazardous.get("fill_level_pct"),
            hazardous_weight_kg=hazardous.get("weight_in_kg"),
            waste_type=waste_type,
            confidence=confidence,
        )
        db.add(record)
        db.commit()
        logger.info(f"Stored telemetry for {device_id}")

    except Exception as e:
        db.rollback()
        logger.error(f"DB insert failed: {e}")
    finally:
        db.close()
