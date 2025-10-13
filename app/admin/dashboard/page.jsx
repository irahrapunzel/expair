"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Inter } from "next/font/google";
import { MoreHorizontal } from "lucide-react";
import AdminPageHeader from "@/components/admin/admin-page-header";
import StatsCard from "@/components/admin/stats-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const inter = Inter({ subsets: ["latin"] });

export default function ReportsPage() {
  const [activeFilter, setActiveFilter] = useState("All");

  // Sample data for User Reports
  const reports = [
    {
      id: 1,
      reportId: "RPT-2024-001",
      reporterName: "John Doe",
      reporterId: "USR-12345",
      reportedUserName: "Jane Smith",
      reportedUserId: "USR-67890",
      reason: "Harassment in chat messages",
      date: "2025/10/11",
      status: "Pending",
    },
    {
      id: 2,
      reportId: "RPT-2024-002",
      reporterName: "Mike Johnson",
      reporterId: "USR-23456",
      reportedUserName: "David Wilson",
      reportedUserId: "USR-78901",
      reason: "Fake trading",
      date: "2025/10/05",
      status: "Reviewed",
    },
    {
      id: 3,
      reportId: "RPT-2024-003",
      reporterName: "Emily Brown",
      reporterId: "USR-34567",
      reportedUserName: "Sarah Manager",
      reportedUserId: "USR-89012",
      reason: "Inappropriate content",
      date: "2025/09/10",
      status: "Pending",
    },
    {
      id: 4,
      reportId: "RPT-2024-004",
      reporterName: "Tom Director",
      reporterId: "USR-45678",
      reportedUserName: "Lisa Thompson",
      reportedUserId: "USR-90123",
      reason: "Spam messaging",
      date: "2025/10/06",
      status: "Resolved",
    },
    {
      id: 5,
      reportId: "RPT-2024-005",
      reporterName: "Anna Davis",
      reporterId: "USR-56789",
      reportedUserName: "Chris Evans",
      reportedUserId: "USR-01234",
      reason: "Profile fraud",
      date: "2025/08/08",
      status: "Reviewed",
    },
    {
      id: 6,
      reportId: "RPT-2024-006",
      reporterName: "Bob Wilson",
      reporterId: "USR-67890",
      reportedUserName: "Alice Cooper",
      reportedUserId: "USR-12345",
      reason: "Trade violation",
      date: "2025/09/12",
      status: "Pending",
    },
    {
      id: 7,
      reportId: "RPT-2024-007",
      reporterName: "Grace Lee",
      reporterId: "USR-78901",
      reportedUserName: "Frank Miller",
      reportedUserId: "USR-23456",
      reason: "Harassment",
      date: "2025/10/10",
      status: "Resolved",
    },
    {
      id: 8,
      reportId: "RPT-2024-008",
      reporterName: "Henry Ford",
      reporterId: "USR-89012",
      reportedUserName: "Diana Prince",
      reportedUserId: "USR-34567",
      reason: "Inappropriate behavior",
      date: "2025/10/01",
      status: "Pending",
    },
  ];


  const handleReviewAction = (action, reportId) => {
    console.log(`Action: ${action} on report: ${reportId}`);
    // Implement review logic here
  };

  // Filter reports based on status filter
  const filteredReports = reports.filter((report) => {
    // Apply status filter
    if (activeFilter !== "All") {
      if (report.status !== activeFilter) {
        return false;
      }
    }
    return true;
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
      {/* Page Title */}
      <AdminPageHeader
        title="Reports"
      />

      {/* Filter Tabs */}
      <div className="border-b border-white/10 mb-6">
        <div className="flex gap-8">
          {["All", "Pending", "Reviewed", "Resolved"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`relative px-1 py-3 text-sm font-medium transition-all border-b-2 ${
                activeFilter === filter
                  ? "text-[#906EFF] border-[#906EFF]"
                  : "text-white/70 border-transparent hover:text-[#906EFF]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-[#0A0028] border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#120A2A] border-b border-white/10">
              <tr>
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
                  Reason
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
                  <td colSpan="9" className="px-6 py-12 text-center text-white/60">
                    No reports available
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-white/5 transition-colors"
                >
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
                  <td className="px-6 py-4 text-sm text-white/70">
                    {report.reason}
                  </td>
                  <td className="px-6 py-4 text-sm text-white/70">
                    {report.date}
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
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c.89 0 1.337-1.077.707-1.707L12.707 4.293a1 1 0 00-1.414 0L5.364 17.293A1 1 0 006.071 19z" />
                            </svg>
                            Warn
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleReviewAction("ban", report.id)}
                            className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:text-white hover:bg-red-500/30 rounded-md transition-all duration-150 cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
                            </svg>
                            Ban
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleReviewAction("dismiss", report.id)}
                            className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-500/30 rounded-md transition-all duration-150 cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Dismiss
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
          <div className="text-sm text-white/60">
            Showing {filteredReports.length} of {reports.length} reports
          </div>
        </div>
      </div>

    </div>
  );
}
