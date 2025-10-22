"use client";

import React, { useState } from "react";
import Step1 from "./step1";
import OTPVerification from "./OTPVerification";

export default function RegistrationFlowManager({ onComplete }) {
  const [currentView, setCurrentView] = useState("step1"); // "step1" | "otp"
  const [step1Data, setStep1Data] = useState(null);
  const [emailToVerify, setEmailToVerify] = useState("");

  const handleStep1Submit = (data) => {
    setStep1Data(data);
  };

  const handleShowOtpPage = (email) => {
    setEmailToVerify(email);
    setCurrentView("otp");
  };

  const handleOtpVerified = () => {
    // OTP verified successfully - proceed to next registration step
    console.log("Email verified! Proceeding to next step...");
    onComplete?.(step1Data); // Pass step1 data to parent
  };

  const handleBackToStep1 = () => {
    setCurrentView("step1");
  };

  if (currentView === "otp") {
    return (
      <OTPVerification
        email={emailToVerify}
        onVerified={handleOtpVerified}
        onBack={handleBackToStep1}
      />
    );
  }

  return (
    <Step1
      step1Data={step1Data}
      onDataSubmit={handleStep1Submit}
      onShowOtpPage={handleShowOtpPage}
    />
  );
}