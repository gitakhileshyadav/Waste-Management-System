# SwachhTech | Startup Guide 🚀

The entire SwachhTech ecosystem is now fully containerized. You no longer need to run multiple terminals manually.

---

## 1. Quick Start (Recommended)

Run this single command in your root directory to build and start the entire stack (Database, Backend, Frontend, and Simulator):

```powershell
docker-compose up --build -d
```

### 🌍 Accessing the System
- **Command Center Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Analytics Deep-Dive**: [http://localhost:3000/analytics](http://localhost:3000/analytics)
- **Device Diagnostics**: [http://localhost:3000/devices](http://localhost:3000/devices)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 2. Managing the Environment

| Action | Command |
|---|---|
| **Stop All Services** | `docker-compose stop` |
| **Start Stopped Services** | `docker-compose start` |
| **Restart Everything** | `docker-compose restart` |
| **View Live Logs** | `docker-compose logs -f` |
| **Shutdown & Remove** | `docker-compose down` |
| **Full Data Reset** | `docker-compose down -v` |

---

## 3. Troubleshooting
- **Port Conflict?** If you get a "port is already allocated" error, ensure no local instances of Node (3000) or Python (8000) are running on your host machine.
- **Data not appearing?** Wait about 30 seconds for the `waste_iot_simulator` container to start pushing its first batch of telemetry to the backend.

---

## 4. Troubleshooting
- **Port 8000 already in use?**
  Run: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force`
- **Map not showing markers?**
  Ensure the simulator is running and you have an active internet connection (for Map tiles).
