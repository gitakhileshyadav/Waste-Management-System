# IoT-Based Waste Management Platform

This is a scalable IoT-based waste management platform designed to track and manage smart waste bins across a city or facility.

## System Architecture

```text
  [ IoT Device / Simulator (Raspberry Pi) ]
               |
               | Publishes JSON Payload
               | Topic: waste_management/{device_id}/status
               v
  [ HiveMQ Cloud Cluster ]
               |
               | Subscribes to Topic: waste_management/+/status
               v
     [ Backend (FastAPI) ]
               |
               | Parses Payload & Validates Schema
               | Writes to Database via ORM
               v
     [ Database (PostgreSQL / Neon) ]
               ^
               | Fetches Analytics & Real-time IoT Data
               | via REST API (/api/v1/...)
               v
     [ Frontend (Next.js) ]
               |
               | Renders Dashboards, Maps, and Alerts
               v
     [ User / Operator Browser ]
```

## Directory Structure

- `frontend/`: Next.js frontend application.
- `backend/`: FastAPI backend service.
- `simulator/`: Python scripts simulating IoT devices.
- `database/`: Database schema definitions and migration scripts.
- `docker-compose.yml`: Local orchestrator for developing and running services.

## MQTT Telemetry Schema

**Topic Pattern:** `waste_management/{device_id}/{event_type}`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "WasteBinTelemetry",
  "type": "object",
  "properties": {
    "device_id": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" },
    "location": {
      "type": "object",
      "properties": {
        "lat": { "type": "number" },
        "lng": { "type": "number" }
      },
      "required": ["lat", "lng"]
    },
    "sensors": {
      "type": "object",
      "properties": {
        "fill_level_pct": { "type": "number", "minimum": 0, "maximum": 100 },
        "weight_kg": { "type": "number" },
        "temperature_c": { "type": "number" },
        "battery_pct": { "type": "number", "minimum": 0, "maximum": 100 }
      },
      "additionalProperties": true
    },
    "ai_analysis": {
      "type": "object",
      "properties": {
        "waste_type_detected": {
          "type": "string",
          "enum": ["organic", "recyclable", "hazardous"]
        },
        "confidence_score": { "type": "number", "minimum": 0, "maximum": 1 }
      },
      "additionalProperties": true
    }
  },
  "required": ["device_id", "timestamp", "sensors"]
}
```

## API Routes Contract

**Base URL:** `/api/v1`

### Device Management
* `GET /devices`: List all registered bins.
* `GET /devices/{device_id}`: Detailed config.
* `POST /devices`: Register a new bin.

### Telemetry & Analytics
* `GET /telemetry/{device_id}`: History telemetry data.
* `GET /analytics/fill-levels`: Overall aggregate metrics.
* `GET /analytics/waste-distribution`: Extensible distributions (e.g. types of waste collected).

### Alerts
* `GET /alerts`: Active system alerts (full bins, fire warnings, low battery).
* `PATCH /alerts/{alert_id}`: Resolve or acknowledge an alert.
