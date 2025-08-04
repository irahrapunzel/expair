"use client";

import { useState } from "react";
import { Button } from "../../../../../components/ui/button";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Onboarding1({ onNext, onPrev }) {
  const [serviceRequest, setServiceRequest] = useState("");
  const [date, setDate] = useState("");

  return (
    <div
      className={`pt-[40px] pb-[40px] flex h-screen items-center justify-center ${inter.className} relative overflow-hidden`}
      style={{ 
        backgroundImage: "url('/assets/bg_register1.png')",
        backgroundSize: "100% 110%",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* Background glows */}
      <div className="absolute w-[673px] h-[673px] left-[-611.5px] top-[-336px] bg-[#906EFF] opacity-35 blur-[200px]"></div>
      <div className="absolute w-[673px] h-[673px] right-[-354px] bottom-[-454px] bg-[#0038FF] opacity-35 blur-[200px]"></div>
      
      <div className="relative z-10 w-full max-w-5xl text-center px-4 flex flex-col items-center">
        {/* Header spacing */}
        <div className="mb-[320px]"></div>
        
        {/* Main content */}
        <div className="flex flex-col items-center justify-center w-full max-w-[941px] mx-auto">
          {/* Title and subtitle */}
          <div className="flex flex-col items-center gap-[15px] mb-[25px] w-full">
            <h1 className="font-bold text-[31px] text-center text-white">
              What are you looking for?
            </h1>
            <p className="text-[16px] text-white/40">
              Time to make your first request
            </p>
          </div>
          
          {/* Service input field */}
          <div className="flex flex-col items-center gap-[15px] w-full mb-[40px]">
            <div className="w-[407px] h-[50px] bg-[#120A2A] rounded-[15px] px-[14px] py-[8px] flex items-center">
              <input
                type="text"
                placeholder="Enter a service you need. (e.g., Plumbing)"
                value={serviceRequest}
                onChange={(e) => setServiceRequest(e.target.value)}
                className="w-full h-full bg-transparent text-[16px] text-white outline-none placeholder:text-[#413663]"
              />
            </div>
          </div>
          
          {/* Date selector */}
          <div className="flex flex-col items-center gap-[15px] w-full mb-[40px]">
            <p className="text-[16px] text-white text-center">
              Until when is this available?
            </p>
            <div className="relative w-[400px]">
              <input
                type="text"
                placeholder="DD/MM/YYYY"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-[50px] bg-[#120A2A] border border-white/40 rounded-[15px] px-[18px] py-[15px] text-[16px] text-white outline-none placeholder:text-[#413663]"
                onFocus={(e) => {
                  e.target.type = "date";
                  e.target.showPicker();
                }}
                onBlur={(e) => {
                  if (!e.target.value) e.target.type = "text";
                }}
              />
            </div>
          </div>
          
          {/* Continue Button */}
          <div className="flex justify-center mt-[25px]">
            <Button
              className="cursor-pointer flex w-[240px] h-[50px] justify-center items-center shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-[20px] font-[500] transition rounded-[15px]"
              onClick={onNext}
            >
              Confirm
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}