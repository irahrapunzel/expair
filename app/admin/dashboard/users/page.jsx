"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Inter } from "next/font/google";
import { Check, X, Eye, MoreHorizontal } from "lucide-react";
import AdminPageHeader from "@/components/admin/admin-page-header";
import StatsCard from "@/components/admin/stats-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const inter = Inter({ subsets: ["latin"] });

export default function UsersPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");

  // Mock user verification data
  const users = [
    {
      id: 1032,
      name: "John Doe",
      email: "john.doe@example.com",
      submittedId: "/media/user_verifications/id_1032.jpg",
      registrationDate: "Jan 15, 2024",
      verificationStatus: "Pending",
    },
    {
      id: 1033,
      name: "Jane Smith",
      email: "jane.smith@example.com",
      submittedId: "/media/user_verifications/id_1033.jpg",
      registrationDate: "Dec 1, 2023",
      verificationStatus: "Verified",
    },
    {
      id: 1034,
      name: "Mike Johnson",
      email: "mike.johnson@example.com",
      submittedId: "/media/user_verifications/id_1034.jpg",
      registrationDate: "Feb 20, 2024",
      verificationStatus: "Pending",
    },
    {
      id: 1035,
      name: "Emily Brown",
      email: "emily.brown@example.com",
      submittedId: "/media/user_verifications/id_1035.jpg",
      registrationDate: "Nov 10, 2023",
      verificationStatus: "Verified",
    },
    {
      id: 1036,
      name: "David Wilson",
      email: "david.wilson@example.com",
      submittedId: "/media/user_verifications/id_1036.jpg",
      registrationDate: "Mar 5, 2024",
      verificationStatus: "Rejected",
    },
    {
      id: 1037,
      name: "Sarah Manager",
      email: "sarah.manager@example.com",
      submittedId: "/media/user_verifications/id_1037.jpg",
      registrationDate: "Oct 1, 2023",
      verificationStatus: "Verified",
    },
    {
      id: 1038,
      name: "Tom Director",
      email: "tom.director@example.com",
      submittedId: "/media/user_verifications/id_1038.jpg",
      registrationDate: "Sep 1, 2023",
      verificationStatus: "Pending",
    },
    {
      id: 1039,
      name: "Alex Johnson",
      email: "alex.johnson@example.com",
      submittedId: "/media/user_verifications/id_1039.jpg",
      registrationDate: "Aug 15, 2023",
      verificationStatus: "Rejected",
    },
  ];


  const handleViewId = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const handleVerificationAction = (action, userId) => {
    console.log(`Action: ${action} on user: ${userId}`);
    // Implement verification logic here
  };

  // Filter users based on search query and status filter
  const filteredUsers = users.filter((user) => {
    // First apply status filter
    if (activeFilter !== "All") {
      if (user.verificationStatus !== activeFilter) {
        return false;
      }
    }

    // Then apply search query
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      `U${user.id}`.toLowerCase().includes(query)
    );
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Verified":
      case "Accepted":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      case "Rejected":
        return "text-red-400 bg-red-500/20 border-red-500/30";
      case "Pending":
      default:
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
    }
  };

  return (
    <div className={`p-8 ${inter.className}`}>
      {/* Page Title */}
      <AdminPageHeader
        title="Users"
        searchQuery={searchQuery}
        searchResultsCount={filteredUsers.length}
      />

      {/* Filter Tabs */}
      <div className="border-b border-white/10 mb-6">
        <div className="flex gap-8">
          {["All", "Verified", "Pending", "Rejected"].map((filter) => (
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

      {/* Users Table */}
      <div className="bg-[#0A0028] border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#120A2A] border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Full Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Submitted ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Date Submitted
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Verification Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-white/60">
                    {searchQuery ? "No users found matching your search" : "No users available"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-[#906EFF]">
                    U{user.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-white">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-white/70">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewId(user.submittedId)}
                      className="flex items-center gap-2 px-3 py-1 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all"
                    >
                      <Eye size={14} />
                      View
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/70">
                    {user.registrationDate}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.verificationStatus)}`}>
                      {user.verificationStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.verificationStatus === "Pending" && (
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
                            onClick={() => handleVerificationAction("accept", user.id)}
                            className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-green-400 hover:text-white hover:bg-green-500/30 rounded-md transition-all duration-150 cursor-pointer"
                          >
                            <Check size={12} />
                            Accept
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleVerificationAction("reject", user.id)}
                            className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:text-white hover:bg-red-500/30 rounded-md transition-all duration-150 cursor-pointer"
                          >
                            <X size={12} />
                            Reject
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
            Showing {filteredUsers.length} {searchQuery ? `of ${users.length}` : ""} users
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className="w-[650px] max-h-[90vh] flex flex-col p-[40px] relative overflow-y-auto"
            style={{
              background: "rgba(0, 0, 0, 0.05)",
              border: "2px solid #0038FF",
              boxShadow: "0px 4px 15px #D78DE5",
              backdropFilter: "blur(30px)",
              borderRadius: "15px",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">ID Preview</h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex justify-center">
              <img
                src={selectedImage}
                alt="User ID"
                className="max-w-full max-h-[70vh] rounded-lg border border-white/10"
                onError={(e) => {
                  e.target.src = "/assets/defaultavatar.png";
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
