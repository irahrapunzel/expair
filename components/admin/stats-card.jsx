import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function StatsCard({ label, value, trend, trendLabel, trendUp = null, icon: Icon }) {
  const isNeutral = trendUp === null;
  const isPositive = trendUp === true;
  const isNegative = trendUp === false;

  return (
    <div className="bg-[#120A2A] rounded-xl p-6 border border-[#906EFF]/20 hover:border-[#906EFF]/40 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white/60 text-sm font-medium">{label}</h4>
        
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-[#906EFF]/10 flex items-center justify-center group-hover:bg-[#906EFF]/20 transition-colors">
            <Icon className="w-5 h-5 text-[#906EFF]" />
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <h3 className="text-4xl font-bold text-white transition-transform group-hover:scale-105">
          {value?.toLocaleString() || 0}
        </h3>
      </div>
      
      {trend && (
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
            isNeutral ? 'bg-white/10' : 
            isPositive ? 'bg-green-500/10' : 
            'bg-red-500/10'
          }`}>
            {isNeutral ? (
              <Minus className="w-3.5 h-3.5 text-white/40" />
            ) : isPositive ? (
              <TrendingUp className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            )}
            <span className={`text-xs font-semibold ${
              isNeutral ? 'text-white/40' :
              isPositive ? 'text-green-400' : 
              'text-red-400'
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
  );
}