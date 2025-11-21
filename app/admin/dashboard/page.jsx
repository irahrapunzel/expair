"use client";

import { useState, useEffect, useCallback } from "react";
import StatsCard from "@/components/admin/stats-card";
import AvatarNameCell from "@/components/admin/avatar-name-cell";
import DashboardSkeleton from "@/components/admin/dashboard-skeleton";
import { useSession } from "next-auth/react"; 
import { 
  TrendingUp, 
  BarChart3, 
  Users as UsersIcon, 
  Star,
  Package,
  CheckCircle,
  RefreshCw,
  Clock,
  AlertCircle
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdminDashboard() {
  // --- STATE DEFINITIONS ---
  const { data: session, status: sessionStatus } = useSession(); 
  
  const [stats, setStats] = useState({
    totalTrades: 0,
    completedTrades: 0,
    activeTrades: 0,
    pendingTrades: 0
  });
  
  const [trends, setTrends] = useState({
    total_trades: { value: "0%", is_up: true, is_neutral: true },
    completed_trades: { value: "0%", is_up: true, is_neutral: true },
    active_trades: { value: "0%", is_up: true, is_neutral: true },
    pending_trades: { value: "0%", is_up: true, is_neutral: true }
  });
  
  const [monthlyData, setMonthlyData] = useState([]);
  const [topTraders, setTopTraders] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  
  const [loading, setLoading] = useState({
    stats: true,
    monthly: true,
    traders: true,
    activity: true
  });
  
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  // --- FUNCTION DEFINITIONS (Moved up to fix ReferenceError) ---

  // Individual fetch functions
  async function fetchTradeStats(adminToken) { 
    try {
      const response = await fetch(`${API_BASE}/api/admin/trade-stats/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${adminToken}`, 
            'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Trade stats failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to load trade stats");
      }
      
      setStats({
        totalTrades: data.total_trades || 0,
        completedTrades: data.completed_trades || 0,
        activeTrades: data.active_trades || 0,
        pendingTrades: data.pending_trades || 0
      });
      
      if (data.trends) {
        setTrends(data.trends);
      }
      
      setMonthlyData(data.monthly_breakdown || []);
      
      setLoading(prev => ({ ...prev, stats: false, monthly: false }));
      
    } catch (err) {
      console.error("Error fetching trade stats:", err);
      setError(err.message);
      setLoading(prev => ({ ...prev, stats: false, monthly: false }));
    }
  }

  async function fetchTopTraders(adminToken) { 
    try {
      const response = await fetch(`${API_BASE}/api/admin/top-traders/?limit=5`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${adminToken}`, 
            'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTopTraders(data.top_traders || []);
        }
      }
      
      setLoading(prev => ({ ...prev, traders: false }));
      
    } catch (err) {
      console.error("Error fetching top traders:", err);
      setLoading(prev => ({ ...prev, traders: false }));
    }
  }

  async function fetchRecentActivity(adminToken) { 
    try {
      const response = await fetch(`${API_BASE}/api/admin/recent-activity/?limit=10`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${adminToken}`, 
            'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRecentActivity(data.activities || []);
        }
      }
      
      setLoading(prev => ({ ...prev, activity: false }));
      
    } catch (err) {
      console.error("Error fetching recent activity:", err);
      setLoading(prev => ({ ...prev, activity: false }));
    }
  }

  // fetchAllData is defined using useCallback to ensure stable function reference
  const fetchAllData = useCallback(async () => {
    setLoading({
      stats: true,
      monthly: true,
      traders: true,
      activity: true
    });
    setError(null);
    
    // Get the access token securely from the session
    const adminToken = session?.access;
    if (!adminToken) {
        setLoading({ stats: false, monthly: false, traders: false, activity: false });
        setError("Authentication token not available. Please log in.");
        return;
    }
    
    await Promise.all([
      fetchTradeStats(adminToken), 
      fetchTopTraders(adminToken), 
      fetchRecentActivity(adminToken) 
    ]);
    
    setLastRefresh(new Date());
  }, [session?.access]); 

  // --- HOOKS AND LIFE CYCLE ---

  // Trigger fetch when session is authenticated and token is available
  useEffect(() => {
    // This is run once the component mounts and session status updates
    if (sessionStatus === "authenticated" && session?.access) { 
      fetchAllData();
    }
  }, [sessionStatus, session?.access, fetchAllData]); // Added fetchAllData dependency for completeness

  // Utility function (unchanged)
  function getActivityIcon(type) {
    const icons = {
      user_registered: "👤",
      trade_completed: "✅",
      trade_created: "📦",
      report_submitted: "⚠️",
      user_verified: "✔️"
    };
    return icons[type] || "📋";
  }

  const isInitialLoad = loading.stats && loading.monthly && loading.traders && loading.activity;

  if (sessionStatus === "loading" || (isInitialLoad && !error && sessionStatus !== "authenticated")) {
    return <DashboardSkeleton />;
  }
  
  if (sessionStatus === "unauthenticated") { 
    // Handle explicit unauthenticated state (redirect to login)
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050015] p-6 text-white">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-red-400">
                Access Denied (401). Please ensure you are logged in as an administrator.
            </div>
        </div>
    );
  }

  if (error && isInitialLoad) {
    return (
      <div className="min-h-screen bg-[#050015] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-red-400">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
                <p className="text-red-400/80 mb-4">{error}</p>
                <button
                  onClick={fetchAllData}
                  className="px-4 py-2 bg-[#906EFF] text-white rounded-lg hover:bg-[#7D5FE6] transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050015] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Refresh */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-white/60">
              Overview of platform activity
              {lastRefresh && (
                <span className="ml-2 text-white/40 text-sm">
                  • Last updated: {lastRefresh.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          
          <button
            onClick={fetchAllData}
            disabled={Object.values(loading).some(Boolean)}
            className="flex items-center gap-2 px-4 py-2 bg-[#120A2A] border border-[#906EFF]/30 rounded-lg text-white hover:bg-[#1A0F3E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${Object.values(loading).some(Boolean) ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh All</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading.stats ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#120A2A] rounded-xl p-6 border border-[#906EFF]/20 animate-pulse">
                <div className="h-4 w-24 bg-white/10 rounded mb-4" />
                <div className="h-10 w-20 bg-white/10 rounded mb-4" />
                <div className="h-3 w-32 bg-white/10 rounded" />
              </div>
            ))
          ) : (
            <>
              <StatsCard
                label="Total Trades"
                value={stats.totalTrades}
                trend={trends.total_trades.value}
                trendUp={trends.total_trades.is_neutral ? null : trends.total_trades.is_up}
                trendLabel="from last month"
                icon={Package}
              />
              <StatsCard
                label="Completed"
                value={stats.completedTrades}
                trend={trends.completed_trades.value}
                trendUp={trends.completed_trades.is_neutral ? null : trends.completed_trades.is_up}
                trendLabel="from last month"
                icon={CheckCircle}
              />
              <StatsCard
                label="Active Trades"
                value={stats.activeTrades}
                trend={trends.active_trades.value}
                trendUp={trends.active_trades.is_neutral ? null : trends.active_trades.is_up}
                trendLabel="from last month"
                icon={RefreshCw}
              />
              <StatsCard
                label="Pending"
                value={stats.pendingTrades}
                trend={trends.pending_trades.value}
                trendUp={trends.pending_trades.is_neutral ? null : trends.pending_trades.is_up}
                trendLabel="from last month"
                icon={Clock}
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Trades Table */}
          <div className="bg-[#120A2A] rounded-xl p-6 border border-[#906EFF]/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#906EFF]/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-[#906EFF]" />
                </div>
                <h2 className="text-xl font-semibold text-white">Trades Per Month</h2>
              </div>
              
              {loading.monthly && (
                <RefreshCw className="w-4 h-4 text-[#906EFF] animate-spin" />
              )}
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
                  {loading.monthly ? (
                    <tr>
                      <td colSpan="4" className="text-center py-8">
                        <RefreshCw className="w-6 h-6 text-[#906EFF] animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : monthlyData.length === 0 ? (
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
                        className="border-b border-white/5 hover:bg-[#1A0F3E] transition-colors group"
                      >
                        <td className="py-4 px-4">
                          <span className="text-white font-medium group-hover:text-[#906EFF] transition-colors">
                            {row.month}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-white font-semibold text-lg">{row.trades || 0}</span>
                            <span className="text-xs text-[#906EFF] bg-[#906EFF]/10 px-2 py-0.5 rounded-full">
                              {row.completed || 0} completed
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full">
                            <UsersIcon className="w-4 h-4 text-white/60" />
                            <span className="text-white">{row.active_users || 0}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {row.avg_rating != null && row.avg_rating > 0 ? (
                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/30">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="text-yellow-400 font-medium">{row.avg_rating.toFixed(1)}</span>
                            </div>
                          ) : (
                            <span className="text-white/30 text-sm">No ratings</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Traders */}
          <div className="bg-[#120A2A] rounded-xl p-6 border border-[#906EFF]/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Top Traders</h2>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/40">This month</span>
                {loading.traders && (
                  <RefreshCw className="w-4 h-4 text-[#906EFF] animate-spin" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              {loading.traders ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 text-[#906EFF] animate-spin mx-auto" />
                </div>
              ) : topTraders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <UsersIcon className="w-8 h-8 text-white/20" />
                    <p className="text-white/40 text-sm">No traders with completed trades yet</p>
                  </div>
                </div>
              ) : (
                topTraders.map((trader, index) => (
                  <div
                    key={trader.user_id}
                    className="flex items-center gap-4 p-4 bg-[#1A0F3E] rounded-xl border border-[#906EFF]/10 hover:border-[#906EFF]/30 transition-all group cursor-pointer"
                  >
                    {/* Rank Badge */}
                    <div className="w-8 h-8 rounded-full bg-[#906EFF]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#906EFF] font-bold text-sm">#{index + 1}</span>
                    </div>
                    
                    <AvatarNameCell
                      name={trader.username}
                      username={`${trader.completed_trades} ${trader.completed_trades === 1 ? 'trade' : 'trades'}`}
                      avatarUrl={trader.profile_pic}
                    />
                    
                    <div className="ml-auto text-right">
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-yellow-400 font-semibold">
                          {trader.rating > 0 ? trader.rating.toFixed(1) : 'N/A'}
                        </span>
                        <span className="text-white/30 text-xs">({trader.rating_count})</span>
                      </div>
                      <div className="text-xs text-white/40">
                        Level {trader.level} • {trader.total_xp.toLocaleString()} XP
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity with Timeline */}
        <div className="bg-[#120A2A] rounded-xl p-6 border border-[#906EFF]/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
            
            {loading.activity && (
              <RefreshCw className="w-4 h-4 text-[#906EFF] animate-spin" />
            )}
          </div>

          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-[#906EFF]/50 via-[#906EFF]/20 to-transparent" />

            <div className="space-y-4">
              {loading.activity ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 text-[#906EFF] animate-spin mx-auto" />
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/40 text-sm">No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity, idx) => (
                  <div
                    key={`${activity.type}-${idx}`}
                    className="relative flex items-start gap-4 group"
                  >
                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                      activity.type === 'user_registered' ? 'bg-green-500/20 ring-2 ring-green-500/30' :
                      activity.type === 'trade_completed' ? 'bg-blue-500/20 ring-2 ring-blue-500/30' :
                      activity.type === 'trade_created' ? 'bg-purple-500/20 ring-2 ring-purple-500/30' :
                      activity.type === 'report_submitted' ? 'bg-red-500/20 ring-2 ring-red-500/30' :
                      'bg-[#906EFF]/20 ring-2 ring-[#906EFF]/30'
                    }`}>
                      {getActivityIcon(activity.type)}
                    </div>

                    <div className="flex-1 bg-[#1A0F3E] rounded-xl p-4 border border-[#906EFF]/10 group-hover:border-[#906EFF]/30 transition-all">
                      <p className="text-white font-medium mb-1">{activity.description}</p>
                      <p className="text-xs text-white/40">{activity.timestamp}</p>
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