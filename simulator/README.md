# IoT Simulator (Raspberry Pi Mock)

This simulator mimics the behavior of multiple smart waste bins (Raspberry Pi devices equipped with sensors and a camera module for AI classification). It continuously publishes structured JSON payloads containing telemetry and waste categorization data to the HiveMQ broker over MQTT.

## Requirements
- Python 3.9+
- `paho-mqtt`

## How to run locally

Ensure your virtual environment is active, then install dependencies and run:

```bash
cd simulator
pip install -r requirements.txt
python simulator.py
```

### Alternatively, run via Docker Compose:
From the root of the project:
```bash
docker-compose up simulator --build
```

## Example Output Logs
```json
Starting IoT Simulator. Connecting to e00cbe0c3fa04a1d8e3e711bb7ae7f35.s1.eu.hivemq.cloud:8883
✅ Connected to MQTT Broker.
📤 Published to waste_management/bin_003/status:
{
  "device_id": "bin_003",
  "timestamp": "2026-03-17T11:58:34.123456+00:00",
  "location": {
    "lat": 40.7148,
    "lng": -74.0085
  },
  "sensors": {
    "fill_level_pct": 73,
    "weight_kg": 18.25,
    "temperature_c": 22.4,
    "battery_pct": 89
  },
  "ai_analysis": {
    "waste_type_detected": "recyclable",
    "confidence_score": 0.892
  }
}
----------------------------------------
```
