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
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedReportForRejection, setSelectedReportForRejection] = useState(null);
  const [rejectionDescription, setRejectionDescription] = useState("");
  const [showReportDetailModal, setShowReportDetailModal] = useState(false);
  const [selectedReportDetail, setSelectedReportDetail] = useState(null);

  // Enhanced reports data based on modal structure
  const reports = [
    {
      id: 1,
      reportId: "RPT-2024-001",
      reporterName: "John Doe",
      reporterId: "U1032",
      reportedUserName: "Jane Smith",
      reportedUserId: "U1033",
      category: "User Behavior",
      issue: "Harassment or bullying",
      additionalDetails: "User has been sending inappropriate messages and making threats in the trading chat room. Screenshots provided.",
      dateReported: "2024-01-15",
      status: "Pending",
      priority: "High",
      assignedTo: "Admin Team",
      lastUpdated: "2 hours ago",
      rejectionDescription: null,
      actions: []
    },
    {
      id: 2,
      reportId: "RPT-2024-002",
      reporterName: "Mike Johnson",
      reporterId: "U1034",
      reportedUserName: "David Wilson",
      reportedUserId: "U1036",
      category: "Trade Issues",
      issue: "Payment Issues",
      additionalDetails: "User failed to complete agreed trade and kept the items without payment. Trade agreement and payment proof provided.",
      dateReported: "2024-01-10",
      status: "Reviewed",
      priority: "Critical",
      assignedTo: "Security Team",
      lastUpdated: "1 day ago",
      rejectionDescription: null,
      actions: ["Warning Issued", "Account Flagged"]
    },
    {
      id: 3,
      reportId: "RPT-2024-003",
      reporterName: "Emily Brown",
      reporterId: "U1035",
      reportedUserName: "Sarah Manager",
      reportedUserId: "U1037",
      category: "Profile Content",
      issue: "Inappropriate requests",
      additionalDetails: "User posted inappropriate content in their profile and trade descriptions. Screenshots of profile content provided.",
      dateReported: "2024-01-08",
      status: "Pending",
      priority: "Medium",
      assignedTo: "Content Team",
      lastUpdated: "3 hours ago",
      rejectionDescription: null,
      actions: []
    },
    {
      id: 4,
      reportId: "RPT-2024-004",
      reporterName: "Tom Director",
      reporterId: "U1038",
      reportedUserName: "Alex Johnson",
      reportedUserId: "U1039",
      category: "User Behavior",
      issue: "Spam or scam activity",
      additionalDetails: "User is sending repetitive promotional messages to multiple users. Message history logs provided.",
      dateReported: "2024-01-05",
      status: "Resolved",
      priority: "Low",
      assignedTo: "Moderation Team",
      lastUpdated: "5 days ago",
      rejectionDescription: null,
      actions: ["Warning Issued", "Messages Removed"]
    },
    {
      id: 5,
      reportId: "RPT-2024-005",
      reporterName: "Jane Smith",
      reporterId: "U1033",
      reportedUserName: "Mike Johnson",
      reportedUserId: "U1034",
      category: "Safety & Privacy",
      issue: "Disrespectful or rude language",
      additionalDetails: "User is using fake identity documents and impersonating another person. Document comparison and verification failure logs provided.",
      dateReported: "2024-01-03",
      status: "Rejected",
      priority: "Critical",
      assignedTo: "Security Team",
      lastUpdated: "2 days ago",
      rejectionDescription: "Insufficient evidence provided. Please provide more detailed documentation.",
      actions: ["Account Suspended", "Documents Flagged"]
    },
    {
      id: 6,
      reportId: "RPT-2024-006",
      reporterName: "Sarah Manager",
      reporterId: "U1037",
      reportedUserName: "Tom Director",
      reportedUserId: "U1038",
      category: "Trade Issues",
      issue: "Payment Issues",
      additionalDetails: "User failed to complete agreed trade and kept the items without payment. Trade agreement and payment proof provided.",
      dateReported: "2024-01-01",
      status: "Pending",
      priority: "High",
      assignedTo: "Trade Support",
      lastUpdated: "1 hour ago",
      rejectionDescription: null,
      actions: []
    },
    {
      id: 7,
      reportId: "RPT-2024-007",
      reporterName: "David Wilson",
      reporterId: "U1036",
      reportedUserName: "Emily Brown",
      reportedUserId: "U1035",
      category: "User Behavior",
      issue: "Harassment or bullying",
      additionalDetails: "User has been stalking and sending threatening messages outside the platform. External messages and threat screenshots provided.",
      dateReported: "2023-12-28",
      status: "Resolved",
      priority: "Critical",
      assignedTo: "Security Team",
      lastUpdated: "3 days ago",
      rejectionDescription: null,
      actions: ["Permanent Ban", "Legal Action"]
    },
    {
      id: 8,
      reportId: "RPT-2024-008",
      reporterName: "Alex Johnson",
      reporterId: "U1039",
      reportedUserName: "John Doe",
      reportedUserId: "U1032",
      category: "Others",
      issue: "Inappropriate requests",
      additionalDetails: "User is exhibiting aggressive behavior in trade negotiations. Negotiation logs provided.",
      dateReported: "2023-12-25",
      status: "Rejected",
      priority: "Medium",
      assignedTo: "Community Team",
      lastUpdated: "4 hours ago",
      rejectionDescription: "Report does not meet our community guidelines criteria. No further action required.",
      actions: []
    },
  ];

  const handleReviewAction = (action, reportId) => {
    console.log(`Action: ${action} on report: ${reportId}`);
    // Implement review logic here
  };

  const handleRejectReport = (reportId) => {
    const report = reports.find(r => r.id === reportId);
    setSelectedReportForRejection(report);
    setShowRejectionModal(true);
  };

  const handleSubmitRejection = () => {
    if (rejectionDescription.trim()) {
      console.log(`Rejecting report ${selectedReportForRejection.reportId} with description: ${rejectionDescription}`);
      // Here you would update the report status and rejection description
      setShowRejectionModal(false);
      setRejectionDescription("");
      setSelectedReportForRejection(null);
    }
  };

  const handleViewReportDetail = (report) => {
    setSelectedReportDetail(report);
    setShowReportDetailModal(true);
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
        reporterName: report.reporterName,
        reporterId: report.reporterId,
        reportedUserName: report.reportedUserName,
        reportedUserId: report.reportedUserId,
        category: report.category,
        issue: report.issue,
        additionalDetails: report.additionalDetails,
        dateReported: report.dateReported,
        status: report.status,
        priority: report.priority,
        assignedTo: report.assignedTo,
        lastUpdated: report.lastUpdated,
        rejectionDescription: report.rejectionDescription,
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
          report.category.toLowerCase().includes(query) ||
          report.reporterName.toLowerCase().includes(query) ||
          report.reporterId.toLowerCase().includes(query) ||
          report.reportedUserName.toLowerCase().includes(query) ||
          report.reportedUserId.toLowerCase().includes(query) ||
          report.issue.toLowerCase().includes(query) ||
          report.additionalDetails.toLowerCase().includes(query) ||
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
      case "Rejected":
        return "text-red-400 bg-red-500/20 border-red-500/30";
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
            {/*<button 
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
            </button>*/}
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
                placeholder="Search reports by ID, category, users, issue, or details..."
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
            {["All", "Pending", "Reviewed", "Resolved", "Rejected"].map((filter) => (
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
                  Report ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Reporter Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Reporter ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Reported User Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Reported User ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Issue
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Additional Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Date Reported
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Priority
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
                  <td colSpan="13" className="px-6 py-12 text-center">
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
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => handleViewReportDetail(report)}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
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
                    <td className="px-6 py-4 text-sm text-white">
                      {report.reporterName}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/70">
                      {report.reporterId}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {report.reportedUserName}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/70">
                      {report.reportedUserId}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getTypeColor(report.category)}`}>
                        {report.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/70">
                      {report.issue}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-sm text-white/70 truncate" title={report.additionalDetails}>
                        {report.additionalDetails}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/70">
                      {report.dateReported}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(report.priority)}`}>
                        {report.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
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
                              onClick={() => handleRejectReport(report.id)}
                              className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:text-white hover:bg-red-500/30 rounded-md transition-all duration-150 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
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
                      {report.status === "Rejected" && (
                        <div className="flex items-center gap-1">
                          <XCircle className="w-4 h-4 text-red-400" />
                          <span className="text-xs text-red-400">Rejected</span>
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

      {/* Rejection Modal */}
      {showRejectionModal && selectedReportForRejection && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#0A0028] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Reject Report</h2>
                <p className="text-sm text-white/60 mt-1">Provide a reason for rejecting this report</p>
              </div>
              <button
                onClick={() => setShowRejectionModal(false)}
                className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Report Info */}
            <div className="px-6 py-4 border-b border-white/10 bg-white/5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/60">Report ID:</span>
                  <span className="text-white font-medium ml-2">{selectedReportForRejection.reportId}</span>
                </div>
                <div>
                  <span className="text-white/60">Reporter:</span>
                  <span className="text-white font-medium ml-2">{selectedReportForRejection.reporterName}</span>
                </div>
                <div>
                  <span className="text-white/60">Reported User:</span>
                  <span className="text-white font-medium ml-2">{selectedReportForRejection.reportedUserName}</span>
                </div>
                <div>
                  <span className="text-white/60">Category:</span>
                  <span className="text-white font-medium ml-2">{selectedReportForRejection.category}</span>
                </div>
              </div>
            </div>

            {/* Rejection Form */}
            <div className="px-6 py-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Rejection Description *
                </label>
                <textarea
                  value={rejectionDescription}
                  onChange={(e) => setRejectionDescription(e.target.value)}
                  placeholder="Please provide a detailed reason for rejecting this report..."
                  className="w-full h-32 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#906EFF]/50 focus:ring-1 focus:ring-[#906EFF]/20 resize-none"
                  required
                />
                <p className="text-xs text-white/60 mt-2">
                  This description will be sent to the reporter explaining why their report was rejected.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-white/5">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className="px-4 py-2 bg-white/10 text-white/80 border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRejection}
                  disabled={!rejectionDescription.trim()}
                  className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Detail Modal */}
      {showReportDetailModal && selectedReportDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0028] border border-white/10 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Report Details</h2>
                <p className="text-sm text-white/60 mt-1">Complete report information and investigation details</p>
              </div>
              <button
                onClick={() => setShowReportDetailModal(false)}
                className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Report Information */}
            <div className="px-6 py-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Report Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Report Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/60">Report ID:</span>
                      <span className="text-white font-medium">{selectedReportDetail.reportId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Date Reported:</span>
                      <span className="text-white font-medium">{selectedReportDetail.dateReported}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedReportDetail.status)}`}>
                        {selectedReportDetail.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Priority:</span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(selectedReportDetail.priority)}`}>
                        {selectedReportDetail.priority}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Assigned To:</span>
                      <span className="text-white font-medium">{selectedReportDetail.assignedTo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Last Updated:</span>
                      <span className="text-white font-medium">{selectedReportDetail.lastUpdated}</span>
                    </div>
                  </div>
                </div>

                {/* Category & Issue */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Category & Issue</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/60">Category:</span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getTypeColor(selectedReportDetail.category)}`}>
                        {selectedReportDetail.category}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Issue:</span>
                      <span className="text-white font-medium">{selectedReportDetail.issue}</span>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="mt-4">
                    <span className="text-white/60 block mb-2">Additional Details:</span>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <p className="text-white/80 text-sm leading-relaxed">
                        {selectedReportDetail.additionalDetails}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reporter Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Reporter Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/60">Reporter Name:</span>
                      <span className="text-white font-medium">{selectedReportDetail.reporterName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Reporter ID:</span>
                      <span className="text-white font-medium">{selectedReportDetail.reporterId}</span>
                    </div>
                  </div>
                </div>

                {/* Reported User Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Reported User Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/60">Reported User Name:</span>
                      <span className="text-white font-medium">{selectedReportDetail.reportedUserName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Reported User ID:</span>
                      <span className="text-white font-medium">{selectedReportDetail.reportedUserId}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Taken */}
                {selectedReportDetail.actions && selectedReportDetail.actions.length > 0 && (
                  <div className="space-y-4 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-white mb-4">Actions Taken</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedReportDetail.actions.map((action, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs rounded-lg">
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejection Description */}
                {selectedReportDetail.rejectionDescription && (
                  <div className="space-y-4 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-white mb-4">Rejection Description</h3>
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                      <p className="text-red-400 text-sm leading-relaxed">
                        {selectedReportDetail.rejectionDescription}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-white/5">
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/60">
                  <p>• Use the actions dropdown in the main table to manage this report</p>
                  <p>• All actions and status changes are logged for audit purposes</p>
                </div>
                <div className="flex items-center gap-3">
                  {selectedReportDetail.status === "Pending" && (
                    <>
                      <button
                        onClick={() => handleReviewAction("warn", selectedReportDetail.id)}
                        className="px-4 py-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/30 transition-colors"
                      >
                        Issue Warning
                      </button>
                      <button
                        onClick={() => handleRejectReport(selectedReportDetail.id)}
                        className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        Reject Report
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowReportDetailModal(false)}
                    className="px-4 py-2 bg-[#906EFF] text-white text-sm font-medium rounded-lg hover:bg-[#906EFF]/80 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}