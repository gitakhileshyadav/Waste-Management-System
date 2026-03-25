"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";

// Fix default icon paths broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const urgentIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const lowBatIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const activeIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function chooseIcon(device) {
  const maxFill = Math.max(
    device.organic_fill_pct || 0,
    device.recyclable_fill_pct || 0,
    device.hazardous_fill_pct || 0
  );
  if (maxFill >= 90) return urgentIcon;
  if (device.battery_pct != null && device.battery_pct < 20) return lowBatIcon;
  return activeIcon;
}

function FillRow({ label, value, color }) {
  const pct = value || 0;
  return (
    <div className="mb-1">
      <div className="flex justify-between text-[11px] text-gray-600 mb-0.5">
        <span>{label}</span><span className="font-semibold">{pct}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function BinMap({ devices, filter }) {
  const validDevices = (devices || []).filter(d => d.lat && d.lng);

  const filtered = validDevices.filter(d => {
    const maxFill = Math.max(d.organic_fill_pct || 0, d.recyclable_fill_pct || 0, d.hazardous_fill_pct || 0);
    if (filter === "full")     return maxFill >= 90;
    if (filter === "inactive") return d.status !== "active";
    if (filter === "hazardous") return (d.hazardous_fill_pct || 0) >= 70;
    return true;
  });

  const center = validDevices.length > 0
    ? [validDevices[0].lat, validDevices[0].lng]
    : [40.7128, -74.0060];

  return (
    <MapContainer center={center} zoom={14} className="w-full h-full rounded-xl z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MarkerClusterGroup chunkedLoading>
        {filtered.map(device => (
          <Marker
            key={device.device_id}
            position={[device.lat, device.lng]}
            icon={chooseIcon(device)}
          >
            <Popup minWidth={200}>
              <div className="text-sm">
                <div className="font-bold text-[#0B3C5D] mb-2">{device.device_id}</div>
                <FillRow label="🌿 Organic"    value={device.organic_fill_pct}    color="#0B3C5D" />
                <FillRow label="♻️ Recyclable" value={device.recyclable_fill_pct} color="#9CA3AF" />
                <FillRow label="⚠️ Hazardous"  value={device.hazardous_fill_pct}  color="#EF4444" />
                <div className="mt-2 flex justify-between text-[11px] text-gray-500">
                  <span>🔋 {device.battery_pct ?? "—"}%</span>
                  <span className={device.status === "active" ? "text-green-600" : "text-gray-400"}>
                    ● {device.status || "unknown"}
                  </span>
                </div>
                {device.description && (
                  <div className="mt-1 text-[11px] text-gray-400 italic">{device.description}</div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
