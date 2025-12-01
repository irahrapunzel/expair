"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Icon } from "@iconify/react";
import XpGainedDialog from "./xp-gained-dialog";

export default function SuccessDialog({ isOpen, onClose, trade }) {
  const { data: session } = useSession();
  const [feedback, setFeedback] = useState("");
  const [showRating, setShowRating] = useState(false);
  const [showXpGained, setShowXpGained] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratingStatus, setRatingStatus] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [error, setError] = useState("");

  const maxChars = 500;

  // Fetch rating status when dialog opens
  useEffect(() => {
    if (isOpen && trade?.tradereq_id) {
      fetchRatingStatus();
    }
  }, [isOpen, trade?.tradereq_id]);

  const fetchRatingStatus = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-rating/status/${trade.tradereq_id}/`,
        {
          headers: {
            Authorization: `Bearer ${session?.access}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setRatingStatus(data);
        
        // If user already rated, skip directly to XP display
        if (data.current_user_rated) {
          setSubmissionResult({
            xp_awarded: 0, 
            new_total_xp: 0,
            new_level: 0,
          });
          setShowXpGained(true);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch rating status');
      }
    } catch (error) {
      console.error('Error fetching rating status:', error);
      setError('Failed to connect to server');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      setError("Please provide feedback about your trade experience");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      console.log("🤖 Calling AI sentiment analysis and rating submission...");
      
      const sentimentResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ai/submit-rating/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tradereq_id: trade.tradereq_id,
            review_text: feedback
          })
        }
      );

      if (!sentimentResponse.ok) {
        const errorData = await sentimentResponse.json();
        throw new Error(errorData.error || "Failed to submit rating/analyze sentiment");
      }

      const sentimentData = await sentimentResponse.json();
      console.log("✅ Submission Result (includes XP/Level from backend):", sentimentData);

      setSubmissionResult({
        user_rating_submitted: sentimentData.stars,
        both_users_rated: sentimentData.both_users_rated, 
        sentiment: sentimentData.sentiment,
        confidence: sentimentData.confidence,
        partner_name: sentimentData.partner_updated.username,
        partner_new_rating: sentimentData.partner_updated.new_avg_stars,
        partner_total_ratings: sentimentData.partner_updated.new_rating_count,
        xp_awarded: sentimentData.xp_awarded, 
        new_total_xp: sentimentData.new_total_xp, 
        new_level: sentimentData.new_level, 
      });

      setShowRating(true);

    } catch (error) {
      console.error("❌ Rating submission error:", error);
      setError(error.message || "Failed to submit rating. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    setShowRating(false);
    setShowXpGained(true);
  };

  const handleXpGainedClose = () => {
    setShowXpGained(false);
    setFeedback("");
    setError("");
    setSubmissionResult(null);
    onClose();
  };

  const stars = Array(5).fill(0);
  const aiRating = submissionResult?.user_rating_submitted || 0;

  if (!isOpen) return null;

  return (
    <>
      {showXpGained ? (
        <XpGainedDialog
          isOpen={showXpGained}
          onClose={handleXpGainedClose}
          xpGained={submissionResult?.xp_awarded || 0}  
          level={submissionResult?.new_level}           
          currentXp={submissionResult?.new_total_xp}   
          tradereqId={trade?.tradereq_id}
          authToken={session?.access}
          apiBase={process.env.NEXT_PUBLIC_BACKEND_URL}
        />
      ) : (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          {!showRating ? (
            // First phase - Feedback Input
            <div
              // ✅ Responsive Width & Padding
              className="w-[95%] max-w-[650px] flex flex-col items-center justify-center p-6 md:p-[40px] relative"
              style={{
                background: "rgba(0, 0, 0, 0.05)",
                border: "2px solid #0038FF",
                boxShadow: "0px 4px 15px #D78DE5",
                backdropFilter: "blur(30px)",
                borderRadius: "15px",
              }}
            >
              {/* Background gradients - Hidden on mobile */}
              <div className="hidden md:block absolute top-[-50px] left-[-50px] w-[150px] h-[150px] rounded-full bg-[#0038FF]/15 blur-[40px]"></div>
              <div className="hidden md:block absolute bottom-[-40px] right-[-40px] w-[120px] h-[120px] rounded-full bg-[#906EFF]/15 blur-[40px]"></div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 md:top-[30px] md:right-[30px] text-white hover:text-gray-300 z-20"
              >
                <Icon icon="lucide:x" className="w-[15px] h-[15px]" />
              </button>

              <div className="flex flex-col items-center gap-[20px] md:gap-[30px] w-full relative z-10">
                {/* Success Icon */}
                <div className="w-[60px] h-[60px] md:w-[70px] md:h-[70px] rounded-full bg-[#0038FF] flex items-center justify-center">
                  <Icon icon="lucide:check" className="w-[30px] h-[30px] md:w-[40px] md:h-[40px] text-white" />
                </div>

                {/* Title */}
                <h2 className="text-[22px] md:text-[25px] font-bold text-white text-center">
                  Successful trade!
                </h2>

                {/* Trade details - Stack on mobile */}
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-white text-center w-full max-w-[500px]">
                  {/* Left Box: Service Request */}
                  <div className="w-full sm:flex-1 min-w-0 px-3 py-2 border border-white/10 rounded-lg sm:border-none">
                    <span 
                      className="text-[14px] truncate block" 
                      title={trade?.requested || trade?.reqname || "Service Request"}
                    >
                      {trade?.requested || trade?.reqname || "Service Request"}
                    </span>
                  </div>

                  <Icon icon="lucide:x" className="w-5 h-5 flex-shrink-0 rotate-90 sm:rotate-0" />

                  {/* Right Box: Skill Exchange */}
                  <div className="w-full sm:flex-1 min-w-0 px-3 py-2 border border-white/10 rounded-lg sm:border-none">
                    <span 
                      className="text-[14px] truncate block"
                      title={trade?.offering || trade?.exchange || "Skill Exchange"}
                    >
                      {trade?.offering || trade?.exchange || "Skill Exchange"}
                    </span>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="w-full p-3 bg-red-500/20 border border-red-500 rounded-[15px] text-red-300 text-sm">
                    {error}
                  </div>
                )}

                {/* Feedback Section */}
                <div className="w-full">
                  <p className="text-white text-center mb-4 text-sm md:text-base">
                    Tell us more about your experience
                  </p>
                  <div className="relative">
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="How did the trade go? Our AI will analyze your feedback to generate an objective rating."
                      maxLength={maxChars}
                      className="w-full h-[120px] bg-[#120A2A] border border-[rgba(255,255,255,0.60)] rounded-[15px] text-white p-4 focus:outline-none focus:ring-2 focus:ring-[#0038FF] resize-none text-sm md:text-base"
                      disabled={isSubmitting}
                    />
                    <span className="absolute bottom-2 right-3 text-xs text-gray-400">
                      {feedback.length}/{maxChars}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Your rating will be generated automatically based on AI sentiment analysis
                  </p>
                </div>

                {/* Submit Button - Full width on mobile */}
                <button
                  onClick={handleSubmit}
                  disabled={!feedback.trim() || isSubmitting}
                  className="w-full sm:w-[172px] h-[40px] rounded-[15px] text-[16px] sm:self-end 
                            shadow-[0px_0px_15px_#284CCC] bg-[#0038FF] text-white 
                            disabled:opacity-50 disabled:cursor-not-allowed
                            flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <Icon icon="lucide:loader-2" className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </div>
          ) : (
            // Second phase - AI-Generated Rating Display
            <div
              // ✅ Responsive Width & Padding
              className="w-[95%] max-w-[650px] flex flex-col items-center justify-center p-6 md:p-[40px] relative"
              style={{
                background: "rgba(0, 0, 0, 0.05)",
                border: "2px solid #0038FF",
                boxShadow: "0px 4px 15px #D78DE5",
                backdropFilter: "blur(30px)",
                borderRadius: "15px",
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 md:top-[30px] md:right-[30px] text-white hover:text-gray-300 transition z-20"
              >
                <Icon icon="lucide:x" className="w-[15px] h-[15px]" />
              </button>

              {/* Subtle background glow - Hidden on mobile */}
              <div className="hidden md:block absolute top-[-40px] left-[-40px] w-[120px] h-[120px] rounded-full bg-[#0038FF]/15 blur-[35px]"></div>
              <div className="hidden md:block absolute bottom-[-40px] right-[-40px] w-[100px] h-[100px] rounded-full bg-[#906EFF]/15 blur-[35px]"></div>

              <div className="flex flex-col items-center gap-[20px] md:gap-[30px] w-full relative z-10">
                {/* success icon */}
                <div className="w-[60px] h-[60px] md:w-[70px] md:h-[70px] rounded-full bg-[#0038FF] flex items-center justify-center">
                  <Icon icon="lucide:check" className="w-[30px] h-[30px] md:w-[40px] md:h-[40px] text-white" />
                </div>

                {/* Title */}
                <h2 className="text-[22px] md:text-[25px] font-bold text-white text-center">
                  Rating Generated!
                </h2>

                {/* Trade details - Stack on mobile */}
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-white text-center w-full max-w-[500px]">
                  {/* Left Box */}
                  <div className="w-full sm:flex-1 min-w-0 px-3 py-2 border border-white/10 rounded-lg sm:border-none">
                    <span 
                      className="text-[14px] truncate block" 
                      title={trade?.requested || trade?.reqname || "Service Request"}
                    >
                      {trade?.requested || trade?.reqname || "Service Request"}
                    </span>
                  </div>

                  <Icon icon="lucide:x" className="w-5 h-5 flex-shrink-0 rotate-90 sm:rotate-0" />

                  {/* Right Box */}
                  <div className="w-full sm:flex-1 min-w-0 px-3 py-2 border border-white/10 rounded-lg sm:border-none">
                    <span 
                      className="text-[14px] truncate block"
                      title={trade?.offering || trade?.exchange || "Skill Exchange"}
                    >
                      {trade?.offering || trade?.exchange || "Skill Exchange"}
                    </span>
                  </div>
                </div>

                {/* AI-Generated Star Rating Display */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-3">
                    {stars.map((_, index) => (
                      <div key={index} className="relative w-[30px] h-[30px] cursor-default">
                        {index < aiRating ? (
                          <svg
                            width="30"
                            height="30"
                            viewBox="0 0 30 30"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M15 2.5L18.09 11.26L27.5 12.29L21.25 18.14L22.82 27.5L15 22.77L7.18 27.5L8.75 18.14L2.5 12.29L11.91 11.26L15 2.5Z"
                              fill="url(#paint0_linear_1277_5550)"
                            />
                            <defs>
                              <linearGradient
                                id="paint0_linear_1277_5550"
                                x1="0"
                                y1="15"
                                x2="30"
                                y2="15"
                                gradientUnits="userSpaceOnUse"
                              >
                                <stop stopColor="#FB9696" />
                                <stop offset="0.25" stopColor="#D78DE5" />
                                <stop offset="0.5" stopColor="#7E59F8" />
                                <stop offset="0.75" stopColor="#284CCC" />
                                <stop offset="1" stopColor="#6DDFFF" />
                              </linearGradient>
                            </defs>
                          </svg>
                        ) : (
                          <svg
                            width="30"
                            height="30"
                            viewBox="0 0 30 30"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M15 2.5L18.09 11.26L27.5 12.29L21.25 18.14L22.82 27.5L15 22.77L7.18 27.5L8.75 18.14L2.5 12.29L11.91 11.26L15 2.5Z"
                              fill="#1A0F3E"
                            />
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="text-center text-white">
                    <p className="text-xl font-bold bg-gradient-to-r from-[#D78DE5] to-[#6DDFFF] bg-clip-text text-transparent">
                      {aiRating} out of 5
                    </p>
                    <p className="text-lg font-medium text-white/90">
                      AI-Generated Rating
                    </p>
                  </div>

                  <div className="text-white/60 text-sm text-center mt-2 max-w-[400px]">
                    <p>This rating was generated through AI sentiment analysis of your feedback.</p>
                    {submissionResult?.both_users_rated ? (
                      <p className="text-green-400 mt-1">
                        ✓ Trade completed — both users have submitted ratings!
                      </p>
                    ) : (
                      <p className="text-yellow-400 mt-1">
                        Waiting for your trade partner to submit their rating...
                      </p>
                    )}
                  </div>
                </div>

                {/* Continue Button - Full width on mobile */}
                <button
                  onClick={handleContinue}
                  className="w-full sm:w-[172px] h-[40px] bg-[#0038FF] rounded-[15px] text-white text-[16px] 
                            shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors 
                            flex items-center justify-center gap-2"
                >
                  Continue
                  <Icon icon="lucide:arrow-right" className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}