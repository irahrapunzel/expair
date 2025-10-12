"use client";
import { useState } from "react";
import { Icon } from "@iconify/react";
import { useSession } from "next-auth/react";
import ReportSubmitDialog from "./report-submit-dialog"; // 🆕 import

export default function ReportDialog({ isOpen, onClose, reportedUser, tradeId }) {
  const { data: session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedIssue, setSelectedIssue] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); // 🆕 success modal state

  const categories = {
    "User Behavior": [
      "Harassment or bullying",
      "Disrespectful or rude language",
      "Spam or scam activity",
      "Inappropriate requests",
    ],
    "Trade Issues": [
      "Did not deliver promised service",
      "Provided low-quality or incomplete work",
      "Misleading description",
      "Attempted to trade outside Expair",
    ],
    "Profile Content": [
      "Fake or impersonation account",
      "Offensive or explicit content",
      "False skills or credentials",
    ],
    "Safety & Privacy": [
      "Sharing private information",
      "Suspicious links or attachments",
      "Threatening or harmful behavior",
    ],
    "Others": ["Other"],
  };

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedCategory || !selectedIssue) {
      alert("Please select a category and issue.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access}`,
        },
        body: JSON.stringify({
          reported_user: reportedUser,
          tradereq: tradeId,
          category: selectedCategory,
          issue_detail: selectedIssue,
          description: details,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to submit report");
      }

      console.log("✅ Report submitted successfully");
      setShowSuccess(true); // 🆕 show popup instead of alert
    } catch (error) {
      console.error("❌ Report error:", error);
      alert("Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* main dialog */}
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-[#120A2A] border border-white/30 rounded-[15px] w-[500px] max-w-[90%] p-8 relative text-white shadow-lg">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white"
          >
            <Icon icon="lucide:x" className="w-5 h-5" />
          </button>

          <h2 className="text-2xl font-bold mb-6 text-center">Report User</h2>

          {/* Category Select */}
          <div className="mb-5">
            <label className="block mb-2 text-sm text-white/70">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedIssue("");
              }}
              className="w-full bg-[#0E0820] border border-white/40 rounded-md p-3 text-white"
            >
              <option value="">Select a category</option>
              {Object.keys(categories).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Issue Select */}
          {selectedCategory && (
            <div className="mb-5">
              <label className="block mb-2 text-sm text-white/70">Issue</label>
              <select
                value={selectedIssue}
                onChange={(e) => setSelectedIssue(e.target.value)}
                className="w-full bg-[#0E0820] border border-white/40 rounded-md p-3 text-white"
              >
                <option value="">Select an issue</option>
                {categories[selectedCategory].map((issue) => (
                  <option key={issue} value={issue}>
                    {issue}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Optional Details */}
          <div className="mb-6">
            <label className="block mb-2 text-sm text-white/70">
              Additional details (optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              className="w-full bg-[#0E0820] border border-white/40 rounded-md p-3 text-white resize-none"
              placeholder="Add more context here..."
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-[#0038FF] rounded-md font-semibold hover:bg-[#1a4dff] transition-all disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </div>

      {/* 🆕 success modal */}
      <ReportSubmitDialog
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          onClose(); // close main dialog too
        }}
      />
    </>
  );
}
