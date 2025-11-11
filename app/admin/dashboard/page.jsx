"use client";

import { useState, useEffect } from "react";
import StatsCard from "@/components/admin/stats-card";
import AvatarNameCell from "@/components/admin/avatar-name-cell";
import DashboardSkeleton from "@/components/admin/dashboard-skeleton";
import { 
  TrendingUp, 
  BarChart3, 
  Users as UsersIcon, 
  Star,
  Package,
  CheckCircle,
  RefreshCw,
  Clock
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalTrades: 0,
    completedTrades: 0,
    activeTrades: 0,
    pendingTrades: 0
  });
  const [trends, setTrends] = useState({
    total_trades: { value: "0%", is_up: true },
    completed_trades: { value: "0%", is_up: true },
    active_trades: { value: "0%", is_up: true },
    pending_trades: { value: "0%", is_up: true }
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [topTraders, setTopTraders] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch trade statistics
      const tradeStatsRes = await fetch(`${API_BASE}/api/admin/trade-stats/`);
      
      if (!tradeStatsRes.ok) {
        throw new Error(`Trade stats failed: ${tradeStatsRes.status}`);
      }
      
      const tradeStatsData = await tradeStatsRes.json();
      
      if (!tradeStatsData.success) {
        throw new Error(tradeStatsData.error || "Failed to load trade stats");
      }
      
      setStats({
        totalTrades: tradeStatsData.total_trades,
        completedTrades: tradeStatsData.completed_trades,
        activeTrades: tradeStatsData.active_trades,
        pendingTrades: tradeStatsData.pending_trades
      });
      
      // Set real trends from backend
      if (tradeStatsData.trends) {
        setTrends(tradeStatsData.trends);
      }
      
      setMonthlyData(tradeStatsData.monthly_breakdown || []);
      
      // Fetch top traders
      const topTradersRes = await fetch(`${API_BASE}/api/admin/top-traders/?limit=5`);
      if (topTradersRes.ok) {
        const topTradersData = await topTradersRes.json();
        if (topTradersData.success) {
          setTopTraders(topTradersData.top_traders || []);
        }
      }
      
      // Fetch recent activity
      const activityRes = await fetch(`${API_BASE}/api/admin/recent-activity/?limit=10`);
      if (activityRes.ok) {
        const activityData = await activityRes.json();
        if (activityData.success) {
          setRecentActivity(activityData.activities || []);
        }
      }
      
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getActivityIcon(type) {
    switch (type) {
      case 'user_registered': return '👤';
      case 'trade_completed': return '✅';
      case 'report_filed': return '⚠️';
      default: return '📋';
    }
  }

  function getActivityColor(type) {
    switch (type) {
      case 'user_registered': return 'text-green-400';
      case 'trade_completed': return 'text-blue-400';
      case 'report_filed': return 'text-yellow-400';
      default: return 'text-white/60';
    }
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-red-400">
          <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
          <p>{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-[#6DDFFF] text-black rounded-lg hover:bg-[#5DCFEF]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-white/60">Overview of platform activity</p>
        </div>

        {/* Stats Cards with Icons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            label="Total Trades"
            value={stats.totalTrades}
            trend={trends.total_trades.value}
            trendUp={trends.total_trades.is_up}
            trendLabel="from last month"
            icon={Package}
          />
          <StatsCard
            label="Completed"
            value={stats.completedTrades}
            trend={trends.completed_trades.value}
            trendUp={trends.completed_trades.is_up}
            trendLabel="from last month"
            icon={CheckCircle}
          />
          <StatsCard
            label="Active Trades"
            value={stats.activeTrades}
            trend={trends.active_trades.value}
            trendUp={trends.active_trades.is_up}
            trendLabel="from last month"
            icon={RefreshCw}
          />
          <StatsCard
            label="Pending"
            value={stats.pendingTrades}
            trend={trends.pending_trades.value}
            trendUp={trends.pending_trades.is_up}
            trendLabel="from last month"
            icon={Clock}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Enhanced Monthly Trades Table */}
          <div className="bg-gradient-to-br from-[#151B2B] to-[#0A0F1A] rounded-xl p-6 border border-white/10 hover:border-[#6DDFFF]/20 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#6DDFFF]/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-[#6DDFFF]" />
                </div>
                <h2 className="text-xl font-semibold text-white">Trades Per Month</h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-white/60 font-medium text-sm">Month</th>
                    <th className="text-center py-3 px-4 text-white/60 font-medium text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Trades
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 text-white/60 font-medium text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <UsersIcon className="w-4 h-4" />
                        Users
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 text-white/60 font-medium text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <Star className="w-4 h-4" />
                        Rating
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <BarChart3 className="w-8 h-8 text-white/20" />
                          <p className="text-white/40 text-sm">No data available</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    monthlyData.map((row, idx) => (
                      <tr 
                        key={idx} 
                        className="border-b border-white/5 hover:bg-[#6DDFFF]/5 transition-colors group"
                      >
                        <td className="py-4 px-4">
                          <span className="text-white font-medium group-hover:text-[#6DDFFF] transition-colors">
                            {row.month}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-white font-semibold text-lg">{row.trades}</span>
                            <span className="text-xs text-[#6DDFFF] bg-[#6DDFFF]/10 px-2 py-0.5 rounded-full">
                              {row.completed} completed
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full">
                            <UsersIcon className="w-3.5 h-3.5 text-white/60" />
                            <span className="text-white font-medium">{row.active_users}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {row.average_rating > 0 ? (
                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500/10 rounded-full">
                              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                              <span className="text-yellow-400 font-semibold">{row.average_rating}</span>
                            </div>
                          ) : (
                            <span className="text-white/30">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Enhanced Top Traders */}
          <div className="bg-gradient-to-br from-[#151B2B] to-[#0A0F1A] rounded-xl p-6 border border-white/10 hover:border-[#6DDFFF]/20 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Top Traders</h2>
              </div>
              <span className="text-xs text-white/40">This month</span>
            </div>

            <div className="space-y-2">
              {topTraders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <UsersIcon className="w-8 h-8 text-white/20" />
                    <p className="text-white/40 text-sm">No traders yet</p>
                  </div>
                </div>
              ) : (
                topTraders.map((trader, idx) => (
                  <div
                    key={trader.user_id}
                    className="relative flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-[#6DDFFF]/10 transition-all duration-300 group cursor-pointer border border-transparent hover:border-[#6DDFFF]/20"
                  >
                    {/* Rank badge */}
                    <div className={`absolute -left-2 -top-2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-lg shadow-yellow-500/50' :
                      idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' :
                      idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-black' :
                      'bg-white/10 text-white/60'
                    }`}>
                      {idx + 1}
                    </div>

                    <AvatarNameCell
                      name={trader.name}
                      username={`@${trader.username}`}
                      avatarUrl={trader.profile_pic}
                    />

                    <div className="ml-auto text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-white font-semibold text-lg">{trader.trades}</span>
                        <span className="text-white/40 text-sm">trades</span>
                      </div>
                      <div className="flex items-center gap-1 justify-end mt-1">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-yellow-400 font-medium text-sm">
                          {trader.rating.toFixed(1)}
                        </span>
                        <span className="text-white/30 text-xs">({trader.rating_count})</span>
                      </div>
                      <div className="text-xs text-white/40 mt-1">
                        Level {trader.level} • {trader.total_xp.toLocaleString()} XP
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Recent Activity with Timeline */}
        <div className="bg-gradient-to-br from-[#151B2B] to-[#0A0F1A] rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-[#6DDFFF]/50 via-[#6DDFFF]/20 to-transparent" />

            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/40 text-sm">No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity, idx) => (
                  <div
                    key={idx}
                    className="relative flex items-start gap-4 group"
                  >
                    {/* Timeline dot */}
                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                      activity.type === 'user_registered' ? 'bg-green-500/20 ring-2 ring-green-500/30' :
                      activity.type === 'trade_completed' ? 'bg-blue-500/20 ring-2 ring-blue-500/30' :
                      'bg-yellow-500/20 ring-2 ring-yellow-500/30'
                    }`}>
                      {getActivityIcon(activity.type)}
                    </div>

                    <div className="flex-1 bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors">
                      <p className={`${getActivityColor(activity.type)} font-medium mb-1`}>
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <span>{new Date(activity.timestamp).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{new Date(activity.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}