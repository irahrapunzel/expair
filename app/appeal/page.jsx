"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import DragDropUploader from "../../components/admin/dragdropuploader";
import { useSession } from "next-auth/react";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
console.log("--- APPEAL PAGE COMPONENT STARTED ---");
export default function AppealPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

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

  // Get report ID from URL
  const reportId = searchParams?.get("originalReportId") || searchParams?.get("reportId");

  console.log(`2. Initial Check: reportId=${reportId}, Session Access=${!!session?.access}`);

  // --- FETCH REPORT DATA ON MOUNT ---
  useEffect(() => {
    if (!reportId || !session?.access) {
      setLoading(false);
      return;
    }

    const fetchReportData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!baseUrl) throw new Error("Backend URL not configured.");

        console.log("1. Starting API Fetch. Report ID:", reportId, "Token status:", !!session.access);

        // Call the admin report detail endpoint
        const res = await fetch(`${baseUrl}/api/admin/report-detail/${reportId}/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch report: ${res.status}`);
        }

        const data = await res.json();
        console.log("2B. API Fetch Succeeded. Raw Data:", data);

        setReportData(data);
        setFetchError(null);
      } catch (err) {
        console.error("3. Critical Error during Fetch or Parsing:", err);

        setFetchError(err.message || "Failed to load violation details");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [reportId, session?.access]);

  const onFilesChange = (items) => {
    setFiles(items.slice(0, 5));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const token = session?.access;

    if (!token) {
      setMessage({ type: "error", text: "Session expired. Please log in again." });
      return;
    }

    if (!declaration) {
      setMessage({ type: "error", text: "Please confirm the declaration." });
      return;
    }

    if (!appealText.trim()) {
      setMessage({ type: "error", text: "Please provide a reason for your appeal." });
      return;
    }

    if (!reportId) {
      setMessage({ type: "error", text: "Missing violation record ID. Cannot submit appeal." });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!baseUrl) throw new Error("Backend URL not configured.");

      const formData = new FormData();
      formData.append("original_report_id", reportId);
      formData.append("appeal_reason", appealText);
      formData.append("additional_context", additionalContext);

      files.slice(0, 5).forEach((f) => {
        formData.append("evidence_files", f, f.name);
      });

      const res = await fetch(`${baseUrl}/submit-appeal/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to submit appeal");
      }

      setMessage({
        type: "success",
        text: "Your appeal has been submitted. We'll review it within 48 hours.",
      });

      setTimeout(() => {
        router.push("/login?appealSubmitted=true");
      }, 3000);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  // --- HELPER FUNCTIONS ---
  const getSanctionDisplay = () => {

    console.log("🔍 Report Data Loaded:", reportData);

    // Safely retrieve sanction_details, defaulting to an empty object if null/undefined
    const details = reportData?.sanction_details || {};

    // Safely destructure, setting defaults to "NONE" and null if keys are missing
    const { level = "NONE", until = null } = details;

    // *** THIS LOG WILL NOW ALWAYS SHOW UP ***
    console.log("🔍 Sanction Display - level:", level, "until:", until);
    // ***************************************

    if (level === "BAN") {
      return "Permanent Ban";
    }

    if (level === "SUSPENSION") {
      if (until === "INDEFINITE") {
        return "Indefinite Suspension (until appeal review)";
      }

      if (until) {
        try {
          const date = new Date(until);
          if (isNaN(date.getTime())) {
            return `Suspension until ${until}`;
          }
          return `Suspension until ${date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}`;
        } catch (e) {
          console.error("Date parsing error:", e);
          return `Suspension until ${until}`;
        }
      }

      return "Suspension (duration unknown)";
    }

    if (level === "WARNING") {
      return "Warning (No account lock)";
    }

    // Fallback if level exists but is NONE or the default value
    if (level === "NONE") {
      return "No Sanction Currently Active";
    }

    return level || "No active sanction found for this report.";
  };

  const getSanctionReason = () => {
    // Safely access reason from sanction_details
    if (reportData?.sanction_details?.reason) {
      return reportData.sanction_details.reason;
    }

    // Fallback: Extract the reason from the Report's modified description field
    if (reportData?.description) {
      const match = reportData.description.match(/\[Admin Action: \w+\]: (.*)/);
      if (match && match[1]) {
        return match[1].trim(); // Returns "try suspension ang sama mo kasi"
      }
    }

    // Fallback: Report's original issue detail
    if (reportData?.issue_detail) {
      return reportData.issue_detail;
    }

    return "No reason specified";
  };

  // --- LOADING & ERROR STATES ---
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

  if (fetchError && !reportData) {
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
          <div className="bg-[#0B0521]/80 border border-[#120A2A] rounded-2xl p-8">
            <p className="text-red-400 text-center">{fetchError}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-6 py-2 rounded-lg border border-[#2a2140] text-gray-200 mx-auto block"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

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

          {/* DYNAMIC VIOLATION SUMMARY */}
          <div className="mb-6 bg-[#050015] border border-[#2a2140] rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-3">
              <strong>Violation Summary</strong>
            </p>

            {reportData ? (
              <div className="space-y-2">
                {/* Record ID */}
                <p className="text-sm text-gray-200">
                  Record ID:{" "}
                  <span className="font-medium text-red-400">
                    #{reportData.report_id}
                  </span>
                </p>

                {/* Violation Category */}
                <p className="text-sm text-gray-200">
                  Violation Type:{" "}
                  <span className="font-medium text-orange-400">
                    {reportData.sanction_applied ? (
                      reportData.sanction_applied === "DISMISS"
                        ? "Dismissed"
                        : reportData.sanction_applied
                    ) : "None (Report Submitted)"}
                  </span>
                </p>

                {/* Issue Detail */}
                <p className="text-sm text-gray-200">
                  Issue Detail:{" "}
                  <span className="font-medium text-gray-100">
                    {reportData.issue_detail || "No details provided"}
                  </span>
                </p>

                {/* Sanction Applied (from Report model) */}
                <p className="text-sm text-gray-200">
                  Sanction Applied:{" "}
                  <span className="font-medium text-orange-400">
                    {reportData.sanction_applied ? (
                      reportData.sanction_applied === "DISMISS"
                        ? "Dismissed"
                        : reportData.sanction_applied
                    ) : "None"}
                  </span>
                </p>

                {/* Sanction Reason (from User.sanction_details) */}
                <p className="text-sm text-gray-200">
                  Reason for Action:{" "}
                  <span className="font-medium text-gray-100">
                    {getSanctionReason()} 
                  </span>
                </p>

                {/* Action Taken (formatted display) */}
                <p className="text-sm text-gray-200">
                  Action:{" "}
                  <span className="font-medium text-yellow-300">
                    {getSanctionDisplay()}
                  </span>
                </p>

                {/* Issue Date */}
                {reportData.created_at && (
                  <p className="text-xs text-gray-400 mt-2">
                    Issued on:{" "}
                    {new Date(reportData.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Report data not available</p>
            )}

            <p className="text-xs text-red-300 mt-3">
              Appeals must be truthful and supported by evidence.
            </p>
          </div>
          {/* END DYNAMIC VIOLATION SUMMARY */}

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
                onClick={() => router.back()}
                className="w-full sm:w-auto px-6 py-3 rounded-lg border border-[#2a2140] text-gray-200"
              >
                Cancel
              </button>
            </div>

            {message && (
              <div
                className={`mt-4 p-3 rounded-md ${message.type === "error" ? "bg-red-900" : "bg-green-900"
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