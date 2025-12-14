"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
    Search,
    RefreshCw,
    Eye,
    MoreHorizontal,
    Briefcase,
    Calendar,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Download,
    XCircle,
    Repeat, // Icon for Exchange
    Link as LinkIcon,
    Image as ImageIcon,
    Star,
    MessageSquare
} from "lucide-react";
import AvatarNameCell from "@/components/admin/avatar-name-cell";
import DashboardSkeleton from "@/components/admin/dashboard-skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function TradesPage() {
    const { data: session, status: sessionStatus } = useSession();

    // --- STATE ---
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });

    // Sorting
    const [sortBy, setSortBy] = useState("created_at");
    const [sortDirection, setSortDirection] = useState("desc");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTrades, setTotalTrades] = useState(0);

    // Modal
    const [selectedTrade, setSelectedTrade] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // --- FETCHERS ---

    const fetchTrades = useCallback(async () => {
        const adminToken = session?.access;
        if (sessionStatus !== 'authenticated' || !adminToken) {
            if (sessionStatus === 'unauthenticated') setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                per_page: "20",
                search: searchQuery,
                status: statusFilter,
                sort: sortBy,
                direction: sortDirection,
            });

            if (dateRange.start) params.append('start_date', dateRange.start);
            if (dateRange.end) params.append('end_date', dateRange.end);

            const response = await fetch(`${API_BASE}/api/admin/trades-list/?${params}`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });

            if (!response.ok) throw new Error("Failed to fetch trades");

            const data = await response.json();

            if (data.success) {
                setTrades(data.trades || []);
                setTotalPages(data.pagination?.total_pages || 1);
                setTotalTrades(data.pagination?.total || 0);
            }
        } catch (error) {
            console.error("Failed to fetch trades:", error);
        } finally {
            setLoading(false);
        }
    }, [session?.access, sessionStatus, currentPage, searchQuery, statusFilter, dateRange, sortBy, sortDirection]);

    useEffect(() => {
        fetchTrades();
    }, [fetchTrades]);

    // --- ACTIONS ---

    const handleReset = () => {
        setSearchQuery("");
        setStatusFilter("ALL");
        setDateRange({ start: "", end: "" });
        setSortBy("created_at");
        setSortDirection("desc");
        setCurrentPage(1);
        fetchTrades();
    };

    const handleViewDetails = async (trade) => {
        setSelectedTrade(trade); 
        setShowDetailModal(true);
        
        const adminToken = session?.access;
        if (!adminToken) return;

        setDetailLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/trade-detail/${trade.id}/`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            const data = await res.json();
            if (data.success) {
                setSelectedTrade(data.trade);
            }
        } catch (err) {
            console.error(err);
        } finally { 
            setDetailLoading(false); 
        }
    };

    // --- HELPERS ---

    const getStatusPill = (status) => {
        const styles = {
            PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
            ACTIVE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
            COMPLETED: "bg-green-500/10 text-green-400 border-green-500/20",
            CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.PENDING}`}>
                {status}
            </span>
        );
    };

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDirection('desc');
        }
    };

    const getSortIcon = (column) => {
        if (sortBy !== column) return <ArrowUpDown className="w-3.5 h-3.5 text-white/30" />;
        return sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#906EFF]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#906EFF]" />;
    };

    // Helper to render star rating
    const renderStars = (count) => {
        if (!count) return <span className="text-white/40 text-xs">No rating</span>;
        return (
            <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star 
                        key={i} 
                        className={`w-3 h-3 ${i < count ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} 
                    />
                ))}
            </div>
        );
    };

    if (sessionStatus === "loading") return <DashboardSkeleton />;

    return (
        <div className="min-h-screen bg-[#050015] p-6">
            <div className="max-w-7xl mx-auto">

                {/* HEADER */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Trade Management</h1>
                    <p className="text-white/60">Oversee marketplace activity, track status, and view details.</p>
                </div>

                {/* FILTERS */}
                <div className="bg-[#120A2A] rounded-xl p-6 border border-[#906EFF]/20 mb-6">
                    <div className="flex flex-col xl:flex-row gap-4 justify-between">
                        <div className="flex flex-col md:flex-row gap-4 flex-1">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Search by ID, title, or exchange..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-[#1A0F3E] border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#906EFF]/50"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2.5 bg-[#1A0F3E] border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#906EFF]/50"
                            >
                                <option value="ALL">All Status</option>
                                <option value="PENDING">Pending</option>
                                <option value="ACTIVE">Active</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="flex items-center gap-2 bg-[#1A0F3E] border border-white/20 rounded-lg p-1 pr-3">
                                <div className="p-2 text-white/40"><Calendar className="w-4 h-4" /></div>
                                <input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="bg-transparent text-white text-sm focus:outline-none w-28 [&::-webkit-calendar-picker-indicator]:invert" />
                                <span className="text-white/40">-</span>
                                <input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="bg-transparent text-white text-sm focus:outline-none w-28 [&::-webkit-calendar-picker-indicator]:invert" />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button onClick={handleReset} className="px-4 py-2.5 bg-[#1A0F3E] border border-white/20 rounded-lg text-white hover:bg-[#3C2E64] transition-colors">
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TABLE */}
                <div className="bg-[#120A2A] rounded-xl border border-[#906EFF]/20 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10 bg-[#1A0F3E]">
                                    <th className="text-left py-4 px-6 text-white/60 font-medium text-sm cursor-pointer hover:text-white whitespace-nowrap" onClick={() => handleSort('tradereq_id')}>
                                        <div className="flex items-center gap-2">Trade ID {getSortIcon('tradereq_id')}</div>
                                    </th>
                                    <th className="text-left py-4 px-6 text-white/60 font-medium text-sm cursor-pointer hover:text-white whitespace-nowrap" onClick={() => handleSort('reqname')}>
                                        <div className="flex items-center gap-2">Request Title {getSortIcon('reqname')}</div>
                                    </th>
                                    {/* ✅ NEW COLUMN: Exchange */}
                                    <th className="text-left py-4 px-6 text-white/60 font-medium text-sm whitespace-nowrap">
                                        <div className="flex items-center gap-2">Exchange Offer</div>
                                    </th>
                                    <th className="text-left py-4 px-6 text-white/60 font-medium text-sm whitespace-nowrap">Requester</th>
                                    <th className="text-left py-4 px-6 text-white/60 font-medium text-sm whitespace-nowrap">Responder</th>
                                    <th className="text-center py-4 px-6 text-white/60 font-medium text-sm cursor-pointer hover:text-white whitespace-nowrap" onClick={() => handleSort('status')}>
                                        <div className="flex items-center justify-center gap-2">Status {getSortIcon('status')}</div>
                                    </th>
                                    <th className="text-center py-4 px-6 text-white/60 font-medium text-sm cursor-pointer hover:text-white whitespace-nowrap" onClick={() => handleSort('created_at')}>
                                        <div className="flex items-center justify-center gap-2">Posted {getSortIcon('created_at')}</div>
                                    </th>
                                    <th className="text-center py-4 px-6 text-white/60 font-medium text-sm whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="8" className="text-center py-12 text-white/40">Loading trades...</td></tr>
                                ) : trades.length === 0 ? (
                                    <tr><td colSpan="8" className="text-center py-12 text-white/40">No trades found matching filters</td></tr>
                                ) : (
                                    trades.map((trade) => (
                                        <tr key={trade.id} className="border-b border-white/5 hover:bg-[#1A0F3E] transition-colors cursor-pointer" onClick={() => handleViewDetails(trade)}>
                                            <td className="py-4 px-6 text-[#906EFF] font-medium">#{trade.id}</td>
                                            <td className="py-4 px-6 text-white font-medium">{trade.title}</td>
                                            {/* ✅ Render Exchange Name */}
                                            <td className="py-4 px-6 text-white/80">{trade.exchange || "-"}</td>
                                            <td className="py-4 px-6"><AvatarNameCell name={trade.requester} username="Requester" avatarUrl={null} /></td>
                                            <td className="py-4 px-6">
                                                {trade.responder ? <AvatarNameCell name={trade.responder} username="Responder" avatarUrl={null} /> : <span className="text-white/30 italic text-sm">Pending...</span>}
                                            </td>
                                            <td className="py-4 px-6 text-center">{getStatusPill(trade.status)}</td>
                                            <td className="py-4 px-6 text-center text-white/60 text-sm">{new Date(trade.created_at).toLocaleDateString()}</td>
                                            <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-[#906EFF] border border-white/10 rounded-lg"><MoreHorizontal className="w-4 h-4" /></button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-[#120A2A] border-[#906EFF]/30 text-white">
                                                        <DropdownMenuItem onClick={() => handleViewDetails(trade)} className="hover:bg-[#1A0F3E] cursor-pointer"><Eye className="w-4 h-4 mr-2" /> View Details</DropdownMenuItem>
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

                {/* Pagination (Keeping existing logic) */}
                <div className="mt-6 flex items-center justify-between">
                    <div className="text-white/60 text-sm">Showing {trades.length} of {totalTrades} trades</div>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-[#120A2A] border border-white/20 rounded-lg text-white hover:bg-[#1A0F3E] disabled:opacity-50">Previous</button>
                        <span className="px-4 py-2 bg-[#120A2A] border border-[#906EFF]/30 rounded-lg text-white">Page {currentPage} of {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 bg-[#120A2A] border border-white/20 rounded-lg text-white hover:bg-[#1A0F3E] disabled:opacity-50">Next</button>
                    </div>
                </div>

            </div>

            {/* TRADE DETAILS MODAL (ENHANCED) */}
            {showDetailModal && selectedTrade && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#120A2A] border border-[#906EFF]/30 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

                        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#1A0F3E]">
                            <div>
                                <h2 className="text-xl font-semibold text-white">Trade #{selectedTrade.id}</h2>
                                <p className="text-sm text-white/60 mt-1">{new Date(selectedTrade.created_at).toLocaleString()}</p>
                            </div>
                            <button onClick={() => setShowDetailModal(false)}><XCircle className="w-6 h-6 text-white/60 hover:text-white" /></button>
                        </div>

                        <div className="px-6 py-6 overflow-y-auto flex-1 space-y-6">
                            
                            {/* 1. Header & Status */}
                            <div className="flex items-center justify-between p-4 bg-[#1A0F3E] rounded-xl border border-white/10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#906EFF]/20 rounded-lg flex items-center justify-center">
                                        <Briefcase className="w-6 h-6 text-[#906EFF]" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">{selectedTrade.title}</h3>
                                        <p className="text-white/60 text-sm flex items-center gap-1">
                                            <Repeat className="w-3 h-3" /> Exchanging for: <span className="text-white">{selectedTrade.exchange || "N/A"}</span>
                                        </p>
                                    </div>
                                </div>
                                {getStatusPill(selectedTrade.status)}
                            </div>

                            {/* 2. Participants */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-[#1A0F3E] rounded-xl border border-white/10">
                                    <p className="text-xs text-white/40 uppercase mb-3">Requester</p>
                                    <div className="flex items-center gap-3">
                                        <img src={selectedTrade.requester?.profile_pic || "/defaultavatar.png"} className="w-10 h-10 rounded-full bg-white/10 object-cover" />
                                        <div className="overflow-hidden">
                                            <p className="text-white font-medium truncate">{selectedTrade.requester?.username || "Unknown"}</p>
                                            <p className="text-xs text-white/60">Initiator</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-[#1A0F3E] rounded-xl border border-white/10">
                                    <p className="text-xs text-white/40 uppercase mb-3">Responder</p>
                                    {selectedTrade.responder ? (
                                        <div className="flex items-center gap-3">
                                            <img src={selectedTrade.responder?.profile_pic || "/defaultavatar.png"} className="w-10 h-10 rounded-full bg-white/10 object-cover" />
                                            <div className="overflow-hidden">
                                                <p className="text-white font-medium truncate">{selectedTrade.responder?.username}</p>
                                                <p className="text-xs text-white/60">Partner</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-white/40 italic text-sm">No responder yet</p>
                                    )}
                                </div>
                            </div>

                            {/* 3. Trade Descriptions */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-white/80 mb-2">Request Details</h4>
                                    <div className="p-4 bg-[#1A0F3E] rounded-lg border border-white/10 text-white/80 text-sm leading-relaxed">
                                        {selectedTrade.description || "No description provided."}
                                    </div>
                                </div>
                                {selectedTrade.category && (
                                    <div className="flex items-center gap-2 text-sm text-white/60">
                                        <span className="px-2 py-1 bg-white/5 rounded border border-white/10 text-xs">Category: {selectedTrade.category}</span>
                                    </div>
                                )}
                            </div>

                            {/* 4. COMPLETED TRADE SECTION: Proofs & Reviews */}
                            {selectedTrade.status === 'COMPLETED' && (
                                <div className="space-y-6 pt-4 border-t border-white/10">
                                    
                                    {/* Proofs */}
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <LinkIcon className="w-5 h-5 text-[#906EFF]"/> Trade History & Proofs
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {['requester', 'responder'].map((role) => (
                                            <div key={role} className="p-4 bg-[#1A0F3E] rounded-lg border border-white/10">
                                                <p className="text-xs text-white/40 uppercase mb-2">{role} Proofs</p>
                                                {selectedTrade.proofs && selectedTrade.proofs[role] && selectedTrade.proofs[role].length > 0 ? (
                                                    <div className="space-y-2">
                                                        {selectedTrade.proofs[role].map((proof, idx) => (
                                                            <a 
                                                                key={idx} 
                                                                href={proof.url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 p-2 bg-white/5 rounded hover:bg-white/10 transition-colors text-sm text-[#906EFF] truncate"
                                                            >
                                                                {proof.type === 'image' || proof.url.includes('cloudinary') ? <ImageIcon className="w-4 h-4"/> : <LinkIcon className="w-4 h-4"/>}
                                                                <span className="truncate flex-1">{proof.url}</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-white/30 text-sm italic">No proofs submitted</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Reviews */}
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Star className="w-5 h-5 text-yellow-400"/> Reviews & Feedback
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Requester Review */}
                                        <div className="p-4 bg-[#1A0F3E] rounded-lg border border-white/10">
                                            <p className="text-xs text-white/40 uppercase mb-2">Requester's Review</p>
                                            {selectedTrade.reviews?.requester_rating ? (
                                                <>
                                                    {renderStars(selectedTrade.reviews.requester_rating)}
                                                    <p className="text-white/80 text-sm mt-2 italic">"{selectedTrade.reviews.requester_comment || "No comment"}"</p>
                                                </>
                                            ) : <p className="text-white/30 text-sm italic">No rating given</p>}
                                        </div>

                                        {/* Responder Review */}
                                        <div className="p-4 bg-[#1A0F3E] rounded-lg border border-white/10">
                                            <p className="text-xs text-white/40 uppercase mb-2">Responder's Review</p>
                                            {selectedTrade.reviews?.responder_rating ? (
                                                <>
                                                    {renderStars(selectedTrade.reviews.responder_rating)}
                                                    <p className="text-white/80 text-sm mt-2 italic">"{selectedTrade.reviews.responder_comment || "No comment"}"</p>
                                                </>
                                            ) : <p className="text-white/30 text-sm italic">No rating given</p>}
                                        </div>
                                    </div>

                                </div>
                            )}

                        </div>

                        <div className="px-6 py-4 border-t border-white/10 bg-[#1A0F3E] flex justify-end">
                            <button onClick={() => setShowDetailModal(false)} className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20">Close</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}