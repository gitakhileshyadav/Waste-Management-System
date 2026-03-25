"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import { 
  TrendingUp, Download, Calendar, Filter, 
  BarChart2, Map as MapIcon, Award, AlertCircle, 
  Target, Zap, DollarSign, ArrowLeft
} from "lucide-react";

const fetcher = (url) => fetch(url).then(r => r.json());

const COLORS = ["#0B3C5D", "#9CA3AF", "#EF4444"];
const PIE_COLORS = { organic: "#0B3C5D", recyclable: "#9CA3AF", hazardous: "#EF4444" };

function AnalyticsKPI({ icon: Icon, label, value, unit, colorClass = "text-[#0B3C5D]", bgClass = "bg-[#F5F7FA]" }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all duration-200">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgClass}`}>
        <Icon size={24} className={colorClass} />
      </div>
      <div>
        <p className="text-xs text-[#6B7280] font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-[#1F2937]">
          {value}<span className="text-sm font-normal text-[#6B7280] ml-1">{unit}</span>
        </p>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const [days, setDays] = useState(7);
  const { data, error, isLoading } = useSWR(`${API}/analytics?days=${days}`, fetcher, { refreshInterval: 10000 });

  const trends    = data?.trends || [];
  const rankings  = data?.rankings || [];
  const anomalies = data?.anomalies || [];
  const impact    = data?.impact || {};

  const handleExport = () => {
    // Generate simple CSV from trends for demo
    const headers = ["Date", "Organic (kg)", "Recyclable (kg)", "Hazardous (kg)", "Total (kg)"];
    const rows = trends.map(t => [t.date, t.organic, t.recyclable, t.hazardous, t.total]);
    const csvContent = "data:text/csv;charset=utf-8," + 
      headers.join(",") + "\n" + 
      rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `swachhtech_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <div className="h-6 w-px bg-gray-200 mx-2" />
          <nav className="flex items-center gap-1">
            <Link href="/" className="px-4 py-2 rounded-lg text-sm font-medium text-[#6B7280] hover:text-[#0B3C5D] hover:bg-gray-50 transition-all">Dashboard</Link>
            <Link href="/analytics" className="px-4 py-2 rounded-lg text-sm font-bold text-[#0B3C5D] bg-[#F5F7FA]">Analytics</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
            {[7, 30].map(d => (
              <button 
                key={d}
                onClick={() => setDays(d)}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${days === d ? "bg-white text-[#0B3C5D] shadow-sm" : "text-[#6B7280] hover:text-[#1F2937]"}`}
              >
                Last {d} Days
              </button>
            ))}
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-[#0B3C5D] text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-[#0B3C5D]/90 active:scale-95 transition-all shadow-sm"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto p-8 space-y-8">
        
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Municipal Waste Impact</h1>
          <p className="text-[#6B7280] text-sm mt-1">Measuring segregation efficiency and environmental footprint across the city.</p>
        </div>

        {/* Impact KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnalyticsKPI icon={Target}     label="Segregation Success" value={impact.segregation_success_rate || 0} unit="%" colorClass="text-green-600" bgClass="bg-green-50" />
          <AnalyticsKPI icon={TrendingUp} label="Total Collected"     value={impact.total_collected_kg || 0}   unit="kg" />
          <AnalyticsKPI icon={Zap}        label="Avg Efficiency"      value={impact.collection_efficiency || 0} unit="%" colorClass="text-blue-500" bgClass="bg-blue-50" />
          <AnalyticsKPI icon={DollarSign} label="Est. Cost Saved"     value={impact.cost_saved_inr || 0}       unit="₹" colorClass="text-orange-600" bgClass="bg-orange-50" />
        </div>

        {/* Mid Section: Trends & Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Trends Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-[#1F2937]">Collection Trends (kg)</h3>
              <div className="flex gap-4">
                {["Organic", "Recyclable", "Hazardous"].map((cat, i) => (
                  <div key={cat} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: Object.values(PIE_COLORS)[i] }} /> {cat}
                  </div>
                ))}
              </div>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: '600' }}
                  />
                  <Line type="monotone" dataKey="organic"    stroke="#0B3C5D" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="recyclable" stroke="#9CA3AF" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="hazardous"  stroke="#EF4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Composition Donut */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
            <h3 className="font-bold text-[#1F2937] mb-8">Waste Composition</h3>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Organic",    value: trends.reduce((sum, t) => sum + t.organic,    0) },
                      { name: "Recyclable", value: trends.reduce((sum, t) => sum + t.recyclable, 0) },
                      { name: "Hazardous",  value: trends.reduce((sum, t) => sum + t.hazardous,  0) },
                    ].filter(d => d.value > 0)}
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                     <Cell fill="#0B3C5D" />
                     <Cell fill="#9CA3AF" />
                     <Cell fill="#EF4444" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Section: Rankings & Anomalies */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
          
          {/* Colony Rankings */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-[#1F2937] flex items-center gap-2">
                <Award size={18} className="text-orange-500" /> Colony Performance Ranking
              </h3>
              <span className="text-[10px] uppercase font-bold text-[#6B7280]">Sorted by Accuracy</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F8FAFC] text-[#64748B]">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-xs">Area / Colony</th>
                    <th className="px-6 py-4 text-center font-semibold uppercase tracking-wider text-xs">Accuracy</th>
                    <th className="px-6 py-4 text-center font-semibold uppercase tracking-wider text-xs">Total Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rankings.map((r, i) => (
                    <tr key={i} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4 font-medium text-[#1F2937]">{r.area}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full" style={{ width: `${r.accuracy}%` }} />
                          </div>
                          <span className="font-bold tabular-nums text-[#1F2937]">{r.accuracy}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-[#6B7280] font-medium">{r.weight} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Anomaly Detection */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-2">
              <AlertCircle size={18} className="text-red-500" />
              <h3 className="font-bold text-[#1F2937]">Predictive Anomaly Detection</h3>
            </div>
            <div className="p-6 space-y-4">
              {anomalies.length === 0 ? (
                <div className="text-center py-10 text-[#6B7280] text-sm italic">No recurring overflow anomalies detected in this period.</div>
              ) : anomalies.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl">
                  <div>
                    <p className="font-bold text-[#1F2937] text-sm">{a.device_id}</p>
                    <p className="text-xs text-red-600 mt-0.5">{a.events} overflow instances detect in {days} days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-[#6B7280]">Reco</p>
                    <p className="text-xs font-bold text-[#0B3C5D]">{a.suggestion}</p>
                  </div>
                </div>
              ))}
              
              {/* Heatmap Simulation Info */}
              <div className="mt-8 p-5 bg-[#F5F7FA] rounded-xl border border-dashed border-gray-300">
                <h4 className="text-xs font-bold text-[#1F2937] uppercase mb-4 flex items-center gap-2">
                  <BarChart2 size={14} /> Peak Collection Load Analysis
                </h4>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-6 rounded-sm ${i % 3 === 0 ? "bg-[#0B3C5D]/60" : i % 5 === 0 ? "bg-[#0B3C5D]" : "bg-[#0B3C5D]/20"}`}
                      title="Simulated Heatmap Data Point"
                    />
                  ))}
                </div>
                <p className="text-[10px] text-[#6B7280] mt-3">Visualizing historical peak fill frequency across active municipal sectors.</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
