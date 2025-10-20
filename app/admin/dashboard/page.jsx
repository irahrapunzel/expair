"use client";

import { useState, useEffect } from "react";
import { Inter } from "next/font/google";
import { 
  Users, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  Activity,
  X,
  Search,
  Filter,
  Calendar,
  TrendingDown,
  Shield,
  Award
} from "lucide-react";
import AdminPageHeader from "@/components/admin/admin-page-header";
import StatsCard from "@/components/admin/stats-card";

const inter = Inter({ subsets: ["latin"] });

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsersRegistered: 0,
    verifiedUsers: 0,
    pendingVerifications: 0,
    totalReportsSubmitted: 0,
    totalCompletedTrades: 0,
    activeUsersThisMonth: 0,
    systemHealth: "Good"
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityFilter, setActivityFilter] = useState("all");
  const [activitySearch, setActivitySearch] = useState("");
  const [dateRange, setDateRange] = useState("2023-2024");

  useEffect(() => {
    // Use hardcoded data instead of API calls
    console.log("Loading hardcoded dashboard data...");
    
    // Set hardcoded stats that match the Users page data (8 users total)
    setStats({
      totalUsersRegistered: 8,
      verifiedUsers: 3, // Jane Smith, Emily Brown, Sarah Manager
      pendingVerifications: 3, // John Doe, Mike Johnson, Tom Director  
      totalReportsSubmitted: 0,
      totalCompletedTrades: 0,
      activeUsersThisMonth: 8,
      systemHealth: "Good"
    });
    
    // Set hardcoded recent activity based on Users page data
    const allActivities = [
    {
      id: 1,
        type: "user_registration",
        message: "New user 'Alex Johnson' registered",
        timestamp: "Aug 15, 2023",
        icon: Users,
        status: "completed",
        details: "User completed full registration process with email verification"
    },
    {
      id: 2,
        type: "user_registration", 
        message: "New user 'Tom Director' registered",
        timestamp: "Sep 1, 2023",
        icon: Users,
        status: "completed",
        details: "User completed full registration process with email verification"
    },
    {
      id: 3,
        type: "user_registration",
        message: "New user 'Sarah Manager' registered",
        timestamp: "Oct 1, 2023",
        icon: Users,
        status: "completed",
        details: "User completed full registration process with email verification"
    },
    {
      id: 4,
        type: "user_registration",
        message: "New user 'Emily Brown' registered",
        timestamp: "Nov 10, 2023",
        icon: Users,
        status: "completed",
        details: "User completed full registration process with email verification"
    },
    {
      id: 5,
        type: "user_registration",
        message: "New user 'Jane Smith' registered",
        timestamp: "Dec 1, 2023",
        icon: Users,
        status: "completed",
        details: "User completed full registration process with email verification"
    },
    {
      id: 6,
        type: "user_registration",
        message: "New user 'John Doe' registered",
        timestamp: "Jan 15, 2024",
        icon: Users,
        status: "pending",
        details: "User registration pending verification"
    },
    {
      id: 7,
        type: "user_registration",
        message: "New user 'Mike Johnson' registered",
        timestamp: "Feb 20, 2024",
        icon: Users,
        status: "pending",
        details: "User registration pending verification"
    },
    {
      id: 8,
        type: "user_registration",
        message: "New user 'David Wilson' registered",
        timestamp: "Mar 5, 2024",
        icon: Users,
        status: "rejected",
        details: "User registration rejected due to invalid documents"
      },
      {
        id: 9,
        type: "trade_created",
        message: "New trade 'Web Development Services' created",
        timestamp: "Mar 10, 2024",
        icon: TrendingUp,
        status: "active",
        details: "Trade request created by verified user"
      },
      {
        id: 10,
        type: "report_submitted",
        message: "Report submitted against user 'David Wilson'",
        timestamp: "Mar 12, 2024",
        icon: AlertTriangle,
        status: "under_review",
        details: "User reported for suspicious activity"
      },
      {
        id: 11,
        type: "trade_completed",
        message: "Trade #001 completed successfully",
        timestamp: "Mar 15, 2024",
        icon: CheckCircle,
        status: "completed",
        details: "Trade between verified users completed with positive rating"
      },
      {
        id: 12,
        type: "system_alert",
        message: "High server load detected",
        timestamp: "Mar 18, 2024",
        icon: Activity,
        status: "resolved",
        details: "Server load spike resolved automatically"
      }
    ];
    
    // Set recent activity (first 5 for dashboard)
    setRecentActivity(allActivities.slice(0, 5));
  }, []);

  // All activities data (same as in useEffect)
  const allActivities = [
    {
      id: 1,
      type: "user_registration",
      message: "New user 'Alex Johnson' registered",
      timestamp: "Aug 15, 2023",
      icon: Users,
      status: "completed",
      details: "User completed full registration process with email verification"
    },
    {
      id: 2,
      type: "user_registration", 
      message: "New user 'Tom Director' registered",
      timestamp: "Sep 1, 2023",
      icon: Users,
      status: "completed",
      details: "User completed full registration process with email verification"
    },
    {
      id: 3,
      type: "user_registration",
      message: "New user 'Sarah Manager' registered",
      timestamp: "Oct 1, 2023",
      icon: Users,
      status: "completed",
      details: "User completed full registration process with email verification"
    },
    {
      id: 4,
      type: "user_registration",
      message: "New user 'Emily Brown' registered",
      timestamp: "Nov 10, 2023",
      icon: Users,
      status: "completed",
      details: "User completed full registration process with email verification"
    },
    {
      id: 5,
      type: "user_registration",
      message: "New user 'Jane Smith' registered",
      timestamp: "Dec 1, 2023",
      icon: Users,
      status: "completed",
      details: "User completed full registration process with email verification"
    },
    {
      id: 6,
      type: "user_registration",
      message: "New user 'John Doe' registered",
      timestamp: "Jan 15, 2024",
      icon: Users,
      status: "pending",
      details: "User registration pending verification"
    },
    {
      id: 7,
      type: "user_registration",
      message: "New user 'Mike Johnson' registered",
      timestamp: "Feb 20, 2024",
      icon: Users,
      status: "pending",
      details: "User registration pending verification"
    },
    {
      id: 8,
      type: "user_registration",
      message: "New user 'David Wilson' registered",
      timestamp: "Mar 5, 2024",
      icon: Users,
      status: "rejected",
      details: "User registration rejected due to invalid documents"
    },
    {
      id: 9,
      type: "trade_created",
      message: "New trade 'Web Development Services' created",
      timestamp: "Mar 10, 2024",
      icon: TrendingUp,
      status: "active",
      details: "Trade request created by verified user"
    },
    {
      id: 10,
      type: "report_submitted",
      message: "Report submitted against user 'David Wilson'",
      timestamp: "Mar 12, 2024",
      icon: AlertTriangle,
      status: "under_review",
      details: "User reported for suspicious activity"
    },
    {
      id: 11,
      type: "trade_completed",
      message: "Trade #001 completed successfully",
      timestamp: "Mar 15, 2024",
      icon: CheckCircle,
      status: "completed",
      details: "Trade between verified users completed with positive rating"
    },
    {
      id: 12,
      type: "system_alert",
      message: "High server load detected",
      timestamp: "Mar 18, 2024",
      icon: Activity,
      status: "resolved",
      details: "Server load spike resolved automatically"
    }
  ];

  // Chart data
  const tradesPerMonth = [
    { month: "Jan 2023", trades: 12, revenue: 2400 },
    { month: "Feb 2023", trades: 18, revenue: 3600 },
    { month: "Mar 2023", trades: 25, revenue: 5000 },
    { month: "Apr 2023", trades: 22, revenue: 4400 },
    { month: "May 2023", trades: 30, revenue: 6000 },
    { month: "Jun 2023", trades: 28, revenue: 5600 },
    { month: "Jul 2023", trades: 35, revenue: 7000 },
    { month: "Aug 2023", trades: 32, revenue: 6400 },
    { month: "Sep 2023", trades: 38, revenue: 7600 },
    { month: "Oct 2023", trades: 42, revenue: 8400 },
    { month: "Nov 2023", trades: 45, revenue: 9000 },
    { month: "Dec 2023", trades: 48, revenue: 9600 },
    { month: "Jan 2024", trades: 52, revenue: 10400 },
    { month: "Feb 2024", trades: 58, revenue: 11600 },
    { month: "Mar 2024", trades: 65, revenue: 13000 }
  ];

  const topTraders = [
    { name: "Sarah Manager", trades: 45, rating: 4.9, revenue: 9200 },
    { name: "Emily Brown", trades: 38, rating: 4.8, revenue: 7600 },
    { name: "Jane Smith", trades: 32, rating: 4.7, revenue: 6400 },
    { name: "Tom Director", trades: 28, rating: 4.6, revenue: 5600 },
    { name: "Alex Johnson", trades: 25, rating: 4.5, revenue: 5000 }
  ];

  const mostReportedUsers = [
    { name: "David Wilson", reports: 8, reason: "Suspicious Activity", status: "Under Review" },
    { name: "Mike Johnson", reports: 5, reason: "Payment Issues", status: "Resolved" },
    { name: "John Doe", reports: 3, reason: "Inappropriate Behavior", status: "Pending" },
    { name: "Unknown User", reports: 2, reason: "Spam", status: "Resolved" }
  ];

  const reportReasons = [
    { reason: "Suspicious Activity", count: 8, percentage: 44 },
    { reason: "Payment Issues", count: 5, percentage: 28 },
    { reason: "Inappropriate Behavior", count: 3, percentage: 17 },
    { reason: "Spam", count: 2, percentage: 11 }
  ];

  // Filter activities based on search and filter
  const filteredActivities = allActivities.filter(activity => {
    const matchesSearch = activity.message.toLowerCase().includes(activitySearch.toLowerCase()) ||
                         activity.details.toLowerCase().includes(activitySearch.toLowerCase());
    const matchesFilter = activityFilter === "all" || activity.type === activityFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      case "pending":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      case "rejected":
        return "text-red-400 bg-red-500/20 border-red-500/30";
      case "active":
        return "text-blue-400 bg-blue-500/20 border-blue-500/30";
      case "under_review":
        return "text-orange-400 bg-orange-500/20 border-orange-500/30";
      case "resolved":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500/30";
    }
  };

  const statCards = [
    {
      title: "Total Users Registered",
      value: stats.totalUsersRegistered.toLocaleString(),
      icon: Users,
      change: "+12%",
      changeType: "positive",
      color: "blue"
    },
    {
      title: "Verified Users",
      value: stats.verifiedUsers.toLocaleString(),
      icon: CheckCircle,
      change: "+8%",
      changeType: "positive",
      color: "green"
    },
    {
      title: "Pending Verifications",
      value: stats.pendingVerifications,
      icon: Clock,
      change: "-3%",
      changeType: "negative",
      color: "yellow"
    },
    {
      title: "Total Reports Submitted",
      value: stats.totalReportsSubmitted.toLocaleString(),
      icon: AlertTriangle,
      change: "+5%",
      changeType: "positive",
      color: "red"
    },
    {
      title: "Total Completed Trades",
      value: stats.totalCompletedTrades.toLocaleString(),
      icon: TrendingUp,
      change: "+15%",
      changeType: "positive",
      color: "purple"
    },
    {
      title: "Active Users This Month",
      value: stats.activeUsersThisMonth.toLocaleString(),
      icon: Activity,
      change: "+23%",
      changeType: "positive",
      color: "indigo"
    }
  ];

  return (
    <div className={`p-8 ${inter.className}`}>
      {/* Page Title */}
      <AdminPageHeader
        title="Dashboard Overview"
        subtitle="Welcome back! Here's what's happening on your platform."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, index) => (
          <StatsCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            change={card.change}
            changeType={card.changeType}
            color={card.color}
          />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-[#0A0028] border border-white/10 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          <p className="text-sm text-white/60 mt-1">Latest user registrations and platform activity</p>
        </div>
        
        <div className="divide-y divide-white/5">
          {recentActivity.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="px-6 py-4 hover:bg-white/5 transition-colors duration-200">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#906EFF]/20 to-[#906EFF]/10 rounded-xl flex items-center justify-center border border-[#906EFF]/20">
                      <Icon className="w-5 h-5 text-[#906EFF]" />
        </div>
      </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-white truncate">
                        {activity.message}
                      </h4>
                      <span className="text-xs text-white/50 font-mono bg-white/5 px-2 py-1 rounded-md">
                        #{String(activity.id).padStart(3, '0')}
                    </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-white/60 font-medium">{activity.timestamp}</span>
                      <span className="text-xs text-white/40">•</span>
                      <span className="text-xs text-white/60 capitalize">{activity.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-3 bg-white/5 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/60">Showing {recentActivity.length} recent activities</span>
            <button
              onClick={() => setShowActivityModal(true)}
              className="text-xs text-[#906EFF] hover:text-[#906EFF]/80 font-medium transition-colors"
            >
              View All Activity →
            </button>
          </div>
        </div>
      </div>

      {/* Charts / Reports Summary */}
      <div className="mt-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Charts / Reports Summary</h2>
          <p className="text-white/60">Analytics and insights for platform performance</p>
        </div>

        {/* Date Range Filter */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/80">Date Range:</span>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-[#0A0028] border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#906EFF]/50"
          >
            <option value="2023-2024" className="bg-[#0A0028] text-white">2023 - 2024</option>
            <option value="2023" className="bg-[#0A0028] text-white">2023 Only</option>
            <option value="2024" className="bg-[#0A0028] text-white">2024 Only</option>
            <option value="last-6-months" className="bg-[#0A0028] text-white">Last 6 Months</option>
          </select>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Number of Trades per Month */}
          <div className="bg-[#0A0028] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Number of Trades per Month</h3>
                <p className="text-sm text-white/60">Monthly trade volume and revenue</p>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-sm text-green-400 font-medium">+23%</span>
              </div>
            </div>
            
            {/* Simple Bar Chart */}
            <div className="space-y-3">
              {tradesPerMonth.slice(-6).map((data, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-16 text-xs text-white/60 font-medium">{data.month}</div>
                  <div className="flex-1 bg-white/5 rounded-full h-6 relative overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#906EFF] to-[#6DDFFF] rounded-full transition-all duration-500"
                      style={{ width: `${(data.trades / 65) * 100}%` }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-between px-3">
                      <span className="text-xs text-white font-medium">{data.trades}</span>
                      <span className="text-xs text-white/60">${data.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Total Trades: <span className="text-white font-medium">342</span></span>
                <span className="text-white/60">Total Revenue: <span className="text-white font-medium">$68,400</span></span>
              </div>
            </div>
          </div>

          {/* Most Active Users / Top Traders */}
          <div className="bg-[#0A0028] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Most Active Users / Top Traders</h3>
                <p className="text-sm text-white/60">Top performing traders by volume</p>
              </div>
              <Award className="w-5 h-5 text-yellow-400" />
            </div>
            
            <div className="space-y-4">
              {topTraders.map((trader, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#906EFF]/20 to-[#906EFF]/10 rounded-full flex items-center justify-center border border-[#906EFF]/20">
                    <span className="text-xs font-bold text-[#906EFF]">#{index + 1}</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-white">{trader.name}</h4>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-yellow-400">★</span>
                        <span className="text-xs text-white/80">{trader.rating}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>{trader.trades} trades</span>
                      <span>${trader.revenue.toLocaleString()} revenue</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row - Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Reported Users */}
          <div className="bg-[#0A0028] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Most Reported Users</h3>
                <p className="text-sm text-white/60">Users with highest report counts</p>
              </div>
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            
            <div className="space-y-4">
              {mostReportedUsers.map((user, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500/20 to-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                    <span className="text-xs font-bold text-red-400">#{index + 1}</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-white">{user.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        user.status === 'Under Review' ? 'bg-orange-500/20 text-orange-400' :
                        user.status === 'Resolved' ? 'bg-green-500/20 text-green-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {user.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>{user.reports} reports</span>
                      <span>{user.reason}</span>
                    </div>
                  </div>
                </div>
          ))}
        </div>
      </div>

          {/* Most Common Report Reasons */}
          <div className="bg-[#0A0028] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Most Common Report Reasons</h3>
                <p className="text-sm text-white/60">Breakdown of report categories</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-orange-400" />
            </div>
            
            <div className="space-y-4">
              {reportReasons.map((reason, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white font-medium">{reason.reason}</span>
                    <span className="text-sm text-white/60">{reason.count} reports</span>
                  </div>
                  
                  <div className="w-full bg-white/5 rounded-full h-3 relative overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        index === 0 ? 'bg-gradient-to-r from-red-500 to-red-400' :
                        index === 1 ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
                        index === 2 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                        'bg-gradient-to-r from-gray-500 to-gray-400'
                      }`}
                      style={{ width: `${reason.percentage}%` }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-end pr-2">
                      <span className="text-xs text-white font-medium">{reason.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Total Reports: <span className="text-white font-medium">18</span></span>
                <span className="text-white/60">Avg per User: <span className="text-white font-medium">2.3</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0028] border border-white/10 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">All Activity</h2>
                <p className="text-sm text-white/60 mt-1">Complete activity log with filtering and search</p>
              </div>
              <button
                onClick={() => setShowActivityModal(false)}
                className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search and Filter */}
            <div className="px-6 py-4 border-b border-white/10 bg-white/5">
              <div className="flex gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#906EFF]/50 focus:ring-1 focus:ring-[#906EFF]/20"
                  />
        </div>

                {/* Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                  <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 bg-[#0A0028] border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#906EFF]/50 focus:ring-1 focus:ring-[#906EFF]/20 appearance-none"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="all" className="bg-[#0A0028] text-white">All Types</option>
                    <option value="user_registration" className="bg-[#0A0028] text-white">User Registration</option>
                    <option value="trade_created" className="bg-[#0A0028] text-white">Trade Created</option>
                    <option value="trade_completed" className="bg-[#0A0028] text-white">Trade Completed</option>
                    <option value="report_submitted" className="bg-[#0A0028] text-white">Report Submitted</option>
                    <option value="system_alert" className="bg-[#0A0028] text-white">System Alert</option>
                  </select>
          </div>
        </div>
      </div>

            {/* Activity List */}
            <div className="overflow-y-auto max-h-[60vh]">
              <div className="divide-y divide-white/5">
                {filteredActivities.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-white/40" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No activities found</h3>
                    <p className="text-white/60">Try adjusting your search or filter criteria</p>
                  </div>
                ) : (
                  filteredActivities.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div key={activity.id} className="px-6 py-4 hover:bg-white/5 transition-colors duration-200">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#906EFF]/20 to-[#906EFF]/10 rounded-xl flex items-center justify-center border border-[#906EFF]/20">
                              <Icon className="w-5 h-5 text-[#906EFF]" />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-white">
                                {activity.message}
                              </h4>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(activity.status)}`}>
                                  {activity.status.replace('_', ' ')}
                                </span>
                                <span className="text-xs text-white/50 font-mono bg-white/5 px-2 py-1 rounded-md">
                                  #{String(activity.id).padStart(3, '0')}
                                </span>
                              </div>
                            </div>
                            
                            <p className="text-xs text-white/70 mb-2">{activity.details}</p>
                            
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                              <span className="text-xs text-white/60 font-medium">{activity.timestamp}</span>
                              <span className="text-xs text-white/40">•</span>
                              <span className="text-xs text-white/60 capitalize">{activity.type.replace('_', ' ')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">
                  Showing {filteredActivities.length} of {allActivities.length} activities
                </span>
                <button
                  onClick={() => setShowActivityModal(false)}
                  className="px-4 py-2 bg-[#906EFF] text-white text-sm font-medium rounded-lg hover:bg-[#906EFF]/80 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
