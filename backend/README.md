# Waste Management Backend (FastAPI)

This is the backend service for the IoT Waste Management Platform. It serves dual purposes:
1. Subscribes to the HiveMQ IoT broker to continuously ingest telemetry from smart bins into the Neon PostgreSQL database.
2. Exposes a REST API for the Next.js frontend to query aggregated statistics and manually insert records.

## Requirements Checklist
- Python 3.9+
- Activated virtual environment (from the project root)

## Environment Variables
The application relies on the following environment variables (defined in the `docker-compose.yml` or set locally):
- `DATABASE_URL`: Your PostgreSQL connection string (defaults to local docker postgres).
- `MQTT_BROKER_URL`: Address of the HiveMQ cluster (e.g., `xyz.eu.hivemq.cloud`).
- `MQTT_PORT`: HiveMQ Port (e.g., `8883`).
- `MQTT_USERNAME`: Your HiveMQ username.
- `MQTT_PASSWORD`: Your HiveMQ password.

## How to run locally

### Option 1: Using Docker (Recommended)
You can build and run this via the main docker-compose file in the project directory.
```bash
cd ..
docker-compose up backend --build
```

### Option 2: Running natively via Uvicorn
Ensure you have activated your project-root virtual environment (`venv`) and installed dependencies:
```bash
cd backend
pip install -r requirements.txt

# Start the server (auto-reloads on file changes)
uvicorn main:app --reload
```

## API Documentation
Once the server is running, the Swagger interactive documentation will be available at:
[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
