"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { StarIcon } from "../icons/star-icon";
import XpGainedDialog from "./xp-gained-dialog";

export default function SuccessDialog({ isOpen, onClose, trade }) {
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(3);
  const [showRating, setShowRating] = useState(false);
  const [showXpGained, setShowXpGained] = useState(false);
  
  const maxChars = 500;

  if (!isOpen) return null;

  // Create array of 5 stars
  const stars = Array(5).fill(0);

  const handleSubmit = () => {
    // Here you would submit the feedback and show the rating phase
    console.log("Submitting feedback:", feedback);
    setShowRating(true);
  };

  const handleContinue = () => {
    // Show XP gained dialog
    setShowRating(false);
    setShowXpGained(true);
  };

  const handleXpGainedClose = () => {
    // Final step - close all dialogs
    setShowXpGained(false);
    onClose();
  };

  return (
    <>
      {showXpGained ? (
        <XpGainedDialog 
          isOpen={showXpGained}
          onClose={handleXpGainedClose}
          xpGained={trade?.xp?.replace(" XP", "") || 250}
        />
      ) : (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          {!showRating ? (
            // First phase - Feedback dialog
            <div 
              className="w-[618px] flex flex-col items-center justify-center p-[50px] relative"
              style={{
                background: "rgba(0, 0, 0, 0.05)",
                border: "2px solid #0038FF",
                boxShadow: "0px 4px 15px #D78DE5",
                backdropFilter: "blur(30px)",
                borderRadius: "15px"
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-[30px] right-[30px] text-white hover:text-gray-300"
              >
                <Icon icon="lucide:x" className="w-[15px] h-[15px]" />
              </button>

              <div className="flex flex-col items-center gap-[30px] w-full">
                {/* Success Icon */}
                <div className="w-[70px] h-[70px] rounded-full bg-[#0038FF] flex items-center justify-center">
                  <Icon icon="lucide:check" className="w-[40px] h-[40px] text-white" />
                </div>
                
                {/* Title */}
                <h2 className="text-[25px] font-bold text-white text-center">
                  Successful trade!
                </h2>
                
                {/* Trade Details */}
                <div className="flex items-center gap-4 text-white text-center max-w-[500px]">
                  <span className="text-[14px]">{trade?.requested}</span>
                  <Icon icon="lucide:x" className="w-4 h-4" />
                  <span className="text-[14px]">{trade?.offering}</span>
                </div>
                
                {/* Feedback Section */}
                <div className="w-full">
                  <p className="text-white text-center mb-4">
                    Tell us more about your experience
                  </p>
                  <div className="relative">
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="How did the trade go?"
                      maxLength={maxChars}
                      className="w-full h-[120px] bg-[#120A2A] border-none rounded-[15px] text-white p-4 focus:outline-none focus:ring-2 focus:ring-[#0038FF]"
                    />
                    <span className="absolute bottom-2 right-3 text-xs text-gray-400">
                      {feedback.length}/{maxChars}
                    </span>
                  </div>
                </div>
                
                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  className="w-[172px] h-[40px] bg-[#0038FF] rounded-[15px] text-white text-[16px] shadow-[0px_0px_15px_#284CCC] self-end"
                >
                  Submit
                </button>
              </div>
            </div>
          ) : (
            // Second phase - Rating dialog
            <div 
              className="w-[618px] flex flex-col items-center justify-center p-[50px] relative"
              style={{
                background: "rgba(0, 0, 0, 0.05)",
                border: "2px solid #0038FF",
                boxShadow: "0px 4px 15px #D78DE5",
                backdropFilter: "blur(30px)",
                borderRadius: "15px"
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-[30px] right-[30px] text-white hover:text-gray-300"
              >
                <Icon icon="lucide:x" className="w-[15px] h-[15px]" />
              </button>

              <div className="flex flex-col items-center gap-[30px] w-full">
                {/* Success Icon */}
                <div className="w-[70px] h-[70px] rounded-full bg-[#0038FF] flex items-center justify-center">
                  <Icon icon="lucide:check" className="w-[40px] h-[40px] text-white" />
                </div>
                
                {/* Title */}
                <h2 className="text-[25px] font-bold text-white text-center">
                  Successful trade!
                </h2>
                
                {/* Trade Details */}
                <div className="flex items-center gap-4 text-white text-center max-w-[500px]">
                  <div className="flex-1 px-3 py-2 bg-[rgba(40,76,204,0.2)] border-[1.5px] border-[#0038FF] rounded-[15px]">
                    <span className="text-[14px]">{trade?.requested}</span>
                  </div>
                  <Icon icon="lucide:x" className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 px-3 py-2 bg-[rgba(144,110,255,0.2)] border-[1.5px] border-[#906EFF] rounded-[15px]">
                    <span className="text-[14px]">{trade?.offering}</span>
                  </div>
                </div>
                
                {/* Star Rating */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-4">
                    {stars.map((_, index) => (
                      <div 
                        key={index} 
                        onClick={() => setRating(index + 1)}
                        className="cursor-pointer transform hover:scale-110 transition-transform"
                      >
                        {index < rating ? (
                          <svg width="40" height="40" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path 
                              d="M19 1.16516L17.74 3.91516L15 5.16516L17.74 6.42516L19 9.16516L20.25 6.42516L23 5.16516L20.25 3.91516M9 4.16516L6.5 9.66516L1 12.1652L6.5 14.6652L9 20.1652L11.5 14.6652L17 12.1652L11.5 9.66516M19 15.1652L17.74 17.9052L15 19.1652L17.74 20.4152L19 23.1652L20.25 20.4152L23 19.1652L20.25 17.9052" 
                              fill="url(#paint0_linear_607_12474)"
                            />
                            <defs>
                              <linearGradient 
                                id="paint0_linear_607_12474" 
                                x1="1" 
                                y1="12.1652" 
                                x2="23" 
                                y2="12.1652" 
                                gradientUnits="userSpaceOnUse"
                              >
                                <stop stopColor="#FB9696"/>
                                <stop offset="0.25" stopColor="#D78DE5"/>
                                <stop offset="0.5" stopColor="#7E59F8"/>
                                <stop offset="0.75" stopColor="#284CCC"/>
                                <stop offset="1" stopColor="#6DDFFF"/>
                              </linearGradient>
                            </defs>
                          </svg>
                        ) : (
                          <svg width="40" height="40" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path 
                              d="M19 1.16516L17.74 3.91516L15 5.16516L17.74 6.42516L19 9.16516L20.25 6.42516L23 5.16516L20.25 3.91516M9 4.16516L6.5 9.66516L1 12.1652L6.5 14.6652L9 20.1652L11.5 14.6652L17 12.1652L11.5 9.66516M19 15.1652L17.74 17.9052L15 19.1652L17.74 20.4152L19 23.1652L20.25 20.4152L23 19.1652L20.25 17.9052" 
                              fill="#2A1C44"
                            />
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-center text-white">
                    <p className="text-xl font-bold">{rating} out of 5</p>
                    <p className="text-lg">Your rating</p>
                  </div>
                  <p className="text-white/60 text-sm text-center mt-2">
                    These are objective ratings generated by AI via sentiment analysis.
                  </p>
                </div>
                
                {/* Continue Button */}
                <button
                  onClick={handleContinue}
                  className="w-[172px] h-[40px] bg-[#0038FF] rounded-[15px] text-white text-[16px] shadow-[0px_0px_15px_#284CCC]"
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}