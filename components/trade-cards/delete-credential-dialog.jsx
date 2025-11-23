"use client";

import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { Icon } from "@iconify/react";

/**
 * Custom modal component for confirming credential deletion.
 * * @param {boolean} isOpen - Controls visibility.
 * @param {function} onClose - Function to close the dialog.
 * @param {function} onConfirmDelete - Function to execute the deletion action.
 * @param {string} credentialTitle - The title of the credential being deleted.
 */
export default function DeleteCredentialDialog({
  isOpen,
  onClose,
  onConfirmDelete,
  credentialTitle,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen && !showSuccess) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirmDelete(); // Execute the actual delete logic (API call)
      
      setSubmitting(false);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error during credential deletion:', error);
      setSubmitting(false);
      // Optional: Display error message here if needed
      // For now, we'll rely on the parent component's error handling.
      onClose(); // Close on failure to allow user to retry
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onClose(); 
  };

  // Handle close with proper cleanup
  const handleClose = () => {
    setShowSuccess(false);
    setSubmitting(false);
    onClose();
  };


  return (
    <>
      {/* Main Delete Confirmation Dialog */}
      {isOpen && !showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={handleClose}
          ></div>

          {/* Dialog - Adjusted width/height for content */}
          <div className="relative w-[650px] h-auto p-10 flex flex-col justify-center items-center bg-black/40 border-2 border-[#0038FF] shadow-[0px_4px_15px_#D78DE5] backdrop-blur-[40px] rounded-[15px] z-50 isolate">
            {/* Close button */}
            <button
              className="absolute top-5 right-5 text-white cursor-pointer flex items-center justify-center w-[30px] h-[30px] bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              onClick={handleClose}
              aria-label="Close dialog"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <Trash2 className="w-10 h-10 text-red-500 mb-4" />

            {/* Title */}
            <h2 className="font-bold text-[22px] leading-tight text-center text-white mb-2">
              Confirm Deletion
            </h2>
            <p className="text-[18px] text-white/90 text-center mb-6">
                Are you sure you want to permanently delete: <br />
                <span className="font-semibold italic text-[#D78DE5]">"{credentialTitle}"</span>
            </p>

            {/* Action section */}
            <div className="flex flex-col items-center gap-6 w-full">
              <div className="flex flex-row justify-center items-center gap-6 w-full">
                
                {/* Cancel button */}
                <button
                    className="w-[150px] h-[45px] py-2 rounded-[15px] text-white border-2 border-[#0038FF] bg-transparent text-[16px] hover:bg-white/10 transition duration-300 disabled:opacity-50"
                    onClick={handleClose}
                    disabled={submitting}
                >
                    Cancel
                </button>

                {/* Confirm Delete button (Red) */}
                <button
                  className="w-[150px] h-[45px] py-2 flex flex-row justify-center items-center gap-2 bg-red-600 rounded-[15px] shadow-[0px_0px_15px_rgba(255,0,0,0.5)] text-white text-[16px] font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleConfirm}
                  disabled={submitting}
                  type="button"
                >
                  <Trash2 className="w-4 h-4" />
                  {submitting ? "Deleting..." : "Delete"}
                </button>
              </div>

              {/* Warning message */}
              <p className="w-full text-[13px] leading-[120%] text-center text-white/60">
                This action is irreversible and cannot be undone.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70]">
          <div
            className="w-[450px] h-[200px] flex flex-col items-center justify-center p-[50px] relative"
            style={{
              background: "rgba(0, 0, 0, 0.4)",
              border: "2px solid #0038FF",
              boxShadow: "0px 4px 15px #D78DE5",
              backdropFilter: "blur(40px)",
              borderRadius: "15px",
            }}
          >
            {/* Close button */}
            <button
              onClick={handleSuccessClose}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
              type="button"
            >
              <Icon icon="lucide:x" className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center gap-5 w-full">
              <h2 className="text-[20px] font-semibold text-white text-center">
                Credential successfully deleted.
              </h2>

              <button
                onClick={handleSuccessClose}
                className="w-[120px] h-[40px] bg-[#0038FF] rounded-[15px] text-white text-[16px] shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors"
                type="button"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}