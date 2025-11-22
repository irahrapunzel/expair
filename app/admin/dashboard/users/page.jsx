"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react"; // CRITICAL: Import useSession
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
  Flag,
  User,
  Users as UsersIcon,
  Star,
  Award,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  ExternalLink,
  ChevronDown
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
import { Icon } from '@iconify/react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const REJECTION_OPTIONS = [
  "Document is blurry or unreadable",
  "Document has expired",
  "Name on ID does not match account profile",
  "Invalid ID type submitted",
  "Document is incomplete or cropped",
  "Suspected fake or altered document",
  "Others"
];

export default function UsersPage() {
  const { data: session, status: sessionStatus } = useSession(); // ACTIVATE SESSION HOOK

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

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(""); // For the dropdown
  const [customReason, setCustomReason] = useState(""); // For the textarea
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showExportDropdown, setShowExportDropdown] = useState(false);

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

  const [showSanctionModal, setShowSanctionModal] = useState(false);
  const [selectedSanctionUser, setSelectedSanctionUser] = useState(null);
  const [sanctionReason, setSanctionReason] = useState('');
  const [suspensionDays, setSuspensionDays] = useState(7);
  const [applyingSanction, setApplyingSanction] = useState(false);
  const [sanctionDetailLoading, setSanctionDetailLoading] = useState(false);

  // --- CORE FETCH FUNCTIONS (Defined with useCallback) ---

  const fetchStats = useCallback(async () => {
    // 1. Get Token
    const adminToken = session?.access;
    // Only proceed if authenticated and token is present
    if (sessionStatus !== 'authenticated' || !adminToken) return;

    try {
      const response = await fetch(`${API_BASE}/api/admin/user-stats/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`, // FIX: ADD HEADER
          'Content-Type': 'application/json'
        }
      });

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
  }, [session?.access, sessionStatus]);


  const fetchUsers = useCallback(async () => {
    // 1. Get Token
    const adminToken = session?.access;
    if (sessionStatus !== 'authenticated' || !adminToken) {
      setLoading(false);
      return;
    }

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

      const response = await fetch(`${API_BASE}/api/admin/users-list/?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`, // FIX: ADD HEADER
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch users: ${response.status} - ${errorData.error || response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load users');
      }

      let fetchedUsers = data.users || [];
      // Client-side sorting as a fallback (if needed)
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
  }, [session?.access, searchQuery, verificationFilter, showFlaggedOnly, sortBy, sortDirection, currentPage, sessionStatus]);

  const handleOpenSanctionModal = async (userId) => {
    const adminToken = session?.access;
    if (!adminToken) return;

    setSanctionDetailLoading(true);
    setSelectedSanctionUser(null);
    setSanctionReason('');
    setSuspensionDays(7);
    setShowSanctionModal(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/admin/user-sanction-detail/${userId}/`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success === true && data.user_detail) {
        setSelectedSanctionUser(data.user_detail);
        // Pre-fill reason with current sanction reason if one exists
        const details = data.user_detail.sanction_details;
        if (details.reason) {
          setSanctionReason(details.reason);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch user details.');
      }
    } catch (err) {
      console.error('❌ Error fetching sanction details:', err);
      alert(`Failed to load user sanction data: ${err.message}`);
      setShowSanctionModal(false);
    } finally {
      setSanctionDetailLoading(false);
    }
  };

  const handleApplySanction = async (actionType, reasonNote, durationDays) => {
    const adminToken = session?.access;
    if (!adminToken || applyingSanction || !selectedSanctionUser) return;

    // Use the ID of the most recent report for logging purposes
    const reportId = selectedSanctionUser.recent_reports?.[0]?.report_id || 1; // Fallback ID 

    if (!confirm(`Are you sure you want to apply ${actionType} to @${selectedSanctionUser.username}?`)) {
      return;
    }

    try {
      setApplyingSanction(true);

      const requestBody = {
        // NOTE: We pass the user's most recent report ID for backend logging
        report_id: reportId,
        sanction_type: actionType,
        reason_note: reasonNote,
      };

      if (actionType === 'SUSPENSION') {
        requestBody.duration_days = durationDays;
      }

      const response = await fetch(
        `${API_BASE}/api/admin/apply-sanction/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.success !== false) {
        alert(`Sanction ${actionType} applied successfully!`);
        // Refresh user list and close modal
        fetchUsers();
        setShowSanctionModal(false);
      }
    } catch (err) {
      console.error('Error applying sanction:', err);
      alert(`Failed to apply sanction: ${err.message}`);
    } finally {
      setApplyingSanction(false);
    }
  };

  // --- ASYNC ACTION HANDLERS (Must use token) ---

  async function handleVerifyUser(userId) {
    const adminToken = session?.access;
    if (!adminToken) {
      alert("Authentication token expired. Please log in again.");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/verify-user/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}` // FIX: ADD HEADER
        },
        body: JSON.stringify({ user_id: userId })
      });

      const data = await response.json();

      if (data.success) {
        alert(`User verified successfully`);
        fetchUsers();
        fetchStats();
        setShowUserDetailModal(false);
        setSelectedUser(null);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error("Error verifying user:", err);
      alert("Failed to verify user");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRejectVerification() {
    const adminToken = session?.access;
    if (!adminToken) {
      alert("Authentication token expired. Please log in again.");
      return;
    }

    let finalReason = selectedReason;

    if (selectedReason === "Others") {
      finalReason = customReason.trim();
    }

    if (!finalReason) {
      alert("Please provide a reason for rejection.");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/api/admin/reject-verification/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}` // FIX: ADD HEADER
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          reason: finalReason // Send the determined reason
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`User verification rejected successfully.`);
        fetchUsers();
        fetchStats();
        // Reset and close
        setShowRejectModal(false);
        setShowUserDetailModal(false);
        setSelectedUser(null);
        setSelectedReason(""); // Reset dropdown
        setCustomReason("");   // Reset textarea
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error("Error rejecting verification:", err);
      alert("Failed to reject verification");
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- USE EFFECT HOOKS (Triggering Fetches) ---

  // Trigger fetchStats when component mounts and filters change
  useEffect(() => {
    fetchStats();
  }, [fetchStats, showFlaggedOnly]);

  // Trigger fetchUsers when component mounts and filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, searchQuery, verificationFilter, showFlaggedOnly, sortBy, sortDirection, currentPage]);


  // --- UTILITY FUNCTIONS (Unchanged Logic) ---

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

  // Direct export to CSV (Excel compatible)
  const escapeCsv = (val) => `"${String(val || '').replace(/"/g, '""')}"`;

  // 1. Local CSV Generation (Dependency-Free)
  function handleExportCSV() {
    if (users.length === 0) {
      alert("No data to export.");
      return;
    }

    const headers = [
      "User ID",
      "Username",
      "Email",
      "Full Name",
      "Level",
      "Total XP",
      "Rating",
      "Rating Count",
      "Verification Status",
      "Active Reports",
      "Joined Date"
    ];

    const csvRows = [
      headers.join(','),
      ...users.map(user => {
        const row = [
          user.id,
          escapeCsv(user.username),
          escapeCsv(user.email),
          escapeCsv(`${user.first_name} ${user.last_name}`.trim()),
          user.level || 1,
          user.total_xp || 0,
          user.rating?.toFixed(1) || 0,
          user.rating_count || 0,
          escapeCsv(user.verification_status),
          user.active_reports_count || 0,
          escapeCsv(new Date(user.created_at).toLocaleDateString())
        ];
        return row.join(',');
      })
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expair-users-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 2. PDF/CSV API Download Handler
  function handleExportReport(format) {
    if (users.length === 0) {
      alert("No data to export.");
      return;
    }

    // If CSV is selected, run the local generation function and exit
    if (format === 'csv') {
      handleExportCSV();
      setShowExportDropdown(false);
      return;
    }

    // --- PDF API Download Logic (Follows user-report pattern) ---
    const adminToken = session?.access;
    const endpoint = '/api/admin/users-report/pdf/'; // New Admin Report Endpoint (MUST BE IMPLEMENTED IN DJANGO)
    const reportUrl = `${API_BASE}${endpoint}`;

    if (!adminToken) {
      alert("Authentication token expired. Please log in again.");
      setShowExportDropdown(false);
      return;
    }

    fetch(reportUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(`Server error (${response.status}): ${err.error || response.statusText}`);
          }).catch(() => {
            throw new Error(`Failed to fetch PDF report: Server status ${response.status}`);
          });
        }

        // Extract filename from header
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `expair-users-admin-${new Date().toISOString().split('T')[0]}.pdf`;
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?(.+)"?$/i);
          if (match && match[1]) {
            filename = match[1];
          }
        }

        return { blob: response.blob(), filename };
      })
      .then(async ({ blob: blobPromise, filename }) => {
        const blob = await blobPromise;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error("PDF Download failed:", error);
        alert(`Failed to download PDF report: ${error.message}`);
      })
      .finally(() => {
        setShowExportDropdown(false);
      });
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
            onClick={() => {
              // Manually trigger fetchers after error
              fetchUsers();
              fetchStats();
            }}
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
        {/* Header */}
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
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${showFlaggedOnly
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
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    fetchUsers();
                    fetchStats();
                  }}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#1A0F3E] border border-white/20 rounded-lg text-white hover:bg-[#3C2E64] transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>

                {/* NEW EXPORT DROPDOWN */}
                <div className="relative">
                  <button
                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#906EFF] text-white rounded-lg hover:bg-[#7D5FE6] transition-colors font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Export
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showExportDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-40 bg-[#120A2A] rounded-xl border border-white/20 shadow-lg py-1 z-10">
                      <button
                        onClick={() => handleExportReport('pdf')}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        PDF Report
                      </button>
                      <button
                        onClick={() => handleExportReport('csv')}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                      >
                        <Icon icon="mdi:file-excel-box-outline" className="mr-2 h-4 w-4" />
                        CSV Data
                      </button>
                    </div>
                  )}
                </div>
              </div>
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
                                // 1. View Details logic (keep this)
                                setSelectedUser(user);
                                setShowUserDetailModal(true);
                              }}
                              className="text-white hover:bg-[#1A0F3E] cursor-pointer"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => {
                                // 2. Suspend Account logic (Crucial change)
                                if (applyingSanction) return; // Prevent double-clicking
                                handleOpenSanctionModal(user.id);
                              }}
                              className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                            >
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

                {/* Verification Document Section */}
                {selectedUser.id_document && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white">Verification Document</h3>
                    <div className="bg-[#1A0F3E] rounded-lg p-4 border border-[#906EFF]/20 flex items-center justify-between group hover:border-[#906EFF]/40 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-[#906EFF]/10 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-[#906EFF]" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Identity Proof</p>
                          <p className="text-xs text-white/40 group-hover:text-white/60 transition-colors">
                            {selectedUser.id_type || "Document"}
                          </p>
                        </div>
                      </div>
                      <a
                        href={selectedUser.id_document}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-[#906EFF] text-white text-sm rounded-lg hover:bg-[#7D5FE6] transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View File
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>
                    </div>
                  </div>
                )}

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
                disabled={isSubmitting}
              >
                Close
              </button>

              {selectedUser.verification_status === 'pending' && (
                <>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="flex-1 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Reject Verification"}
                  </button>
                  <button
                    onClick={() => handleVerifyUser(selectedUser.id)}
                    className="flex-1 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors font-medium"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Accept Verification"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#120A2A] border border-[#906EFF]/30 rounded-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#1A0F3E]">
              <div>
                <h2 className="text-xl font-semibold text-white">Reject Verification</h2>
                <p className="text-sm text-white/60 mt-1">Select a reason for rejection</p>
              </div>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedReason("");
                  setCustomReason("");
                }}
                className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-4">
              {/* Dropdown Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Reason</label>
                <div className="relative">
                  <select
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-full px-4 py-3 bg-[#1A0F3E] border border-[#906EFF]/20 rounded-lg text-white appearance-none focus:outline-none focus:border-[#906EFF]/50 focus:ring-1 focus:ring-[#906EFF]/20 transition-colors"
                  >
                    <option value="" disabled>Select a reason...</option>
                    {REJECTION_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-[#1A0F3E]">
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                </div>
              </div>

              {/* Conditional Text Area for "Others" */}
              {selectedReason === "Others" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="text-sm font-medium text-white/80">Specific Reason</label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Please type the specific reason for rejection..."
                    className="w-full h-32 px-4 py-3 bg-[#1A0F3E] border border-[#906EFF]/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#906EFF]/50 focus:ring-1 focus:ring-[#906EFF]/20 transition-colors resize-none"
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-white/10 bg-[#1A0F3E] flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedReason("");
                  setCustomReason("");
                }}
                className="flex-1 px-4 py-2 bg-[#120A2A] text-white border border-white/20 rounded-lg hover:bg-[#3C2E64] transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectVerification}
                className="flex-1 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  isSubmitting ||
                  !selectedReason ||
                  (selectedReason === "Others" && !customReason.trim())
                }
              >
                {isSubmitting ? "Submitting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- Sanction Application Modal --- */}
      {showSanctionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#120A2A] border border-[#906EFF]/20 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#1A0F3E]">
              <h2 className="text-xl font-semibold text-white">Apply Sanction</h2>
              <button
                onClick={() => setShowSanctionModal(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                disabled={applyingSanction}
              >
                <XCircle className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-250px)]">
              {sanctionDetailLoading || !selectedSanctionUser ? (
                <div className="py-12 text-center">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading user details...
                </div>
              ) : (
                <div className="space-y-6">
                  {/* User Info & Current Status */}
                  <div className="bg-[#1A0F3E] rounded-lg p-4 border border-white/10">
                    <div className="flex items-center gap-4">
                      <img
                        src={selectedSanctionUser.profile_pic || '/defaultavatar.png'}
                        alt=""
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-xl text-white font-medium">@{selectedSanctionUser.username}</div>
                        <div className="text-sm text-white/60">{selectedSanctionUser.email}</div>
                        <div className="text-sm mt-1">
                          Current Status:
                          <span className={`inline-block ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${selectedSanctionUser.current_sanction_status === 'BAN' ? 'bg-red-700/50 text-red-300' :
                              selectedSanctionUser.current_sanction_status === 'SUSPENSION' ? 'bg-orange-700/50 text-orange-300' :
                                selectedSanctionUser.current_sanction_status === 'WARNING' ? 'bg-yellow-700/50 text-yellow-300' :
                                  'bg-green-700/50 text-green-300'
                            }`}>
                            {selectedSanctionUser.current_sanction_status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Admin Action Input */}
                  <div className="p-4 bg-[#1A0F3E] rounded-lg border border-[#906EFF]/20">
                    <h4 className="text-lg font-semibold text-white mb-3">
                      Apply New Sanction
                    </h4>

                    <label className="text-sm text-white/60 mb-1 block">Reason for Action (Required)</label>
                    <textarea
                      value={sanctionReason}
                      onChange={(e) => setSanctionReason(e.target.value)}
                      placeholder="E.g., Repeated harassment, Fraudulent activity. This will be visible to the user."
                      className="w-full p-2 bg-[#120A2A] border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none h-20 mb-3"
                    />

                    <div className="mt-4">
                      <label className="text-sm text-white/60 mb-1 block">Suspension Duration (Days)</label>
                      <input
                        type="number"
                        value={suspensionDays}
                        onChange={(e) => setSuspensionDays(parseInt(e.target.value) || 0)}
                        min="1"
                        className="w-32 p-2 bg-[#120A2A] border border-white/20 rounded-lg text-white focus:outline-none"
                      />
                      <p className="text-xs text-white/40 mt-1">Duration for **Suspension** only. Use 'BAN' for permanent.</p>
                    </div>
                  </div>

                  {/* Sanction History */}
                  {selectedSanctionUser.recent_reports.length > 0 && (
                    <div className="bg-[#1A0F3E] rounded-lg p-4 border border-white/10">
                      <h4 className="text-sm font-semibold text-white mb-3">Recent Reports ({selectedSanctionUser.pending_reports_count} Pending)</h4>
                      {selectedSanctionUser.recent_reports.map((r) => (
                        <div key={r.report_id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10 mb-1">
                          <div className="text-xs text-white">#{r.report_id} - {r.issue_detail}</div>
                          <div className="text-xs text-white/60">{new Date(r.created_at).toLocaleDateString()} ({r.status})</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer (Action Buttons) */}
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3 bg-[#1A0F3E]">
              <button
                onClick={() => setShowSanctionModal(false)}
                className="px-4 py-2 bg-[#120A2A] text-white border border-white/20 rounded-lg hover:bg-[#3C2E64] transition-colors text-sm"
                disabled={applyingSanction}
              >
                Cancel
              </button>

              <button
                onClick={() => handleApplySanction('WARNING', sanctionReason || 'Inappropriate behavior.', 0)}
                disabled={applyingSanction || sanctionReason.length < 5}
                className="px-4 py-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/30 transition-colors disabled:opacity-50 text-sm"
              >
                Issue Warning
              </button>

              <button
                onClick={() => handleApplySanction('SUSPENSION', sanctionReason, suspensionDays)}
                disabled={applyingSanction || sanctionReason.length < 10 || suspensionDays < 1}
                className="px-4 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg hover:bg-orange-500/30 transition-colors disabled:opacity-50 text-sm"
              >
                Suspend ({suspensionDays}d)
              </button>

              <button
                onClick={() => handleApplySanction('BAN', sanctionReason, 0)}
                disabled={applyingSanction || sanctionReason.length < 10}
                className="px-4 py-2 bg-red-700/50 text-white border border-red-500/30 rounded-lg hover:bg-red-700/80 transition-colors disabled:opacity-50 text-sm font-semibold"
              >
                Issue Ban
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}