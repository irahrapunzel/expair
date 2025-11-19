"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import { useRouter, useSearchParams } from "next/navigation";
import DragDropUploader from "../../../../../components/admin/dragdropuploader";

const inter = Inter({ subsets: ["latin"] });

export default function AppealPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const violationId = searchParams?.get("violationId") || "unknown";

  const [appealText, setAppealText] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [files, setFiles] = useState([]);
  const [declaration, setDeclaration] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const onFilesChange = (items) => {
    // items is an array of File
    setFiles(items.slice(0, 5));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!declaration) {
      setMessage({ type: "error", text: "Please confirm the declaration." });
      return;
    }
    if (!appealText.trim()) {
      setMessage({ type: "error", text: "Please provide a reason for your appeal." });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!baseUrl) throw new Error("Backend URL not configured.");

      const formData = new FormData();
      formData.append("violation_id", violationId);
      formData.append("reason", appealText);
      formData.append("context", additionalContext);

      files.slice(0, 5).forEach((f, idx) => {
        formData.append("evidence", f, f.name);
      });

      // Example endpoint - replace with your actual endpoint
      const res = await fetch(`${baseUrl}/api/appeals/submit/`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to submit appeal");
      }

      setMessage({ type: "success", text: "Your appeal has been submitted. We'll review it within 48 hours." });
      // optionally redirect to "appeal status" page
      setTimeout(() => {
        router.push("/admin/dashboard/reports/appeal-status");
      }, 1500);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

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
            <Image src="/expair.png" alt="Expair Logo" width={120} height={40} className="w-auto h-[40px]" />
        </div>

        <div className="bg-[#0B0521]/80 border border-[#120A2A] rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-2">Submit an Appeal</h2>
          <p className="text-sm text-gray-300 mb-6">
            If you believe the action taken on your account was made in error, please provide clear and honest details below.
            You may upload up to 5 files (images, screenshots, PDFs, chat logs).
          </p>

          <div className="mb-6 bg-[#050015] border border-[#2a2140] rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1"><strong>Violation Summary</strong></p>
            <p className="text-sm text-gray-200">Violation Type: <span className="font-medium text-gray-100">Suspension</span></p>
            <p className="text-sm text-gray-200">Reason Cited: <span className="font-medium text-gray-100">Failed to deliver agreed service</span></p>
            <p className="text-sm text-gray-200">Action Taken: <span className="font-medium text-gray-100">7-day suspension</span></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Reason for Appeal (required)</label>
              <textarea
                value={appealText}
                onChange={(e) => setAppealText(e.target.value)}
                rows={5}
                placeholder="Tell us why you believe this action should be reconsidered..."
                className="w-full p-3 bg-[#050015] border border-[#2a2140] rounded-md text-gray-100 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Additional Context (optional)</label>
              <textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                rows={3}
                placeholder="Add any relevant details, e.g. technical issues, misunderstandings..."
                className="w-full p-3 bg-[#050015] border border-[#2a2140] rounded-md text-gray-100 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Evidence (optional, up to 5 files)</label>
              <DragDropUploader maxFiles={5} onFilesChange={onFilesChange} />
              {files.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-2">Files ready to upload:</p>
                  <ul className="space-y-1">
                    {files.map((f, i) => (
                      <li key={i} className="flex items-center justify-between bg-[#050015] p-2 rounded-md border border-[#2a2140]">
                        <div className="text-sm text-gray-200 truncate">{f.name}</div>
                        <div className="text-xs text-gray-400">{Math.round(f.size / 1024)} KB</div>
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
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#0038FF] hover:bg-[#1a4dff] text-white font-medium shadow"
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
              <div className={`mt-4 p-3 rounded-md ${message.type === "error" ? "bg-red-900" : "bg-green-900"}`}>
                <p className="text-sm">{message.text}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
