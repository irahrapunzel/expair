"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Inter } from "next/font/google";
import { 
  Check, 
  X, 
  Eye, 
  MoreHorizontal, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  UserCheck,
  UserX,
  Clock,
  Mail,
  Calendar,
  Shield,
  AlertTriangle
} from "lucide-react";
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
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("table"); // table or grid
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportData, setExportData] = useState("");
  const [exportFormat, setExportFormat] = useState("json");
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);

  // Enhanced user verification data
  const users = [
    {
      id: 1032,
      name: "John Doe",
      email: "john.doe@example.com",
      submittedId: "/media/user_verifications/id_1032.jpg",
      idType: "Driver's License (Philippine)",
      birthdate: "03/15/1990",
      nationality: "Filipino",
      registrationDate: "Jan 15, 2024",
      verificationStatus: "Pending",
      lastActive: "2 hours ago",
      totalTrades: 12,
      rating: 4.2,
      location: "Manila, Philippines",
      phone: "+63 912 345 6789",
      riskScore: "Low",
      documents: ["Driver's License"],
      notes: "Professional trader with good history"
    },
    {
      id: 1033,
      name: "Jane Smith",
      email: "jane.smith@example.com",
      submittedId: "/media/user_verifications/id_1033.jpg",
      idType: "National ID (Card/Paper/Digital)",
      birthdate: "07/22/1988",
      nationality: "Filipino",
      registrationDate: "Dec 1, 2023",
      verificationStatus: "Verified",
      lastActive: "1 day ago",
      totalTrades: 45,
      rating: 4.9,
      location: "Cebu City, Philippines",
      phone: "+63 917 234 5678",
      riskScore: "Very Low",
      documents: ["National ID"],
      notes: "Premium user with excellent track record"
    },
    {
      id: 1034,
      name: "Mike Johnson",
      email: "mike.johnson@example.com",
      submittedId: "/media/user_verifications/id_1034.jpg",
      idType: "UMID",
      birthdate: "11/08/1992",
      nationality: "Filipino",
      registrationDate: "Feb 20, 2024",
      verificationStatus: "Pending",
      lastActive: "3 hours ago",
      totalTrades: 8,
      rating: 4.1,
      location: "Davao City, Philippines",
      phone: "+63 918 345 6789",
      riskScore: "Medium",
      documents: ["UMID"],
      notes: "New user, requires additional verification"
    },
    {
      id: 1035,
      name: "Emily Brown",
      email: "emily.brown@example.com",
      submittedId: "/media/user_verifications/id_1035.jpg",
      idType: "Passport",
      birthdate: "05/12/1985",
      nationality: "Filipino",
      registrationDate: "Nov 10, 2023",
      verificationStatus: "Verified",
      lastActive: "5 hours ago",
      totalTrades: 38,
      rating: 4.8,
      location: "Quezon City, Philippines",
      phone: "+63 919 456 7890",
      riskScore: "Low",
      documents: ["Passport"],
      notes: "Reliable trader, frequent user"
    },
    {
      id: 1036,
      name: "David Wilson",
      email: "david.wilson@example.com",
      submittedId: "/media/user_verifications/id_1036.jpg",
      idType: "Postal ID",
      birthdate: "09/30/1995",
      nationality: "Filipino",
      registrationDate: "Mar 5, 2024",
      verificationStatus: "Rejected",
      lastActive: "1 week ago",
      totalTrades: 3,
      rating: 2.1,
      location: "Makati City, Philippines",
      phone: "+63 920 567 8901",
      riskScore: "High",
      documents: ["Postal ID"],
      notes: "Multiple reports, suspicious activity"
    },
    {
      id: 1037,
      name: "Sarah Manager",
      email: "sarah.manager@example.com",
      submittedId: "/media/user_verifications/id_1037.jpg",
      idType: "National ID (Card/Paper/Digital)",
      birthdate: "12/03/1980",
      nationality: "Filipino",
      registrationDate: "Oct 1, 2023",
      verificationStatus: "Verified",
      lastActive: "30 minutes ago",
      totalTrades: 52,
      rating: 4.9,
      location: "Taguig City, Philippines",
      phone: "+63 921 678 9012",
      riskScore: "Very Low",
      documents: ["National ID"],
      notes: "VIP user, business account"
    },
    {
      id: 1038,
      name: "Tom Director",
      email: "tom.director@example.com",
      submittedId: "/media/user_verifications/id_1038.jpg",
      idType: "Driver's License (Philippine)",
      birthdate: "02/14/1987",
      nationality: "Filipino",
      registrationDate: "Sep 1, 2023",
      verificationStatus: "Pending",
      lastActive: "2 days ago",
      totalTrades: 15,
      rating: 4.3,
      location: "Pasig City, Philippines",
      phone: "+63 922 789 0123",
      riskScore: "Low",
      documents: ["Driver's License"],
      notes: "Good standing, verification in progress"
    },
    {
      id: 1039,
      name: "Alex Johnson",
      email: "alex.johnson@example.com",
      submittedId: "/media/user_verifications/id_1039.jpg",
      idType: "UMID",
      birthdate: "08/25/1993",
      nationality: "Filipino",
      registrationDate: "Aug 15, 2023",
      verificationStatus: "Rejected",
      lastActive: "2 weeks ago",
      totalTrades: 7,
      rating: 2.8,
      location: "Mandaluyong City, Philippines",
      phone: "+63 923 890 1234",
      riskScore: "High",
      documents: ["UMID"],
      notes: "Payment disputes, account suspended"
    },
  ];


  const handleViewId = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const handleViewUserDetail = (user) => {
    setSelectedUserDetail(user);
    setShowUserDetailModal(true);
  };

  const handleVerificationAction = (action, userId) => {
    setIsLoading(true);
    console.log(`Action: ${action} on user: ${userId}`);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Update user status logic here
    }, 1000);
  };

  const handleBulkAction = (action) => {
    setIsLoading(true);
    console.log(`Bulk action: ${action} on users:`, selectedUsers);
    setTimeout(() => {
      setIsLoading(false);
      setSelectedUsers([]);
    }, 1000);
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(
      selectedUsers.length === filteredUsers.length 
        ? [] 
        : filteredUsers.map(user => user.id)
    );
  };

  // Export functionality
  const generateExportData = () => {
    const dataToExport = selectedUsers.length > 0 
      ? users.filter(user => selectedUsers.includes(user.id))
      : filteredUsers;
    
    const exportPayload = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        totalRecords: dataToExport.length,
        filters: {
          status: activeFilter,
          search: searchInput,
          sortBy: sortBy
        },
        exportedBy: "Admin"
      },
      users: dataToExport.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        birthdate: user.birthdate,
        nationality: user.nationality,
        idType: user.idType,
        verificationStatus: user.verificationStatus,
        registrationDate: user.registrationDate,
        lastActive: user.lastActive,
        totalTrades: user.totalTrades,
        rating: user.rating,
        location: user.location,
        phone: user.phone,
        riskScore: user.riskScore,
        documents: user.documents,
        notes: user.notes
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
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.users && Array.isArray(parsed.users)) {
        console.log('Imported users:', parsed.users);
        // Handle import logic here
        alert(`Successfully imported ${parsed.users.length} users`);
      } else {
        alert('Invalid JSON format. Expected users array.');
      }
    } catch (error) {
      alert('Invalid JSON format: ' + error.message);
    }
  };

  // Enhanced filtering and sorting
  const filteredUsers = users
    .filter((user) => {
      // Status filter
      if (activeFilter !== "All" && user.verificationStatus !== activeFilter) {
        return false;
      }
      
      // Search filter
      if (!searchInput) return true;
      const query = searchInput.toLowerCase();
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.location.toLowerCase().includes(query) ||
        user.idType.toLowerCase().includes(query) ||
        user.birthdate.toLowerCase().includes(query) ||
        user.nationality.toLowerCase().includes(query) ||
        `U${user.id}`.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.registrationDate) - new Date(a.registrationDate);
        case "oldest":
          return new Date(a.registrationDate) - new Date(b.registrationDate);
        case "name":
          return a.name.localeCompare(b.name);
        case "rating":
          return b.rating - a.rating;
        case "trades":
          return b.totalTrades - a.totalTrades;
        default:
          return 0;
      }
    });

  const getStatusColor = (status) => {
    switch (status) {
      case "Verified":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      case "Rejected":
        return "text-red-400 bg-red-500/20 border-red-500/30";
      case "Pending":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500/30";
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case "Very Low":
        return "text-green-400 bg-green-500/20";
      case "Low":
        return "text-blue-400 bg-blue-500/20";
      case "Medium":
        return "text-yellow-400 bg-yellow-500/20";
      case "High":
        return "text-red-400 bg-red-500/20";
      default:
        return "text-gray-400 bg-gray-500/20";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Verified":
        return <UserCheck className="w-4 h-4" />;
      case "Rejected":
        return <UserX className="w-4 h-4" />;
      case "Pending":
        return <Clock className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className={`p-8 ${inter.className}`}>
      {/* Modern Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
            <p className="text-white/60">Manage user accounts, verification status, and platform access</p>
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
                <p className="text-sm text-white/60">Total Users</p>
                <p className="text-2xl font-bold text-white">{users.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-[#0A0028] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Verified</p>
                <p className="text-2xl font-bold text-green-400">{users.filter(u => u.verificationStatus === 'Verified').length}</p>
              </div>
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-[#0A0028] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{users.filter(u => u.verificationStatus === 'Pending').length}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="bg-[#0A0028] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Rejected</p>
                <p className="text-2xl font-bold text-red-400">{users.filter(u => u.verificationStatus === 'Rejected').length}</p>
              </div>
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <UserX className="w-5 h-5 text-red-400" />
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
                placeholder="Search users by name, email, location, ID type, birthdate, nationality, or ID..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#906EFF]/50 focus:ring-1 focus:ring-[#906EFF]/20"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
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
                <option value="name" className="bg-[#0A0028] text-white">Name A-Z</option>
                <option value="rating" className="bg-[#0A0028] text-white">Highest Rating</option>
                <option value="trades" className="bg-[#0A0028] text-white">Most Trades</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/60">{selectedUsers.length} selected</span>
              <button
                onClick={() => handleBulkAction('verify')}
                className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
              >
                Verify All
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
              >
                Reject All
              </button>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="mt-6 border-t border-white/10 pt-6">
          <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
            {["All", "Verified", "Pending", "Rejected"].map((filter) => (
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
                  Birthdate
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Nationality
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Submitted ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                  ID Type
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
                  <td colSpan="10" className="px-6 py-12 text-center text-white/60">
                    {searchInput ? "No users found matching your search" : "No users available"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => handleViewUserDetail(user)}
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
                  <td className="px-6 py-4 text-sm text-white/70">
                    {user.birthdate}
                  </td>
                  <td className="px-6 py-4 text-sm text-white/70">
                    {user.nationality}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewId(user.submittedId);
                      }}
                      className="flex items-center gap-2 px-3 py-1 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all"
                    >
                      <Eye size={14} />
                      View
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/70">
                    {user.idType}
                  </td>
                  <td className="px-6 py-4 text-sm text-white/70">
                    {user.registrationDate}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.verificationStatus)}`}>
                      {user.verificationStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
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
            Showing {filteredUsers.length} {searchInput ? `of ${users.length}` : ""} users
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

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0028] border border-white/10 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Export Users Data</h2>
                <p className="text-sm text-white/60 mt-1">Export user data in JSON format for analysis or backup</p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Export Options */}
            <div className="px-6 py-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/80">Export Format:</span>
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#906EFF]/50"
                    >
                      <option value="json" className="bg-[#0A0028] text-white">JSON</option>
                      <option value="csv" className="bg-[#0A0028] text-white">CSV</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/80">Records:</span>
                    <span className="text-sm text-[#906EFF] font-medium">
                      {selectedUsers.length > 0 ? `${selectedUsers.length} selected` : `${filteredUsers.length} filtered`}
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
                  You can copy this JSON data or paste your own JSON data below to import users.
                </p>
              </div>

              <div className="space-y-4">
                {/* Export Textarea */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Export Data (JSON)</label>
                  <textarea
                    value={exportData}
                    onChange={(e) => setExportData(e.target.value)}
                    placeholder="JSON data will appear here when you click Generate..."
                    className="w-full h-64 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#906EFF]/50 focus:ring-1 focus:ring-[#906EFF]/20 font-mono text-sm resize-none"
                  />
                </div>

                {/* Import Section */}
                <div className="border-t border-white/10 pt-4">
                  <label className="block text-sm font-medium text-white/80 mb-2">Import Data (JSON)</label>
                  <div className="flex gap-2">
                    <textarea
                      placeholder="Paste JSON data here to import users..."
                      className="flex-1 h-32 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#906EFF]/50 focus:ring-1 focus:ring-[#906EFF]/20 font-mono text-sm resize-none"
                      onChange={(e) => {
                        if (e.target.value.trim()) {
                          handleImportJSON(e.target.value);
                          e.target.value = "";
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const textarea = document.querySelector('textarea[placeholder*="Paste JSON"]');
                        if (textarea && textarea.value.trim()) {
                          handleImportJSON(textarea.value);
                          textarea.value = "";
                        }
                      }}
                      className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors self-start"
                    >
                      Import
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-white/5">
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/60">
                  <p>• Export includes all user data with metadata</p>
                  <p>• JSON format is compatible with most data analysis tools</p>
                  <p>• Import validates JSON structure before processing</p>
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

      {/* User Detail Modal */}
      {showUserDetailModal && selectedUserDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0028] border border-white/10 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">User Details</h2>
                <p className="text-sm text-white/60 mt-1">Complete user information and verification status</p>
              </div>
              <button
                onClick={() => setShowUserDetailModal(false)}
                className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Information */}
            <div className="px-6 py-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/60">User ID:</span>
                      <span className="text-white font-medium">U{selectedUserDetail.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Full Name:</span>
                      <span className="text-white font-medium">{selectedUserDetail.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Email:</span>
                      <span className="text-white font-medium">{selectedUserDetail.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Phone:</span>
                      <span className="text-white font-medium">{selectedUserDetail.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Birthdate:</span>
                      <span className="text-white font-medium">{selectedUserDetail.birthdate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Nationality:</span>
                      <span className="text-white font-medium">{selectedUserDetail.nationality}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Location:</span>
                      <span className="text-white font-medium">{selectedUserDetail.location}</span>
                    </div>
                  </div>
                </div>

                {/* Verification Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Verification Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/60">ID Type:</span>
                      <span className="text-white font-medium">{selectedUserDetail.idType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Verification Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedUserDetail.verificationStatus)}`}>
                        {selectedUserDetail.verificationStatus}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Registration Date:</span>
                      <span className="text-white font-medium">{selectedUserDetail.registrationDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Last Active:</span>
                      <span className="text-white font-medium">{selectedUserDetail.lastActive}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Risk Score:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(selectedUserDetail.riskScore)}`}>
                        {selectedUserDetail.riskScore}
                      </span>
                    </div>
                  </div>

                  {/* Submitted ID */}
                  <div className="mt-4">
                    <span className="text-white/60 block mb-2">Submitted ID:</span>
                    <button
                      onClick={() => handleViewId(selectedUserDetail.submittedId)}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all"
                    >
                      <Eye size={16} />
                      View ID Document
                    </button>
                  </div>
                </div>

                {/* Trading Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Trading Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/60">Total Trades:</span>
                      <span className="text-white font-medium">{selectedUserDetail.totalTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Rating:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-white font-medium">{selectedUserDetail.rating}</span>
                        <span className="text-yellow-400">★</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents & Notes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Documents & Notes</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-white/60 block mb-2">Documents:</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedUserDetail.documents.map((doc, index) => (
                          <span key={index} className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded">
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-white/60 block mb-2">Admin Notes:</span>
                      <p className="text-white/80 text-sm bg-white/5 p-3 rounded-lg">
                        {selectedUserDetail.notes}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-white/5">
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/60">
                  <p>• Click "View ID Document" to see submitted verification documents</p>
                  <p>• Use the buttons below or the actions dropdown in the main table to approve/reject verification</p>
                </div>
                <div className="flex items-center gap-3">
                  {selectedUserDetail.verificationStatus === "Pending" && (
                    <>
                      <button
                        onClick={() => {
                          setIsLoading(true);
                          console.log(`Accepting verification for user: ${selectedUserDetail.id}`);
                          // Simulate API call
                          setTimeout(() => {
                            setIsLoading(false);
                            // Update the user status in the modal
                            setSelectedUserDetail(prev => ({ ...prev, verificationStatus: "Verified" }));
                            // Close the modal
                            setShowUserDetailModal(false);
                            // Show success message or update the main table
                            alert(`Verification accepted for ${selectedUserDetail.name}`);
                          }, 1000);
                        }}
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? "Processing..." : "Accept Verification"}
                      </button>
                      <button
                        onClick={() => {
                          setIsLoading(true);
                          console.log(`Rejecting verification for user: ${selectedUserDetail.id}`);
                          // Simulate API call
                          setTimeout(() => {
                            setIsLoading(false);
                            // Update the user status in the modal
                            setSelectedUserDetail(prev => ({ ...prev, verificationStatus: "Rejected" }));
                            // Close the modal
                            setShowUserDetailModal(false);
                            // Show success message or update the main table
                            alert(`Verification rejected for ${selectedUserDetail.name}`);
                          }, 1000);
                        }}
                        disabled={isLoading}
                        className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? "Processing..." : "Reject Verification"}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowUserDetailModal(false)}
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
