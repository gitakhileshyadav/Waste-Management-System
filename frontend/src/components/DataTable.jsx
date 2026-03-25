function FillBar({ value }) {
  const pct = value || 0;
  const color = pct >= 80 ? "bg-red-500" : pct >= 60 ? "bg-yellow-400" : "bg-[#0B3C5D]";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-[#6B7280] tabular-nums w-8">{pct}%</span>
    </div>
  );
}

export default function DeviceTable({ devices }) {
  const rows = devices || [];
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-[#1F2937] font-semibold text-base">Device Status</h3>
        <span className="text-xs text-[#6B7280]">{rows.length} bins tracked</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F7FA] text-[#6B7280]">
            <tr>
              {["Device", "Status", "Battery", "Organic", "Recyclable", "Hazardous", "Last Seen", "Action"].map(h => (
                <th key={h} className="px-5 py-3 text-left font-medium text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-5 py-8 text-center text-[#6B7280]">No devices reporting yet.</td>
              </tr>
            ) : rows.map((d, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-5 py-3.5 font-medium text-[#1F2937]">{d.device_id}</td>
                <td className="px-5 py-3.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${d.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {d.status || "unknown"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-[#6B7280]">
                  {d.battery_pct != null ? (
                    <span className={`font-medium ${d.battery_pct < 20 ? "text-red-500" : "text-[#1F2937]"}`}>
                      {d.battery_pct}%
                    </span>
                  ) : "—"}
                </td>
                <td className="px-5 py-3.5"><FillBar value={d.organic_fill_pct} /></td>
                <td className="px-5 py-3.5"><FillBar value={d.recyclable_fill_pct} /></td>
                <td className="px-5 py-3.5"><FillBar value={d.hazardous_fill_pct} /></td>
                <td className="px-5 py-3.5 text-[#6B7280] whitespace-nowrap">
                  {d.last_seen ? new Date(d.last_seen).toLocaleTimeString() : "—"}
                </td>
                <td className="px-5 py-3.5">
                  {d.needs_attention ? (
                    <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-semibold">
                      Dispatch
                    </span>
                  ) : (
                    <span className="text-xs text-[#6B7280]">Normal</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
