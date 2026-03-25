"use client";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = {
  organic:    "#0B3C5D",
  recyclable: "#9CA3AF",
  hazardous:  "#D1D5DB",
};

export default function PieChartCard({ counts }) {
  const data = [
    { name: "Organic",    value: counts?.organic    || 0 },
    { name: "Recyclable", value: counts?.recyclable || 0 },
    { name: "Hazardous",  value: counts?.hazardous  || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col h-full hover:shadow-md transition-all duration-200">
      <h3 className="text-[#1F2937] font-semibold text-base mb-4">Detections by Category</h3>
      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-[#6B7280]">No data yet</div>
      ) : (
        <div className="flex-1 min-h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                {data.map((entry, i) => <Cell key={i} fill={COLORS[entry.name.toLowerCase()]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "#6B7280" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
