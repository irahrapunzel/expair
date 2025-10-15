"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "../../../../../components/ui/button";
import { Inter } from "next/font/google";
import { Calendar } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export default function Onboarding1({ onNext, onPrev }) {
  const { data: session } = useSession();
  const [serviceRequest, setServiceRequest] = useState("");
  const [date, setDate] = useState("");
  const [errors, setErrors] = useState({ serviceRequest: "", date: "" });
  const [isLoading, setIsLoading] = useState(false);
  const dateInputRef = useRef(null);

  const validate = () => {
    let valid = true;
    const newErrors = { serviceRequest: "", date: "" };

    if (!serviceRequest.trim()) {
      newErrors.serviceRequest = "Please enter a service.";
      valid = false;
    }

    if (!date) {
      newErrors.date = "Please select a date.";
      valid = false;
    } else {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = "Date cannot be in the past.";
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  };

  const handleConfirm = async () => {
    if (!validate()) return;

    const token = session?.access || session?.accessToken;
    if (!token) {
      setErrors((prev) => ({
        ...prev,
        serviceRequest:
          "You must be signed in. Please log in again and try confirming.",
      }));
      return;
    }

    setIsLoading(true);
    try {
      // ✅ FIXED: Correct endpoint path
      const resp = await fetch(`${BACKEND_URL}/trade-requests/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reqname: serviceRequest.trim(),
          reqdeadline: date, // Send as YYYY-MM-DD
          reqstatus: "pending", // ✅ Added default status
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        
        console.log("✅ Trade request created:", data);
        console.log("✅ Trade request ID:", data.tradereq_id);
        
        // ✅ Auto-categorize the new trade request
        try {
          const categorizeResp = await fetch(`${BACKEND_URL}/api/ai/categorize/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              tradereq_id: data.tradereq_id,
            }),
          });

          if (categorizeResp.ok) {
            const catData = await categorizeResp.json();
            console.log("✅ Trade categorized as:", catData.category);
          } else {
            console.warn("⚠️ Categorization failed, continuing anyway");
          }
        } catch (catError) {
          console.error("⚠️ Categorization error:", catError);
          // Continue anyway - categorization is optional
        }
        
        // ✅ CRITICAL: Pass tradereq_id to parent component
        if (data.tradereq_id) {
          console.log("✅ Passing tradereq_id to Onboarding2:", data.tradereq_id);
          onNext?.(data.tradereq_id);
        } else {
          console.error("❌ No tradereq_id in response!");
          console.error("Response data:", data);
          // Fallback: try to continue anyway
          onNext?.();
        }
      } else {
        let msg = `Failed to create request (HTTP ${resp.status})`;
        try {
          const err = await resp.json();
          console.error("❌ Server error response:", err);
          if (err?.error || err?.detail) {
            msg += `: ${err.error || err.detail}`;
          } else if (err?.reqname) {
            msg += `: ${err.reqname[0]}`;
          } else if (err?.reqdeadline) {
            msg += `: ${err.reqdeadline[0]}`;
          }
        } catch (parseError) {
          console.error("❌ Could not parse error response");
        }
        setErrors((prev) => ({ ...prev, serviceRequest: msg }));
      }
    } catch (e) {
      console.error("❌ Network error:", e);
      setErrors((prev) => ({
        ...prev,
        serviceRequest: `Network error: ${e?.message || e}`,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`flex min-h-screen items-center justify-center bg-cover bg-center ${inter.className}`}
      style={{ backgroundImage: "url('/assets/bg_register1.png')" }}
    >
      <div className="relative z-10 w-full max-w-5xl text-center px-4 flex flex-col items-center">
        <div className="mb-[530px]" />

        <div className="flex flex-col items-center justify-center w-full max-w-[941px] mx-auto">
          {/* Title */}
          <div className="flex flex-col items-center gap-[15px] mb-[25px] w-full">
            <h1 className="font-[700] text-[31px] text-center text-white">
              What are you looking for?
            </h1>
            <p className="text-[16px] font-[400] text-white/40">
              Time to make your first request
            </p>
          </div>

          {/* Service input */}
          <div className="flex flex-col items-center gap-[8px] w-full mb-[40px]">
            <div
              className="w-[407px] h-[50px] rounded-[15px] p-[2px]"
              style={{
                background:
                  "linear-gradient(90deg, #FB9696 0%, #D78DE5 25%, #7E59F8 50%, #284CCC 75%, #6DDFFF 100%)",
              }}
            >
              <input
                type="text"
                placeholder="Enter a service you need. (e.g., Plumbing)"
                value={serviceRequest}
                onChange={(e) => {
                  setServiceRequest(e.target.value);
                  if (errors.serviceRequest) {
                    setErrors((prev) => ({ ...prev, serviceRequest: "" }));
                  }
                }}
                className="w-full h-full bg-[#120A2A] rounded-[13px] px-[14px] py-[8px] text-[16px] text-white outline-none placeholder:text-[#413663]"
              />
            </div>
            <div className="h-[10px]">
              {errors.serviceRequest && (
                <p className="text-red-500 text-sm mt-2">
                  {errors.serviceRequest}
                </p>
              )}
            </div>
          </div>

          {/* Date selector */}
          <div className="flex flex-col items-center gap-[8px] w-full mb-[40px]">
            <p className="text-[16px] text-white text-center">
              Until when is this available?
            </p>
            <div className="relative w-[400px]">
              <input
                ref={dateInputRef}
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) {
                    setErrors((prev) => ({ ...prev, date: "" }));
                  }
                }}
                min={new Date().toISOString().split('T')[0]} // ✅ Prevent past dates in picker
                className="w-full h-[50px] bg-[#120A2A] border border-white/40 rounded-[15px] px-[18px] py-[15px] pr-[45px] text-[16px] text-white outline-none placeholder:text-[#413663]"
              />
              <Calendar
                size={20}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white cursor-pointer"
                onClick={() => dateInputRef.current?.showPicker?.()}
              />
            </div>
            <div className="h-[10px]">
              {errors.date && (
                <p className="text-red-500 text-sm mt-2">{errors.date}</p>
              )}
            </div>
          </div>

          {/* Continue Button */}
          <div className="flex justify-center mt-[25px] mb-[100px]">
            <Button
              className="cursor-pointer flex w-[240px] h-[50px] justify-center items-center shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-[20px] font-[500] transition rounded-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleConfirm}
              disabled={isLoading || !(session?.access || session?.accessToken)}
            >
              {isLoading ? "Creating request..." : "Submit"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}