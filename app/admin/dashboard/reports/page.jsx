"use client";

import { useState } from "react";
import { Inter } from "next/font/google";
import { 
  MoreHorizontal, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  Shield, 
  UserX, 
  MessageSquare, 
  Flag, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Calendar,
  Users,
  FileText,
  TrendingUp
} from "lucide-react";
import AdminPageHeader from "@/components/admin/admin-page-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const inter = Inter({ subsets: ["latin"] });

export default function ReportsPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedReports, setSelectedReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportData, setExportData] = useState("");
  const [viewMode, setViewMode] = useState("table"); // table or grid

  // Enhanced reports data with ID and Type columns
  const reports = [
    {
      id: 1,
      reportId: "RPT-2024-001",
      type: "Harassment",
      reporterName: "John Doe",
      reporterId: "USR-12345",
      reporterEmail: "john.doe@example.com",
      reportedUserName: "Jane Smith",
      reportedUserId: "USR-67890",
      reportedUserEmail: "jane.smith@example.com",
      reason: "Harassment in chat messages",
      description: "User has been sending inappropriate messages and making threats in the trading chat room.",
      evidence: ["chat_screenshot_1.png", "chat_screenshot_2.png"],
      date: "2025/10/11",
      time: "14:30",
      status: "Pending",
      priority: "High",
      assignedTo: "Admin Team",
      lastUpdated: "2 hours ago",
      resolution: null,
      actions: []
    },
    {
      id: 2,
      reportId: "RPT-2024-002",
      type: "Fraud",
      reporterName: "Mike Johnson",
      reporterId: "USR-23456",
      reporterEmail: "mike.johnson@example.com",
      reportedUserName: "David Wilson",
      reportedUserId: "USR-78901",
      reportedUserEmail: "david.wilson@example.com",
      reason: "Fake trading",
      description: "User is advertising fake trading services and scamming other users.",
      evidence: ["profile_screenshot.png", "message_log.txt"],
      date: "2025/10/05",
      time: "09:15",
      status: "Reviewed",
      priority: "Critical",
      assignedTo: "Security Team",
      lastUpdated: "1 day ago",
      resolution: "User temporarily suspended pending investigation",
      actions: ["Warning Issued", "Account Flagged"]
    },
    {
      id: 3,
      reportId: "RPT-2024-003",
      type: "Content Violation",
      reporterName: "Emily Brown",
      reporterId: "USR-34567",
      reporterEmail: "emily.brown@example.com",
      reportedUserName: "Sarah Manager",
      reportedUserId: "USR-89012",
      reportedUserEmail: "sarah.manager@example.com",
      reason: "Inappropriate content",
      description: "User posted inappropriate content in their profile and trade descriptions.",
      evidence: ["profile_content.png"],
      date: "2025/09/10",
      time: "16:45",
      status: "Pending",
      priority: "Medium",
      assignedTo: "Content Team",
      lastUpdated: "3 hours ago",
      resolution: null,
      actions: []
    },
    {
      id: 4,
      reportId: "RPT-2024-004",
      type: "Spam",
      reporterName: "Tom Director",
      reporterId: "USR-45678",
      reporterEmail: "tom.director@example.com",
      reportedUserName: "Lisa Thompson",
      reportedUserId: "USR-90123",
      reportedUserEmail: "lisa.thompson@example.com",
      reason: "Spam messaging",
      description: "User is sending repetitive promotional messages to multiple users.",
      evidence: ["message_history.json"],
      date: "2025/10/06",
      time: "11:20",
      status: "Resolved",
      priority: "Low",
      assignedTo: "Moderation Team",
      lastUpdated: "5 days ago",
      resolution: "User warned and spam messages removed",
      actions: ["Warning Issued", "Messages Removed"]
    },
    {
      id: 5,
      reportId: "RPT-2024-005",
      type: "Identity Fraud",
      reporterName: "Anna Davis",
      reporterId: "USR-56789",
      reporterEmail: "anna.davis@example.com",
      reportedUserName: "Chris Evans",
      reportedUserId: "USR-01234",
      reportedUserEmail: "chris.evans@example.com",
      reason: "Profile fraud",
      description: "User is using fake identity documents and impersonating another person.",
      evidence: ["document_comparison.pdf", "verification_failure.log"],
      date: "2025/08/08",
      time: "13:10",
      status: "Reviewed",
      priority: "Critical",
      assignedTo: "Security Team",
      lastUpdated: "2 days ago",
      resolution: "Account suspended pending verification",
      actions: ["Account Suspended", "Documents Flagged"]
    },
    {
      id: 6,
      reportId: "RPT-2024-006",
      type: "Trade Violation",
      reporterName: "Bob Wilson",
      reporterId: "USR-67890",
      reporterEmail: "bob.wilson@example.com",
      reportedUserName: "Alice Cooper",
      reportedUserId: "USR-12345",
      reportedUserEmail: "alice.cooper@example.com",
      reason: "Trade violation",
      description: "User failed to complete agreed trade and kept the items without payment.",
      evidence: ["trade_agreement.pdf", "payment_proof.png"],
      date: "2025/09/12",
      time: "10:30",
      status: "Pending",
      priority: "High",
      assignedTo: "Trade Support",
      lastUpdated: "1 hour ago",
      resolution: null,
      actions: []
    },
    {
      id: 7,
      reportId: "RPT-2024-007",
      type: "Harassment",
      reporterName: "Grace Lee",
      reporterId: "USR-78901",
      reporterEmail: "grace.lee@example.com",
      reportedUserName: "Frank Miller",
      reportedUserId: "USR-23456",
      reportedUserEmail: "frank.miller@example.com",
      reason: "Harassment",
      description: "User has been stalking and sending threatening messages outside the platform.",
      evidence: ["external_messages.png", "threat_screenshots.png"],
      date: "2025/10/10",
      time: "15:45",
      status: "Resolved",
      priority: "Critical",
      assignedTo: "Security Team",
      lastUpdated: "3 days ago",
      resolution: "User permanently banned and reported to authorities",
      actions: ["Permanent Ban", "Legal Action"]
    },
    {
      id: 8,
      reportId: "RPT-2024-008",
      type: "Behavioral",
      reporterName: "Henry Ford",
      reporterId: "USR-89012",
      reporterEmail: "henry.ford@example.com",
      reportedUserName: "Diana Prince",
      reportedUserId: "USR-34567",
      reportedUserEmail: "diana.prince@example.com",
      reason: "Inappropriate behavior",
      description: "User is exhibiting aggressive behavior in trade negotiations.",
      evidence: ["negotiation_log.txt"],
      date: "2025/10/01",
      time: "12:15",
      status: "Pending",
      priority: "Medium",
      assignedTo: "Community Team",
      lastUpdated: "4 hours ago",
      resolution: null,
      actions: []
    },
  ];

  const handleReviewAction = (action, reportId) => {
    console.log(`Action: ${action} on report: ${reportId}`);
    // Implement review logic here
  };

  // Helper functions
  const handleBulkAction = (action) => {
    console.log(`Bulk action: ${action} on reports:`, selectedReports);
    // Implement bulk action logic here
  };

  const handleSelectReport = (reportId) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleSelectAll = () => {
    setSelectedReports(
      selectedReports.length === filteredReports.length 
        ? [] 
        : filteredReports.map(report => report.id)
    );
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "Harassment":
        return <UserX className="w-4 h-4" />;
      case "Fraud":
        return <Shield className="w-4 h-4" />;
      case "Content Violation":
        return <FileText className="w-4 h-4" />;
      case "Spam":
        return <MessageSquare className="w-4 h-4" />;
      case "Identity Fraud":
        return <AlertTriangle className="w-4 h-4" />;
      case "Trade Violation":
        return <Flag className="w-4 h-4" />;
      case "Behavioral":
        return <Users className="w-4 h-4" />;
      default:
        return <Flag className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "Harassment":
        return "text-red-400 bg-red-500/20 border-red-500/30";
      case "Fraud":
        return "text-orange-400 bg-orange-500/20 border-orange-500/30";
      case "Content Violation":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      case "Spam":
        return "text-blue-400 bg-blue-500/20 border-blue-500/30";
      case "Identity Fraud":
        return "text-purple-400 bg-purple-500/20 border-purple-500/30";
      case "Trade Violation":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      case "Behavioral":
        return "text-indigo-400 bg-indigo-500/20 border-indigo-500/30";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500/30";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Critical":
        return "text-red-400 bg-red-500/20 border-red-500/30";
      case "High":
        return "text-orange-400 bg-orange-500/20 border-orange-500/30";
      case "Medium":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      case "Low":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500/30";
    }
  };

  // Export functionality
  const generateExportData = () => {
    const dataToExport = selectedReports.length > 0 
      ? reports.filter(report => selectedReports.includes(report.id))
      : filteredReports;
    
    const exportPayload = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        totalRecords: dataToExport.length,
        filters: {
          status: activeFilter,
          search: searchQuery,
          sortBy: sortBy
        },
        exportedBy: "Admin"
      },
      reports: dataToExport.map(report => ({
        id: report.id,
        reportId: report.reportId,
        type: report.type,
        reporterName: report.reporterName,
        reporterEmail: report.reporterEmail,
        reportedUserName: report.reportedUserName,
        reportedUserEmail: report.reportedUserEmail,
        reason: report.reason,
        description: report.description,
        date: report.date,
        time: report.time,
        status: report.status,
        priority: report.priority,
        assignedTo: report.assignedTo,
        lastUpdated: report.lastUpdated,
        resolution: report.resolution,
        actions: report.actions
      }))
    };
    
    return JSON.stringify(exportPayload, null, 2);
  };

  const handleExport = () => {
    const data = generateExportData();
    setExportData(data);
    setShowExportModal(true);
  };

  const downloadJSON = () => {
    const data = generateExportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Enhanced filtering and sorting
  const filteredReports = reports
    .filter((report) => {
      // Status filter
      if (activeFilter !== "All" && report.status !== activeFilter) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          report.reportId.toLowerCase().includes(query) ||
          report.type.toLowerCase().includes(query) ||
          report.reporterName.toLowerCase().includes(query) ||
          report.reportedUserName.toLowerCase().includes(query) ||
          report.reason.toLowerCase().includes(query) ||
          report.description.toLowerCase().includes(query) ||
          report.assignedTo.toLowerCase().includes(query)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.date) - new Date(a.date);
        case "oldest":
          return new Date(a.date) - new Date(b.date);
        case "priority":
          const priorityOrder = { "Critical": 4, "High": 3, "Medium": 2, "Low": 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case "type":
          return a.type.localeCompare(b.type);
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  const getStatusColor = (status) => {
    switch (status) {
      case "Resolved":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      case "Reviewed":
        return "text-blue-400 bg-blue-500/20 border-blue-500/30";
      case "Pending":
      default:
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
    }
  };

  return (
    <div className={`p-8 ${inter.className}`}>
      {/* Modern Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Reports Management</h1>
            <p className="text-white/60">Monitor, review, and manage user reports and violations</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsLoading(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-[#906EFF] text-white rounded-lg hover:bg-[#906EFF]/80 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#0A0028] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Total Reports</p>
                <p className="text-2xl font-bold text-white">{reports.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-[#0A0028] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{reports.filter(r => r.status === 'Pending').length}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="bg-[#0A0028] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Reviewed</p>
                <p className="text-2xl font-bold text-blue-400">{reports.filter(r => r.status === 'Reviewed').length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-[#0A0028] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Resolved</p>
                <p className="text-2xl font-bold text-green-400">{reports.filter(r => r.status === 'Resolved').length}</p>
              </div>
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Controls */}
      <div className="bg-[#0A0028] border border-white/10 rounded-xl p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search reports by ID, type, users, or description..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#906EFF]/50 focus:ring-1 focus:ring-[#906EFF]/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#906EFF]/50"
              >
                <option value="newest" className="bg-[#0A0028] text-white">Newest First</option>
                <option value="oldest" className="bg-[#0A0028] text-white">Oldest First</option>
                <option value="priority" className="bg-[#0A0028] text-white">Priority</option>
                <option value="type" className="bg-[#0A0028] text-white">Type</option>
                <option value="status" className="bg-[#0A0028] text-white">Status</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedReports.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/60">{selectedReports.length} selected</span>
              <button
                onClick={() => handleBulkAction('review')}
                className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
              >
                Mark as Reviewed
              </button>
              <button
                onClick={() => handleBulkAction('resolve')}
                className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
              >
                Resolve All
              </button>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="mt-6 border-t border-white/10 pt-6">
          <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
            {["All", "Pending", "Reviewed", "Resolved"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeFilter === filter
                    ? "bg-[#906EFF] text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-[#0A0028] border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#120A2A] border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedReports.length === filteredReports.length && filteredReports.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-[#906EFF] bg-white/10 border-white/20 rounded focus:ring-[#906EFF]/20"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Reporter
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Reported User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-white/40" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No reports found</h3>
                    <p className="text-white/60">Try adjusting your search or filter criteria</p>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report.id)}
                        onChange={() => handleSelectReport(report.id)}
                        className="w-4 h-4 text-[#906EFF] bg-white/10 border-white/20 rounded focus:ring-[#906EFF]/20"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[#906EFF]">
                      {report.reportId}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(report.type)}`}>
                        {getTypeIcon(report.type)}
                        {report.type}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-white">{report.reporterName}</div>
                        <div className="text-xs text-white/60">{report.reporterEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-white">{report.reportedUserName}</div>
                        <div className="text-xs text-white/60">{report.reportedUserEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm text-white truncate">{report.reason}</div>
                        <div className="text-xs text-white/60 truncate">{report.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(report.priority)}`}>
                        {report.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-white">{report.date}</div>
                        <div className="text-xs text-white/60">{report.time}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {report.status === "Pending" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex items-center justify-center w-8 h-8 text-white/70 hover:text-[#906EFF] hover:bg-[#906EFF]/10 border border-white/10 rounded-lg transition-all duration-200">
                              <MoreHorizontal size={16} />
                            </button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent
                            align="end"
                            className="bg-[#120A2A]/95 border border-white/10 rounded-lg backdrop-blur-sm shadow-lg w-auto min-w-[120px] p-1"
                          >
                            <DropdownMenuItem
                              onClick={() => handleReviewAction("warn", report.id)}
                              className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-yellow-400 hover:text-white hover:bg-yellow-500/30 rounded-md transition-all duration-150 cursor-pointer"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Warn
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleReviewAction("ban", report.id)}
                              className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:text-white hover:bg-red-500/30 rounded-md transition-all duration-150 cursor-pointer"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              Ban
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleReviewAction("dismiss", report.id)}
                              className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-500/30 rounded-md transition-all duration-150 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Dismiss
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      {report.status === "Reviewed" && (
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4 text-blue-400" />
                          <span className="text-xs text-blue-400">Reviewed</span>
                        </div>
                      )}
                      {report.status === "Resolved" && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-green-400">Resolved</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
          <div className="text-sm text-white/60">
            Showing {filteredReports.length} of {reports.length} reports
          </div>
          <div className="flex items-center gap-4 text-sm text-white/60">
            <span>Priority: <span className="text-red-400">Critical</span> • <span className="text-orange-400">High</span> • <span className="text-yellow-400">Medium</span> • <span className="text-green-400">Low</span></span>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0028] border border-white/10 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Export Reports Data</h2>
                <p className="text-sm text-white/60 mt-1">Export reports data in JSON format for analysis or backup</p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Export Options */}
            <div className="px-6 py-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/80">Records:</span>
                    <span className="text-sm text-[#906EFF] font-medium">
                      {selectedReports.length > 0 ? `${selectedReports.length} selected` : `${filteredReports.length} filtered`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadJSON}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download JSON
                  </button>
                  <button
                    onClick={() => setExportData(generateExportData())}
                    className="px-4 py-2 bg-[#906EFF]/20 text-[#906EFF] border border-[#906EFF]/30 rounded-lg hover:bg-[#906EFF]/30 transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>

            {/* JSON Data Display */}
            <div className="px-6 py-4">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-white">JSON Data</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(exportData)}
                      className="px-3 py-1 bg-white/10 text-white/80 border border-white/20 rounded-lg text-sm hover:bg-white/20 transition-colors"
                    >
                      Copy to Clipboard
                    </button>
                    <button
                      onClick={() => setExportData("")}
                      className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <p className="text-sm text-white/60 mb-3">
                  Export includes all report data with metadata, evidence, and resolution details.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Export Data (JSON)</label>
                <textarea
                  value={exportData}
                  onChange={(e) => setExportData(e.target.value)}
                  placeholder="JSON data will appear here when you click Generate..."
                  className="w-full h-64 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#906EFF]/50 focus:ring-1 focus:ring-[#906EFF]/20 font-mono text-sm resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-white/5">
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/60">
                  <p>• Export includes all report data with metadata and evidence</p>
                  <p>• JSON format is compatible with most data analysis tools</p>
                  <p>• Includes priority levels, assignment details, and resolution status</p>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
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