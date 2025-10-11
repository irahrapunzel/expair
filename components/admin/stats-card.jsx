export default function StatsCard({ label, value, valueColor = "text-white" }) {
  return (
    <div className="bg-[#0A0028] border border-white/10 rounded-lg p-4">
      <div className="text-white/60 text-sm mb-1">{label}</div>
      <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
    </div>
  );
}



