"use client";
import { CheckCircle, X } from "lucide-react";

export default function ReportSubmitDialog({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[60] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

      {/* Dialog */}
      <div
        className="relative w-[90%] max-w-[618px] h-auto min-h-[274px] flex flex-col items-center justify-center p-8 sm:p-[50px]
          bg-black/40 border-2 border-[#0038FF] shadow-[0px_4px_15px_#D78DE5] backdrop-blur-[40px] rounded-[15px] z-50 isolate"
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 sm:top-[26px] sm:right-[26px] text-white cursor-pointer hover:text-gray-300"
          onClick={onClose}
          aria-label="Close dialog"
          type="button"
        >
          <X className="w-[15px] h-[15px]" />
        </button>

        <div className="flex flex-col items-center gap-4 sm:gap-[16px] w-full max-w-[470px]">
          {/* Success Icon */}
          <CheckCircle className="w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] text-[#00E5A1]" />

          {/* Title */}
          <h2 className="text-[20px] sm:text-[25px] font-semibold text-white text-center">
            Report successfully submitted!
          </h2>
          <p className="text-white/80 text-center text-sm sm:text-base">
            Our team will review the report soon.
          </p>

          {/* Action button */}
          <button
            onClick={onClose}
            className="w-full max-w-[258px] h-[40px] bg-[#0038FF] rounded-[15px] text-white text-[16px] shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors mt-2"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}