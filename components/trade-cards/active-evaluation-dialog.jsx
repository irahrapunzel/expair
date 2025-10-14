"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useSession } from "next-auth/react";

const StarLogo = () => (
  <svg width="100" height="100" viewBox="0 0 162 181" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-[0px_4px_40px_#D78DE5]">
    <g filter="url(#filter0_d_2180_7319)">
      <path d="M81 136.5L90.0723 86.5L81 36.5L71.9277 86.5L81 136.5Z" fill="white"/>
      <path d="M40.5917 55.6433L79.8637 94.3593L91.2485 78.4686L40.5917 55.6433Z" fill="#0038FF"/>
      <path d="M121.388 117.215L82.1163 78.4991L70.7315 94.3898L121.388 117.215Z" fill="#0038FF"/>
      <path d="M121.408 55.6433L82.1366 94.3593L70.7517 78.4686L121.408 55.6433Z" fill="#906EFF"/>
      <path d="M40.612 117.215L79.8839 78.4991L91.2688 94.3898L40.612 117.215Z" fill="#906EFF"/>
    </g>
    <defs>
      <filter id="filter0_d_2180_7319" x="-9" y="0.5" width="180" height="180" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="4"/>
        <feGaussianBlur stdDeviation="20"/>
        <feComposite in2="hardAlpha" operator="out"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.841408 0 0 0 0 0.553254 0 0 0 0 0.899038 0 0 0 1 0"/>
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2180_7319"/>
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2180_7319" result="shape"/>
      </filter>
    </defs>
  </svg>
);

export default function ActiveEvaluationDialog({ isOpen, onClose, tradeData }) {
  const { data: session } = useSession();

  // Default empty state
  const [evaluation, setEvaluation] = useState({
    tradeScore: 0,
    taskComplexity: 0,
    timeCommitment: 0,
    skillLevel: 0,
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Animated progress states
  const [progress, setProgress] = useState({
    tradeScore: 0,
    taskComplexity: 0,
    timeCommitment: 0,
    skillLevel: 0,
  });

  useEffect(() => {
    if (!isOpen || !tradeData?.tradereq_id) return;

    const fetchWithRetry = async (url, opts = {}, retries = 3, delayMs = 800) => {
      for (let i = 0; i < retries; i += 1) {
        try {
          const r = await fetch(url, opts);
          const txt = await r.text();
          // try parse JSON safely
          let json = null;
          try { json = txt ? JSON.parse(txt) : null; } catch (e) { json = null; }

          console.log(`[eval] GET ${url} attempt ${i + 1} status=${r.status}`, { ok: r.ok, text: txt, json });
          if (r.ok) return json;
          // if 404 return null quickly (caller may decide to create)
          if (r.status === 404) return { __not_found: true };
        } catch (err) {
          console.warn(`[eval] fetch attempt ${i + 1} failed:`, err);
        }
        // delay before next try
        await new Promise(res => setTimeout(res, delayMs));
      }
      throw new Error("Failed to fetch after retries");
    };

    const fetchEvaluation = async () => {
      setLoading(true);
      setError(null);

      // reset visible evaluation while loading
      setEvaluation({
        tradeScore: 0,
        taskComplexity: 0,
        timeCommitment: 0,
        skillLevel: 0,
        description: "",
      });

      const base = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      const url = `${base}/api/ai/evaluation/${tradeData.tradereq_id}/`;
      const token = session?.access || session?.accessToken || null;

      try {
        console.log("🔍 evaluation url:", url, "tokenPresent:", !!token);

        const headers = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        // Try GET (with retries)
        let data = await fetchWithRetry(url, { headers }, 1, 200);

        // If server responded 404 marker -> try to generate
        if (data && data.__not_found) {
          console.log("⚠️ evaluation not found, POSTing to generate");
          const genUrl = `${base}/api/ai/evaluate/`;
          const genRes = await fetch(genUrl, {
            method: "POST",
            headers,
            body: JSON.stringify({ tradereq_id: tradeData.tradereq_id }),
          });

          const genText = await genRes.text();
          let genJson = null;
          try { genJson = genText ? JSON.parse(genText) : null; } catch(e) { genJson = null; }

          console.log("[eval] POST generate:", { status: genRes.status, ok: genRes.ok, text: genText, json: genJson });

          if (!genRes.ok) {
            // if POST failed, surface backend text
            throw new Error(`Generate failed: ${genText || genRes.status}`);
          }

          // sometimes generation is async; retry GET a few times to read saved DB row
          let attempts = 0;
          const maxAttempts = 4;
          const retryDelay = 700;
          let got = null;
          while (attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, retryDelay));
            const tryGet = await fetchWithRetry(url, { headers }, 1, 200).catch(() => null);
            if (tryGet && !tryGet.__not_found) { got = tryGet; break; }
            attempts += 1;
            console.log(`[eval] retry GET after generate attempt ${attempts}`);
          }
          if (!got) {
            // fallback to using POST response if it included evaluation payload
            data = genJson || null;
          } else {
            data = got;
          }
        }

        // If initial GET returned the evaluation directly it will be in data
        if (!data) {
          throw new Error("No evaluation data returned");
        }

        console.log("[eval] final evaluation payload:", data);

        // Use DB-provided fields directly (no math)
        const tradeScore = Number(data.overall_score_out_of_10 ?? 0);
        const taskComplexity = Number(data.taskcomplexity ?? data.task_complexity ?? 0);
        const timeCommitment = Number(data.timecommitment ?? data.time_commitment ?? 0);
        const skillLevel = Number(data.skilllevel ?? data.skill_level ?? 0);
        const description = data.evaluationdescription ?? data.description ?? "";

        setEvaluation({
          tradeScore: isNaN(tradeScore) ? 0 : tradeScore,
          taskComplexity: isNaN(taskComplexity) ? 0 : taskComplexity,
          timeCommitment: isNaN(timeCommitment) ? 0 : timeCommitment,
          skillLevel: isNaN(skillLevel) ? 0 : skillLevel,
          description: description || "",
        });
      } catch (err) {
        console.error("❌ Evaluation fetch error:", err);
        setError(err.message || "Failed to load evaluation");
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [isOpen, tradeData?.tradereq_id, session?.access, session?.accessToken]);

  // Trigger staggered animations
  useEffect(() => {
    if (isOpen && !loading && evaluation.tradeScore > 0) {
      // Reset progress
      setProgress({
        tradeScore: 0,
        taskComplexity: 0,
        timeCommitment: 0,
        skillLevel: 0,
      });

      // Animate each metric
      setTimeout(() => {
        setProgress(prev => ({ 
          ...prev, 
          tradeScore: (evaluation.tradeScore / 10) * 100  // Convert 0-10 to 0-100% for progress bar
        }));
      }, 200);

      setTimeout(() => {
        setProgress(prev => ({ 
          ...prev, 
          taskComplexity: evaluation.taskComplexity  // Already 0-100
        }));
      }, 600);

      setTimeout(() => {
        setProgress(prev => ({ 
          ...prev, 
          timeCommitment: evaluation.timeCommitment  // Already 0-100
        }));
      }, 900);

      setTimeout(() => {
        setProgress(prev => ({ 
          ...prev, 
          skillLevel: evaluation.skillLevel  // Already 0-100
        }));
      }, 1200);
    }
  }, [evaluation, isOpen, loading]);

  // Handle close
  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
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
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const data = {
    requestTitle: tradeData?.reqname || tradeData?.requestTitle || "Trade Request",
    offerTitle: tradeData?.exchange || tradeData?.offerTitle || "Trade Offer",
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleBackdropClick}
      ></div>

      <div className="relative w-[940px] h-[790px] flex flex-col justify-center items-center p-[80px_60px] bg-black/10 shadow-[0px_4px_15px_#D78DE5] backdrop-blur-[50px] rounded-[15px] z-60 isolate">
        <button
          className="absolute top-[35px] right-[35px] text-white cursor-pointer flex items-center justify-center w-[30px] h-[30px] transition-all duration-200 hover:bg-white/10 hover:text-[#D78DE5] rounded-full z-[100]"
          onClick={handleClose}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Close dialog"
        >
          <X className="w-[15px] h-[15px]" />
        </button>

        <div className="absolute w-[942px] h-[218px] left-[-1px] top-0 z-[1]">
          <div className="absolute w-[421px] h-[218px] left-[calc(50%-421px/2-260.5px)] top-0 bg-[#906EFF] blur-[175px]"></div>
          <div className="absolute w-[421px] h-[218px] left-[calc(50%-421px/2+260.5px)] top-0 bg-[#0038FF] blur-[175px]"></div>
          <div className="absolute w-[225px] h-[105.09px] left-[calc(50%-225px/2+283.5px)] top-[83.85px] bg-[#906EFF] blur-[60px]"></div>
          <div className="absolute w-[225px] h-[105.09px] left-[calc(50%-225px/2-283.5px)] top-[83.85px] bg-[#0038FF] blur-[60px]"></div>
        </div>

        <div className="flex flex-col justify-center items-center gap-[40px] w-[792px] h-[613px] z-[2]">
          <div className="flex flex-col items-center gap-[20px] w-[792px]">
            <div className="flex flex-row justify-between items-center w-[792px]">
              <div className="flex flex-col items-start gap-[6px] w-[300px]">
                <h3 className="w-[300px] font-[700] text-[25px] leading-[120%] text-white">
                  {data.requestTitle}
                </h3>
                <p className="w-[300px] h-[19px] text-[16px] leading-[120%] text-white">
                  What you'll provide
                </p>
              </div>

              <div className="flex items-center justify-center w-[140px] h-[140px]">
                <StarLogo />
              </div>

              <div className="flex flex-col items-end gap-[6px] w-[300px]">
                <h3 className="w-[300px] font-[700] text-[25px] leading-[120%] text-right text-white">
                  {data.offerTitle}
                </h3>
                <p className="w-[300px] h-[19px] text-[16px] leading-[120%] text-right text-white">
                  What you'll get in return
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-[#D78DE5] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white text-lg">Hang tight — computing evaluation...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-red-400 text-center">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#0038FF] text-white rounded-lg hover:bg-[#0038FF]/80"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Trade score */}
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
                  <h4 className="w-[110px] h-[24px] font-bold text-[20px] leading-[120%] text-center text-white">
                    {evaluation.tradeScore >= 8 ? "Excellent" : 
                     evaluation.tradeScore >= 6 ? "Great" : 
                     evaluation.tradeScore >= 4 ? "Good" : 
                     evaluation.tradeScore >= 2 ? "Fair" : "Poor"}
                  </h4>
                  <p className="w-[81px] h-[19px] text-[16px] leading-[120%] text-center text-white">
                    {evaluation.tradeScore.toFixed(1)} out of 10
                  </p>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex flex-col items-end gap-[15px] w-[457px]">
                {/* Task complexity */}
                <div className="flex flex-row items-end gap-[20px] w-[452px] h-[20px]">
                  <span className="w-[132px] h-[19px] text-[16px] leading-[120%] text-right text-white whitespace-nowrap">
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
                <div className="flex flex-row items-end gap-[20px] w-[457px] h-[20px]">
                  <span className="w-[137px] h-[19px] text-[16px] leading-[120%] text-right text-white">
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
                <div className="flex flex-row items-end gap-[20px] w-[390px] h-[20px]">
                  <span className="w-[70px] h-[19px] text-[16px] leading-[120%] text-right text-white">
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
              <div className="flex flex-col items-start gap-[15px] w-[792px]">
                <div className="flex flex-row items-center gap-[15px] w-[792px] h-[19px]">
                  <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.57483 0.5C8.08409 4.35956 11.1404 7.41579 15 7.92506V8.07483C11.1404 8.58409 8.08409 11.6404 7.57483 15.5H7.42517C6.91591 11.6404 3.85956 8.58409 0 8.07483V7.92506C3.85956 7.41579 6.91591 4.35956 7.42517 0.5H7.57483Z" fill="#D9D9D9"/>
                  </svg>
                  <span className="w-[122px] h-[19px] italic text-[16px] leading-[120%] text-white">
                    What we think...
                  </span>
                </div>
                <p className="w-[792px] text-[16px] leading-[120%] text-white">
                  {evaluation.description || "Evaluation in progress..."}
                </p>
              </div>
            </>
          )}
        </div>
        
        <p className="absolute w-[847px] h-[19px] left-[calc(50%-847px/2+4.5px)] bottom-[25px] text-[12px] leading-[120%] text-center text-white/80 opacity-60 z-[3]">
          This response is generated by AI and may be inaccurate sometimes. This should only serve as a guide for users.
        </p>

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
    </div>
  );
}