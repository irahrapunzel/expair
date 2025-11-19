"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Inter } from "next/font/google";
import { 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  Eye, 
  CheckCircle, 
  XCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Flag,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter
} from "lucide-react";
import AdminPageHeader from "@/components/admin/admin-page-header";
import StatusPill from "@/components/admin/status-pill";
import DashboardSkeleton from "@/components/admin/dashboard-skeleton";

const inter = Inter({ subsets: ["latin"] });

export default function ReportsPage() {
  const { data: session, status: sessionStatus } = useSession();
  
  // State management
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  
  // Sorting - tri-state: null (no sort), 'asc', 'desc'
  const [sortBy, setSortBy] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const perPage = 20;
  
  // Modal states
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReports, setSelectedReports] = useState([]);
  const [resolving, setResolving] = useState(false);
  
  useEffect(() => {
    if (sessionStatus === "authenticated" && session) {
      fetchStats();
    }
  }, [sessionStatus, session]);
  
  useEffect(() => {
    if (sessionStatus === "authenticated" && session) {
      fetchReports();
    }
  }, [sessionStatus, session, searchQuery, statusFilter, categoryFilter, priorityFilter, sortBy, sortDirection, currentPage]);
  
  const fetchStats = async () => {
    if (!session) return;
    
    try {
      setStatsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/report-stats/`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success !== false) {
        setStats(data);
      }
    } catch (err) {
      console.error('❌ Error fetching report stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };
  
  const fetchReports = async () => {
    if (!session) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        page: currentPage.toString(),
        per_page: perPage.toString()
      });
      
      // Only add sort params if sorting is active
      if (sortBy && sortDirection) {
        params.append('sort', sortBy);
        params.append('direction', sortDirection);
      }
      
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/reports-list/?${params}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success === true || data.reports) {
        setReports(data.reports || []);
        setTotalPages(data.pagination?.total_pages || 1);
        setTotalReports(data.pagination?.total || 0);
      } else if (data.success === false) {
        throw new Error(data.error || 'API returned success=false');
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      console.error('❌ Error in fetchReports:', err);
      setError(err.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };
  
  // Tri-state column sorting handler
  const handleSort = (column) => {
    if (sortBy === column) {
      // Cycle through: asc → desc → null (no sort)
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        // Reset to no sorting
        setSortBy(null);
        setSortDirection(null);
      }
    } else {
      // New column, start with ascending
      setSortBy(column);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page on sort change
  };
  
  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-white/30" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 text-[#906EFF]" />
      : <ArrowDown className="w-3.5 h-3.5 text-[#906EFF]" />;
  };
  
  const handleResolveReport = async (reportId, newStatus = 'RESOLVED') => {
    if (!session || resolving) return;
    
    try {
      setResolving(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/resolve-report/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ report_id: reportId, status: newStatus })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success !== false) {
        await fetchReports();
        await fetchStats();
        setShowDetailModal(false);
        setSelectedReport(null);
      }
    } catch (err) {
      console.error('Error resolving report:', err);
      alert(`Failed to resolve report: ${err.message}`);
    } finally {
      setResolving(false);
    }
  };
  
  const handleBulkResolve = async () => {
    if (selectedReports.length === 0 || !session || resolving) return;
    
    if (!confirm(`Are you sure you want to resolve ${selectedReports.length} report(s)?`)) {
      return;
    }
    
    try {
      setResolving(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/bulk-resolve-reports/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            report_ids: selectedReports, 
            status: 'RESOLVED' 
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success !== false) {
        setSelectedReports([]);
        await fetchReports();
        await fetchStats();
      }
    } catch (err) {
      console.error('Error bulk resolving reports:', err);
      alert(`Failed to bulk resolve: ${err.message}`);
    } finally {
      setResolving(false);
    }
  };
  
  const handleViewDetail = async (reportId) => {
    if (!session) return;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/report-detail/${reportId}/`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success !== false && data.report) {
        setSelectedReport(data.report);
        setShowDetailModal(true);
      }
    } catch (err) {
      console.error('Error fetching report detail:', err);
      alert(`Failed to load report: ${err.message}`);
    }
  };
  
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };
  
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'warning';
      case 'resolved': return 'success';
      case 'rejected': return 'danger';
      default: return 'default';
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (sessionStatus === "loading") {
    return <DashboardSkeleton />;
  }
  
  // if (sessionStatus === "unauthenticated") {
  //   return (
  //     <div className={`min-h-screen bg-[#050015] text-white p-6 ${inter.className}`}>
  //       <div className="flex items-center justify-center h-[50vh]">
  //         <div className="text-center">
  //           <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
  //           <p className="text-white/60 mb-4">You must be signed in to view this page.</p>
  //           <button
  //             onClick={() => window.location.href = '/signin'}
  //             className="px-4 py-2 bg-[#906EFF] text-white rounded-lg hover:bg-[#7c5dd8] transition-colors"
  //           >
  //             Sign In
  //           </button>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }
  
  return (
    <div className={`min-h-screen bg-[#050015] text-white p-6 ${inter.className}`}>
      <AdminPageHeader
        title="Reports Management"
        subtitle="Monitor and manage user reports"
      />
      
      {/* Stats Cards - Single Accent Color */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#120A2A] border border-white/10 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-20 mb-2"></div>
              <div className="h-8 bg-white/10 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#120A2A] border border-[#906EFF]/20 rounded-xl p-6 hover:border-[#906EFF]/40 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/60 text-sm font-medium">Total Reports</span>
              <FileText className="w-5 h-5 text-[#906EFF]" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.total_reports || 0}</div>
            <div className="text-xs text-white/40">All time submissions</div>
          </div>
          
          <div className="bg-[#120A2A] border border-[#906EFF]/20 rounded-xl p-6 hover:border-[#906EFF]/40 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/60 text-sm font-medium">Pending Review</span>
              <AlertTriangle className="w-5 h-5 text-[#906EFF]" />
            </div>
            <div className="text-3xl font-bold text-[#906EFF] mb-1">{stats.pending_reports || 0}</div>
            <div className="text-xs text-white/40">Awaiting action</div>
          </div>
          
          <div className="bg-[#120A2A] border border-[#906EFF]/20 rounded-xl p-6 hover:border-[#906EFF]/40 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/60 text-sm font-medium">Resolved</span>
              <CheckCircle className="w-5 h-5 text-[#906EFF]" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.resolved_reports || 0}</div>
            <div className="text-xs text-white/40">Successfully handled</div>
          </div>
          
          <div className="bg-[#120A2A] border border-[#906EFF]/20 rounded-xl p-6 hover:border-[#906EFF]/40 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/60 text-sm font-medium">Critical Priority</span>
              <Flag className="w-5 h-5 text-[#906EFF]" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.priority_breakdown?.critical || 0}</div>
            <div className="text-xs text-white/40">Requires immediate attention</div>
          </div>
        </div>
      )}
      
      {/* Filters and Actions */}
      <div className="bg-[#120A2A] border border-[#906EFF]/20 rounded-xl p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search by user, category, or details..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#1A0F3E] border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#906EFF]/50 focus:ring-1 focus:ring-[#906EFF]/20 transition-colors"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          
          {/* Filters - Fixed Contrast */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-[#906EFF]" />
            
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 bg-[#1A0F3E] border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#906EFF]/50 focus:ring-1 focus:ring-[#906EFF]/20 cursor-pointer hover:bg-[#1A0F3E]/80 transition-colors"
            >
              <option value="all" className="bg-[#120A2A] text-white">All Status</option>
              <option value="pending" className="bg-[#120A2A] text-white">Pending</option>
              <option value="resolved" className="bg-[#120A2A] text-white">Resolved</option>
              <option value="rejected" className="bg-[#120A2A] text-white">Rejected</option>
            </select>
            
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 bg-[#1A0F3E] border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#906EFF]/50 focus:ring-1 focus:ring-[#906EFF]/20 cursor-pointer hover:bg-[#1A0F3E]/80 transition-colors"
            >
              <option value="all" className="bg-[#120A2A] text-white">All Categories</option>
              <option value="User Behavior" className="bg-[#120A2A] text-white">User Behavior</option>
              <option value="Trade Issues" className="bg-[#120A2A] text-white">Trade Issues</option>
              <option value="Safety & Privacy" className="bg-[#120A2A] text-white">Safety & Privacy</option>
              <option value="Others" className="bg-[#120A2A] text-white">Others</option>
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 bg-[#1A0F3E] border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#906EFF]/50 focus:ring-1 focus:ring-[#906EFF]/20 cursor-pointer hover:bg-[#1A0F3E]/80 transition-colors"
            >
              <option value="all" className="bg-[#120A2A] text-white">All Priority</option>
              <option value="critical" className="bg-[#120A2A] text-white">Critical</option>
              <option value="high" className="bg-[#120A2A] text-white">High</option>
              <option value="medium" className="bg-[#120A2A] text-white">Medium</option>
              <option value="low" className="bg-[#120A2A] text-white">Low</option>
            </select>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            {selectedReports.length > 0 && (
              <button
                onClick={handleBulkResolve}
                disabled={resolving}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#906EFF]/20 text-[#906EFF] border border-[#906EFF]/30 rounded-lg hover:bg-[#906EFF]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                {resolving ? 'Resolving...' : `Resolve (${selectedReports.length})`}
              </button>
            )}
            
            <button
              onClick={fetchReports}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1A0F3E] border border-white/20 rounded-lg text-white hover:bg-[#1A0F3E]/80 hover:border-[#906EFF]/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      {/* Reports Table with Full Column Sorting */}
      <div className="bg-[#120A2A] border border-[#906EFF]/20 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1A0F3E] border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left w-12">
                  <input
                    type="checkbox"
                    checked={selectedReports.length === reports.length && reports.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedReports(reports.map(r => r.report_id));
                      } else {
                        setSelectedReports([]);
                      }
                    }}
                    className="w-4 h-4 accent-[#906EFF] cursor-pointer"
                  />
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase cursor-pointer hover:text-white transition-colors group"
                  onClick={() => handleSort('report_id')}
                >
                  <div className="flex items-center gap-2">
                    ID
                    {getSortIcon('report_id')}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase cursor-pointer hover:text-white transition-colors group"
                  onClick={() => handleSort('reporter')}
                >
                  <div className="flex items-center gap-2">
                    Reporter
                    {getSortIcon('reporter')}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase cursor-pointer hover:text-white transition-colors group"
                  onClick={() => handleSort('reported_user')}
                >
                  <div className="flex items-center gap-2">
                    Reported User
                    {getSortIcon('reported_user')}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase cursor-pointer hover:text-white transition-colors group"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center gap-2">
                    Category
                    {getSortIcon('category')}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase cursor-pointer hover:text-white transition-colors group"
                  onClick={() => handleSort('issue_detail')}
                >
                  <div className="flex items-center gap-2">
                    Issue
                    {getSortIcon('issue_detail')}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-center text-xs font-semibold text-white/60 uppercase cursor-pointer hover:text-white transition-colors group"
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Priority
                    {getSortIcon('priority')}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-center text-xs font-semibold text-white/60 uppercase cursor-pointer hover:text-white transition-colors group"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Status
                    {getSortIcon('status')}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-center text-xs font-semibold text-white/60 uppercase cursor-pointer hover:text-white transition-colors group"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Date
                    {getSortIcon('created_at')}
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-white/60 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-white/60">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <div>Loading reports...</div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center">
                    <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <div className="text-red-400 mb-3">{error}</div>
                    <button
                      onClick={fetchReports}
                      className="text-sm text-[#906EFF] hover:underline"
                    >
                      Try again
                    </button>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <div className="text-white/60 mb-2">No reports found</div>
                    <div className="text-sm text-white/40">
                      {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Reports will appear here when users submit them'}
                    </div>
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr
                    key={report.report_id}
                    className="border-b border-white/5 hover:bg-[#1A0F3E] transition-colors cursor-pointer group"
                    onClick={() => handleViewDetail(report.report_id)}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report.report_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedReports([...selectedReports, report.report_id]);
                          } else {
                            setSelectedReports(selectedReports.filter(id => id !== report.report_id));
                          }
                        }}
                        className="w-4 h-4 accent-[#906EFF] cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[#906EFF]">
                      #{report.report_id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={report.reporter?.profile_pic || '/assets/defaultavatar.png'}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => { e.target.src = '/assets/defaultavatar.png'; }}
                        />
                        <span className="text-sm text-white">{report.reporter?.username || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {report.reported_user ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={report.reported_user.profile_pic || '/assets/defaultavatar.png'}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => { e.target.src = '/assets/defaultavatar.png'; }}
                          />
                          <div>
                            <div className="text-sm text-white">{report.reported_user.username}</div>
                            {report.reported_user.total_reports > 0 && (
                              <div className="text-xs text-[#906EFF]">
                                {report.reported_user.total_reports} report{report.reported_user.total_reports > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-white/40">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-white/70">{report.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-white/70 max-w-xs truncate block">
                        {report.issue_detail || 'No details provided'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(report.priority)}`}>
                        {report.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusPill status={report.status} variant={getStatusColor(report.status)} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-sm text-white/60">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(report.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleViewDetail(report.report_id)}
                        className="p-2 hover:bg-[#906EFF]/20 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-white/60 group-hover:text-[#906EFF] transition-colors" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-[#1A0F3E]">
            <div className="text-sm text-white/60">
              Showing <span className="text-white font-medium">{((currentPage - 1) * perPage) + 1}</span> to <span className="text-white font-medium">{Math.min(currentPage * perPage, totalReports)}</span> of <span className="text-white font-medium">{totalReports}</span> reports
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-white px-3">
                Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#120A2A] border border-[#906EFF]/20 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#1A0F3E]">
              <div>
                <h2 className="text-xl font-semibold text-white">Report Details</h2>
                <p className="text-sm text-white/60 mt-1">Report #{selectedReport.report_id}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-white/60" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Reporter Info */}
                <div className="bg-[#1A0F3E] rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-[#906EFF]" />
                    <h3 className="text-sm font-semibold text-white">Reporter</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedReport.reporter?.profile_pic || '/assets/defaultavatar.png'}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => { e.target.src = '/assets/defaultavatar.png'; }}
                    />
                    <div>
                      <div className="text-white font-medium">{selectedReport.reporter?.username || 'Unknown'}</div>
                      <div className="text-sm text-white/60">{selectedReport.reporter?.email || 'N/A'}</div>
                    </div>
                  </div>
                </div>
                
                {/* Reported User Info */}
                {selectedReport.reported_user && (
                  <div className="bg-[#1A0F3E] rounded-lg p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Flag className="w-4 h-4 text-[#906EFF]" />
                      <h3 className="text-sm font-semibold text-white">Reported User</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedReport.reported_user.profile_pic || '/assets/defaultavatar.png'}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => { e.target.src = '/assets/defaultavatar.png'; }}
                      />
                      <div>
                        <div className="text-white font-medium">{selectedReport.reported_user.username}</div>
                        <div className="text-sm text-white/60">{selectedReport.reported_user.email || 'N/A'}</div>
                        {selectedReport.reported_user.total_reports > 0 && (
                          <div className="text-sm text-[#906EFF] mt-1">
                            {selectedReport.reported_user.total_reports} pending report{selectedReport.reported_user.total_reports > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Report Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1A0F3E] rounded-lg p-4 border border-white/10">
                    <label className="text-xs text-white/60 uppercase mb-1 block">Category</label>
                    <div className="text-white">{selectedReport.category}</div>
                  </div>
                  
                  <div className="bg-[#1A0F3E] rounded-lg p-4 border border-white/10">
                    <label className="text-xs text-white/60 uppercase mb-1 block">Date Reported</label>
                    <div className="text-white">{formatDateTime(selectedReport.created_at)}</div>
                  </div>
                </div>
                
                <div className="bg-[#1A0F3E] rounded-lg p-4 border border-white/10">
                  <label className="text-xs text-white/60 uppercase mb-2 block">Issue Detail</label>
                  <div className="text-white">{selectedReport.issue_detail || 'No details provided'}</div>
                </div>
                
                <div className="bg-[#1A0F3E] rounded-lg p-4 border border-white/10">
                  <label className="text-xs text-white/60 uppercase mb-2 block">Description</label>
                  <div className="text-white whitespace-pre-wrap">{selectedReport.description || 'No description provided'}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1A0F3E] rounded-lg p-4 border border-white/10">
                    <label className="text-xs text-white/60 uppercase mb-2 block">Priority</label>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(selectedReport.priority)}`}>
                      {selectedReport.priority}
                    </span>
                  </div>
                  <div className="bg-[#1A0F3E] rounded-lg p-4 border border-white/10">
                    <label className="text-xs text-white/60 uppercase mb-2 block">Status</label>
                    <StatusPill status={selectedReport.status} variant={getStatusColor(selectedReport.status)} />
                  </div>
                </div>
                
                {/* Related Reports */}
                {selectedReport.related_reports && selectedReport.related_reports.length > 0 && (
                  <div className="bg-[#1A0F3E] rounded-lg p-4 border border-white/10">
                    <h4 className="text-sm font-semibold text-white mb-3">Related Reports Against This User</h4>
                    <div className="space-y-2">
                      {selectedReport.related_reports.map((r) => (
                        <div key={r.report_id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                          <div>
                            <div className="text-sm text-white">#{r.report_id} - {r.category}</div>
                            <div className="text-xs text-white/60">{formatDate(r.created_at)}</div>
                          </div>
                          <StatusPill status={r.status} variant={getStatusColor(r.status)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3 bg-[#1A0F3E]">
              {selectedReport.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleResolveReport(selectedReport.report_id, 'REJECTED')}
                    disabled={resolving}
                    className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resolving ? 'Processing...' : 'Reject Report'}
                  </button>
                  <button
                    onClick={() => handleResolveReport(selectedReport.report_id, 'RESOLVED')}
                    disabled={resolving}
                    className="px-4 py-2 bg-[#906EFF]/20 text-[#906EFF] border border-[#906EFF]/30 rounded-lg hover:bg-[#906EFF]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resolving ? 'Processing...' : 'Resolve Report'}
                  </button>
                </>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                disabled={resolving}
                className="px-4 py-2 bg-[#1A0F3E] border border-white/20 rounded-lg text-white hover:bg-[#1A0F3E]/80 hover:border-[#906EFF]/30 transition-colors disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}