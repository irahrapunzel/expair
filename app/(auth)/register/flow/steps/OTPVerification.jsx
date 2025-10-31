"use client";

import React, { useEffect, useState } from "react";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import Image from "next/image";
import { ArrowLeft, Mail } from "lucide-react";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function OTPVerification({ email, onVerified, onBack }) {
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Countdown Timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setOtpError("Please enter a 6-digit code");
      return;
    }

    setIsVerifying(true);
    setOtpError("");

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!baseUrl) {
        setOtpError("Configuration Error: Backend URL not found.");
        setIsVerifying(false);
        return;
      }

      const response = await fetch(`${baseUrl}/api/verify-otp/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          otp: otpCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setOtpError(data.error || "Verification failed");
        setIsVerifying(false);
        return;
      }

      // Success!
      setSuccessMessage("Email verified successfully!");
      setTimeout(() => {
        onVerified();
      }, 1500);
    } catch (error) {
      console.error("OTP verification error:", error);
      setOtpError("Network error. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setOtpError("");
    setSuccessMessage("");

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!baseUrl) {
        setOtpError("Configuration Error: Backend URL not found.");
        setIsResending(false);
        return;
      }

      const response = await fetch(`${baseUrl}/api/resend-otp/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setOtpError(data.error || "Failed to resend OTP");
        setIsResending(false);
        return;
      }

      // Reset countdown and disable resend button
      setCountdown(300);
      setCanResend(false);
      setSuccessMessage("New code sent successfully!");
      setOtpCode("");
    } catch (error) {
      console.error("Resend OTP error:", error);
      setOtpError("Network error. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtpCode(value);
    setOtpError("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && otpCode.length === 6) {
      handleVerifyOtp();
    }
  };

  return (
    <div
      className={`pt-[50px] pb-[50px] flex min-h-screen items-center justify-center bg-cover bg-center px-4 ${inter.className}`}
      style={{ backgroundImage: "url('/assets/bg_register.png')" }}
    >
      <div className="relative z-10 w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex flex-col items-center mb-[30px]">
          <Image
            src="/assets/logos/Logotype=Logotype M.png"
            alt="Logo"
            width={250}
            height={76}
            className="rounded-full"
          />
        </div>

        {/* Header */}
        <div className="text-center mb-[50px]">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <h1 className="font-[600] text-[25px] text-white mb-[10px]">
            Verify Your Email
          </h1>
          <p className="text-white opacity-80 text-[16px] mb-2">
            We sent a verification code to
          </p>
          <p className="text-[#6DDFFF] font-semibold text-[16px]">{email}</p>
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <p className="text-white font-normal mb-[8px] text-left">
            Enter 6-digit code
          </p>
          <Input
            type="text"
            value={otpCode}
            onChange={handleOtpChange}
            onKeyPress={handleKeyPress}
            placeholder="000000"
            className="w-full h-[60px] text-center text-2xl tracking-widest"
            maxLength={6}
            autoFocus
          />
          {otpError && (
            <p className="text-red-500 text-sm mt-2 text-left">{otpError}</p>
          )}
          {successMessage && (
            <p className="text-green-400 text-sm mt-2 text-left">
              {successMessage}
            </p>
          )}
        </div>

        {/* Timer and Resend */}
        <div className="mb-8 text-center">
          {countdown > 0 ? (
            <p className="text-white opacity-60 text-sm">
              Code expires in{" "}
              <span className="font-semibold text-[#6DDFFF]">
                {Math.floor(countdown / 60)}:
                {(countdown % 60).toString().padStart(2, "0")}
              </span>
            </p>
          ) : (
            <p className="text-white opacity-60 text-sm">Code expired</p>
          )}

          <button
            onClick={handleResendOtp}
            disabled={!canResend || isResending}
            className={`mt-2 text-sm ${
              canResend && !isResending
                ? "text-[#6DDFFF] hover:underline cursor-pointer"
                : "text-gray-500 cursor-not-allowed"
            }`}
          >
            {isResending ? "Sending..." : "Resend code"}
          </button>
        </div>

        {/* Verify Button */}
        <div className="flex justify-center mb-6">
          <Button
            onClick={handleVerifyOtp}
            disabled={otpCode.length !== 6 || isVerifying}
            className="cursor-pointer flex w-[240px] h-[50px] justify-center items-center px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-[20px] font-normal transition rounded-[15px]"
          >
            {isVerifying ? "Verifying..." : "Verify Email"}
          </Button>
        </div>

        {/* Back Button */}
        <div className="flex justify-center">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white opacity-80 hover:opacity-100 transition"
          >
            <ArrowLeft size={20} />
            <span>Change email address</span>
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex justify-center items-center gap-2 text-[16px] text-white opacity-60 z-50">
          <span>1 of 6 - Email Verification</span>
        </div>
      </div>
    </div>
  );
}