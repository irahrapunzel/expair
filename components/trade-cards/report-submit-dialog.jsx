"use client";
import { CheckCircle, X } from "lucide-react";

export default function ReportSubmitDialog({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[60]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

      {/* Dialog */}
      <div
        className="relative w-[618px] h-[274px] flex flex-col items-center justify-center p-[50px]
          bg-black/40 border-2 border-[#0038FF] shadow-[0px_4px_15px_#D78DE5] backdrop-blur-[40px] rounded-[15px] z-50 isolate"
      >
        {/* Close button */}
        <button
          className="absolute top-[26px] right-[26px] text-white cursor-pointer hover:text-gray-300"
          onClick={onClose}
          aria-label="Close dialog"
          type="button"
        >
          <X className="w-[15px] h-[15px]" />
        </button>

        <div className="flex flex-col items-center gap-[16px] w-[470px]">
          {/* Success Icon */}
          <CheckCircle className="w-[60px] h-[60px] text-[#00E5A1]" />

          {/* Title */}
          <h2 className="text-[25px] font-semibold text-white text-center">
            Report successfully submitted!
          </h2>
          <p className="text-white/80 text-center">
            Our team will review the report soon.
          </p>

          {/* Action button */}
          <button
            onClick={onClose}
            className="w-[258px] h-[40px] bg-[#0038FF] rounded-[15px] text-white text-[16px] shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
