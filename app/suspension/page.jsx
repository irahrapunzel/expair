"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react"; 

const inter = Inter({ subsets: ["latin"] });

export default function SuspensionPage({ searchParams }) {
  const router = useRouter();

  // --- 1. CAPTURE ALL URL PARAMETERS ---
  const reason = (searchParams && searchParams.reason) || "Violation of platform policies";
  const until = (searchParams && searchParams.until) || null;
  const originalReportId = (searchParams && searchParams.originalReportId) || "N/A";

  // 2. CONSTRUCT THE APPEAL URL SAFELY
  const encodedReason = encodeURIComponent(reason);
  const encodedUntil = encodeURIComponent(until || 'Permanent Ban');
  const encodedReportId = encodeURIComponent(originalReportId);

  const appealUrl = `/appeal?reason=${encodedReason}&until=${encodedUntil}&originalReportId=${encodedReportId}`;

  // 3. Display Logic
  const isPermanent = !until;
  let displayAction;
  
  if (isPermanent) {
      displayAction = "Permanent Ban";
  } else {
      // Highlight the suspension date
      displayAction = (
          <>
              Account suspended until 
              <span className="font-semibold text-white ml-1">
                  {until}
              </span>
          </>
      );
  }

  return (
    <div
      className={`${inter.className} min-h-screen w-full flex items-center justify-center bg-[#050015] px-4 py-12`}
      style={{
        backgroundImage: "url('/assets/bg_register.png')",
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="max-w-3xl w-full">
        {/* Logo (Top Left) */}
        <div className="flex items-center justify-start mb-8">
          <Link href="/">
            <Image
              src="/expair.png"
              alt="Expair Logo"
              width={120}
              height={40}
              className="w-auto h-[40px] cursor-pointer"
            />
          </Link>
        </div>

        {/* Main Content Card - Glow Effect Applied Here */}
        <div 
            className="w-full mx-auto p-8 md:p-12 text-center rounded-2xl shadow-2xl"
            style={{
                background: 'rgba(11, 5, 33, 0.9)', 
                backdropFilter: 'blur(10px)',
                boxShadow: '0 0 40px 5px rgba(144, 110, 255, 0.3)', 
            }}
        >
          {/* Ban Icon (Styled AlertTriangle) */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-full bg-yellow-800/20 flex items-center justify-center border-4 border-yellow-500 shadow-yellow-500/30 shadow-lg">
              <AlertTriangle className="w-12 h-12 text-yellow-400" strokeWidth={1.5} /> 
            </div>
          </div>

          <h1 className="text-white text-3xl md:text-4xl font-extrabold mb-2">
            Account {isPermanent ? "Banned" : "Suspended"}
          </h1>
          
          <p className="text-red-400 text-m font-bold mb-7">
              You cannot use this account or engage in any trades while it is suspended.
          </p>

          <p className="text-gray-300 mb-6 font-light">
            We regret to inform you that your account has been flagged and suspended for the following violation:
          </p>

          {/* Violation Details Box */}
          <div 
            className="bg-[#050015] border border-[#2a2140] rounded-xl p-5 text-left mb-8 shadow-inner"
          >
            <p className="text-sm text-gray-400 uppercase font-bold tracking-wider mb-2">
                Violation Details
            </p>
            
            <div className="border-t border-[#2a2140] my-2"></div>

            {/* Reason */}
            <div className="mb-3">
                <p className="text-md text-gray-200 font-semibold">
                    Reason: 
                    <span className="text-gray-200 ml-2 font-normal">
                        {reason}
                    </span>
                </p>
            </div>

            {/* Action - Removed excess mb-3 wrapper */}
            <p className="text-md text-gray-200 font-semibold">
                Action: 
                <span className="text-gray-200 ml-2 font-normal">
                    {displayAction}
                </span>
            </p>

            {/* Violation ID */}
            {originalReportId !== "N/A" && (
              <p className="text-sm text-gray-400 mt-4">
                <span className="font-medium text-gray-300">Case ID: </span>
                <span className="font-mono text-xs">#{originalReportId}</span>
              </p>
            )}
          </div>

          {/* Action Buttons (Rounded Rectangles) */}
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            
            {/* Submit Appeal Button (Primary) */}
            <button
              onClick={() => router.push(appealUrl)}
              className={`w-full sm:w-auto px-6 py-3 rounded-lg bg-[#0038FF] hover:bg-[#1a4dff] text-white font-semibold transition-all duration-300 transform shadow-[0_8px_20px_-8px_rgba(0,56,255,0.6)]`}
            >
              Submit an Appeal
            </button>

            {/* Contact Support Button (Secondary) */}
            <button
              onClick={() => {
                router.push("/help");
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-lg border border-[#2a2140] text-gray-300 hover:text-white hover:border-white/50 transition-all duration-300"
            >
              Contact Support
            </button>
          </div>

          {/* Revised Disclaimer Text */}
          <p className="text-sm text-gray-500 mt-8">
            Appeals are generally reviewed within 24–48 hours. If you wish to submit an appeal, please provide full context regarding your violation.
          </p>
        </div>
      </div>
    </div>
  );
}