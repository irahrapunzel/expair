"use client";

import { useState, useEffect } from "react";
import { 
  Check, 
  X, 
  Eye, 
  MoreHorizontal, 
  Search, 
  Download, 
  RefreshCw,
  Clock,
  Mail,
  Calendar,
  Shield,
  AlertTriangle,
  TrendingUp,
  Users as UsersIcon,
  Star,
  Award,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import StatsCard from "@/components/admin/stats-card";
import AvatarNameCell from "@/components/admin/avatar-name-cell";
import DashboardSkeleton from "@/components/admin/dashboard-skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [sortBy, setSortBy] = useState(null);
  const [sortDirection, setSortDirection] = useState("desc");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportData, setExportData] = useState("");

  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingVerifications: 0,
    flaggedUsers: 0,
    totalTrend: { value: "0%", is_up: false, is_neutral: true },
    verifiedTrend: { value: "0%", is_up: false, is_neutral: true },
    pendingTrend: { value: "0%", is_up: false, is_neutral: true },
    flaggedTrend: { value: "0%", is_up: false, is_neutral: true }
  });

  useEffect(() => {
    fetchStats();
  }, [showFlaggedOnly]);

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, verificationFilter, showFlaggedOnly, sortBy, sortDirection, currentPage]);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        verification: verificationFilter,
        flagged: showFlaggedOnly.toString(),
        sort: sortBy || 'joined',
        page: currentPage.toString(),
        per_page: '20'
      });

      const response = await fetch(`${API_BASE}/api/admin/users-list/?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load users');
      }
      
      let fetchedUsers = data.users || [];

      if (sortBy) {
        if (sortBy === 'name') {
          fetchedUsers = fetchedUsers.sort((a, b) =>
            (a.username || '').localeCompare(b.username || '')
          );
        } else if (sortBy === 'email') {
          fetchedUsers = fetchedUsers.sort((a, b) =>
            (a.email || '').localeCompare(b.email || '')
          );
        } else if (sortBy === 'rating') {
          fetchedUsers = fetchedUsers.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (sortBy === 'level') {
          fetchedUsers = fetchedUsers.sort((a, b) => (b.level || 0) - (a.level || 0));
        } else if (sortBy === 'joined') {
          fetchedUsers = fetchedUsers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else if (sortBy === 'status') {
          const statusOrder = { verified: 0, pending: 1, unverified: 2 };
          fetchedUsers = fetchedUsers.sort((a, b) => 
            (statusOrder[a.verification_status] || 3) - (statusOrder[b.verification_status] || 3)
          );
        }

        if (sortDirection === 'asc') fetchedUsers.reverse();
      }

      setUsers(fetchedUsers);
      setTotalUsers(data.pagination.total);
      setTotalPages(data.pagination.total_pages);
      
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const response = await fetch(`${API_BASE}/api/admin/user-stats/`);
      
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalUsers: data.totalUsersRegistered || 0,
          verifiedUsers: data.verifiedUsers || 0,
          pendingVerifications: data.pendingVerifications || 0,
          flaggedUsers: data.flaggedUsers || 0,
          totalTrend: data.trends?.total_users || { value: "0%", is_up: false, is_neutral: true },
          verifiedTrend: data.trends?.verified_users || { value: "0%", is_up: false, is_neutral: true },
          pendingTrend: data.trends?.pending_verifications || { value: "0%", is_up: false, is_neutral: true },
          flaggedTrend: data.trends?.flagged_users || { value: "0%", is_up: false, is_neutral: true }
        });
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }

  async function handleVerifyUser(userId) {
    try {
      const response = await fetch(`${API_BASE}/api/admin/verify-user/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });

      const data = await response.json();

      if (data.success) {
        alert(`User verified successfully`);
        fetchUsers();
        fetchStats();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error("Error verifying user:", err);
      alert("Failed to verify user");
    }
  }

  function handleSort(column) {
    if (sortBy !== column) {
      setSortBy(column);
      setSortDirection('desc');
    } else {
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else {
        setSortBy(null);
        setSortDirection('desc');
      }
    }
  }

  function getSortIcon(column) {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-white/30" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 text-[#906EFF]" />
      : <ArrowDown className="w-3.5 h-3.5 text-[#906EFF]" />;
  }

  function getVerificationBadge(user) {
    if (user.verification_status === 'verified') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-green-500/10 text-green-400 border-green-500/30">
          <Shield className="w-3 h-3" />
          Verified
        </span>
      );
    } else if (user.verification_status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-red-500/10 text-red-400 border-red-500/30">
        <XCircle className="w-3 h-3" />
        Unverified
      </span>
    );
  }

  function handleExport() {
    const exportPayload = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalUsers: users.length,
        filters: {
          search: searchQuery,
          verification: verificationFilter,
          flaggedOnly: showFlaggedOnly,
          sortBy: sortBy
        }
      },
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`.trim(),
        created_at: user.created_at,
        level: user.level,
        total_xp: user.total_xp,
        rating: user.rating,
        rating_count: user.rating_count,
        verification_status: user.verification_status,
        active_reports: user.active_reports_count
      }))
    };
    
    setExportData(JSON.stringify(exportPayload, null, 2));
    setShowExportModal(true);
  }

  function downloadJSON() {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expair-users-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading && users.length === 0) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050015] p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-red-400">
          <h2 className="text-xl font-bold mb-2">Error Loading Users</h2>
          <p>{error}</p>
          <button
            onClick={fetchUsers}
            className="mt-4 px-4 py-2 bg-[#906EFF] text-white rounded-lg hover:bg-[#7D5FE6] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050015] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Users Management</h1>
          <p className="text-white/60">Monitor and manage user accounts, verifications, and activity</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            label="Total Users"
            value={stats.totalUsers}
            icon={UsersIcon}
            trend={stats.totalTrend.value}
            trendLabel="from last month"
            trendUp={stats.totalTrend.is_neutral ? null : stats.totalTrend.is_up}
          />
          <StatsCard
            label="Verified Users"
            value={stats.verifiedUsers}
            icon={Shield}
            trend={stats.verifiedTrend.value}
            trendLabel="from last month"
            trendUp={stats.verifiedTrend.is_neutral ? null : stats.verifiedTrend.is_up}
          />
          <StatsCard
            label="Pending Verifications"
            value={stats.pendingVerifications}
            icon={Clock}
            trend={stats.pendingTrend.value}
            trendLabel="from last month"
            trendUp={stats.pendingTrend.is_neutral ? null : !stats.pendingTrend.is_up}
          />
          <StatsCard
            label="Flagged Users"
            value={stats.flaggedUsers}
            icon={AlertTriangle}
            trend={stats.flaggedTrend.value}
            trendLabel="from last month"
            trendUp={stats.flaggedTrend.is_neutral ? null : stats.flaggedTrend.is_up}
          />
        </div>

        {/* Filters & Actions */}
        <div className="bg-[#120A2A] rounded-xl p-6 border border-[#906EFF]/20 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search by username, email, or name..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#1A0F3E] border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#906EFF]/50 focus:ring-1 focus:ring-[#906EFF]/20 transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="px-4 py-2.5 bg-[#1A0F3E] border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#906EFF]/50 focus:ring-1 focus:ring-[#906EFF]/20 transition-colors"
              style={{ colorScheme: 'dark' }}
            >
              <option value="all" className="bg-[#120A2A] text-white">All Status</option>
              <option value="verified" className="bg-[#120A2A] text-white">✓ Verified</option>
              <option value="pending" className="bg-[#120A2A] text-white">⏱ Pending</option>
              <option value="unverified" className="bg-[#120A2A] text-white">✗ Unverified</option>
            </select>

            <button
              onClick={() => setShowFlaggedOnly(!showFlaggedOnly)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
                showFlaggedOnly
                  ? 'bg-red-500/20 border-red-500/30 text-red-400'
                  : 'bg-[#1A0F3E] border-white/20 text-white/70 hover:text-white hover:bg-[#3C2E64]'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {showFlaggedOnly ? 'Showing Flagged' : 'Show Flagged Only'}
              </span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1A0F3E] border border-white/20 rounded-lg text-white hover:bg-[#3C2E64] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#906EFF] text-white rounded-lg hover:bg-[#7D5FE6] transition-colors font-medium"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#120A2A] rounded-xl border border-[#906EFF]/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-[#1A0F3E]">
                  <th 
                    className="text-left py-4 px-6 text-white/60 font-medium text-sm cursor-pointer hover:text-white transition-colors group"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      User
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-4 px-6 text-white/60 font-medium text-sm cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-2">
                      Email
                      {getSortIcon('email')}
                    </div>
                  </th>
                  <th 
                    className="text-center py-4 px-6 text-white/60 font-medium text-sm cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('level')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Level
                      {getSortIcon('level')}
                    </div>
                  </th>
                  <th 
                    className="text-center py-4 px-6 text-white/60 font-medium text-sm cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('rating')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Rating
                      {getSortIcon('rating')}
                    </div>
                  </th>
                  <th 
                    className="text-center py-4 px-6 text-white/60 font-medium text-sm cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th 
                    className="text-center py-4 px-6 text-white/60 font-medium text-sm cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('joined')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Joined
                      {getSortIcon('joined')}
                    </div>
                  </th>
                  <th className="text-center py-4 px-6 text-white/60 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <UsersIcon className="w-12 h-12 text-white/20" />
                        <p className="text-white/40">
                          {showFlaggedOnly ? 'No flagged users found' : 'No users found'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr 
                      key={user.id}
                      className="border-b border-white/5 hover:bg-[#1A0F3E] transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserDetailModal(true);
                      }}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <AvatarNameCell
                            name={`${user.first_name} ${user.last_name}`.trim() || user.username}
                            username={`@${user.username}`}
                            avatarUrl={user.profile_pic}
                          />
                          {user.active_reports_count > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                              <AlertTriangle className="w-3 h-3" />
                              {user.active_reports_count}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-white/70">
                          <Mail className="w-4 h-4 text-white/40" />
                          <span className="text-sm">{user.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-[#906EFF]/10 rounded-full border border-[#906EFF]/30">
                          <Award className="w-3.5 h-3.5 text-[#906EFF]" />
                          <span className="text-white font-medium text-sm">{user.level || 1}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {user.rating && user.rating > 0 ? (
                          <div className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/30">
                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                            <span className="text-yellow-400 font-medium text-sm">
                              {user.rating.toFixed(1)}
                            </span>
                            <span className="text-white/30 text-xs">({user.rating_count || 0})</span>
                          </div>
                        ) : (
                          <span className="text-white/30 text-sm">No ratings</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {getVerificationBadge(user)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1 text-white/60 text-sm">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex items-center justify-center w-8 h-8 text-white/60 hover:text-[#906EFF] hover:bg-[#906EFF]/10 border border-white/10 rounded-lg transition-all">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-[#120A2A] border border-[#906EFF]/30 rounded-lg backdrop-blur-sm shadow-lg"
                          >
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserDetailModal(true);
                              }}
                              className="text-white hover:bg-[#1A0F3E] cursor-pointer"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleVerifyUser(user.id)}
                              className="text-green-400 hover:bg-green-500/10 cursor-pointer"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Verify User
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-400 hover:bg-red-500/10 cursor-pointer">
                              <X className="w-4 h-4 mr-2" />
                              Suspend Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-white/60 text-sm">
            Showing {users.length} of {totalUsers} users
            {showFlaggedOnly && stats.flaggedUsers > 0 && (
              <span className="ml-2 text-red-400">({stats.flaggedUsers} flagged)</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-[#120A2A] border border-white/20 rounded-lg text-white hover:bg-[#1A0F3E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-[#120A2A] border border-[#906EFF]/30 rounded-lg text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-[#120A2A] border border-white/20 rounded-lg text-white hover:bg-[#1A0F3E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {showUserDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#120A2A] border border-[#906EFF]/30 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#1A0F3E]">
              <div>
                <h2 className="text-xl font-semibold text-white">User Details</h2>
                <p className="text-sm text-white/60 mt-1">Complete user information and activity</p>
              </div>
              <button
                onClick={() => setShowUserDetailModal(false)}
                className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-[#1A0F3E] rounded-xl border border-[#906EFF]/20">
                  <AvatarNameCell
                    name={`${selectedUser.first_name} ${selectedUser.last_name}`.trim() || selectedUser.username}
                    username={`@${selectedUser.username}`}
                    avatarUrl={selectedUser.profile_pic}
                  />
                  <div className="ml-auto flex items-center gap-2">
                    {selectedUser.active_reports_count > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                        <AlertTriangle className="w-3 h-3" />
                        {selectedUser.active_reports_count} Reports
                      </span>
                    )}
                    {getVerificationBadge(selectedUser)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#1A0F3E] rounded-lg p-4 text-center border border-[#906EFF]/20">
                    <Award className="w-6 h-6 text-[#906EFF] mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{selectedUser.level || 1}</p>
                    <p className="text-xs text-white/60">Level</p>
                  </div>
                  <div className="bg-[#1A0F3E] rounded-lg p-4 text-center border border-[#906EFF]/20">
                    <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{selectedUser.total_xp || 0}</p>
                    <p className="text-xs text-white/60">Total XP</p>
                  </div>
                  <div className="bg-[#1A0F3E] rounded-lg p-4 text-center border border-[#906EFF]/20">
                    <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{selectedUser.rating?.toFixed(1) || 'N/A'}</p>
                    <p className="text-xs text-white/60">Rating</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">Account Information</h3>
                  <div className="space-y-2 text-sm bg-[#1A0F3E] rounded-lg p-4 border border-[#906EFF]/20">
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-white/60">Email:</span>
                      <span className="text-white">{selectedUser.email}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-white/60">Joined:</span>
                      <span className="text-white">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-white/60">Rating Count:</span>
                      <span className="text-white">{selectedUser.rating_count || 0} reviews</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-white/60">Completed Trades:</span>
                      <span className="text-white">{selectedUser.completed_trades || 0}</span>
                    </div>
                    {selectedUser.active_reports_count > 0 && (
                      <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-white/60">Active Reports:</span>
                        <span className="text-red-400 font-semibold">{selectedUser.active_reports_count}</span>
                      </div>
                    )}
                    {selectedUser.location && (
                      <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-white/60">Location:</span>
                        <span className="text-white">{selectedUser.location}</span>
                      </div>
                    )}
                    {selectedUser.nationality && (
                      <div className="flex justify-between py-2">
                        <span className="text-white/60">Nationality:</span>
                        <span className="text-white">{selectedUser.nationality}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/10 bg-[#1A0F3E] flex gap-3">
              <button
                onClick={() => setShowUserDetailModal(false)}
                className="flex-1 px-4 py-2 bg-[#120A2A] text-white border border-white/20 rounded-lg hover:bg-[#3C2E64] transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => handleVerifyUser(selectedUser.id)}
                className="flex-1 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors"
              >
                Verify User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#120A2A] border border-[#906EFF]/30 rounded-xl w-full max-w-3xl">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#1A0F3E]">
              <div>
                <h2 className="text-xl font-semibold text-white">Export Users Data</h2>
                <p className="text-sm text-white/60 mt-1">Download user data in JSON format</p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4">
              <textarea
                value={exportData}
                readOnly
                className="w-full h-64 px-4 py-3 bg-[#1A0F3E] border border-[#906EFF]/20 rounded-lg text-white font-mono text-sm resize-none"
              />
            </div>

            <div className="px-6 py-4 border-t border-white/10 bg-[#1A0F3E] flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 bg-[#120A2A] text-white border border-white/20 rounded-lg hover:bg-[#3C2E64] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={downloadJSON}
                className="flex-1 px-4 py-2 bg-[#906EFF] text-white rounded-lg hover:bg-[#7D5FE6] transition-colors font-medium"
              >
                <Download className="w-4 h-4 inline mr-2" />
                Download JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}