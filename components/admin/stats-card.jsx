import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatsCard({ label, value, trend, trendLabel, trendUp = true, icon: Icon }) {
  return (
    <div className="group relative bg-gradient-to-br from-[#151B2B] to-[#0A0F1A] rounded-xl p-6 border border-white/10 hover:border-[#6DDFFF]/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(109,223,255,0.1)]">
      {/* Glassmorphic overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#6DDFFF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
      
      <div className="relative">
        {/* Header with icon */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-white/60 text-sm font-medium">{label}</p>
          {Icon && (
            <div className="w-10 h-10 rounded-lg bg-[#6DDFFF]/10 flex items-center justify-center group-hover:bg-[#6DDFFF]/20 transition-colors">
              <Icon className="w-5 h-5 text-[#6DDFFF]" />
            </div>
          )}
        </div>
        
        {/* Value with animation */}
        <div className="mb-4">
          <h3 className="text-4xl font-bold text-white transition-transform group-hover:scale-105">
            {value?.toLocaleString() || 0}
          </h3>
        </div>
        
        {/* Trend indicator */}
        {trend && (
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
              trendUp ? 'bg-green-500/10' : 'bg-red-500/10'
            }`}>
              {trendUp ? (
                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              )}
              <span className={`text-xs font-semibold ${
                trendUp ? 'text-green-400' : 'text-red-400'
              }`}>
                {trend}
              </span>
            </div>
            {trendLabel && (
              <span className="text-xs text-white/40">{trendLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}