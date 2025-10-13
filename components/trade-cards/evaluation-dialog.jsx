"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { X, Check } from "lucide-react";
import Image from "next/image";
import ConfirmDialog from "./confirm-dialog";
import RejectDialog from "./reject-dialog";

const StarLogo = () => (
  <svg width="200" height="200" viewBox="0 0 162 181" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-[0px_4px_40px_#D78DE5]">
    <g filter="url(#filter0_d_2180_7319)">
      <path d="M81 136.5L90.0723 86.5L81 36.5L71.9277 86.5L81 136.5Z" fill="white" />
      <path d="M40.5917 55.6433L79.8637 94.3593L91.2485 78.4686L40.5917 55.6433Z" fill="#0038FF" />
      <path d="M121.388 117.215L82.1163 78.4991L70.7315 94.3898L121.388 117.215Z" fill="#0038FF" />
      <path d="M121.408 55.6433L82.1366 94.3593L70.7517 78.4686L121.408 55.6433Z" fill="#906EFF" />
      <path d="M40.612 117.215L79.8839 78.4991L91.2688 94.3898L40.612 117.215Z" fill="#906EFF" />
    </g>
    <defs>
      <filter id="filter0_d_2180_7319" x="-9" y="0.5" width="180" height="180" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dy="4" />
        <feGaussianBlur stdDeviation="20" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.841408 0 0 0 0 0.553254 0 0 0 0 0.899038 0 0 0 1 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2180_7319" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2180_7319" result="shape" />
      </filter>
    </defs>
  </svg>
);

export default function EvaluationDialog({ 
  isOpen,
  onClose,
  tradeData,
  onTradeUpdate,
  viewOnly = false 
}) {
  const { data: session } = useSession();

  const currentUserHasResponded = tradeData?.evaluationStatus?.current_user_response !== null;
  const userResponse = tradeData?.evaluationStatus?.current_user_response;

  // Default values
  const [evaluation, setEvaluation] = useState({
    tradeScore: 7,
    taskComplexity: 60,
    timeCommitment: 50,
    skillLevel: 70,
  });

  // Animated progress states
  const [progress, setProgress] = useState({
    tradeScore: 0,
    taskComplexity: 0,
    timeCommitment: 0,
    skillLevel: 0,
  });

  // State for confirmation dialogs
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // AI evaluation states
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState(null);
  const [hardcodedFeedback, setHardcodedFeedback] = useState('');

  // Helper function to get quality label
  const getQualityLabel = (score) => {
    if (score >= 8) return "Excellent trade";
    if (score >= 6) return "Great trade";
    if (score >= 4) return "Good trade";
    if (score >= 2) return "Okay trade";
    return "Poor trade";
  };

  // ✅ FETCH AI EVALUATION
  useEffect(() => {
    if (!isOpen || !tradeData?.tradereq_id) return;
    
    const fetchEvaluation = async () => {
      setIsEvaluating(true);
      setEvaluationError(null);
      
      try {
        // Check if evaluation already exists (TE2 - viewing saved evaluation)
        const checkResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ai/evaluation/${tradeData.tradereq_id}/`,
          {
            headers: {
              'Authorization': `Bearer ${session?.access}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        let evaluationData;
        
        if (checkResponse.ok) {
        // TE2: Evaluation exists, load saved data
        evaluationData = await checkResponse.json();
        console.log('✅ Loaded saved evaluation:', evaluationData);
      } else if (viewOnly) {
        // ❌ View-only mode but no evaluation found
        throw new Error('No evaluation found for this trade. Please contact support.');
      } else {
        // TE1: New evaluation, call AI endpoint (only in Pending Trades)
        console.log('🤖 Generating new AI evaluation...');
        const evalResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ai/evaluate-trade/`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tradereq_id: tradeData.tradereq_id
            }),
          }
        );
        
        if (!evalResponse.ok) {
          const errorText = await evalResponse.text();
          throw new Error(errorText || 'Failed to evaluate trade');
        }
        
        evaluationData = await evalResponse.json();
        console.log('✅ AI evaluation complete:', evaluationData);
      }
      
      // Update state with evaluation data
      setEvaluation({
        tradeScore: evaluationData.overall_score_out_of_10,
        taskComplexity: evaluationData.taskcomplexity,
        timeCommitment: evaluationData.timecommitment,
        skillLevel: evaluationData.skilllevel,
      });
      
      setHardcodedFeedback(evaluationData.evaluationdescription);
      
    } catch (error) {
      console.error('❌ Evaluation error:', error);
      setEvaluationError(error.message);
      
      // Only show fallback if NOT in view-only mode
      if (!viewOnly) {
        setEvaluation({
          tradeScore: 7,
          taskComplexity: 60,
          timeCommitment: 50,
          skillLevel: 70,
        });
        setHardcodedFeedback('Unable to generate evaluation. Please try again.');
      } else {
        // In view-only mode, show error state
        setHardcodedFeedback(error.message || 'Unable to load evaluation.');
      }
    } finally {
      setIsEvaluating(false);
    }
  };
  
  fetchEvaluation();
}, [isOpen, tradeData?.tradereq_id, session, viewOnly]);

  // Trigger staggered animations after evaluation updates
  useEffect(() => {
    if (isOpen && !isEvaluating) {
      // Reset progress first
      setProgress({
        tradeScore: 0,
        taskComplexity: 0,
        timeCommitment: 0,
        skillLevel: 0,
      });

      // Staggered animations
      setTimeout(() => {
        setProgress(prev => ({ ...prev, tradeScore: (evaluation.tradeScore / 10) * 100 }));
      }, 200);

      setTimeout(() => {
        setProgress(prev => ({ ...prev, taskComplexity: evaluation.taskComplexity }));
      }, 600);

      setTimeout(() => {
        setProgress(prev => ({ ...prev, timeCommitment: evaluation.timeCommitment }));
      }, 900);

      setTimeout(() => {
        setProgress(prev => ({ ...prev, skillLevel: evaluation.skillLevel }));
      }, 1200);
    }
  }, [evaluation, isOpen, isEvaluating]);

  // Handle close with proper event handling and state reset
  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowConfirmDialog(false);
    setShowRejectDialog(false);
    onClose();
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose(e);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Reset dialog states when main dialog closes
  useEffect(() => {
    if (!isOpen) {
      setShowConfirmDialog(false);
      setShowRejectDialog(false);
    }
  }, [isOpen]);

    const handleConfirmComplete = async () => {
    if (!tradeData?.tradereq_id) {
      console.error('No trade request ID found in tradeData:', tradeData);
      alert('Error: No trade request ID found');
      return;
    }

    console.log('=== CONFIRM TRADE DEBUG ===');
    console.log('Trade ID:', tradeData.tradereq_id);
    console.log('Full URL:', `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-requests/${tradeData.tradereq_id}/evaluation/confirm/`);
    console.log('Session token exists:', !!session?.access);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-requests/${tradeData.tradereq_id}/evaluation/confirm/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('Raw response text:', responseText);

      if (response.ok) {
        let result;
        try {
          result = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
          console.error('Failed to parse response JSON:', e);
          result = { message: 'Trade confirmed successfully' };
        }
        
        console.log('✅ Trade confirmed:', result);
        setShowConfirmDialog(false);
        onClose();
        if (onTradeUpdate) onTradeUpdate(tradeData.tradereq_id);
      } else {
        // Better error parsing
        let errorMessage = 'Unknown error occurred';
        
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorData.detail || errorData.message || JSON.stringify(errorData);
          } catch {
            errorMessage = responseText;
          }
        }
        
        console.error('❌ Confirm failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage
        });
        
        alert(`Failed to confirm trade: ${errorMessage}`);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('💥 Network error:', error);
      alert(`Network error: ${error.message}`);
      throw error;
    }
  };

  // Handle reject dialog completion  
  const handleRejectComplete = async () => {
    if (!tradeData?.tradereq_id) {
      console.error('No trade request ID found in tradeData:', tradeData);
      throw new Error('No trade request ID found');
    }

    console.log('=== REJECT COMPLETE DEBUG ===');
    console.log('Trade ID:', tradeData.tradereq_id);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-requests/${tradeData.tradereq_id}/evaluation/reject/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Reject response status:', response.status);

      const responseText = await response.text();
      console.log('Reject raw response:', responseText);

      if (response.ok) {
        const result = JSON.parse(responseText);
        console.log('Trade rejected successfully:', result);
        setShowRejectDialog(false);
        onClose();
        if (onTradeUpdate) onTradeUpdate();
      } else {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText };
        }
        console.error('Error rejecting trade:', errorData);
        alert(`Error: ${errorData.error || 'Unknown error occurred'}`);
        throw new Error(errorData.error || 'Failed to reject trade');
      }
    } catch (error) {
      console.error('Network error rejecting trade:', error);
      alert('Network error. Please check your connection and try again.');
      throw error;
    }
  };

  if (!isOpen) return null;

  // Default data if not provided
  const data = tradeData || {
    requestTitle: "Nutrition Coaching for Weight Loss",
    offerTitle: "Yoga Instruction",
    feedback: "Loading evaluation..."
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleBackdropClick}
      ></div>

      {/* Dialog */}
      <div className="relative w-[940px] h-[790px] flex flex-col justify-center items-center p-[98.5px_74px] bg-black/10 shadow-[0px_4px_15px_#D78DE5] backdrop-blur-[50px] rounded-[15px] z-50 isolate">
        {/* Close button */}
        <button
          className="absolute top-[35px] right-[35px] text-white cursor-pointer flex items-center justify-center w-[30px] h-[30px] transition-all duration-200 hover:bg-white/10 hover:text-[#D78DE5] rounded-full z-[100]"
          onClick={handleClose}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Close dialog"
          type="button"
        >
          <X className="w-[20px] h-[20px]" />
        </button>

        {/* Background glow effects */}
        <div className="absolute w-[942px] h-[218px] left-[-1px] top-0 z-[1]">
          <div className="absolute w-[421px] h-[218px] left-[calc(50%-421px/2-260.5px)] top-0 bg-[#906EFF] blur-[175px]"></div>
          <div className="absolute w-[421px] h-[218px] left-[calc(50%-421px/2+260.5px)] top-0 bg-[#0038FF] blur-[175px]"></div>
          <div className="absolute w-[225px] h-[105.09px] left-[calc(50%-225px/2+283.5px)] top-[83.85px] bg-[#906EFF] blur-[60px]"></div>
          <div className="absolute w-[225px] h-[105.09px] left-[calc(50%-225px/2-283.5px)] top-[83.85px] bg-[#0038FF] blur-[60px]"></div>
        </div>

        {/* ✅ LOADING STATE */}
        {isEvaluating && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-[200] rounded-[15px]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-[#D78DE5] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white text-lg">Evaluating trade with AI...</p>
            </div>
          </div>
        )}

        {/* Content container */}
        <div className="flex flex-col justify-center items-center gap-[40px] w-[792px] h-[613px] z-[2]">
          {/* Header section */}
          <div className="flex flex-col items-center gap-[25px] w-[792px] h-[150px]">
            <div className="flex flex-row justify-between items-center w-[792px] h-[150px]">
              {/* Left side */}
              <div className="flex flex-col items-start justify-between w-[300px] h-full">
                <h3 className="w-[300px] font-[700] text-[25px] leading-[120%] text-white">
                  {data.requestTitle || tradeData?.needs || "Loading..."}
                </h3>
                <p className="w-[300px] text-[16px] font-[400] leading-[120%] text-white">
                  What you'll provide
                </p>
              </div>

              {/* Center - Logo */}
              <div className="flex items-center justify-center w-[200px] h-[200px]">
                <StarLogo />
              </div>

              {/* Right side */}
              <div className="flex flex-col items-end justify-between w-[300px] h-full">
                <h3 className="w-[300px] font-[700] text-[25px] leading-[120%] text-right text-white">
                  {data.offerTitle || tradeData?.offers || "Loading..."}
                </h3>
                <p className="w-[300px] text-[16px] font-[400] leading-[120%] text-right text-white">
                  What you'll get in return
                </p>
              </div>
            </div>
          </div>

          {/* Trade assessment */}
          <div className="flex flex-col items-center gap-[15px] w-[300px] h-[83px]">
            <div className="relative flex items-center w-[300px] h-[20px] p-[2px] bg-white shadow-[0px_5px_19px_rgba(0,0,0,0.15)] rounded-[32px] overflow-hidden">
              <div
                className="h-full rounded-[30px] z-[2] transition-all duration-700 ease-out relative"
                style={{
                  width: `calc(${progress.tradeScore}% - 4px)`,
                  background: "linear-gradient(to right, #FB9696, #D78DE5, #7E59F8, #284CCC, #6DDFFF)",
                  boxShadow: progress.tradeScore > 0 ? "0px 0px 20px rgba(126, 89, 248, 0.4)" : "none"
                }}
              >
                <div
                  className="absolute inset-0 rounded-[30px] opacity-60"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)"
                  }}
                />

                {progress.tradeScore > 10 && (
                  <div className="absolute inset-0 rounded-[30px] overflow-hidden">
                    <div
                      className="absolute top-0 left-[-100%] w-full h-full opacity-40"
                      style={{
                        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)",
                        animation: "shimmer 3s infinite ease-in-out"
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="absolute top-[2px] left-[2px] right-[2px] bottom-[2px] bg-white opacity-35 z-[1] rounded-[30px]"></div>
            </div>

            <div className="flex flex-col items-center gap-[5px] w-[110px] h-[48px]">
              <h4 className="font-[700] text-[20px] text-center text-white">
                {getQualityLabel(evaluation.tradeScore)}
              </h4>
              <p className="text-[16px] font-[400] text-center text-white">
                {evaluation.tradeScore} out of 10
              </p>
            </div>
          </div>

          {/* Assessment metrics */}
          <div className="flex flex-col items-end gap-[15px] w-[457px]">
            {/* Task complexity */}
            <div className="flex items-center gap-[20px] w-full">
              <span className="w-[140px] text-[16px] text-right text-white">
                Task complexity
              </span>

              <div className="relative flex items-center w-[300px] h-[20px] p-[2px] bg-white shadow-[0px_5px_19px_rgba(0,0,0,0.15)] rounded-[32px] overflow-hidden">
                <div
                  className="h-full rounded-[30px] transition-all duration-800 ease-out relative"
                  style={{
                    width: `calc(${progress.taskComplexity}% - 4px)`,
                    background: "linear-gradient(to right, #FB9696, #FA6666)",
                    boxShadow: progress.taskComplexity > 0 ? "0px 0px 15px rgba(251, 150, 150, 0.5)" : "none"
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-[30px] opacity-60"
                    style={{
                      background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)"
                    }}
                  />

                  {progress.taskComplexity > 10 && (
                    <div className="absolute inset-0 rounded-[30px] overflow-hidden">
                      <div
                        className="absolute top-0 left-[-100%] w-full h-full opacity-50"
                        style={{
                          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)",
                          animation: "shimmer 2s infinite ease-in-out"
                        }}
                      />
                    </div>
                  )}

                  {progress.taskComplexity > 5 && (
                    <div
                      className="absolute top-1/2 right-0 w-[6px] h-[6px] rounded-full opacity-90"
                      style={{
                        background: "#FFFFFF",
                        boxShadow: "0px 0px 8px rgba(255,255,255,0.9)",
                        transform: "translateY(-50%)",
                        animation: "pulse 1.5s infinite ease-in-out"
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Time commitment */}
            <div className="flex items-center gap-[20px] w-full">
              <span className="w-[140px] text-[16px] text-right text-white">
                Time commitment
              </span>

              <div className="relative flex items-center w-[300px] h-[20px] p-[2px] bg-white shadow-[0px_5px_19px_rgba(0,0,0,0.15)] rounded-[32px] overflow-hidden">
                <div
                  className="h-full rounded-[30px] transition-all duration-900 ease-out relative"
                  style={{
                    width: `calc(${progress.timeCommitment}% - 4px)`,
                    background: "linear-gradient(to right, #D78DE5, #C865DC)",
                    boxShadow: progress.timeCommitment > 0 ? "0px 0px 15px rgba(215, 141, 229, 0.5)" : "none"
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-[30px] opacity-60"
                    style={{
                      background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)"
                    }}
                  />

                  {progress.timeCommitment > 10 && (
                    <div className="absolute inset-0 rounded-[30px] overflow-hidden">
                      <div
                        className="absolute top-0 left-[-100%] w-full h-full opacity-50"
                        style={{
                          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)",
                          animation: "shimmer 2.2s infinite ease-in-out",
                          animationDelay: "0.3s"
                        }}
                      />
                    </div>
                  )}

                  {progress.timeCommitment > 5 && (
                    <div
                      className="absolute top-1/2 right-0 w-[6px] h-[6px] rounded-full opacity-90"
                      style={{
                        background: "#FFFFFF",
                        boxShadow: "0px 0px 8px rgba(255,255,255,0.9)",
                        transform: "translateY(-50%)",
                        animation: "pulse 1.8s infinite ease-in-out"
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Skill level */}
            <div className="flex items-center gap-[20px] w-full">
              <span className="w-[140px] text-[16px] text-right text-white">
                Skill level
              </span>

              <div className="relative flex items-center w-[300px] h-[20px] p-[2px] bg-white shadow-[0px_5px_19px_rgba(0,0,0,0.15)] rounded-[32px] overflow-hidden">
                <div
                  className="h-full rounded-[30px] transition-all duration-1000 ease-out relative"
                  style={{
                    width: `calc(${progress.skillLevel}% - 4px)`,
                    background: "linear-gradient(to right, #6DDFFF, #38D3FF)",
                    boxShadow: progress.skillLevel > 0 ? "0px 0px 15px rgba(109, 223, 255, 0.5)" : "none"
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-[30px] opacity-60"
                    style={{
                      background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)"
                    }}
                  />

                  {progress.skillLevel > 10 && (
                    <div className="absolute inset-0 rounded-[30px] overflow-hidden">
                      <div
                        className="absolute top-0 left-[-100%] w-full h-full opacity-50"
                        style={{
                          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)",
                          animation: "shimmer 2.5s infinite ease-in-out",
                          animationDelay: "0.6s"
                        }}
                      />
                    </div>
                  )}

                  {progress.skillLevel > 5 && (
                    <div
                      className="absolute top-1/2 right-0 w-[6px] h-[6px] rounded-full opacity-90"
                      style={{
                        background: "#FFFFFF",
                        boxShadow: "0px 0px 8px rgba(255,255,255,0.9)",
                        transform: "translateY(-50%)",
                        animation: "pulse 2s infinite ease-in-out"
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Feedback section */}
          <div className="flex flex-col items-start gap-[15px] w-[792px] h-[110px]">
            <div className="flex flex-row items-center gap-[15px] w-[792px] h-[19px]">
              <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.57483 0.5C8.08409 4.35956 11.1404 7.41579 15 7.92506V8.07483C11.1404 8.58409 8.08409 11.6404 7.57483 15.5H7.42517C6.91591 11.6404 3.85956 8.58409 0 8.07483V7.92506C3.85956 7.41579 6.91591 4.35956 7.42517 0.5H7.57483Z" fill="#D9D9D9" />
              </svg>
              <span className="w-[122px] h-[19px] italic text-[16px] leading-[120%] text-white">
                What we think...
              </span>
            </div>
            <p className="w-[792px] h-[76px] text-[16px] leading-[120%] text-white">
              {hardcodedFeedback || 'Evaluating trade fairness...'}
            </p>
          </div>

          {/* Action buttons */}
          {currentUserHasResponded && (
            <div className="absolute top-[-40px] left-0 right-0 text-center">
              <span className="text-[14px] text-[#6DDFFF]">
                You have already {userResponse === "CONFIRMED" ? "confirmed" : "rejected"} this evaluation
              </span>
            </div>
          )}

          <div className="flex flex-row justify-center items-center gap-[40px] w-[792px] h-[70px] relative isolate mb-[35px]">
            <span className="absolute w-[116px] h-[24px] left-[168px] top-[23px] font-medium text-[20px] leading-[120%] text-white z-0">
              Reject trade
            </span>

            {/* Reject button */}
            <button
              className={`flex flex-row justify-center items-center p-[16px] gap-[10px] w-[70px] h-[70px] filter drop-shadow-[0px_0px_15px_#284CCC] z-[1] transition-all ${currentUserHasResponded
                  ? 'opacity-40 cursor-not-allowed'
                  : 'cursor-pointer hover:scale-105'
                }`}
              onClick={(e) => {
                e.stopPropagation();
                if (!currentUserHasResponded) {
                  setShowRejectDialog(true);
                }
              }}
              disabled={currentUserHasResponded}
              type="button"
            >
              <div className="absolute left-0 right-0 top-0 bottom-0 bg-[#0038FF] rounded-[100px] z-0"></div>
              <X className="w-[25px] h-[25px] text-white z-[1]" />
            </button>

            {/* Confirm button */}
            <button
              className={`flex flex-row justify-center items-center p-[16px] gap-[10px] w-[70px] h-[70px] filter drop-shadow-[0px_0px_15px_#284CCC] z-[2] transition-all ${currentUserHasResponded
                  ? 'opacity-40 cursor-not-allowed'
                  : 'cursor-pointer hover:scale-105'
                }`}
              onClick={(e) => {
                e.stopPropagation();
                if (!currentUserHasResponded) {
                  setShowConfirmDialog(true);
                }
              }}
              disabled={currentUserHasResponded}
              type="button"
            >
              <div className="absolute left-0 right-0 top-0 bottom-0 bg-[#0038FF] rounded-[100px] z-0"></div>
              <Check className="w-[35px] h-[25px] text-white rounded-[2px] z-[1]" />
            </button>
            <span className="absolute w-[133px] h-[24px] left-[526px] top-[23px] font-medium text-[20px] leading-[120%] text-white z-[3]">
              Confirm trade
            </span>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="absolute w-[847px] h-[19px] left-[calc(50%-847px/2+4.5px)] top-[737px] text-[12px] leading-[120%] text-center text-white/80 opacity-60 z-[3]">
          This evaluation is based on AI analysis and should serve as a guide for users.
        </p>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmComplete}
      />

      {/* Reject Dialog */}
      <RejectDialog
        isOpen={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onReject={handleRejectComplete}
      />

      {/* Add keyframes for animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        @keyframes pulse {
          0%, 100% { 
            opacity: 0.6; 
            transform: translateY(-50%) scale(0.8);
          }
          50% { 
            opacity: 1; 
            transform: translateY(-50%) scale(1.3);
          }
        }
      `}</style>
    </div>
  );
}