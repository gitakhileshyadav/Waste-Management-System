export default function KpiCard({ title, value, unit, icon, alert = false }) {
  return (
    <div className={`bg-white rounded-xl border ${alert ? "border-red-200" : "border-gray-200"} shadow-sm p-5 flex flex-col gap-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">{title}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="flex items-end gap-1.5">
        <span className={`text-3xl font-semibold ${alert ? "text-red-600" : "text-[#1F2937]"}`}>{value}</span>
        {unit && <span className="text-sm text-[#6B7280] pb-0.5">{unit}</span>}
      </div>
    </div>
  );
}
