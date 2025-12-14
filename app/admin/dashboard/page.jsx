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
  AlertCircle,
  Filter,
  Download
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdminDashboard() {
  // --- STATE DEFINITIONS ---
  const { data: session, status: sessionStatus } = useSession();

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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

  const [monthRange, setMonthRange] = useState({ start: "", end: "" });

  const [loading, setLoading] = useState({
    stats: true,
    monthly: true,
    traders: true,
    activity: true
  });

  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  // --- API FETCH FUNCTIONS ---

  async function fetchTradeStats(adminToken, startMonth = null, endMonth = null) {
    try {
      let url = `${API_BASE}/api/admin/trade-stats/`;

      // Convert Month strings (YYYY-MM) to full dates for backend
      if (startMonth && endMonth) {
        const startDate = `${startMonth}-01`;
        const [y, m] = endMonth.split('-');
        const lastDay = new Date(y, m, 0).getDate();
        const endDate = `${endMonth}-${lastDay}`;

        url += `?start_date=${startDate}&end_date=${endDate}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();

      setStats({
        totalTrades: data.total_trades || 0,
        completedTrades: data.completed_trades || 0,
        activeTrades: data.active_trades || 0,
        pendingTrades: data.pending_trades || 0
      });

      if (data.trends) setTrends(data.trends);

      setMonthlyData(data.monthly_breakdown || []);
      setLoading(prev => ({ ...prev, stats: false, monthly: false }));

    } catch (err) {
      console.error(err);
      setLoading(prev => ({ ...prev, stats: false, monthly: false }));
    }
  }

  async function fetchTopTraders(adminToken) {
    try {
      const response = await fetch(`${API_BASE}/api/admin/top-traders/?limit=5`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await response.json();
      if (data.success) setTopTraders(data.top_traders || []);
      setLoading(prev => ({ ...prev, traders: false }));
    } catch (err) {
      setLoading(prev => ({ ...prev, traders: false }));
    }
  }

  async function fetchRecentActivity(adminToken) {
    try {
      const response = await fetch(`${API_BASE}/api/admin/recent-activity/?limit=10`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await response.json();
      if (data.success) setRecentActivity(data.activities || []);
      setLoading(prev => ({ ...prev, activity: false }));
    } catch (err) {
      setLoading(prev => ({ ...prev, activity: false }));
    }
  }

  // --- HANDLERS ---

  const handleGenerateReport = async () => {
    if (!session?.access) return;

    setIsGeneratingPdf(true);
    try {
      let url = `${API_BASE}/api/admin/dashboard-report-pdf/`;

      // Pass the current month range filter if active
      if (monthRange.start && monthRange.end) {
        const startDate = `${monthRange.start}-01`;
        const [y, m] = monthRange.end.split('-');
        const lastDay = new Date(y, m, 0).getDate();
        const endDate = `${monthRange.end}-${lastDay}`;
        url += `?start_date=${startDate}&end_date=${endDate}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access}`,
        },
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      // Handle File Download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `expair_analytics_report.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleApplyFilter = () => {
    if (session?.access && monthRange.start && monthRange.end) {
      setLoading(prev => ({ ...prev, monthly: true }));
      fetchTradeStats(session.access, monthRange.start, monthRange.end);
    }
  };

  const handleClearFilter = () => {
    setMonthRange({ start: "", end: "" });
    if (session?.access) {
      setLoading(prev => ({ ...prev, monthly: true }));
      fetchTradeStats(session.access);
    }
  };

  const fetchAllData = useCallback(async () => {
    setLoading({ stats: true, monthly: true, traders: true, activity: true });
    setError(null);
    const adminToken = session?.access;
    if (!adminToken) return;

    await Promise.all([
      fetchTradeStats(adminToken, monthRange.start, monthRange.end),
      fetchTopTraders(adminToken),
      fetchRecentActivity(adminToken)
    ]);
    setLastRefresh(new Date());
  }, [session?.access, monthRange.start, monthRange.end]);

  // --- HOOKS AND LIFE CYCLE ---

  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.access) {
      fetchAllData();
    }
  }, [sessionStatus, session?.access]);

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

        {/* HEADER */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
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

          <div className="flex items-center gap-2">
            {/* 4. NEW EXPORT BUTTON */}
            <button
              onClick={handleGenerateReport}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-[#906EFF] text-white rounded-lg hover:bg-[#7D5FE6] transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {isGeneratingPdf ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Export Report</span>
            </button>

            <button
              onClick={fetchAllData}
              disabled={Object.values(loading).some(Boolean)}
              className="flex items-center gap-2 px-4 py-2 bg-[#120A2A] border border-[#906EFF]/30 rounded-lg text-white hover:bg-[#1A0F3E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${Object.values(loading).some(Boolean) ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh All</span>
            </button>
          </div>
        </div>

        {/* STATS CARDS GRID */}
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

        {/* MIDDLE SECTION: Monthly Trades Table & Top Traders */}
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
                    {/* Rating Column Removed */}
                  </tr>
                </thead>
                <tbody>
                  {loading.monthly ? (
                    <tr>
                      <td colSpan="3" className="text-center py-8">
                        <RefreshCw className="w-6 h-6 text-[#906EFF] animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : monthlyData.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center py-8">
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
                        {/* Rating Cell Removed */}
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

        {/* --- ANALYTICS VISUALIZER --- */}
        <div className="bg-[#120A2A] rounded-xl p-6 border border-[#906EFF]/20 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#906EFF]" />
                Trade Analytics
              </h2>
              <p className="text-white/40 text-sm">Visualizing trade volume over time</p>
            </div>

            {/* MONTH RANGE FILTER */}
            <div className="flex flex-wrap items-center gap-2 bg-[#050015] p-2 rounded-lg border border-[#906EFF]/20">
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs uppercase">From</span>
                <input
                  type="month"
                  value={monthRange.start}
                  onChange={(e) => setMonthRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-[#1A0F3E] text-white text-sm px-3 py-1.5 rounded border border-white/10 focus:border-[#906EFF] outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs uppercase">To</span>
                <input
                  type="month"
                  value={monthRange.end}
                  onChange={(e) => setMonthRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-[#1A0F3E] text-white text-sm px-3 py-1.5 rounded border border-white/10 focus:border-[#906EFF] outline-none"
                />
              </div>

              <button onClick={handleApplyFilter} className="bg-[#906EFF] hover:bg-[#7D5FE6] text-white p-2 rounded ml-2">
                <Filter className="w-4 h-4" />
              </button>
              {(monthRange.start || monthRange.end) && (
                <button onClick={handleClearFilter} className="text-red-400 hover:text-red-300 text-xs font-medium px-2">
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* CHART VISUALIZER */}
          <div className="h-[350px] w-full">
            {loading.monthly ? (
              <div className="h-full flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-[#906EFF] animate-spin" />
              </div>
            ) : monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="rgba(255,255,255,0.5)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.5)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1A0F3E', borderColor: '#906EFF', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ fill: 'rgba(144, 110, 255, 0.1)' }}
                  />
                  <Legend />
                  <Bar name="Total Created" dataKey="trades" fill="#906EFF" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Bar name="Completed" dataKey="completed" fill="#4ADE80" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/40">
                <BarChart3 className="w-12 h-12 mb-2 opacity-50" />
                <p>No trade data found for this period</p>
              </div>
            )}
          </div>
        </div>

        {/* RECENT ACTIVITY (WITH RESTORED UI) */}
        <div className="bg-[#120A2A] rounded-xl p-6 border border-[#906EFF]/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Activity</h2>

            {loading.activity && (
              <RefreshCw className="w-4 h-4 text-[#906EFF] animate-spin" />
            )}
          </div>

          <div className="relative">
            {/* Vertical Timeline Line */}
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
                    {/* Colored Icon Bubble */}
                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-xl ${activity.type === 'user_registered' ? 'bg-green-500/20 ring-2 ring-green-500/30' :
                      activity.type === 'trade_completed' ? 'bg-blue-500/20 ring-2 ring-blue-500/30' :
                        activity.type === 'trade_created' ? 'bg-purple-500/20 ring-2 ring-purple-500/30' :
                          activity.type === 'report_submitted' ? 'bg-red-500/20 ring-2 ring-red-500/30' :
                            'bg-[#906EFF]/20 ring-2 ring-[#906EFF]/30'
                      }`}>
                      {getActivityIcon(activity.type)}
                    </div>

                    {/* Styled Card for Details */}
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