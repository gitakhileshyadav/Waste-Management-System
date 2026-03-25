import os
import time
import json
import random
from datetime import datetime, timezone
import paho.mqtt.client as mqtt

# MQTT config loaded from environment (see root .env file)
BROKER   = os.getenv("MQTT_BROKER")
PORT     = int(os.getenv("MQTT_PORT", 1883))
USERNAME = os.getenv("MQTT_USERNAME")
PASSWORD = os.getenv("MQTT_PASSWORD")

DEVICES = [
    {"id": "bin_001", "lat": 40.7128, "lng": -74.0060, "desc": "City Park - North Gate"},
    {"id": "bin_002", "lat": 40.7138, "lng": -74.0075, "desc": "City Park - South Gate"},
    {"id": "bin_003", "lat": 40.7148, "lng": -74.0085, "desc": "Market Street Corner"},
]

# Track simulated fill levels to make them drift up realistically
fills = {d["id"]: {"organic": random.randint(5, 40), "recyclable": random.randint(5, 40), "hazardous": random.randint(0, 20)} for d in DEVICES}
batteries = {d["id"]: random.randint(50, 100) for d in DEVICES}


def generate_payload(device):
    did = device["id"]
    # Drift fill levels up; reset if over 100
    for cat in ["organic", "recyclable", "hazardous"]:
        fills[did][cat] += random.randint(0, 5)
        if fills[did][cat] >= 100:
            fills[did][cat] = random.randint(0, 10) # Reset after pickup simulation
            
    # Slow battery drain
    batteries[did] = max(5, batteries[did] - random.randint(0, 1))
    if batteries[did] <= 10:
        batteries[did] = random.randint(80, 100) # Recharged

    dominant = max(fills[did], key=fills[did].get)

    return {
        "device_id": did,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "location": {
            "lat": device["lat"],
            "lng": device["lng"],
            "area": device["desc"],
            "status": "active",
            "battery_pct": batteries[did],
        },
        "organic": {
            "fill_level_pct": fills[did]["organic"],
            "weight_in_kg": round(fills[did]["organic"] * 0.18, 2),
        },
        "recyclable": {
            "fill_level_pct": fills[did]["recyclable"],
            "weight_in_kg": round(fills[did]["recyclable"] * 0.12, 2),
        },
        "hazardous": {
            "fill_level_pct": fills[did]["hazardous"],
            "weight_in_kg": round(fills[did]["hazardous"] * 0.08, 2),
        },
        "ai_analysis": {
            "waste_type_detected": dominant,
            "confidence_score": round(random.uniform(0.75, 0.99), 3),
        },
    }


def start_simulator():
    print(f"Starting IoT Simulator → {BROKER}:{PORT}")
    client = mqtt.Client()
    if USERNAME and PASSWORD:
        client.username_pw_set(USERNAME, PASSWORD)
    if PORT == 8883:
        client.tls_set()

    try:
        client.connect(BROKER, PORT, 60)
        client.loop_start()
        print("✅ Connected to HiveMQ")

        while True:
            device = random.choice(DEVICES)
            topic = f"waste_management/{device['id']}/status"
            payload = generate_payload(device)
            client.publish(topic, json.dumps(payload))
            print(f"📤 [{device['id']}] org={payload['organic']['fill_level_pct']}% "
                  f"rec={payload['recyclable']['fill_level_pct']}% "
                  f"haz={payload['hazardous']['fill_level_pct']}% "
                  f"bat={payload['location']['battery_pct']}%")
            time.sleep(random.uniform(2.0, 5.0))

    except KeyboardInterrupt:
        print("\nStopping Simulator...")
    finally:
        client.loop_stop()
        client.disconnect()
        print("🔌 Disconnected.")


if __name__ == "__main__":
    start_simulator()
