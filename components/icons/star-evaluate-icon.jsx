import React from "react";

export const StarEvaluateIcon = ({ size = "40" }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_d_2180_4511)">
        <rect x="16" y="16" width="38" height="38" rx="19" fill="#120A2A" stroke="url(#paint0_linear_2180_4511)" strokeWidth="2"/>
        <path d="M35 45L36.8145 35L35 25L33.1855 35L35 45Z" fill="white"/>
        <path d="M26.9183 28.829L34.7727 36.5723L37.0497 33.3941L26.9183 28.829Z" fill="white"/>
        <path d="M43.0775 41.1436L35.2232 33.4004L32.9462 36.5785L43.0775 41.1436Z" fill="white"/>
        <path d="M43.0817 28.829L35.2273 36.5723L32.9503 33.3941L43.0817 28.829Z" fill="white"/>
        <path d="M26.9225 41.1436L34.7768 33.4004L37.0538 36.5785L26.9225 41.1436Z" fill="white"/>
      </g>
      <defs>
        <filter id="filter0_d_2180_4511" x="0" y="0" width="70" height="70" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset/>
          <feGaussianBlur stdDeviation="7.5"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0.841408 0 0 0 0 0.553254 0 0 0 0 0.899038 0 0 0 1 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2180_4511"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2180_4511" result="shape"/>
        </filter>
        <linearGradient id="paint0_linear_2180_4511" x1="15" y1="35" x2="55" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7E59F8"/>
          <stop offset="0.5" stopColor="white"/>
          <stop offset="1" stopColor="#7E59F8"/>
        </linearGradient>
      </defs>
    </svg>
  );
};

export default StarEvaluateIcon;