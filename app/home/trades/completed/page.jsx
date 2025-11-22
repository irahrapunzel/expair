"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Inter } from "next/font/google";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import ActiveEvaluationDialog from "../../../../components/trade-cards/active-evaluation-dialog";
import { StarEvaluateIcon } from "../../../../components/icons/star-evaluate-icon";
import { Star, Download, FileText, ChevronDownIcon } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export default function CompletedTradesPage() {
    const { data: session } = useSession();

    const [expandedCardId, setExpandedCardId] = useState(null);
    const [showEvaluationDialog, setShowEvaluationDialog] = useState(false);
    const [selectedTrade, setSelectedTrade] = useState(null);

    const [evaluationData, setEvaluationData] = useState(null);
    const [loadingEvaluation, setLoadingEvaluation] = useState(false);

    // State for real data
    const [completedTrades, setCompletedTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showReportDropdown, setShowReportDropdown] = useState(false);

    // Fetch COMPLETED trades from backend
    useEffect(() => {
        let isMounted = true;

        const fetchCompletedTrades = async () => {
            const token = session?.access || session?.accessToken;
            if (!token) {
                console.log("No session access token available");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // ✅ I-update ang URL para sa fetch request
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/completed-trades/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log("Completed trades data from backend:", data);

                    if (!isMounted) return;

                    // ✅ Hindi na kailangan mag-filter dito dahil salà na mula sa backend
                    // const completedTradesFromBackend = data.home_active_trades.filter(
                    //   trade => trade.status === "COMPLETED"
                    // );

                    // ✅ Gamitin direkta ang 'completed_trades' mula sa response
                    const completedTradesFromBackend = data.completed_trades;

                    console.log("Filtered COMPLETED trades:", completedTradesFromBackend);

                    // Transform only COMPLETED trades
                    const transformedTrades = await Promise.all(
                        completedTradesFromBackend.map(async (trade) => {
                            try {
                                // Fetch reputation/rating data
                                const ratingResponse = await fetch(
                                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-rating/status/${trade.tradereq_id}/`,
                                    {
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json',
                                        },
                                    }
                                );

                                // Fetch trade details
                                const tradeDetailsResponse = await fetch(
                                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-details/${trade.tradereq_id}/`,
                                    {
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json',
                                        },
                                    }
                                );

                                let ratingData = null;
                                let tradeDetails = null;
                                let partnerRating = null;
                                let partnerReview = "";

                                if (ratingResponse.ok) {
                                    ratingData = await ratingResponse.json();
                                }

                                if (tradeDetailsResponse.ok) {
                                    const detailsData = await tradeDetailsResponse.json();
                                    if (detailsData.details && Array.isArray(detailsData.details)) {
                                        const otherUserId = trade.other_user.id;
                                        tradeDetails = detailsData.details.find(detail => detail.user_id === otherUserId);

                                        if (!tradeDetails) {
                                            tradeDetails = detailsData.details.find(detail => detail.user_id === session.user.id);
                                        }

                                        if (!tradeDetails && detailsData.details.length > 0) {
                                            tradeDetails = detailsData.details[0];
                                        }
                                    }
                                }

                                // Fetch the rating that the PARTNER gave to YOU
                                // ✅ *** FIX 1: Changed /user/ to /users/ ***
                                const reputationResponse = await fetch(
                                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${session.user.id}/reviews/`,
                                    {
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json',
                                        },
                                    }
                                );

                                if (reputationResponse.ok) {
                                    const reviewsData = await reputationResponse.json();
                                    // Find the review for this specific trade
                                    const thisTradeReview = reviewsData.reviews.find(
                                        review => review.trade_id === trade.tradereq_id
                                    );

                                    if (thisTradeReview) {
                                        partnerRating = thisTradeReview.rating;
                                        partnerReview = thisTradeReview.review_description || "";
                                    }
                                }

                                return {
                                    id: trade.tradereq_id,
                                    tradereq_id: trade.tradereq_id,
                                    firstname: trade.other_user.name.split(' ')[0] || trade.other_user.name,
                                    lastname: trade.other_user.name.split(' ').slice(1).join(' ') || '',
                                    username: trade.other_user.username,
                                    avatar: trade.other_user.profilePic || "/defaultavatar.png",
                                    rating: trade.other_user.rating.toFixed(1),
                                    level: trade.other_user.level.toString(),

                                    // ✅ Gamitin ang reqname at exchange nang direkta
                                    requested: trade.reqname,
                                    offering: trade.exchange,

                                    deadline: trade.deadline_formatted, // Galing na ito sa backend
                                    xp: `${trade.total_xp} XP`,
                                    description: tradeDetails?.reqbio || `Trade request: ${trade.reqname}`,
                                    status: "completed",
                                    is_requester: trade.is_requester,

                                    // Store the actual trade detail values
                                    skillProficiency: tradeDetails?.skillprof || null,
                                    modeOfDelivery: tradeDetails?.modedel || null,
                                    requestType: tradeDetails?.reqtype || null,
                                    requestBio: tradeDetails?.reqbio || `Trade request: ${trade.reqname}`,
                                    contextPic: tradeDetails?.contextpic || null,

                                    // Rating data - what partner gave to you
                                    partnerRating: partnerRating,
                                    partnerReview: partnerReview,
                                    completedAt: ratingData?.trade_details?.completed_at || null,

                                    traderId: `${trade.other_user.name.toLowerCase().replace(' ', '_')}_${trade.other_user.id}`
                                };
                            } catch (error) {
                                console.error(`Error processing trade ${trade.tradereq_id}:`, error);
                                return null;
                            }
                        })
                    );

                    // Filter out failed trades
                    const validTrades = transformedTrades.filter(trade => trade !== null);

                    if (isMounted) {
                        setCompletedTrades(validTrades);
                    }
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (error) {
                console.error('Error fetching completed trades:', error);
                if (isMounted) {
                    setError('Failed to load completed trades');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchCompletedTrades();

        return () => {
            isMounted = false;
        };
    }, [session]);

    const fetchEvaluationData = async (tradereqId) => {
        const token = session?.access || session?.accessToken;
        if (!token) return;

        setLoadingEvaluation(true);
        try {
            // ✅ *** FIX 2: Changed URL to match urls.py ***
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-requests/${tradereqId}/evaluation/`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                console.log("Evaluation data:", data);
                setEvaluationData(data.evaluation); // This matches the backend response
            } else {
                console.error("Failed to fetch evaluation data");
                setEvaluationData(null);
            }
        } catch (error) {
            console.error("Error fetching evaluation:", error);
            setEvaluationData(null);
        } finally {
            setLoadingEvaluation(false);
        }
    };

    const handleGenerateReport = (format) => {
        // Use the environment variable for the backend base URL
        const RAW_BASE = process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/+$/, "");

        const endpoint = format === 'pdf' ? '/user-report/pdf/' : '/user-report/csv/';
        const reportUrl = `${RAW_BASE}${endpoint}`;

        const token = session?.access || session?.accessToken;

        if (!token) {
            alert("Authentication required to download report.");
            setShowReportDropdown(false);
            return;
        }

        // Secure Download using Fetch/Blob
        fetch(reportUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(response => {
                if (response.status === 401 || response.status === 403) {
                    throw new Error("You are not authorized to download this report.");
                }
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(`Server error (${response.status}): ${err.error || response.statusText}`);
                    }).catch(() => {
                        throw new Error(`Server error (${response.status}). Could not generate report.`);
                    });
                }

                // Determine filename
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = `expair_completed_trade_report_${session.user.username}.${format}`;
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
                console.error("Download failed:", error);
                alert(`Failed to download report: ${error.message}`);
            })
            .finally(() => {
                setShowReportDropdown(false);
            });
    };

    const getTradeDetailTags = (trade) => {
        const tags = [];

        // Skill Proficiency
        if (trade.skillProficiency) {
            const skillMap = {
                'BEGINNER': 'Beginner Level',
                'INTERMEDIATE': 'Intermediate Level',
                'ADVANCED': 'Advanced Level',
                'CERTIFIED': 'Certified'
            };
            tags.push(skillMap[trade.skillProficiency] || trade.skillProficiency);
        }

        // Mode of Delivery
        if (trade.modeOfDelivery) {
            const deliveryMap = {
                'ONLINE': 'Online',
                'ONSITE': 'Onsite',
                'HYBRID': 'Hybrid'
            };
            tags.push(deliveryMap[trade.modeOfDelivery] || trade.modeOfDelivery);
        }

        // Request Type
        if (trade.requestType) {
            const typeMap = {
                'SERVICE': 'Service',
                'OUTPUT': 'Output',
                'PROJECT': 'Project'
            };
            tags.push(typeMap[trade.requestType] || trade.requestType);
        }

        // Fallback if no tags
        if (tags.length === 0) {
            tags.push("Completed Trade");
        }

        return tags;
    };

    const toggleCardExpand = (id) => {
        if (expandedCardId === id) {
            setExpandedCardId(null);
        } else {
            setExpandedCardId(id);
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);

        for (let i = 0; i < 5; i++) {
            stars.push(
                <Star
                    key={i}
                    className={`w-5 h-5 ${i < fullStars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`}
                />
            );
        }

        return stars;
    };

    if (loading) {
        return (
            <div className={`w-[950px] mx-auto pt-10 pb-20 text-white ${inter.className}`}>
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg">Loading completed trades...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`w-[950px] mx-auto pt-10 pb-20 text-white ${inter.className}`}>
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg text-red-400">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`w-[950px] mx-auto pt-10 pb-20 text-white ${inter.className}`}>
            {/* Page Title with Sort/Filter */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-[25px] font-semibold">Completed trades</h1>

                {completedTrades.length > 0 && (
                    <div className="relative">
                        <button
                            onClick={() => setShowReportDropdown(!showReportDropdown)}
                            className="flex items-center text-white text-[16px] border border-white/20 rounded-[15px] h-[40px] px-4 bg-[#120A2A] hover:bg-white/10 transition-colors"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Generate Report
                            <ChevronDownIcon className="ml-2 h-4 w-4 text-white" />
                        </button>
                        {showReportDropdown && (
                            <div className="absolute top-full right-0 mt-2 w-40 bg-[#120A2A] rounded-xl border border-white/20 shadow-lg py-1 z-10">
                                <button
                                    onClick={() => handleGenerateReport('pdf')}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    PDF Report
                                </button>
                                <button
                                    onClick={() => handleGenerateReport('csv')}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                                >
                                    <Icon icon="mdi:file-excel-box-outline" className="mr-2 h-4 w-4" />
                                    CSV Data
                                </button>
                            </div>
                        )}
                    </div>
                )}
                
                <div className="flex items-center gap-4">
                    {/* Sort Button
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#120A2A] rounded-[15px] hover:bg-[#1A0F3E] transition text-sm cursor-pointer">
                        <span>Sort</span>
                        <Icon icon="lucide:arrow-up-down" className="text-lg" />
                    </div> */}
                </div>
            </div>

            

            {/* Completed Trades Section */}
            {completedTrades.length === 0 ? (
                <div className="text-white/60 text-center py-8">
                    No completed trades yet.
                </div>
            ) : (
                <div className="flex flex-col gap-[25px]">
                    {completedTrades.map((trade) => (
                        <div
                            key={trade.id}
                            className={`w-[945px] rounded-[20px] border-[3px] border-[#28CC84]/80 transition-all duration-300 hover:scale-[1.01] overflow-hidden`}
                            style={{
                                background: "radial-gradient(100% 275% at 100% 0%, #249062 0%, #120A2A 69.23%)",
                                boxShadow: "0px 5px 40px rgba(40, 204, 132, 0.2)"
                            }}
                        >
                            {expandedCardId === trade.id ? (
                                // Expanded View
                                <div>
                                    {/* Header */}
                                    <div className="p-[25px] pb-[15px] flex justify-between items-start">
                                        <div className="flex items-start gap-[10px]">
                                            {/* Clickable Profile Picture */}
                                            {trade.username ? (
                                                <Link href={`/home/profile/${trade.username}`} className="flex-shrink-0">
                                                    <div className="w-[25px] h-[25px] rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#28CC84] transition-all">
                                                        <Image
                                                            src={trade.avatar}
                                                            alt="Avatar"
                                                            width={25}
                                                            height={25}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.target.src = '/assets/defaultavatar.png'; }}
                                                        />
                                                    </div>
                                                </Link>
                                            ) : (
                                                <div className="w-[25px] h-[25px] rounded-full overflow-hidden">
                                                    <Image
                                                        src={trade.avatar}
                                                        alt="Avatar"
                                                        width={25}
                                                        height={25}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.src = '/assets/defaultavatar.png'; }}
                                                    />
                                                </div>
                                            )}

                                            <div>
                                                {/* Clickable Name */}
                                                {trade.username ? (
                                                    <Link href={`/home/profile/${trade.username}`} className="hover:text-[#28CC84] transition-colors">
                                                        <span>{trade.firstname} {trade.lastname}</span>
                                                    </Link>
                                                ) : (
                                                    <span className="text-[16px] font-normal text-white">
                                                        {trade.firstname} {trade.lastname}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Context Image - Only show if contextPic exists */}
                                    {trade.contextPic && (
                                        <div className="px-[25px] pb-[20px]">
                                            <div className="w-full h-[321px] rounded-[15px] overflow-hidden shadow-[inset_0_4px_10px_rgba(0,0,0,0.6)]">
                                                <Image
                                                    src={trade.contextPic}
                                                    alt="Trade Context"
                                                    width={900}
                                                    height={300}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Trade Details */}
                                    <div className="px-[25px] pb-[20px]">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="px-[10px] py-[5px] bg-[rgba(40,204,132,0.2)] border-[2px] border-[#28CC84] rounded-[15px] inline-block">
                                                    <span className="text-[16px] text-white">
                                                        {trade.requested}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-[16px] font-semibold text-[#28CC84]">
                                                {trade.xp}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            {/* Tags and Completed Date Row */}
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex flex-wrap gap-[15px]">
                                                    {getTradeDetailTags(trade).map((tag, index) => (
                                                        <div
                                                            key={index}
                                                            className="px-[15px] py-[4px] border-[2px] border-white rounded-[15px]"
                                                        >
                                                            <span className="text-[13px] font-normal text-white">{tag}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <span className="text-[13px] font-normal text-[rgba(255,255,255,0.60)] whitespace-nowrap ml-4">
                                                    Completed {trade.deadline}
                                                </span>
                                            </div>

                                            <div>
                                                <div className="px-[10px] py-[5px] bg-[rgba(40,204,132,0.2)] border-[2px] border-[#28CC84] rounded-[15px] inline-block">
                                                    <span className="text-[16px] text-white">In exchange for {trade.offering}</span>
                                                </div>
                                            </div>

                                            <p className="text-[15px] text-[rgba(255,255,255,0.60)]">{trade.requestBio}</p>

                                            {/* Partner's Rating for You */}
                                            {trade.partnerRating && (
                                                <div className="mt-4 p-4 bg-white/5 rounded-[15px] border border-white/10">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[14px] text-white/80">Rating from {trade.firstname}</span>
                                                        <div className="flex items-center gap-1">
                                                            {renderStars(trade.partnerRating)}
                                                        </div>
                                                    </div>
                                                    {trade.partnerReview && (
                                                        <p className="text-[13px] text-white/70 italic mt-2">
                                                            "{trade.partnerReview}"
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="px-[25px] pb-[25px] flex flex-wrap justify-between">
                                        <button
                                            className="flex items-center justify-center"
                                            onClick={() => toggleCardExpand(trade.id)}
                                        >
                                            <Icon icon="lucide:chevron-up" className="w-[30px] h-[30px] text-white" />
                                        </button>

                                        <div className="flex items-center gap-[15px]">
                                            <button
                                                className="min-w-[170px] h-[40px] flex justify-center items-center rounded-[15px] border-2 border-[#28CC84] bg-[#120A2A] shadow-[0_0_15px_#28CC84] cursor-pointer"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    setSelectedTrade(trade);
                                                    await fetchEvaluationData(trade.tradereq_id);
                                                    setShowEvaluationDialog(true);
                                                }}
                                            >
                                                <div className="flex items-center gap-[10px]">
                                                    <Icon icon="lucide:sparkles" className="text-[#28CC84]" />
                                                    <span className="text-[16px] font-normal text-white">View Evaluation</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Collapsed View
                                <div
                                    className="p-[25px] flex flex-col justify-center items-start gap-[20px] cursor-pointer"
                                    onClick={() => toggleCardExpand(trade.id)}
                                >
                                    {/* Top Row - Name */}
                                    <div className="flex justify-between items-start w-full">
                                        <div className="flex items-center gap-[10px]">
                                            {/* Clickable Profile Picture */}
                                            {trade.username ? (
                                                <Link href={`/home/profile/${trade.username}`} className="flex-shrink-0">
                                                    <div className="w-[25px] h-[25px] rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#28CC84] transition-all">
                                                        <Image
                                                            src={trade.avatar}
                                                            alt="Avatar"
                                                            width={25}
                                                            height={25}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.target.src = '/assets/defaultavatar.png'; }}
                                                        />
                                                    </div>
                                                </Link>
                                            ) : (
                                                <div className="w-[25px] h-[25px] rounded-full overflow-hidden">
                                                    <Image
                                                        src={trade.avatar}
                                                        alt="Avatar"
                                                        width={25}
                                                        height={25}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.src = '/assets/defaultavatar.png'; }}
                                                    />
                                                </div>
                                            )}

                                            {/* Clickable Name */}
                                            {trade.username ? (
                                                <Link href={`/home/profile/${trade.username}`} className="hover:text-[#28CC84] transition-colors">
                                                    <span>
                                                        {trade.firstname} {trade.lastname}
                                                    </span>
                                                </Link>
                                            ) : (
                                                <span className="text-[16px] font-normal text-white">
                                                    {trade.firstname} {trade.lastname}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Middle Row - Requested, In Exchange For, XP */}
                                    <div className="flex justify-between items-start w-full">
                                        <div className="flex items-center gap-[20px]">
                                            <div className="flex flex-col gap-[15px]">
                                                <div className="flex items-center gap-[10px]">
                                                    <span className="text-[16px] text-white">Needed</span>
                                                </div>
                                                <div className="px-[10px] py-[5px] bg-[rgba(40,204,132,0.2)] border-[2px] border-[#28CC84] rounded-[15px]">
                                                    <span className="text-[15px] text-white">{trade.requested}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-[15px]">
                                                <span className="text-[16px] text-white">In exchange for</span>
                                                <div className="px-[10px] py-[5px] bg-[rgba(40,204,132,0.2)] border-[2px] border-[#28CC84] rounded-[15px]">
                                                    <span className="text-[15px] text-white">{trade.offering}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <span className="text-[16px] font-semibold text-[#28CC84]">{trade.xp}</span>
                                    </div>

                                    {/* Bottom Row - Completed Date */}
                                    <div className="flex justify-end items-center w-full">
                                        <span className="text-[15px] font-normal text-white/60">Completed {trade.deadline}</span>
                                    </div>

                                    {/* Chevron Down + Action Buttons */}
                                    <div className="relative w-full mt-2">
                                        <div className="absolute bottom-0 left-0">
                                            <Icon
                                                icon="lucide:chevron-down"
                                                className="w-[30px] h-[30px] text-white cursor-pointer"
                                            />
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap items-center gap-[15px] justify-end">


                                            {/* Partner Rating Badge */}
                                            {trade.partnerRating && (
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
                                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                    <span className="text-sm text-yellow-400">{trade.partnerRating}/5</span>
                                                </div>
                                            )}

                                            {/* View Evaluation Button */}
                                            <div className="h-[55px] flex items-center">
                                                <button
                                                    className="flex justify-center items-center cursor-pointer"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        setSelectedTrade(trade);
                                                        await fetchEvaluationData(trade.tradereq_id);
                                                        setShowEvaluationDialog(true);
                                                    }}
                                                >
                                                    <StarEvaluateIcon size="55" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showEvaluationDialog && selectedTrade && (
                <ActiveEvaluationDialog
                    isOpen={showEvaluationDialog}
                    onClose={() => {
                        setShowEvaluationDialog(false);
                        setEvaluationData(null);
                    }}
                    tradeData={{
                        requestTitle: selectedTrade?.requested,
                        offerTitle: selectedTrade?.offering,
                        taskComplexity: evaluationData?.taskComplexity || 0,
                        timeCommitment: evaluationData?.timeCommitment || 0,
                        skillLevel: evaluationData?.skillLevel || 0,
                        tradeScore: evaluationData?.tradeScore || 0,
                        feedback: evaluationData?.feedback ||
                            `This completed trade for ${selectedTrade?.requested} in exchange for ${selectedTrade?.offering} was well-balanced.`,
                        isLoading: loadingEvaluation
                    }}
                />
            )}
        </div>
    );
}