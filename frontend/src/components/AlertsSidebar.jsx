import { Bell, AlertTriangle, BatteryLow, WifiOff } from "lucide-react";

function alertType(device) {
  const maxFill = Math.max(device.organic_fill_pct || 0, device.recyclable_fill_pct || 0, device.hazardous_fill_pct || 0);
  if (maxFill >= 90) return { type: "overflow", label: "Overflow", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", action: "Dispatch Truck" };
  if (device.battery_pct != null && device.battery_pct < 20) return { type: "battery", label: "Low Battery", icon: BatteryLow, color: "text-orange-500", bg: "bg-orange-50", action: "Assign Technician" };
  if (device.status !== "active") return { type: "offline", label: "Sensor Offline", icon: WifiOff, color: "text-gray-500", bg: "bg-gray-100", action: "Assign Technician" };
  return null;
}

export default function AlertsSidebar({ devices, alertCount }) {
  const alerts = (devices || [])
    .map(d => ({ device: d, alert: alertType(d) }))
    .filter(({ alert }) => alert !== null)
    .sort((a, b) => {
      const priority = { overflow: 0, battery: 1, offline: 2 };
      return priority[a.alert.type] - priority[b.alert.type];
    });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <Bell size={16} className="text-[#0B3C5D]" />
        <span className="font-semibold text-[#1F2937] text-sm">Active Alerts</span>
        {alertCount > 0 && (
          <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{alertCount}</span>
        )}
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-[#6B7280] text-sm">
            <Bell size={24} className="mb-2 opacity-30" />
            All clear
          </div>
        ) : alerts.map(({ device, alert }, i) => {
          const Icon = alert.icon;
          const ts = device.last_seen ? new Date(device.last_seen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
          return (
            <div key={i} className={`p-4 ${alert.bg} hover:brightness-95 transition-all duration-150`}>
              <div className="flex items-start gap-2">
                <Icon size={15} className={`${alert.color} mt-0.5 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${alert.color}`}>{alert.label}</span>
                    <span className="text-[10px] text-[#6B7280]">{ts}</span>
                  </div>
                  <div className="font-medium text-[#1F2937] text-sm mt-0.5">{device.device_id}</div>
                  {device.description && (
                    <div className="text-[11px] text-[#6B7280] truncate">{device.description}</div>
                  )}
                  <button className="mt-2 w-full bg-white border border-gray-200 text-[#0B3C5D] text-xs font-semibold py-1.5 rounded-lg hover:bg-[#0B3C5D] hover:text-white transition-colors duration-200">
                    {alert.action}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
