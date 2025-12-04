"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Inter } from "next/font/google";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import UploadProofDialog from "../../../../components/trade-cards/upload-proof-dialog";
import ViewProofDialog from "../../../../components/trade-cards/view-proof-dialog";
import SuccessDialog from "../../../../components/trade-cards/success-dialog";
import ActiveEvaluationDialog from "../../../../components/trade-cards/active-evaluation-dialog";
import { StarEvaluateIcon } from "../../../../components/icons/star-evaluate-icon";
import { StarIconSmall } from "../../../../components/icons/star-icon-small";
import { Star } from "lucide-react";
import Tooltip from "../../../../components/ui/tooltip";
import ReportDialog from "../../../../components/trade-cards/report-dialog";

const inter = Inter({ subsets: ["latin"] });

export default function ActiveTradesPage() {
  const { data: session } = useSession();

  const [sortAsc, setSortAsc] = useState(true);
  const [selectedSort, setSelectedSort] = useState("Date");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showViewProofDialog, setShowViewProofDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);

  const [showProofSuccessDialog, setShowProofSuccessDialog] = useState(false);
  const [proofSuccessData, setProofSuccessData] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // State for real data
  const [activeTrades, setActiveTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showReportDialog, setShowReportDialog] = useState(false);

  // State to hold the fetched evaluation data
  const [evaluationData, setEvaluationData] = useState({
    tradeScore: 0,
    taskComplexity: 0,
    timeCommitment: 0,
    skillLevel: 0,
    feedback: "Loading evaluation...",
    isLoading: true, // New loading state for the dialog
  });

  const handleReviewDetails = async (trade) => {
    setSelectedTrade(trade); // Set selected trade first
    // Set initial loading state and default titles
    setEvaluationData({
      tradereq_id: trade.tradereq_id,
      requestTitle: trade.requested,
      offerTitle: trade.offering,
      tradeScore: 0,
      taskComplexity: 0,
      timeCommitment: 0,
      skillLevel: 0,
      feedback: "Loading evaluation...",
      isLoading: true
    });
    setShowEvaluationDialog(true); // Open dialog immediately with loading state

    const token = session?.access || session?.accessToken;
    if (!token) {
      setEvaluationData(prev => ({ ...prev, isLoading: false, feedback: "Authentication token missing." }));
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-requests/${trade.tradereq_id}/evaluation/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const evalDetails = data.evaluation;

      // Set the complete fetched evaluation data
      setEvaluationData({
        tradereq_id: trade.tradereq_id,
        requestTitle: evalDetails.requestTitle,
        offerTitle: evalDetails.offerTitle,
        tradeScore: evalDetails.tradeScore, // 0-10
        taskComplexity: evalDetails.taskComplexity, // 0-100
        timeCommitment: evalDetails.timeCommitment, // 0-100
        skillLevel: evalDetails.skillLevel, // 0-100
        feedback: evalDetails.feedback,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching evaluation details:", error);
      setEvaluationData({
        tradereq_id: trade.tradereq_id,
        requestTitle: trade.requested,
        offerTitle: trade.offering,
        tradeScore: 0,
        taskComplexity: 0,
        timeCommitment: 0,
        skillLevel: 0,
        feedback: `Failed to load evaluation: ${error.message}`,
        isLoading: false,
      });
    }
  };

  // Fetch ACTIVE trades from backend
  useEffect(() => {
    let isMounted = true;

    const fetchActiveTrades = async () => {
      const token = session?.access || session?.accessToken;
      if (!token) {
        console.log("No session access token available");
        setLoading(false);
        return;
      }

      // Don't fetch if dialogs are open to prevent data loss
      if (
        showUploadDialog ||
        showViewProofDialog ||
        showSuccessDialog ||
        showEvaluationDialog
      ) {
        console.log("Skipping fetch - dialog is open");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/home/active-trades/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Active trades data:", data);

          console.log("=== FRONTEND DEBUG: RAW BACKEND DATA ===");
          data.home_active_trades.forEach((trade) => {
            console.log(`Trade ${trade.tradereq_id}:`);
            console.log(`  Backend reqname: "${trade.reqname}"`);
            console.log(`  Backend exchange: "${trade.exchange}"`);
            console.log(`  Backend is_requester: ${trade.is_requester}`);
            console.log(`  Current user ID: ${session?.user?.id}`);
          });
          console.log("=== END FRONTEND DEBUG ===");

          if (!isMounted) return;

          const transformedTrades = await Promise.all(
            data.home_active_trades.map(async (trade) => {
              try {
                // Fetch comprehensive proof status
                const proofStatusResponse = await fetch(
                  `${process.env.NEXT_PUBLIC_BACKEND_URL}/home/trade-proof-status/${trade.tradereq_id}/`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                  }
                );

                const tradeDetailsResponse = await fetch(
                  `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-details/${trade.tradereq_id}/`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                  }
                );

                let proofStatus = {
                  current_user_submitted: false,
                  partner_submitted: false,
                  both_submitted: false,
                  current_user_approved: false,
                  partner_approved: false,
                  both_approved: false,
                  current_user_is_requester: trade.is_requester,
                  status: "waiting_for_proofs",
                };

                let tradeDetails = null;

                if (proofStatusResponse.ok) {
                  proofStatus = await proofStatusResponse.json();
                } else {
                  console.log(
                    `Failed to fetch proof status for trade ${trade.tradereq_id}`
                  );
                  // Keep default proofStatus values
                }

                if (tradeDetailsResponse.ok) {
                  try {
                    const detailsData = await tradeDetailsResponse.json();

                    if (
                      detailsData.details &&
                      Array.isArray(detailsData.details)
                    ) {
                      // Find OTHER user's trade detail (the one you're trading with)
                      const otherUserId = trade.other_user.id;
                      tradeDetails = detailsData.details.find(
                        (detail) => detail.user_id === otherUserId
                      );

                      // If partner details not found, use current user's details
                      if (!tradeDetails) {
                        tradeDetails = detailsData.details.find(
                          (detail) => detail.user_id === session.user.id
                        );
                      }

                      // If still nothing, use first available
                      if (!tradeDetails && detailsData.details.length > 0) {
                        tradeDetails = detailsData.details[0];
                      }
                    }
                  } catch (jsonError) {
                    console.log(
                      "Failed to parse trade details JSON:",
                      jsonError
                    );
                  }
                }

                return {
                  id: trade.tradereq_id,
                  tradereq_id: trade.tradereq_id,
                  partnerUserId: trade.other_user.id,
                  firstname:
                    trade.other_user.name.split(" ")[0] ||
                    trade.other_user.name,
                  lastname:
                    trade.other_user.name.split(" ").slice(1).join(" ") || "",
                  username: trade.other_user.username,
                  avatar: trade.other_user.profilePic || "/defaultavatar.png",
                  rating: trade.other_user.rating.toFixed(1),
                  reviews: "0",
                  level: trade.other_user.level.toString(),

                  requested: trade.exchange, // What PARTNER wants
                  offering: trade.reqname, // What PARTNER offers

                  deadline: trade.deadline_formatted,
                  xp: `${trade.total_xp} XP`,
                  description:
                    tradeDetails?.reqbio || `Trade request: ${trade.reqname}`,
                  status: "active",
                  is_requester: trade.is_requester,

                  // Store the actual trade detail values
                  skillProficiency: tradeDetails?.skillprof || null,
                  modeOfDelivery: tradeDetails?.modedel || null,
                  requestType: tradeDetails?.reqtype || null,
                  requestBio:
                    tradeDetails?.reqbio || `Trade request: ${trade.reqname}`,
                  contextPic: tradeDetails?.contextpic || null,

                  // Updated proof tracking
                  myProofSubmitted: proofStatus.current_user_submitted,
                  partnerProofSubmitted: proofStatus.partner_submitted,
                  partnerHasProof: proofStatus.partner_submitted,

                  // Approval tracking
                  myProofApproved: proofStatus.current_user_approved,
                  partnerProofApproved: proofStatus.partner_approved,
                  bothProofsApproved: proofStatus.both_approved,

                  // Overall status for UI decisions
                  proofWorkflowStatus: proofStatus.status,

                  // Rating availability
                  canRate:
                    proofStatus.both_approved ||
                    proofStatus.status === "ready_to_rate",

                  traderId: `${trade.other_user.name
                    .toLowerCase()
                    .replace(" ", "_")}_${trade.other_user.id}`,
                };
              } catch (error) {
                console.error(
                  `Error processing trade ${trade.tradereq_id}:`,
                  error
                );
                return null;
              }
            })
          );

          // Filter out failed trades
          const validTrades = transformedTrades.filter(
            (trade) => trade !== null
          );

          if (isMounted) {
            setActiveTrades(validTrades);
          }
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error("Error fetching active trades:", error);
        if (isMounted) {
          setError("Failed to load active trades");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchActiveTrades();

    return () => {
      isMounted = false;
    };
  }, [session]);

  const getTradeDetailTags = (trade) => {
    const tags = [];

    console.log(`Getting tags for trade ${trade.id}:`, {
      skillProficiency: trade.skillProficiency,
      modeOfDelivery: trade.modeOfDelivery,
      requestType: trade.requestType,
    });

    // Skill Proficiency
    if (trade.skillProficiency) {
      const skillMap = {
        BEGINNER: "Beginner Level",
        INTERMEDIATE: "Intermediate Level",
        ADVANCED: "Advanced Level",
        CERTIFIED: "Certified",
      };
      const skillTag =
        skillMap[trade.skillProficiency] || trade.skillProficiency;
      tags.push(skillTag);
      console.log(`Added skill tag: ${skillTag}`);
    }

    // Mode of Delivery
    if (trade.modeOfDelivery) {
      const deliveryMap = {
        ONLINE: "Online",
        ONSITE: "Onsite",
        HYBRID: "Hybrid",
      };
      const deliveryTag =
        deliveryMap[trade.modeOfDelivery] || trade.modeOfDelivery;
      tags.push(deliveryTag);
      console.log(`Added delivery tag: ${deliveryTag}`);
    }

    // Request Type
    if (trade.requestType) {
      const typeMap = {
        SERVICE: "Service",
        OUTPUT: "Output",
        PROJECT: "Project",
      };
      const typeTag = typeMap[trade.requestType] || trade.requestType;
      tags.push(typeTag);
      console.log(`Added type tag: ${typeTag}`);
    }

    // Debug: Log final tags
    console.log(`Final tags for trade ${trade.id}:`, tags);

    // Only show fallback tags if no actual trade details were found
    if (tags.length === 0) {
      console.log(
        `No trade details found for trade ${trade.id}, using fallback tags`
      );
      tags.push("Active Trade", "In Progress", "Proof Required");
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

  const handleProofSubmission = async (proofData) => {
    if (
      !selectedTrade ||
      (!proofData.files?.length && !proofData.links?.length)
    ) {
      console.error("No new proof data to submit");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("trade_request_id", selectedTrade.tradereq_id);

      // ✅ Append each file to 'proof_files'
      if (proofData.files && proofData.files.length > 0) {
        proofData.files.forEach((fileItem) => {
          if (fileItem.file) {
            formData.append("proof_files", fileItem.file);
          }
        });
      }

      // ✅ Append each link to 'proof_links[]'
      if (proofData.links && proofData.links.length > 0) {
        proofData.links.forEach((linkItem) => {
          if (linkItem.url) {
            formData.append("proof_links[]", linkItem.url);
          }
        });
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-proof/upload/`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session?.access}` },
          body: formData,
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Proof uploaded successfully:", result);

        // Update local UI state
        setActiveTrades((prevTrades) =>
          prevTrades.map((trade) =>
            trade.id === selectedTrade.id
              ? {
                ...trade,
                myProofSubmitted: true,
                proofWorkflowStatus: "waiting_for_approval",
              }
              : trade
          )
        );

        // Close upload dialog and show success modal
        setShowUploadDialog(false);
        setProofSuccessData(result);
        setShowProofSuccessDialog(true);
      } else {
        const errorData = await response.json();
        console.error("❌ Upload failed:", errorData);
        alert(errorData.error || "Failed to submit proof. Please try again.");
      }
    } catch (error) {
      console.error("❌ Error submitting proof:", error);
      alert("An error occurred while submitting your proof. Please try again.");
    }
  };

  const handleProofSuccessClose = () => {
    setShowProofSuccessDialog(false);
    setProofSuccessData(null);
  };

  const handleTradeRating = async (ratingData) => {
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access}`,
      };

      // ✅ CALL AI ENDPOINT DIRECTLY (already handled in SuccessDialog)
      // This function might not even be needed anymore since SuccessDialog
      // now handles the API call internally

      // If you still want to use this handler, just return the data
      // that SuccessDialog already submitted
      return ratingData;
    } catch (error) {
      console.error("Rating submission error:", error);
      throw error;
    }
  };

  const handleViewPartnerProof = async (trade) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-proof/${trade.tradereq_id}/partner/`,
        {
          headers: {
            Authorization: `Bearer ${session?.access}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const partnerProofData = await response.json();
        setSelectedTrade({
          ...trade,
          partnerProofData: partnerProofData,
        });

        setShowViewProofDialog(true);
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to load partner's proof");
      }
    } catch (error) {
      console.error("Error fetching partner proof:", error);
      alert("Failed to load partner's proof");
    }
  };

  const handleApproveProof = async () => {
    if (!selectedTrade) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-proof/${selectedTrade.tradereq_id}/approve/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const approvalData = await response.json();
        console.log("Approval response:", approvalData); // Debug log

        setShowViewProofDialog(false);

        // Update local state with more comprehensive data
        setActiveTrades((prevTrades) =>
          prevTrades.map((trade) =>
            trade.id === selectedTrade.id
              ? {
                ...trade,
                myProofApproved: true,
                partnerProofApproved: true,
                bothProofsApproved:
                  approvalData.both_approved ||
                  approvalData.trade_completed ||
                  false,
                canRate:
                  approvalData.both_approved ||
                  approvalData.trade_completed ||
                  false,
                proofWorkflowStatus:
                  approvalData.both_approved || approvalData.trade_completed
                    ? "ready_to_rate"
                    : "waiting_for_approval",
              }
              : trade
          )
        );

        // If both approved, show success dialog but don't reload immediately
        if (approvalData.both_approved || approvalData.trade_completed) {
          console.log("Both proofs approved, showing success dialog"); // Debug log
          setShowSuccessDialog(true);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to approve proof");
      }
    } catch (error) {
      console.error("Error approving proof:", error);
      alert("Failed to approve proof. Please try again.");
    }
  };

  const handleRejectProof = async () => {
    if (!selectedTrade) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-proof/${selectedTrade.tradereq_id}/reject/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setShowViewProofDialog(false);

        // Show immediate feedback
        setShowSuccessModal(true);

        setActiveTrades((prevTrades) =>
          prevTrades.map((trade) =>
            trade.id === selectedTrade.id
              ? {
                ...trade,
                partnerProofSubmitted: false, // Partner needs to resubmit
                partnerHasProof: false,
                myProofApproved: false,
                partnerProofApproved: false,
                bothProofsApproved: false,
                canRate: false,
              }
              : trade
          )
        );
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reject proof");
      }
    } catch (error) {
      console.error("Error rejecting proof:", error);
      alert("Failed to reject proof. Please try again.");
    }
  };

  const getProofButtonState = (trade) => {
    console.log(`Trade ${trade.id} proof status:`, {
      mySubmitted: trade.myProofSubmitted,
      partnerSubmitted: trade.partnerProofSubmitted,
      myApproved: trade.myProofApproved,
      partnerApproved: trade.partnerProofApproved,
      bothApproved: trade.bothProofsApproved,
      workflowStatus: trade.proofWorkflowStatus,
    });

    if (!trade.myProofSubmitted) {
      return {
        text: "Your Proof",
        disabled: false,
        onClick: () => {
          setSelectedTrade(trade);
          setShowUploadDialog(true);
        },
      };
    }

    if (trade.proofWorkflowStatus === "waiting_for_approval") {
      return {
        text: "Waiting for approval",
        disabled: true,
        onClick: () => {
          setSelectedTrade(trade);
          setShowUploadDialog(true);
        },
      };
    }

    return {
      text: "View Your Proof",
      disabled: false,
      onClick: () => {
        setSelectedTrade(trade);
        // For viewing own proof, we'll use the same dialog but in view mode
        setShowUploadDialog(true);
      },
    };
  };

  const getPartnerProofButtonState = (trade) => {
    // Priority 1: Proof is already approved. Show checkmark and disable.
    if (trade.partnerProofApproved) {
      return {
        text: `${trade.firstname}'s Proof ✓`,
        disabled: false,
        onClick: () => handleViewPartnerProof(trade), // Still allows viewing if needed
      };
    }

    // Priority 2: Waiting for partner to submit
    if (!trade.partnerHasProof) {
      return {
        text: `Waiting for ${trade.firstname}`,
        disabled: true,
        onClick: null,
      };
    }

    // Priority 3: Current user hasn't submitted their own proof yet (cannot approve partner's)
    if (!trade.myProofSubmitted) {
      return {
        text: `${trade.firstname}'s Proof`,
        disabled: true,
        onClick: null,
      };
    }

    // Default: Partner has submitted, and current user can approve/reject
    return {
      text: `${trade.firstname}'s Proof`,
      disabled: false,
      onClick: () => handleViewPartnerProof(trade),
    };
  };

  const handleReport = (trade) => {
    setSelectedTrade(trade);
    setShowReportDialog(true);
  };

  // 🔹 Submit report handler
  const handleReportSubmit = async (reportData) => {
    try {
      const token =
        session?.access ||
        session?.user?.access ||
        session?.user?.accessToken ||
        localStorage.getItem("access");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/reports/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reported_user: reportData.reportedUser,
            tradereq: reportData.tradeId,
            category: reportData.category,
            issue_detail: reportData.issue,
            description: reportData.details,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to submit report");
      alert("✅ Report submitted successfully!");
    } catch (err) {
      console.error("❌ Error submitting report:", err);
      alert("Failed to submit report. Please try again.");
    }
  };

  const shouldShowRateButton = (trade) => {
    console.log(`Rate button check for trade ${trade.id}:`, {
      bothProofsApproved: trade.bothProofsApproved,
      canRate: trade.canRate,
      proofWorkflowStatus: trade.proofWorkflowStatus,
      showRateButton:
        trade.bothProofsApproved ||
        trade.proofWorkflowStatus === "ready_to_rate",
    });

    return (
      trade.bothProofsApproved || trade.proofWorkflowStatus === "ready_to_rate"
    );
  };

  const getTradeStatusText = (trade) => {
    if (trade.bothProofsApproved) {
      return "Ready to rate";
    }

    switch (trade.proofWorkflowStatus) {
      case "waiting_for_proofs":
        if (!trade.myProofSubmitted && !trade.partnerProofSubmitted) {
          return "Trade is ongoing. No proofs submitted yet.";
        } else if (!trade.myProofSubmitted) {
          return "Submit your proof";
        } else {
          return `Waiting for ${trade.firstname}'s proof`;
        }

      case "waiting_for_your_proof":
        return "Submit your proof";

      case "waiting_for_partner_proof":
        return `Waiting for ${trade.firstname}'s proof`;

      case "waiting_for_approval":
        return "Waiting for proof approval";

      case "ready_to_rate":
        return "Ready to rate";

      default:
        return "In progress";
    }
  };

  if (loading) {
    return (
      <div
        className={`w-[950px] mx-auto pt-10 pb-20 text-white ${inter.className}`}
      >
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading active trades...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`w-[950px] mx-auto pt-10 pb-20 text-white ${inter.className}`}
      >
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full md:w-[950px] mx-auto px-4 pt-10 pb-20 text-white ${inter.className}`}
    >
      {/* Page Title with Sort/Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 mb-8">
        <h1 className="text-[25px] font-semibold">Active trades</h1>

        <div className="flex items-center gap-4">
          {/* Sort Button
          <div className="flex items-center gap-2 px-4 py-2 bg-[#120A2A] rounded-[15px] hover:bg-[#1A0F3E] transition text-sm cursor-pointer">
            <span>Sort</span>
            <Icon icon="lucide:arrow-up-down" className="text-lg" /> 
          </div>*/}
        </div>
      </div>

      {/* Active Trades Section */}
      {activeTrades.length === 0 ? (
        <div className="text-white/60 text-center py-4 md:py-8 text-sm md:text-base">
          No active trades yet.
        </div>
      ) : (
        <div className="flex flex-col gap-[25px]">
          {activeTrades.map((trade) => {
            const proofButtonState = getProofButtonState(trade);
            const partnerProofButtonState = getPartnerProofButtonState(trade);
            const showRateButton = shouldShowRateButton(trade);

            return (
              <div
                key={trade.id}
                className={`w-full md:w-[945px] h-auto rounded-[20px] border-[3px] border-[#284CCC]/80 transition-all duration-300 hover:scale-[1.01] overflow-hidden`}
                style={{
                  background:
                    "radial-gradient(100% 275% at 100% 0%, #3D2490 0%, #120A2A 69.23%)",
                  boxShadow: "0px 5px 40px rgba(40, 76, 204, 0.2)",
                }}
              >
                {expandedCardId === trade.id ? (
                  <div>
                    {/* Header */}
                    <div className="p-4 md:p-[25px] pb-[15px] flex justify-between items-start">
                      <div className="flex items-start gap-[10px]">
                        {/* Clickable Profile Picture */}
                        {trade.username ? (
                          <Link
                            href={`/home/profile/${trade.username}`}
                            className="flex-shrink-0"
                          >
                            <div className="w-[25px] h-[25px] rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#284CCC] transition-all">
                              <Image
                                src={trade.avatar}
                                alt="Avatar"
                                width={25}
                                height={25}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = "/assets/defaultavatar.png";
                                }}
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
                              onError={(e) => {
                                e.target.src = "/assets/defaultavatar.png";
                              }}
                            />
                          </div>
                        )}

                        <div>
                          {/* Clickable Name */}
                          {trade.username ? (
                            <Link
                              href={`/home/profile/${trade.username}`}
                              className="hover:text-[#284CCC] transition-colors"
                            >
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
                      {/* Report Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReport(trade);
                        }}
                        className="flex items-center justify-center w-8 h-8 text-white hover:text-red-500 rounded-lg transition-colors"
                        title="Report user"
                      >
                        <Icon
                          icon="mdi:alert-circle-outline"
                          className="text-lg"
                        />
                      </button>
                    </div>

                    {/* Image */}
                    {trade.contextPic && (
                      <div className="px-4 md:px-[25px] pb-[20px]">
                        <div className="w-full h-[200px] md:h-[321px] rounded-[15px] overflow-hidden shadow-[inset_0_4px_10px_rgba(0,0,0,0.6)]">
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
                    <div className="px-4 md:px-[25px] pb-[20px]">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <div className="px-[15px] py-[10px] bg-[rgba(40,76,204,0.2)] border-[2px] border-[#0038FF] rounded-[15px] inline-block">
                            <span className="text-[14px] md:text-[16px] text-white">
                              Requested {trade.requested}
                            </span>
                          </div>
                        </div>
                        <span className="text-[16px] font-semibold text-[#906EFF]">
                          {trade.xp}
                        </span>
                      </div>

                      <div className="flex flex-col gap-4">
                        {/* Tags and Deadline Row - aligned */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-3 md:gap-0">
                          <div className="flex flex-wrap gap-2 md:gap-[15px]">
                            {getTradeDetailTags(trade).map((tag, index) => (
                              <div
                                key={index}
                                className="px-[15px] py-[4px] border-[2px] border-white rounded-[15px]"
                              >
                                <span className="text-[13px] font-normal text-white">
                                  {tag}
                                </span>
                              </div>
                            ))}
                          </div>
                          <span className="text-[13px] font-normal text-[rgba(255,255,255,0.60)] whitespace-nowrap ml-0 md:ml-4">
                            Due on {trade.deadline}
                          </span>
                        </div>

                        <div>
                          <div className="px-[15px] py-[10px] bg-[rgba(144,110,255,0.2)] border-[2px] border-[#906EFF] rounded-[15px] inline-block">
                            <span className="text-[14px] md:text-[16px] text-white">
                              In exchange for {trade.offering}
                            </span>
                          </div>
                        </div>

                        <p className="h-auto text-[15px] text-[rgba(255,255,255,0.60)] whitespace-pre-wrap break-words">
                          {trade.requestBio}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-4 md:px-[25px] pb-[25px] flex flex-wrap justify-between items-center gap-4 md:gap-0">
                      <button
                        className="flex items-center justify-center"
                        onClick={() => toggleCardExpand(trade.id)}
                      >
                        <Icon
                          icon="lucide:chevron-up"
                          className="w-[30px] h-[30px] text-white"
                        />
                      </button>

                      <div className="flex items-center gap-[15px]">
                        {showRateButton ? (
                          <button
                            className="h-[38px] px-[25px] py-[13px] flex justify-center items-center rounded-[15px] cursor-pointer transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTrade(trade);
                              setShowSuccessDialog(true);
                            }}
                            style={{
                              background: "#0038FF",
                              boxShadow: "0px 0px 15px rgba(40, 76, 204, 0.6)",
                            }}
                          >
                            <div className="flex items-center gap-[10px]">
                              <StarIconSmall />
                              <span className="text-[14px] md:text-[16px] text-white whitespace-nowrap">
                                Rate your trade
                              </span>
                            </div>
                          </button>
                        ) : (
                          <button
                            className="min-w-[170px] h-[40px] flex justify-center items-center rounded-[15px] border-2 border-[#7E59F8] bg-[#120A2A] shadow-[0_0_15px_#D78DE5] cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReviewDetails(trade);
                            }}
                          >
                            <div className="flex items-center gap-[10px]">
                              <StarIconSmall />
                              <span className="text-[14px] md:text-[16px] font-normal text-white whitespace-nowrap">
                                Review Details
                              </span>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Collapsed View
                  <div
                    className="p-4 md:p-[25px] flex flex-col justify-center items-start gap-[15px] cursor-pointer"
                    onClick={() => toggleCardExpand(trade.id)}
                  >
                    {/* Top Row - Name and Menu */}
                    <div className="flex justify-between items-start w-full">
                      <div className="flex items-center gap-[10px]">
                        {/* Clickable Profile Picture */}
                        {trade.username ? (
                          <Link
                            href={`/home/profile/${trade.username}`}
                            className="flex-shrink-0"
                          >
                            <div className="w-[25px] h-[25px] rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#284CCC] transition-all">
                              <Image
                                src={trade.avatar}
                                alt="Avatar"
                                width={25}
                                height={25}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = "/assets/defaultavatar.png";
                                }}
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
                              onError={(e) => {
                                e.target.src = "/assets/defaultavatar.png";
                              }}
                            />
                          </div>
                        )}

                        {/* Clickable Name */}
                        {trade.username ? (
                          <Link
                            href={`/home/profile/${trade.username}`}
                            className="hover:text-[#284CCC] transition-colors"
                          >
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
                      {/* Report Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReport(trade);
                        }}
                        className="flex items-center justify-center w-8 h-8 text-white hover:text-red-500 rounded-lg transition-colors"
                        title="Report user"
                      >
                        <Icon
                          icon="mdi:alert-circle-outline"
                          className="text-lg"
                        />
                      </button>
                    </div>

                    {/* Middle Row - Requested, In Exchange For, XP */}
                    <div className="flex flex-col md:flex-row justify-between items-start w-full gap-4 md:gap-0">
                      
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-[15px] w-full md:w-auto">
                        
                        {/* Requested Group */}
                        <div className="flex flex-col gap-[5px] md:gap-[15px] w-full md:w-auto">
                          <div className="flex items-center gap-[10px]">
                            <span className="text-[14px] md:text-[16px] text-white">Requested</span>
                          </div>
                          <div className="px-[15px] py-[10px] bg-[rgba(40,76,204,0.2)] border-[2px] border-[#0038FF] rounded-[15px] w-fit">
                            <span className="text-[14px] md:text-[16px] text-white">
                              {trade.requested}
                            </span>
                          </div>
                        </div>

                        {/* Offering Group */}
                        <div className="flex flex-col gap-[5px] md:gap-[15px] w-full md:w-auto">
                          <span className="text-[14px] md:text-[16px] text-white">
                            In exchange for
                          </span>
                          <div className="px-[15px] py-[10px] bg-[rgba(144,110,255,0.2)] border-[2px] border-[#906EFF] rounded-[15px] w-fit">
                            <span className="text-[14px] md:text-[16px] text-white">
                              {trade.offering}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* XP Display */}
                      <div className="w-full md:w-auto flex justify-end md:block">
                         <span className="text-[16px] font-semibold text-[#906EFF]">
                            {trade.xp}
                         </span>
                      </div>
                    </div>

                    {/* Bottom Row - Due Date */}
                    <div className="flex justify-start md:justify-end items-center w-full">
                      <span className="text-[13px] font-normal text-white/60">
                        Due on {trade.deadline}
                      </span>
                    </div>

                    {/* Action Bar */}
                    <div className="flex justify-between items-center w-full gap-4">
                      
                      {/* Chevron Down */}
                      <div>
                        <Icon
                          icon="lucide:chevron-down"
                          className="w-[30px] h-[30px] text-white cursor-pointer"
                        />
                      </div>

                      {/* Action Buttons with Status */}
                      <div className="flex flex-nowrap justify-end items-center gap-2 md:gap-[15px]">
                        {/* Status Badge */}
                        <div
                          className={`flex justify-center items-center h-[38px] px-3 md:px-[25px] py-[13px] rounded-[15px] ${
                            trade.bothProofsApproved
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : trade.proofWorkflowStatus === "waiting_for_approval"
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          }`}
                        >
                          <span className="text-xs md:text-[16px] font-medium whitespace-nowrap">
                            {getTradeStatusText(trade)}
                          </span>
                        </div>

                        {showRateButton ? (
                          <button
                            className="h-[38px] px-3 md:px-[25px] py-[13px] flex justify-center items-center rounded-[15px] cursor-pointer transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTrade(trade);
                              setShowSuccessDialog(true);
                            }}
                            style={{
                              background: "#0038FF",
                              boxShadow: "0px 0px 15px rgba(40, 76, 204, 0.6)",
                            }}
                          >
                            <div className="flex items-center gap-[10px]">
                              <StarIconSmall />
                              <span className="text-[14px] md:text-[16px] text-white whitespace-nowrap">
                                Rate your trade
                              </span>
                            </div>
                          </button>
                        ) : (
                          <>
                            {/* Your Proof Button */}
                            <button
                              className="h-[38px] px-3 md:px-[25px] py-[13px] flex justify-center items-center rounded-[15px] cursor-pointer transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                proofButtonState.onClick &&
                                  proofButtonState.onClick();
                              }}
                              disabled={proofButtonState.disabled}
                              style={{
                                background: proofButtonState.disabled
                                  ? "#413663"
                                  : "#0038FF",
                                boxShadow: proofButtonState.disabled
                                  ? "none"
                                  : "0px 0px 15px rgba(40, 76, 204, 0.6)",
                                opacity: proofButtonState.disabled ? 0.6 : 1,
                                cursor: proofButtonState.disabled
                                  ? "not-allowed"
                                  : "pointer",
                              }}
                            >
                              <div className="flex items-center gap-[8px]">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="#fff"
                                    d="M6 20q-.825 0-1.412-.587T4 18v-2q0-.425.288-.712T5 15t.713.288T6 16v2h12v-2q0-.425.288-.712T19 15t.713.288T20 16v2q0 .825-.587 1.413T18 20zm5-12.15L9.125 9.725q-.3.3-.712.288T7.7 9.7q-.275-.3-.288-.7t.288-.7l3.6-3.6q.15-.15.325-.212T12 4.425t.375.063t.325.212l3.6 3.6q.3.3.288.7t-.288.7q-.3.3-.712.313t-.713-.288L13 7.85V15q0 .425-.288.713T12 16t-.712-.288T11 15z"
                                  />
                                </svg>
                                <span className="text-[14px] md:text-[16px] text-white truncate max-w-[100px] md:max-w-none">
                                  {proofButtonState.text}
                                </span>
                              </div>
                            </button>

                            {/* Partner Proof Button */}
                            <button
                              className="h-[38px] px-3 md:px-[25px] py-[13px] flex justify-center items-center rounded-[15px] transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                partnerProofButtonState.onClick &&
                                  partnerProofButtonState.onClick();
                              }}
                              disabled={partnerProofButtonState.disabled}
                              style={{
                                background: partnerProofButtonState.disabled
                                  ? "#413663"
                                  : "#0038FF",
                                boxShadow: partnerProofButtonState.disabled
                                  ? "none"
                                  : "0px 0px 15px rgba(40, 76, 204, 0.6)",
                                opacity: partnerProofButtonState.disabled
                                  ? 0.6
                                  : 1,
                                cursor: partnerProofButtonState.disabled
                                  ? "not-allowed"
                                  : "pointer",
                              }}
                            >
                              <div className="flex items-center gap-[8px]">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <path
                                    d="M5 21C4.45 21 3.97933 20.8043 3.588 20.413C3.19667 20.0217 3.00067 19.5507 3 19V5C3 4.45 3.196 3.97933 3.588 3.588C3.98 3.19667 4.45067 3.00067 5 3H19C19.55 3 20.021 3.196 20.413 3.588C20.805 3.98 21.0007 3.45067 21 5V19C21 19.55 20.8043 20.021 20.413 20.413C20.0217 20.805 19.5507 21.0007 19 21H5ZM6 17H18L14.25 12L11.25 16L9 13L6 17Z"
                                    fill="white"
                                  />
                                </svg>
                                <span className="text-[14px] md:text-[16px] text-white truncate max-w-[100px] md:max-w-none">
                                  {partnerProofButtonState.text}
                                </span>
                              </div>
                            </button>
                          </>
                        )}

                        <div className="h-[55px] flex items-center">
                          <button
                            className="flex justify-center items-center cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTrade(trade);
                              handleReviewDetails(trade);
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
            );
          })}
        </div>
      )}

      {/* Upload Proof Dialog */}
      {showUploadDialog && (
        <UploadProofDialog
          isOpen={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          onSubmit={handleProofSubmission}
          title={
            selectedTrade?.myProofSubmitted ? "View Your Proof" : "Your proof"
          }
          mode={selectedTrade?.myProofSubmitted ? "view" : "upload"}
          tradereq_id={selectedTrade?.tradereq_id}
          showSuccess={showProofSuccessDialog}
          successData={proofSuccessData}
          onSuccessClose={handleProofSuccessClose}
        />
      )}

      {/* View Proof Dialog */}
      {showViewProofDialog && (
        <ViewProofDialog
          isOpen={showViewProofDialog}
          onClose={() => {
            setShowViewProofDialog(false);
          }}
          onApprove={handleApproveProof}
          onReject={handleRejectProof}
          trade={selectedTrade}
        />
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <SuccessDialog
          isOpen={showSuccessDialog}
          onClose={() => setShowSuccessDialog(false)}
          trade={selectedTrade}
          onRatingSubmit={handleTradeRating}
        />
      )}

      {/* --- SUCCESS MODAL: Proof Rejected Notification --- */}
      {showSuccessModal && selectedTrade && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] px-4">
          <div
            className="w-full max-w-[618px] flex flex-col items-center justify-center p-6 md:p-[50px] relative"
            style={{
              background: "rgba(0, 0, 0, 0.4)",
              border: "2px solid #FF3838",
              boxShadow: "0px 4px 15px #E58D8D",
              backdropFilter: "blur(40px)",
              borderRadius: "15px",
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 md:top-[26px] md:right-[26px] text-white hover:text-gray-300"
            >
              <Icon icon="lucide:x" className="w-[15px] h-[15px]" />
            </button>

            {/* Content Wrapper */}
            <div className="flex flex-col items-center gap-5 md:gap-[30px] w-full md:w-[470px]">
              <h2 className="text-xl md:text-[25px] font-bold text-white text-center">
                Proof Rejected Successfully
              </h2>

              <p className="text-sm md:text-[16px] text-white/80 text-center">
                {selectedTrade.firstname} has been notified to resubmit their
                proof for the trade.
              </p>

              {/* Acknowledge Button (Styled like the red confirm button) */}
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-[168px] h-[40px] bg-[#FF3838] rounded-[15px] text-white text-[16px] shadow-[0px_0px_15px_#CC4242] hover:bg-[#CC4242] transition-colors"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Dialog */}
      <ActiveEvaluationDialog
        isOpen={showEvaluationDialog}
        onClose={() => setShowEvaluationDialog(false)}
        tradeData={{
          ...evaluationData,
        }}
      />

      {showReportDialog && selectedTrade && (
        <ReportDialog
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
          onSubmit={handleReportSubmit}
          reportedUser={selectedTrade.partnerUserId} //
          tradeId={selectedTrade.tradereq_id}
        />
      )}
    </div>
  );
}
