"use client";

import { useState } from "react";
import { Button } from "../../../../../components/ui/button";
import { Inter } from "next/font/google";
import { Calendar } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export default function Onboarding1({ onNext, onPrev }) {
  const [serviceRequest, setServiceRequest] = useState("");
  const [date, setDate] = useState("");

  return (
    <div
      className={`flex min-h-screen items-center justify-center bg-cover bg-center ${inter.className}`}
      style={{ backgroundImage: "url('/assets/bg_register1.png')" }}
    >

      <div className="relative z-10 w-full max-w-5xl text-center px-4 flex flex-col items-center">
        {/* Header spacing */}
        <div className="mb-[530px]"></div>

        {/* Main content */}
        <div className="flex flex-col items-center justify-center w-full max-w-[941px] mx-auto">
          {/* Title and subtitle */}
          <div className="flex flex-col items-center gap-[15px] mb-[25px] w-full">
            <h1 className="font-[700] text-[31px] text-center text-white">
              What are you looking for?
            </h1>
            <p className="text-[16px] font-[400] text-white/40">
              Time to make your first request
            </p>
          </div>

          {/* Service input field */}
          <div className="flex flex-col items-center gap-[15px] w-full mb-[40px]">
            <div
              className="w-[407px] h-[50px] rounded-[15px] p-[2px]" // padding to show border
              style={{
                background: 'linear-gradient(90deg, #FB9696 0%, #D78DE5 25%, #7E59F8 50%, #284CCC 75%, #6DDFFF 100%)',
              }}
            >
              <input
                type="text"
                placeholder="Enter a service you need. (e.g., Plumbing)"
                value={serviceRequest}
                onChange={(e) => setServiceRequest(e.target.value)}
                className="w-full h-full bg-[#120A2A] rounded-[13px] px-[14px] py-[8px] text-[16px] text-white outline-none placeholder:text-[#413663]"
              />
            </div>
          </div>

          {/* Date selector*/}
          <div className="flex flex-col items-center gap-[15px] w-full mb-[40px]">
            <p className="text-[16px] text-white text-center">
              Until when is this available?
            </p>
            <div className="relative w-[400px]">
              <input
                type="date"
                placeholder="MM/DD/YYYY"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-[50px] bg-[#120A2A] border border-white/40 rounded-[15px] px-[18px] py-[15px] pr-[45px] text-[16px] text-white outline-none placeholder:text-[#413663]"
                onFocus={(e) => {
                  e.target.type = "date";
                }}
                onBlur={(e) => {
                  if (!e.target.value) e.target.type = "text";
                }}
              />
              {/* Lucide calendar icon */}
              <Calendar
                size={20}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white cursor-pointer"
                onClick={() => {
                  // Focus the input when calendar icon is clicked
                  document.querySelector('input[type="date"]')?.focus();
                }}
              />
            </div>
          </div>

          {/* Continue Button */}
          <div className="flex justify-center mt-[25px] mb-[100px]">
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
