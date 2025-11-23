"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import DragDropUploader from "../../components/admin/dragdropuploader";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function AppealPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- STATE FOR FETCHED DATA ---
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // --- FORM STATE ---
  const [appealText, setAppealText] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [files, setFiles] = useState([]);
  const [declaration, setDeclaration] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Get report ID from URL (using reportId param now)
  const reportId = searchParams?.get("reportId");

  console.log("🔍 Appeal Page - Report ID:", reportId);

  // --- FETCH REPORT DATA ON MOUNT (NO AUTH) ---
  useEffect(() => {
    if (!reportId || reportId === 'N/A') {
      setFetchError("Invalid or missing report ID. Cannot load appeal form.");
      setLoading(false);
      return;
    }

    const fetchReportData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!baseUrl) throw new Error("Backend URL not configured.");

        console.log("📡 Fetching report data from PUBLIC endpoint...");

        // Call the PUBLIC report endpoint (no auth required)
        const res = await fetch(`${baseUrl}/api/report-appeal-data/${reportId}/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to fetch report: ${res.status} - ${errorText}`);
        }

        const data = await res.json();
        console.log("✅ Report data fetched:", data);

        // Check if user can appeal
        if (!data.can_appeal) {
          const appealStatus = data.existing_appeal_status || 'PENDING';
          let userMessage = '';
          
          if (appealStatus === 'PENDING') {
            userMessage = 'Your appeal is currently under review by our team. We typically respond within 24-48 hours.';
          } else if (appealStatus === 'APPROVED') {
            userMessage = 'Your appeal has been approved and your account has been restored. You can now log in normally.';
          } else if (appealStatus === 'DENIED') {
            userMessage = 'Your appeal has been reviewed and denied. The sanction remains in effect. Please contact support if you have additional information.';
          } else {
            userMessage = `An appeal has already been submitted for this case (Status: ${appealStatus}). Only one appeal is allowed per violation.`;
          }
          
          setFetchError(userMessage);
          setLoading(false);
          return;
        }

        setReportData(data);
        setFetchError(null);
      } catch (err) {
        console.error("❌ Error fetching report:", err);
        setFetchError(err.message || "Failed to load violation details");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [reportId]);

  const onFilesChange = (items) => {
    setFiles(items.slice(0, 5));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    if (!declaration) {
      setMessage({ type: "error", text: "Please confirm the declaration." });
      return;
    }

    if (!appealText.trim()) {
      setMessage({ type: "error", text: "Please provide a reason for your appeal." });
      return;
    }

    if (!reportId || !reportData?.reported_user?.user_id) {
      setMessage({ type: "error", text: "Missing required data. Cannot submit appeal." });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!baseUrl) throw new Error("Backend URL not configured.");

      const formData = new FormData();
      formData.append("original_report_id", reportId);
      formData.append("user_id", reportData.reported_user.user_id); // ✅ Pass user_id
      formData.append("appeal_reason", appealText);
      formData.append("additional_context", additionalContext);

      files.slice(0, 5).forEach((f) => {
        formData.append("evidence_files", f, f.name);
      });

      console.log("📤 Submitting appeal to PUBLIC endpoint...");

      const res = await fetch(`${baseUrl}/api/submit-appeal/`, {
        method: "POST",
        body: formData,
        // ✅ NO Authorization header - public endpoint
      });

      if (!res.ok) {
        let errorMessage = "Failed to submit appeal";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          const txt = await res.text();
          errorMessage = txt || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await res.json();
      console.log("✅ Appeal submitted:", result);

      setMessage({
        type: "success",
        text: "Your appeal has been submitted. We'll review it within 48 hours.",
      });

      setTimeout(() => {
        router.push("/signin?appealSubmitted=true");
      }, 3000);
    } catch (err) {
      console.error("❌ Appeal submission error:", err);
      setMessage({ type: "error", text: err.message || "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  // --- HELPER FUNCTIONS ---
  const getSanctionDisplay = () => {
    const details = reportData?.sanction_details || {};
    const { level = "NONE", until = null } = details;

    if (level === "BAN") return "Permanent Ban";
    
    if (level === "SUSPENSION") {
      if (until === "INDEFINITE") return "Indefinite Suspension (until appeal review)";
      if (until) {
        try {
          const date = new Date(until);
          if (isNaN(date.getTime())) return `Suspension until ${until}`;
          return `Suspension until ${date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}`;
        } catch (e) {
          return `Suspension until ${until}`;
        }
      }
      return "Suspension (duration unknown)";
    }

    if (level === "WARNING") return "Warning (No account lock)";
    if (level === "NONE") return "No Sanction Currently Active";
    
    return level || "No active sanction found.";
  };

  const getSanctionReason = () => {
    return reportData?.sanction_details?.reason || 
           reportData?.issue_detail || 
           "No reason specified";
  };

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div
        className={`${inter.className} min-h-screen w-full bg-[#050015] text-white px-4 py-12`}
        style={{
          backgroundImage: "url('/assets/bg_register.png')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#0B0521]/80 border border-[#120A2A] rounded-2xl p-8 text-center">
            <p className="text-gray-300">Loading violation details...</p>
          </div>
        </div>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (fetchError) {
    // Determine if this is a "pending appeal" case vs other errors
    const isPendingAppeal = fetchError.includes('under review') || fetchError.includes('currently');
    const isApproved = fetchError.includes('approved');
    const isDenied = fetchError.includes('denied');
    
    return (
      <div
        className={`${inter.className} min-h-screen w-full bg-[#050015] text-white px-4 py-12`}
        style={{
          backgroundImage: "url('/assets/bg_register.png')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex items-center justify-start mb-8">
            <Image
              src="/expair.png"
              alt="Expair Logo"
              width={120}
              height={40}
              className="w-auto h-[40px]"
            />
          </div>

          <div className="bg-[#0B0521]/80 border border-[#120A2A] rounded-2xl p-8 shadow-lg">
            {/* Icon based on status */}
            <div className="flex justify-center mb-6">
              {isPendingAppeal && (
                <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center border-4 border-yellow-500">
                  <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
              {isApproved && (
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border-4 border-green-500">
                  <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {isDenied && (
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center border-4 border-red-500">
                  <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              {!isPendingAppeal && !isApproved && !isDenied && (
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center border-4 border-red-500">
                  <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white text-center mb-4">
              {isPendingAppeal && "Appeal Under Review"}
              {isApproved && "Appeal Approved"}
              {isDenied && "Appeal Denied"}
              {!isPendingAppeal && !isApproved && !isDenied && "Cannot Submit Appeal"}
            </h2>

            {/* Message */}
            <div className={`p-4 rounded-lg mb-6 ${
              isPendingAppeal ? 'bg-yellow-900/20 border border-yellow-500/30' :
              isApproved ? 'bg-green-900/20 border border-green-500/30' :
              isDenied ? 'bg-red-900/20 border border-red-500/30' :
              'bg-red-900/20 border border-red-500/30'
            }`}>
              <p className={`text-center ${
                isPendingAppeal ? 'text-yellow-200' :
                isApproved ? 'text-green-200' :
                'text-red-200'
              }`}>
                {fetchError}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {isApproved && (
                <button
                  onClick={() => router.push("/signin")}
                  className="px-6 py-3 rounded-lg bg-[#0038FF] hover:bg-[#1a4dff] text-white font-medium"
                >
                  Go to Sign In
                </button>
              )}
              
              {(isPendingAppeal || isDenied) && (
                <button
                  onClick={() => router.push("/help")}
                  className="px-6 py-3 rounded-lg border border-[#2a2140] text-gray-200 hover:bg-[#2a2140]"
                >
                  Contact Support
                </button>
              )}

              {!isApproved && (
                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-3 rounded-lg border border-[#2a2140] text-gray-200 hover:bg-[#2a2140]"
                >
                  Return Home
                </button>
              )}
            </div>

            {/* Additional Info for Pending */}
            {isPendingAppeal && (
              <div className="mt-6 text-center text-sm text-gray-400">
                <p>Check your email for updates or visit the notifications page after logging in.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN FORM ---
  return (
    <div
      className={`${inter.className} min-h-screen w-full bg-[#050015] text-white px-4 py-12`}
      style={{
        backgroundImage: "url('/assets/bg_register.png')",
        backgroundPosition: "center",
        backgroundSize: "cover",
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

        <div className="bg-[#0B0521]/80 border border-[#120A2A] rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-2">Submit an Appeal</h2>
          <p className="text-sm text-gray-300 mb-6">
            If you believe the action taken on your account was made in error, please provide
            clear and honest details below. You may upload up to 5 files.
          </p>

          {/* VIOLATION SUMMARY */}
          <div className="mb-6 bg-[#050015] border border-[#2a2140] rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-3">
              <strong>Violation Summary</strong>
            </p>

            {reportData && (
              <div className="space-y-2">
                <p className="text-sm text-gray-200">
                  Record ID: <span className="font-medium text-red-400">#{reportData.report_id}</span>
                </p>

                <p className="text-sm text-gray-200">
                  Violation Type: <span className="font-medium text-orange-400">{reportData.category || "Not specified"}</span>
                </p>

                <p className="text-sm text-gray-200">
                  Issue Detail: <span className="font-medium text-gray-100">{reportData.issue_detail || "No details provided"}</span>
                </p>

                <p className="text-sm text-gray-200">
                  Reason for Action: <span className="font-medium text-gray-100">{getSanctionReason()}</span>
                </p>

                <p className="text-sm text-gray-200">
                  Action: <span className="font-medium text-yellow-300">{getSanctionDisplay()}</span>
                </p>

                {reportData.created_at && (
                  <p className="text-xs text-gray-400 mt-2">
                    Issued on: {new Date(reportData.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
            )}

            <p className="text-xs text-red-300 mt-3">
              Appeals must be truthful and supported by evidence.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Reason for Appeal (required)
              </label>
              <textarea
                value={appealText}
                onChange={(e) => setAppealText(e.target.value)}
                rows={5}
                placeholder="Tell us why you believe this action should be reconsidered..."
                className="w-full p-3 bg-[#050015] border border-[#2a2140] rounded-md text-gray-100 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Additional Context (optional)
              </label>
              <textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                rows={3}
                placeholder="Add any relevant details about the incident..."
                className="w-full p-3 bg-[#050015] border border-[#2a2140] rounded-md text-gray-100 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Evidence (optional, up to 5 files)
              </label>
              <DragDropUploader maxFiles={5} onFilesChange={onFilesChange} />
              {files.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-2">Files ready to upload:</p>
                  <ul className="space-y-1">
                    {files.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between bg-[#050015] p-2 rounded-md border border-[#2a2140]"
                      >
                        <div className="text-sm text-gray-200 truncate">{f.name}</div>
                        <div className="text-xs text-gray-400">
                          {Math.round(f.size / 1024)} KB
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-start gap-3">
              <input
                id="declaration"
                type="checkbox"
                checked={declaration}
                onChange={() => setDeclaration(!declaration)}
                className="mt-1 accent-[#0038FF] rounded"
              />
              <label htmlFor="declaration" className="text-sm text-gray-300">
                I confirm that all information in this appeal is truthful and accurate.
              </label>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#0038FF] hover:bg-[#1a4dff] text-white font-medium shadow disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Appeal"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/help")}
                className="w-full sm:w-auto px-6 py-3 rounded-lg border border-[#2a2140] text-gray-200 hover:bg-[#2a2140]"
              >
                Contact Support
              </button>
            </div>

            {message && (
              <div
                className={`mt-4 p-3 rounded-md ${
                  message.type === "error" ? "bg-red-900/50 border border-red-500" : "bg-green-900/50 border border-green-500"
                }`}
              >
                <p className="text-sm">{message.text}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}