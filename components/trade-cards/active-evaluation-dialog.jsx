"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

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
  // Default values that can be easily adjusted
  const [evaluation, setEvaluation] = useState({
    tradeScore: 8,
    taskComplexity: 60,
    timeCommitment: 50,
    skillLevel: 80,
  });
  
  // Update evaluation if tradeData includes these values
  useEffect(() => {
    if (tradeData) {
      setEvaluation(prev => ({
        ...prev,
        tradeScore: tradeData.tradeScore || prev.tradeScore,
        taskComplexity: tradeData.taskComplexity || prev.taskComplexity,
        timeCommitment: tradeData.timeCommitment || prev.timeCommitment,
        skillLevel: tradeData.skillLevel || prev.skillLevel,
      }));
    }
  }, [tradeData]);
  
  if (!isOpen) return null;

  // Default data if not provided
  const data = tradeData || {
    requestTitle: "Nutrition Coaching for Weight Loss",
    offerTitle: "Yoga Instruction",
    feedback: "Olivia's trade for nutrition coaching in exchange for yoga instruction is well-balanced, with a high skill level required and moderate time commitment. The task complexity is fairly challenging, which makes this a valuable and rewarding exchange for both parties. Overall, it's a great match that promises meaningful growth and results."
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      
      {/* Dialog */}
      <div className="relative w-[900px] h-[650px] flex flex-col justify-center items-center p-[80px_60px] bg-black/10 shadow-[0px_4px_15px_#D78DE5] backdrop-blur-[50px] rounded-[15px] z-50 isolate">
        {/* Close button */}
        <button 
          className="absolute top-[35px] right-[35px] text-white cursor-pointer flex items-center justify-center w-[30px] h-[30px] bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X className="w-[15px] h-[15px]" />
        </button>
        
        {/* Background glow effects */}
        <div className="absolute w-[942px] h-[218px] left-[-1px] top-0 z-[1]">
          {/* Indigo glow left */}
          <div className="absolute w-[421px] h-[218px] left-[calc(50%-421px/2-260.5px)] top-0 bg-[#906EFF] blur-[175px]"></div>
          {/* Blue glow right */}
          <div className="absolute w-[421px] h-[218px] left-[calc(50%-421px/2+260.5px)] top-0 bg-[#0038FF] blur-[175px]"></div>
          {/* Indigo glow bottom right */}
          <div className="absolute w-[225px] h-[105.09px] left-[calc(50%-225px/2+283.5px)] top-[83.85px] bg-[#906EFF] blur-[60px]"></div>
          {/* Blue glow bottom left */}
          <div className="absolute w-[225px] h-[105.09px] left-[calc(50%-225px/2-283.5px)] top-[83.85px] bg-[#0038FF] blur-[60px]"></div>
        </div>
        
        {/* Content container */}
        <div className="flex flex-col justify-center items-center gap-[40px] w-[792px] h-[513px] z-[2]">
          {/* Header section with titles */}
          <div className="flex flex-col items-center gap-[25px] w-[792px] h-[100px]">
            <div className="flex flex-row justify-between items-start gap-[35px] w-[792px] h-[100px]">
              {/* Left side - Request */}
              <div className="flex flex-col items-start gap-[15px] w-[300px] h-[100px]">
                <h3 className="w-[300px] h-[60px] font-bold text-[25px] leading-[120%] text-white">
                  {data.requestTitle}
                </h3>
                <p className="w-[300px] h-[19px] text-[16px] leading-[120%] text-white mt-6">
                  What you'll provide
                </p>
              </div>
              
              {/* Center - Logo */}
              <div className="w-[100px] h-[100px]">
                <StarLogo />
              </div>
              
              {/* Right side - Offer */}
              <div className="flex flex-col items-center gap-[15px] w-[300px] h-[100px]">
                <h3 className="w-[300px] h-[60px] font-bold text-[25px] leading-[120%] text-right text-white">
                  {data.offerTitle}
                </h3>
                <p className="w-[300px] h-[19px] text-[16px] leading-[120%] text-right text-white mt-6">
                  What you'll get in return
                </p>
              </div>
            </div>
          </div>
          
          {/* Trade assessment section */}
          <div className="flex flex-col items-center gap-[15px] w-[300px] h-[83px]">
            {/* Progress bar */}
            <div className="relative flex items-center w-[300px] h-[20px] bg-white shadow-[0px_5px_19px_rgba(0,0,0,0.15)] rounded-[32px] overflow-hidden">
              {/* Filled part */}
              <div
                className="h-full rounded-[32px] z-[2]"
                style={{
                  width: `${(evaluation.tradeScore / 10) * 100}%`,
                  background: "linear-gradient(to right, #FB9696, #D78DE5, #7E59F8, #284CCC, #6DDFFF)"
                }}
              ></div>
              {/* Background overlay */}
              <div className="absolute inset-0 bg-white opacity-35 z-[1]"></div>
            </div>

            {/* Trade assessment text */}
            <div className="flex flex-col items-center gap-[5px] w-[110px] h-[48px]">
              <h4 className="font-bold text-[20px] text-center text-white">
                Good trade
              </h4>
              <p className="text-[16px] text-center text-white">
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
              <div className="relative flex items-center w-[300px] h-[20px] bg-white shadow-[0px_5px_19px_rgba(0,0,0,0.15)] rounded-[32px] overflow-hidden">
                <div
                  className="h-full rounded-[32px] z-[2]"
                  style={{
                    width: `${evaluation.taskComplexity}%`,
                    background: "linear-gradient(to right, #FB9696, #FA6666)"
                  }}
                ></div>
              </div>
            </div>

            {/* Time commitment */}
            <div className="flex items-center gap-[20px] w-full">
              <span className="w-[140px] text-[16px] text-right text-white">
                Time commitment
              </span>
              <div className="relative flex items-center w-[300px] h-[20px] bg-white shadow-[0px_5px_19px_rgba(0,0,0,0.15)] rounded-[32px] overflow-hidden">
                <div
                  className="h-full rounded-[32px] z-[2]"
                  style={{
                    width: `${evaluation.timeCommitment}%`,
                    background: "linear-gradient(to right, #D78DE5, #C865DC)"
                  }}
                ></div>
              </div>
            </div>

            {/* Skill level */}
            <div className="flex items-center gap-[20px] w-full">
              <span className="w-[140px] text-[16px] text-right text-white">
                Skill level
              </span>
              <div className="relative flex items-center w-[300px] h-[20px] bg-white shadow-[0px_5px_19px_rgba(0,0,0,0.15)] rounded-[32px] overflow-hidden">
                <div
                  className="h-full rounded-[32px] z-[2]"
                  style={{
                    width: `${evaluation.skillLevel}%`,
                    background: "linear-gradient(to right, #6DDFFF, #38D3FF)"
                  }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Feedback section */}
          <div className="flex flex-col items-start gap-[15px] w-[792px] h-[110px]">
            <div className="flex flex-row items-center gap-[15px] w-[792px] h-[19px]">
              <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.57483 0.5C8.08409 4.35956 11.1404 7.41579 15 7.92506V8.07483C11.1404 8.58409 8.08409 11.6404 7.57483 15.5H7.42517C6.91591 11.6404 3.85956 8.58409 0 8.07483V7.92506C3.85956 7.41579 6.91591 4.35956 7.42517 0.5H7.57483Z" fill="#D9D9D9"/>
              </svg>
              <span className="w-[122px] h-[19px] italic text-[16px] leading-[120%] text-white">
                What we think...
              </span>
            </div>
            <p className="w-[792px] h-[76px] text-[16px] leading-[120%] text-white">
              {data.feedback}
            </p>
          </div>
        </div>
        
        {/* Disclaimer */}
        <p className="absolute w-[847px] h-[19px] left-[calc(50%-847px/2+4.5px)] bottom-[25px] text-[12px] leading-[120%] text-center text-white/80 opacity-60 z-[3]">
          This response is generated by AI and may be inaccurate sometimes. This should only serve as a guide for users.
        </p>
      </div>
    </div>
  );
}