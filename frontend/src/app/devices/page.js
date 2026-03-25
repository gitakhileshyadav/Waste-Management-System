"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import dynamic from "next/dynamic";
import { 
  Search, Battery, Activity, AlertCircle, 
  MapPin, Cpu, Info, X, Map as MapIcon,
  Trash2, ChevronRight, Filter, RefreshCw
} from "lucide-react";

// Dynamic import for Leaflet mini-map
const MiniMap = dynamic(() => import("@/components/BinMap"), { 
  ssr: false, 
  loading: () => <div className="h-48 bg-gray-100 animate-pulse rounded-lg" /> 
});

const fetcher = (url) => fetch(url).then(r => r.json());

function StatusBadge({ status, battery, fill }) {
  const isCritical = battery < 20 || fill > 90;
  if (status !== "active") return <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold uppercase"><span className="w-1.5 h-1.5 rounded-full bg-gray-400"/> Offline</span>;
  if (isCritical) return <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold uppercase"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/> Critical</span>;
  return <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-[10px] font-bold uppercase"><span className="w-1.5 h-1.5 rounded-full bg-green-500"/> Active</span>;
}

function ProgressCircle({ label, value, color }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full" viewBox="0 0 36 36">
          <path className="text-gray-100" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
          <path className={color} strokeDasharray={`${value}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[#1F2937]">{value}%</span>
      </div>
      <span className="text-[10px] uppercase font-bold text-[#6B7280]">{label}</span>
    </div>
  );
}

export default function DevicesPage() {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const { data, error, mutate, isLoading } = useSWR(`${API}/stats`, fetcher, { refreshInterval: 5000 });
  
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const devices = data?.devices || [];
  
  const selectedDevice = useMemo(() => 
    devices.find(d => d.device_id === selectedId), 
    [devices, selectedId]
  );

  const filtered = useMemo(() => {
    return devices.filter(d => {
      const matchesSearch = d.device_id.toLowerCase().includes(search.toLowerCase()) || 
                           (d.description || "").toLowerCase().includes(search.toLowerCase());
      const maxFill = Math.max(d.organic_fill_pct || 0, d.recyclable_fill_pct || 0, d.hazardous_fill_pct || 0);
      
      if (filterStatus === "critical") return matchesSearch && (d.battery_pct < 20 || maxFill > 90);
      if (filterStatus === "offline") return matchesSearch && d.status !== "active";
      if (filterStatus === "active") return matchesSearch && d.status === "active";
      return matchesSearch;
    });
  }, [devices, search, filterStatus]);

  const kpis = {
    total: devices.length,
    active: devices.filter(d => d.status === "active").length,
    offline: devices.filter(d => d.status !== "active").length,
    lowBattery: devices.filter(d => d.battery_pct < 20).length
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F5F7FA]">
      
      {/* ── HEADER ── */}
      <header className="bg-white border-b border-gray-200 h-16 flex-shrink-0 px-8 flex items-center justify-between z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group px-2 py-1 rounded-xl hover:bg-gray-50 transition-all">
            <img 
              src="https://ik.imagekit.io/cnyztbl62/Logo_SwachhTech?updatedAt=1773815275983" 
              alt="SwachhTech Logo" 
              className="w-10 h-10 object-contain group-hover:scale-105 transition-transform drop-shadow-sm" 
            />
            <span className="font-black text-[#0B3C5D] text-2xl tracking-tight">SwachhTech</span>
          </Link>
          <div className="h-6 w-px bg-gray-200 mx-1" />
          <nav className="flex items-center gap-1">
            <Link href="/" className="px-4 py-2 rounded-lg text-sm font-medium text-[#6B7280] hover:text-[#0B3C5D] hover:bg-gray-50 transition-all">Dashboard</Link>
            <Link href="/analytics" className="px-4 py-2 rounded-lg text-sm font-medium text-[#6B7280] hover:text-[#0B3C5D] hover:bg-gray-50 transition-all">Analytics</Link>
            <Link href="/devices" className="px-4 py-2 rounded-lg text-sm font-bold text-[#0B3C5D] bg-[#F5F7FA]">Devices</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => mutate()}
            className="p-2 hover:bg-gray-100 rounded-lg text-[#6B7280] transition-colors"
            title="Refresh Sensors"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
          <div className="h-8 w-8 rounded-full bg-[#0B3C5D] flex items-center justify-center text-white">
            <Cpu size={16} />
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Table Area */}
        <main className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#1F2937]">Sensor Fleet Management</h1>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                <input 
                  type="text" 
                  placeholder="Search device ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
                />
              </div>
              <select 
                className="bg-white border border-gray-200 rounded-lg text-sm px-3 py-2 text-[#1F2937] focus:outline-none"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Devices</option>
                <option value="active">Active Only</option>
                <option value="offline">Offline Only</option>
                <option value="critical">Critical Only</option>
              </select>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-[#6B7280] tracking-wider mb-1">Total Fleet</p>
              <p className="text-2xl font-black text-[#0B3C5D]">{kpis.total}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-[#6B7280] tracking-wider mb-1">Active</p>
              <p className="text-2xl font-black text-green-600">{kpis.active}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-[#6B7280] tracking-wider mb-1">Offline</p>
              <p className="text-2xl font-black text-gray-400">{kpis.offline}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-b-2 border-b-red-400">
              <p className="text-[10px] uppercase font-bold text-red-500 tracking-wider mb-1">Low Battery</p>
              <p className="text-2xl font-black text-red-600">{kpis.lowBattery}</p>
            </div>
          </div>

          {/* Devices Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F8FAFC] border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#6B7280] uppercase tracking-wider">Device / Area</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-[#6B7280] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-[#6B7280] uppercase tracking-wider">Battery</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-[#6B7280] uppercase tracking-wider">Max Fill</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-[#6B7280] uppercase tracking-wider">Last Seen</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((d) => {
                  const maxFill = Math.max(d.organic_fill_pct || 0, d.recyclable_fill_pct || 0, d.hazardous_fill_pct || 0);
                  const isSelected = selectedId === d.device_id;
                  
                  return (
                    <tr 
                      key={d.device_id} 
                      onClick={() => setSelectedId(d.device_id)}
                      className={`cursor-pointer transition-colors ${isSelected ? "bg-[#0B3C5D]/5" : "hover:bg-gray-50"}`}
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-[#1F2937]">{d.device_id}</p>
                        <p className="text-xs text-[#6B7280]">{d.description || "Unassigned Area"}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <StatusBadge status={d.status} battery={d.battery_pct} fill={maxFill} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Battery size={14} className={d.battery_pct < 20 ? "text-red-500" : "text-gray-400"} />
                          <span className={`font-medium ${d.battery_pct < 20 ? "text-red-600" : "text-[#1F2937]"}`}>{d.battery_pct}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${maxFill > 90 ? "bg-red-500" : maxFill > 70 ? "bg-yellow-500" : "bg-[#0B3C5D]"}`} style={{ width: `${maxFill}%` }} />
                          </div>
                          <span className="font-bold w-8 text-right">{maxFill}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-[#6B7280] tabular-nums">
                        {d.last_seen ? new Date(d.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "---"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight size={16} className="text-gray-300 ml-auto" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>

        {/* Side Detail Panel */}
        <aside className={`w-[450px] bg-white border-l border-gray-200 transform transition-transform duration-300 ease-in-out fixed right-0 top-16 bottom-0 z-40 shadow-2xl flex flex-col ${selectedDevice ? "translate-x-0" : "translate-x-full"}`}>
          {selectedDevice ? (
            <div className="flex flex-col h-full">
              {/* Panel Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-[#0B3C5D]">Device Detail Info</h2>
                  <p className="text-xs text-[#6B7280]">Real-time hardware diagnostics & telemetry</p>
                </div>
                <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Visual Overview Card */}
                <div className="bg-[#F8FAFC] rounded-2xl p-6 border border-gray-100 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
                      <Cpu size={28} className="text-[#0B3C5D]" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#1F2937]">{selectedDevice.device_id}</p>
                      <p className="text-xs text-[#6B7280]">{selectedDevice.description || "Primary Municipal Bin"}</p>
                    </div>
                    <div className="ml-auto">
                      <StatusBadge 
                        status={selectedDevice.status} 
                        battery={selectedDevice.battery_pct} 
                        fill={Math.max(selectedDevice.organic_fill_pct, selectedDevice.recyclable_fill_pct, selectedDevice.hazardous_fill_pct)} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-t border-gray-200 pt-6">
                    <div className="text-center">
                      <p className="text-[9px] uppercase font-bold text-[#6B7280] mb-1">Battery</p>
                      <p className={`text-sm font-black ${selectedDevice.battery_pct < 20 ? "text-red-600" : "text-[#1F2937]"}`}>{selectedDevice.battery_pct}%</p>
                    </div>
                    <div className="text-center border-x border-gray-200">
                      <p className="text-[9px] uppercase font-bold text-[#6B7280] mb-1">Status</p>
                      <p className="text-sm font-black text-[#1F2937] capitalize">{selectedDevice.status}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] uppercase font-bold text-[#6B7280] mb-1">Signals</p>
                      <p className="text-sm font-black text-[#1F2937]">Excellent</p>
                    </div>
                  </div>
                </div>

                {/* Bin Level Analysis */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-2">
                    <Trash2 size={14} className="text-[#0B3C5D]" /> Current Bin Levels
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <ProgressCircle label="Organic"    value={selectedDevice.organic_fill_pct}    color="text-[#0B3C5D]" />
                    <ProgressCircle label="Recyclable" value={selectedDevice.recyclable_fill_pct} color="text-gray-400" />
                    <ProgressCircle label="Hazardous"  value={selectedDevice.hazardous_fill_pct}  color="text-red-500" />
                  </div>
                </div>

                {/* Location Map */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-2">
                    <MapPin size={14} className="text-[#0B3C5D]" /> Exact Location
                  </h3>
                  <div className="h-44 rounded-2xl overflow-hidden border border-gray-200 relative grayscale hover:grayscale-0 transition-all duration-500">
                    <MiniMap 
                      devices={[selectedDevice]} 
                      center={[selectedDevice.lat, selectedDevice.lng]} 
                      zoom={16} 
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#6B7280] px-1 uppercase">
                    <span>Lat: {selectedDevice.lat?.toFixed(5)}</span>
                    <span>Lng: {selectedDevice.lng?.toFixed(5)}</span>
                  </div>
                </div>

                {/* AI Detection Info */}
                <div className="bg-gradient-to-br from-[#0B3C5D] to-[#124b74] rounded-2xl p-6 text-white overflow-hidden relative">
                   <Info size={120} className="absolute -right-10 -bottom-10 opacity-10" />
                   <h3 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-4">Latest AI Detection</h3>
                   <div className="flex items-center gap-4 mb-3">
                     <span className="text-3xl font-black">86.7%</span>
                     <div className="h-8 w-px bg-white/20" />
                     <div>
                       <p className="text-xs font-bold uppercase opacity-80">Confidence Score</p>
                       <p className="text-[10px] text-white/60">High-Fidelity Classification</p>
                     </div>
                   </div>
                   <div className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-md">
                     <Activity size={12} className="text-green-400" />
                     <span className="text-xs font-bold">Detected: Plastic & Packaging</span>
                   </div>
                </div>
              </div>
              
              {/* Bottom Actions */}
              <div className="p-6 bg-[#F8FAFC] border-t border-gray-100 flex gap-3">
                <button className="flex-1 bg-white border border-gray-200 text-[#1F2937] py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 active:scale-95 transition-all shadow-sm">
                  Ping Device
                </button>
                <button className="flex-1 bg-[#0B3C5D] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-[#0B3C5D]/90 active:scale-95 transition-all shadow-sm">
                  Schedule Check
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center p-10 opacity-40">
              <Cpu size={100} className="text-gray-300 mb-6" />
              <h2 className="text-lg font-bold text-[#6B7280]">No Device Selected</h2>
              <p className="text-sm">Click a device in the list to view its real-time diagnostics and location metrics.</p>
            </div>
          )}
        </aside>

      </div>
    </div>
  );
}
