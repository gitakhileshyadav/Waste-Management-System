"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import useSWR from "swr";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Search, Bell, User, Activity, AlertTriangle, Cpu, TrendingUp } from "lucide-react";
import AlertsSidebar from "@/components/AlertsSidebar";

// Dynamic import: Leaflet must not SSR
const BinMap = dynamic(() => import("@/components/BinMap"), { ssr: false, loading: () => (
  <div className="w-full h-full bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-[#6B7280] text-sm">Loading map…</div>
)});

const fetcher = (url) => fetch(url).then(r => r.json());

const PIE_COLORS = { organic: "#0B3C5D", recyclable: "#9CA3AF", hazardous: "#EF4444" };

const FILTERS = [
  { id: "all",       label: "All Bins" },
  { id: "full",      label: "⚠ Overflow (>90%)" },
  { id: "inactive",  label: "⬤ Offline" },
  { id: "hazardous", label: "☣ Hazardous Alert" },
];

function MetricCard({ icon: Icon, label, value, unit, alert }) {
  return (
    <div className={`bg-white rounded-xl border ${alert ? "border-red-300" : "border-gray-200"} shadow-sm px-5 py-4 flex items-center gap-4`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${alert ? "bg-red-50" : "bg-[#F5F7FA]"}`}>
        <Icon size={20} className={alert ? "text-red-500" : "text-[#0B3C5D]"} />
      </div>
      <div>
        <p className="text-xs text-[#6B7280] font-medium uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold ${alert ? "text-red-600" : "text-[#1F2937]"}`}>
          {value}<span className="text-sm font-normal text-[#6B7280] ml-1">{unit}</span>
        </p>
      </div>
    </div>
  );
}

export default function CommandCenter() {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const { data, error } = useSWR(`${API}/stats`, fetcher, { refreshInterval: 5000 });

  const [mapFilter, setMapFilter]   = useState("all");
  const [search, setSearch]         = useState("");

  const summary  = data?.summary  || {};
  const counts   = data?.categorization_counts || {};
  const devices  = data?.devices  || [];

  const filtered = useMemo(() =>
    search.trim()
      ? devices.filter(d => d.device_id.toLowerCase().includes(search.toLowerCase()) ||
          (d.description || "").toLowerCase().includes(search.toLowerCase()))
      : devices,
    [devices, search]
  );

  const urgentBins = devices.filter(d =>
    Math.max(d.organic_fill_pct || 0, d.recyclable_fill_pct || 0, d.hazardous_fill_pct || 0) >= 90
  ).length;

  const activeBins = devices.filter(d => d.status === "active").length;
  const systemHealth = devices.length > 0 ? Math.round((activeBins / devices.length) * 100) : 0;
  const avgFill = devices.length > 0
    ? Math.round(((summary.avg_organic_fill || 0) + (summary.avg_recyclable_fill || 0) + (summary.avg_hazardous_fill || 0)) / 3)
    : 0;

  const pieData = [
    { name: "Organic",    value: counts.organic    || 0 },
    { name: "Recyclable", value: counts.recyclable || 0 },
    { name: "Hazardous",  value: counts.hazardous  || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* ── NAVBAR ── */}
      <header className="bg-white border-b border-gray-200 h-16 flex-shrink-0 px-8 flex items-center gap-8 z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 w-max group px-2 py-1 rounded-xl hover:bg-gray-50 transition-all">
            <img 
              src="https://ik.imagekit.io/cnyztbl62/Logo_SwachhTech?updatedAt=1773815275983" 
              alt="SwachhTech Logo" 
              className="w-10 h-10 object-contain group-hover:scale-105 transition-transform drop-shadow-sm" 
            />
            <span className="font-black text-[#0B3C5D] text-2xl tracking-tight">SwachhTech</span>
          </Link>
          <div className="h-6 w-px bg-gray-200 mx-1" />
          <nav className="flex items-center gap-1">
            <Link href="/" className="px-4 py-2 rounded-lg text-sm font-bold text-[#0B3C5D] bg-[#F5F7FA]">Dashboard</Link>
            <Link href="/analytics" className="px-4 py-2 rounded-lg text-sm font-medium text-[#6B7280] hover:text-[#0B3C5D] hover:bg-gray-50 transition-all">Analytics</Link>
            <Link href="/devices" className="px-4 py-2 rounded-lg text-sm font-medium text-[#6B7280] hover:text-[#0B3C5D] hover:bg-gray-50 transition-all">Devices</Link>
          </nav>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Search by device ID or area…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20 text-[#1F2937] placeholder-[#6B7280]"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#F5F7FA] px-3 py-1.5 rounded-full border border-gray-200 text-xs font-medium text-[#6B7280]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live
          </div>
          <button className="relative p-2.5 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell size={18} className="text-[#1F2937]" />
            {urgentBins > 0 && (
              <span className="absolute -top-0 -right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {urgentBins}
              </span>
            )}
          </button>
          <button className="w-9 h-9 rounded-full bg-[#0B3C5D] flex items-center justify-center hover:brightness-110 active:scale-95 transition-all">
            <User size={16} className="text-white" />
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden bg-[#F5F7FA]">

        {/* ── LEFT: Map + Metrics ── */}
        <div className="flex-1 flex flex-col overflow-hidden p-6 gap-6">

          {/* Metrics row */}
          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2 text-sm">
              ⚠ Cannot reach backend API. Make sure FastAPI is running on port 8000.
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
              <MetricCard icon={AlertTriangle} label="Urgent Bins" value={urgentBins}     unit="bins"  alert={urgentBins > 0} />
              <MetricCard icon={Cpu}           label="Active Devices"      value={activeBins}    unit="online" />
              <MetricCard icon={TrendingUp}    label="Avg Fill Level"      value={avgFill}       unit="%" />
              <MetricCard icon={Activity}      label="System Health"       value={systemHealth}  unit="%"  alert={systemHealth < 80} />
            </div>
          )}

          {/* Map filter strip */}
          <div className="flex items-center gap-2 flex-shrink-0 bg-white p-1 rounded-xl border border-gray-200 w-max self-start shadow-sm leading-none">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setMapFilter(f.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200
                  ${mapFilter === f.id
                    ? "bg-[#0B3C5D] text-white shadow-md active:scale-95"
                    : "text-[#6B7280] hover:text-[#0B3C5D] hover:bg-gray-50"}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* ── Command Center Map Hero ── */}
          <div className="flex-1 min-h-0 rounded-2xl overflow-hidden border border-gray-200 shadow-lg relative">
            <BinMap devices={search ? filtered : devices} filter={mapFilter} />

            {/* Dark overlay stats bar — command center feel */}
            <div className="absolute bottom-0 left-0 right-0 z-[1000] pointer-events-none"
              style={{ background: 'linear-gradient(to top, rgba(11,60,93,0.92) 0%, rgba(11,60,93,0.75) 60%, transparent 100%)' }}>
              <div className="flex items-end justify-between px-6 py-4">
                {/* Left: live feed label */}
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  <span className="text-white text-xs font-bold tracking-widest uppercase opacity-80">Live Feed</span>
                </div>

                {/* Centre: per-category averages */}
                <div className="flex items-center gap-6">
                  {[
                    { label: 'Organic',    value: Math.round(summary.avg_organic_fill    || 0) },
                    { label: 'Recyclable', value: Math.round(summary.avg_recyclable_fill || 0) },
                    { label: 'Hazardous',  value: Math.round(summary.avg_hazardous_fill  || 0) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col items-center gap-0.5">
                      <span className="text-white text-lg font-black leading-none">{`${value}%`}</span>
                      <span className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Right: bin counts */}
                <div className="flex items-center gap-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-white text-lg font-black leading-none">{activeBins}</span>
                    <span className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">Active</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-red-400 text-lg font-black leading-none">{urgentBins}</span>
                    <span className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">Critical</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Alerts Sidebar ── */}
        <aside className="w-80 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden shadow-sm">
          <AlertsSidebar devices={devices} alertCount={urgentBins} />
        </aside>
      </div>
    </div>
  );
}
