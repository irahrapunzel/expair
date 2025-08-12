"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";

export default function XpGainedDialog({ isOpen, onClose, xpGained = 250, level = 15, currentXp = 650, maxXp = 700, rank = "Rising Star" }) {
  if (!isOpen) return null;

  // Calculate progress percentage for the progress bar
  const progressPercentage = (currentXp / maxXp) * 100;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
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

        <div className="flex flex-col items-center gap-[40px] w-[470px]">
          {/* Title */}
          <h2 className="text-[25px] font-[700] text-white text-center">
            Nice! You gained {xpGained} XP.
          </h2>
          
          {/* Level Progress */}
          <div className="flex flex-col items-center gap-[20px] w-full">
            <div className="flex justify-between items-center w-full">
              <span className="text-[16px] text-white">LVL {level}</span>
              
              {/* Progress Bar */}
              <div className="relative w-[300px] h-[20px] bg-white rounded-[32px] shadow-[0px_5px_19px_rgba(0,0,0,0.15)]">
                <div 
                  className="absolute h-[16px] top-[2px] left-[2px] rounded-[100px]"
                  style={{
                    width: `${progressPercentage}%`,
                    background: "linear-gradient(90deg, #FB9696 0%, #D78DE5 25%, #7E59F8 50%, #284CCC 75%, #6DDFFF 100%)"
                  }}
                ></div>
              </div>
              
              <span className="text-[16px] text-white">{currentXp}/{maxXp}</span>
            </div>
            
            {/* Rank */}
            <div className="flex items-center justify-center gap-[15px]">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="19" viewBox="0 0 20 19" fill="none">
                <path d="M10 1C10.2782 1 10.5735 1.03693 10.8525 1.12305C11.0869 1.19538 11.365 1.31969 11.6035 1.53613L11.7031 1.63477L18.1309 8.58594C18.3315 8.80294 18.5 9.11602 18.5 9.5C18.5 9.88398 18.3315 10.1971 18.1309 10.4141L11.7031 17.3652C11.4455 17.6437 11.1204 17.7943 10.8525 17.877C10.5735 17.9631 10.2782 18 10 18C9.7218 18 9.42652 17.9631 9.14746 17.877C8.87963 17.7943 8.55453 17.6437 8.29688 17.3652L1.86914 10.4141C1.66848 10.1971 1.5 9.88398 1.5 9.5C1.5 9.11602 1.66848 8.80294 1.86914 8.58594L8.29688 1.63477L8.39648 1.53613C8.63496 1.31969 8.91313 1.19538 9.14746 1.12305C9.42652 1.03693 9.7218 1 10 1Z" fill="url(#paint0_radial_1277_6289)" stroke="url(#paint1_linear_1277_6289)" strokeWidth="2"/>
                <defs>
                  <radialGradient id="paint0_radial_1277_6289" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(10 9.49999) scale(7.61407 8.23415)">
                    <stop offset="0.4" stop-color="#933BFF"/>
                    <stop offset="1" stop-color="#34188D"/>
                  </radialGradient>
                  <linearGradient id="paint1_linear_1277_6289" x1="10" y1="1.26584" x2="10" y2="17.7341" gradientUnits="userSpaceOnUse">
                    <stop stop-color="white"/>
                    <stop offset="0.5" stop-color="#999999"/>
                    <stop offset="1" stop-color="white"/>
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-[16px] text-white">{rank}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}