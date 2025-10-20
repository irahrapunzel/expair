export default function StatsCard({ title, value, icon: Icon, change, changeType, color }) {
  const getColorClasses = (color) => {
    const colorMap = {
      blue: "bg-blue-500",
      green: "bg-green-500", 
      yellow: "bg-yellow-500",
      purple: "bg-[#906EFF]",
      indigo: "bg-indigo-500",
      pink: "bg-pink-500",
      red: "bg-red-500",
      orange: "bg-orange-500"
    };
    return colorMap[color] || "bg-[#906EFF]";
  };

  const getChangeColor = (changeType) => {
    return changeType === "positive" ? "text-green-400" : "text-red-400";
  };

  return (
    <div className="bg-[#0A0028] border border-white/10 rounded-lg p-6 shadow-sm">
      {/* Icon at top */}
      <div className="flex justify-center mb-4">
        <div className={`w-12 h-12 ${getColorClasses(color)} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      
      {/* Large number in middle */}
      <div className="text-center mb-2">
        <div className="text-3xl font-bold text-white">{value}</div>
      </div>
      
      {/* Text at bottom */}
      <div className="text-center">
        <div className="text-sm text-white/70 mb-1">{title}</div>
        {change && (
          <div className={`text-xs font-medium ${getChangeColor(changeType)}`}>
            {change}
          </div>
        )}
      </div>
    </div>
  );
}



