"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function SuspensionPage({ searchParams }) {
  const router = useRouter();

  // --- 1. CAPTURE ALL URL PARAMETERS ---
  const reason = (searchParams && searchParams.reason) || "Violation of platform policies";
  const until = (searchParams && searchParams.until) || null;
  // CRITICAL: Capture the ID needed for the appeal submission
  const originalReportId = (searchParams && searchParams.originalReportId) || "N/A";

  // 2. CONSTRUCT THE APPEAL URL SAFELY
  // Ensure all necessary data is URL-encoded before being pushed
  const encodedReason = encodeURIComponent(reason);
  const encodedUntil = encodeURIComponent(until || 'Permanent Ban');
  const encodedReportId = encodeURIComponent(originalReportId);

  const appealUrl = `/appeal?reason=${encodedReason}&until=${encodedUntil}&originalReportId=${encodedReportId}`;

  // 3. Display Logic
  const displayAction = until ? `Suspension until ${until}` : "Permanent ban";


  return (
    <div
      className={`${inter.className} min-h-screen w-full flex items-center justify-center bg-[#050015] px-4`}
      style={{
        backgroundImage: "url('/assets/bg_register.png')",
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Image
            src="/expair.png"
            alt="Expair Logo"
            width={120}
            height={40}
            className="w-auto h-[40px]"
          />
        </div>
        <div className="mx-auto bg-[#0B0521]/80 backdrop-blur-sm rounded-2xl p-8 md:p-12 text-center shadow-lg border border-[#120A2A]">
          {/* Ban Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-[#120A2A] flex items-center justify-center border-2 border-red-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12 text-red-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          </div>

          <h1 className="text-white text-2xl md:text-3xl font-semibold mb-2">
            Account {until ? "Suspended" : "Banned"}
          </h1>

          <p className="text-gray-200 opacity-90 mb-4">
            Your account has been suspended for the following reason:
          </p>

          <div className="bg-[#050015] border border-[#2a2140] rounded-lg p-4 text-left mb-6">
            <p className="text-sm text-gray-300">
              <span className="font-medium text-gray-100">Reason: </span>
              {reason}
            </p>
            <p className="text-sm text-gray-300 mt-2">
              <span className="font-medium text-gray-100">Action taken: </span>
              {displayAction}
            </p>
            {originalReportId !== "N/A" && (
              <p className="text-sm text-gray-300 mt-2">
                <span className="font-medium text-gray-100">Violation ID: </span>
                #{originalReportId}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            {/* --- FIX: PASS ALL DATA TO APPEAL PAGE --- */}
            <button
              onClick={() => router.push(appealUrl)}
              className={`w-full sm:w-auto px-6 py-3 rounded-lg bg-[#0038FF] hover:bg-[#1a4dff] text-white font-medium shadow-[0_8px_20px_-8px_rgba(0,56,255,0.6)] transition`}
            >
              Submit an Appeal
            </button>

            <button
              onClick={() => {
                // optional sign-out or help link
                router.push("/help");
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-lg border border-[#2a2140] text-gray-200 hover:text-white"
            >
              Contact Support
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-6">
            If you believe this was an error, you may submit an appeal. Appeals
            are reviewed within 24–48 hours.
          </p>
        </div>
      </div>
    </div>
  );
}