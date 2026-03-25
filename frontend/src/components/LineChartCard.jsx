"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

export default function FillBarChart({ devices }) {
  if (!devices || devices.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col h-full hover:shadow-md transition-all duration-200">
        <h3 className="text-[#1F2937] font-semibold text-base mb-4">Fill Levels by Bin</h3>
        <div className="flex-1 flex items-center justify-center text-sm text-[#6B7280]">No bin data yet</div>
      </div>
    );
  }

  const data = devices.map(d => ({
    name: d.device_id,
    Organic: d.organic_fill_pct || 0,
    Recyclable: d.recyclable_fill_pct || 0,
    Hazardous: d.hazardous_fill_pct || 0,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col h-full hover:shadow-md transition-all duration-200">
      <h3 className="text-[#1F2937] font-semibold text-base mb-4">Fill Levels by Bin (%)</h3>
      <div className="flex-1 min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
            <Legend iconType="square" wrapperStyle={{ fontSize: 12, color: "#6B7280" }} />
            <ReferenceLine y={80} stroke="#EF4444" strokeDasharray="4 4" label={{ value: "80% Alert", position: "right", fontSize: 10, fill: "#EF4444" }} />
            <Bar dataKey="Organic"    fill="#0B3C5D" radius={[3,3,0,0]} />
            <Bar dataKey="Recyclable" fill="#9CA3AF" radius={[3,3,0,0]} />
            <Bar dataKey="Hazardous"  fill="#D1D5DB" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
