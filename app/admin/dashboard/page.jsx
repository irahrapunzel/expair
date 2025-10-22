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
  Activity,
  Calendar,
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
    activeUsersThisMonth: 0,
    systemHealth: "Good"
  });

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
      activeUsersThisMonth: 8,
      systemHealth: "Good"
    });
  }, []);


  // Chart data
  const tradesPerMonth = [
    { month: "Oct 2023", trades: 42, activeUsers: 35, averageRating: 4.3 },
    { month: "Nov 2023", trades: 45, activeUsers: 40, averageRating: 4.4 },
    { month: "Dec 2023", trades: 48, activeUsers: 42, averageRating: 4.5 },
    { month: "Jan 2024", trades: 52, activeUsers: 45, averageRating: 4.6 },
    { month: "Feb 2024", trades: 58, activeUsers: 49, averageRating: 4.7 },
    { month: "Mar 2024", trades: 65, activeUsers: 52, averageRating: 4.8 }
  ];

  const topTraders = [
    { name: "Sarah Manager", trades: 45, rating: 4.9 },
    { name: "Emily Brown", trades: 38, rating: 4.8 },
    { name: "Jane Smith", trades: 32, rating: 4.7 },
    { name: "Tom Director", trades: 28, rating: 4.6 },
    { name: "Alex Johnson", trades: 25, rating: 4.5 }
  ];

  const mostReportedUsers = [
    { name: "David Wilson", reports: 8, reason: "Harassment or bullying", status: "Under Review" },
    { name: "Mike Johnson", reports: 5, reason: "Disrespectful or rude language", status: "Resolved" },
    { name: "John Doe", reports: 3, reason: "Spam or scam activity", status: "Pending" },
    { name: "Unknown User", reports: 2, reason: "Inappropriate requests", status: "Resolved" }
  ];

  const reportReasons = [
    { reason: "Harassment or bullying", count: 12, percentage: 35 },
    { reason: "Disrespectful or rude language", count: 8, percentage: 24 },
    { reason: "Spam or scam activity", count: 6, percentage: 18 },
    { reason: "Inappropriate requests", count: 4, percentage: 12 },
    { reason: "Trade Issues", count: 3, percentage: 9 },
    { reason: "Profile Content", count: 1, percentage: 2 }
  ];


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
                <p className="text-sm text-white/60">Monthly trade volume and user engagement</p>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-sm text-green-400 font-medium">+23%</span>
              </div>
            </div>
            
            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2 text-sm font-medium text-white/80">Month</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-white/80">Trades</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-white/80">Active Users</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-white/80">Average Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {tradesPerMonth.map((data, index) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-2 text-sm text-white/90 font-medium">{data.month}</td>
                      <td className="py-3 px-2 text-sm text-white">{data.trades}</td>
                      <td className="py-3 px-2 text-sm text-white">{data.activeUsers}</td>
                      <td className="py-3 px-2 text-sm text-white flex items-center gap-1">
                        <span>{data.averageRating}</span>
                        <span className="text-yellow-400">⭐</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Total Trades:</span>
                  <span className="text-white font-medium">342</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Total Active Users:</span>
                  <span className="text-white font-medium">263</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Average User Rating:</span>
                  <span className="text-white font-medium">4.55 / 5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Growth:</span>
                  <span className="text-green-400 font-medium">+23% growth in trade activity</span>
                </div>
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
                      <span>{trader.rating} rating</span>
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
                <span className="text-white/60">Total Reports: <span className="text-white font-medium">34</span></span>
                <span className="text-white/60">Avg per User: <span className="text-white font-medium">4.3</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
