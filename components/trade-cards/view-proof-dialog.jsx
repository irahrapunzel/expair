"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";

export default function ViewProofDialog({ isOpen, onClose, onApprove, onReject, trade }) {
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  if (!isOpen) return null;

  const partnerName = trade?.partnerProofData?.partner_name || trade?.firstname || "Partner";
  const proofArray = trade?.partnerProofData?.proof_file || [];

  // Count downloadable items (i.e., files, not links)
  const downloadableCount = proofArray.filter(item => item.type !== "link").length;

  const handleDownloadAll = () => {
    const downloadableItems = proofArray.filter(item => item.type !== "link");
    if (downloadableItems.length === 0) return;

    downloadableItems.forEach((item, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = item.url;
        link.download = item.filename || `proof-${index + 1}`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 100);
    });
  };

  const handleDownloadSingle = (item) => {
    const link = document.createElement('a');
    link.href = item.url;
    link.download = item.filename || 'proof-file';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewFile = (item) => {
    window.open(item.url, "_blank");
  };

  const handleApprove = () => setShowApproveConfirm(true);
  const handleReject = () => setShowRejectConfirm(true);

  const handleConfirmApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove();
      setShowApproveConfirm(false);
    } catch (error) {
      console.error("Approval failed:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleConfirmReject = async () => {
    setIsRejecting(true);
    try {
      await onReject();
      setShowRejectConfirm(false);
    } catch (error) {
      console.error("Rejection failed:", error);
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div
          className="w-[650px] max-h-[90vh] flex flex-col p-[40px] relative overflow-y-auto"
          style={{
            background: "rgba(0, 0, 0, 0.05)",
            border: "2px solid #0038FF",
            boxShadow: "0px 4px 15px #D78DE5",
            backdropFilter: "blur(30px)",
            borderRadius: "15px"
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-[25px] right-[25px] text-white hover:text-gray-300"
          >
            <Icon icon="lucide:x" className="w-[20px] h-[20px]" />
          </button>

          <div className="flex flex-col items-center gap-[30px] w-full mt-[20px]">
            {/* Title */}
            <h2 className="text-[28px] font-bold text-white text-center">
              {partnerName}&apos;s proof
            </h2>

            {/* Proof Items List */}
            <div className="flex flex-col gap-[15px] w-full">
              <p className="text-[18px] text-white font-medium">
                Submitted proof ({proofArray.length} {proofArray.length === 1 ? 'item' : 'items'})
              </p>

              <div className="flex flex-col gap-[12px] w-full">
                {proofArray.length > 0 ? (
                  proofArray.map((item, index) => {
                    const isLink = item.type === "link";
                    const isImage = !isLink && item.file_type?.startsWith("image/");

                    return (
                      <div
                        key={index}
                        className="flex flex-row justify-between items-center p-[20px] bg-[#120A2A] rounded-[12px] shadow-lg w-full"
                      >
                        <div className="flex items-center gap-[15px] min-w-0 flex-1">
                          {/* Thumbnail / Icon based on type */}
                          {isImage ? (
                            <div className="w-[50px] h-[50px] rounded-[8px] overflow-hidden flex-shrink-0 border border-white/20">
                              <img src={item.url} alt={item.filename} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-[50px] h-[50px] rounded-[8px] bg-[#1A0F3E] border border-white/20 flex items-center justify-center flex-shrink-0">
                              <Icon icon={isLink ? "lucide:link" : "lucide:file"} className="w-[24px] h-[24px] text-white/60" />
                            </div>
                          )}

                          {/* File Info */}
                          <div className="flex flex-col gap-[2px] min-w-0 flex-1">
                            <span className="text-[16px] text-white truncate" title={item.filename}>
                              {item.filename || "Untitled"}
                            </span>
                            <span className="text-[12px] text-white/50">
                              {isLink ? "External Link" : isImage ? "Image file" : "Document"}
                            </span>
                          </div>
                        </div>

                        {/* Actions - View and Download */}
                        <div className="flex items-center gap-[12px] flex-shrink-0 text-white">
                          <button onClick={() => handleViewFile(item)} className="hover:bg-white/10 p-2 rounded transition-colors" title={isLink ? "Open link" : "View file"}>
                            <Icon icon={isLink ? "lucide:external-link" : "lucide:eye"} className="w-[20px] h-[20px]" />
                          </button>
                          {!isLink && (
                            <button onClick={() => handleDownloadSingle(item)} className="hover:bg-white/10 p-2 rounded transition-colors" title="Download file">
                              <Icon icon="lucide:download" className="w-[20px] h-[20px]" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-[70px] flex items-center justify-center">
                    <p className="text-[14px] text-white/40">No proof submitted</p>
                  </div>
                )}
              </div>
            </div>

            {/* Question and Disclaimer */}
            <div className="flex flex-col items-center gap-[20px] w-full mt-[15px]">
              <p className="text-[16px] text-white text-center">
                Is {partnerName}&apos;s output or service satisfactory?
              </p>

              <p className="text-[13px] text-white/40 text-center leading-relaxed">
                Please review the uploaded proof carefully. You are responsible for verifying its validity. Expair is not liable for any disputes arising from user-submitted files.
              </p>
            </div>

            {/* Actions - Download All, Reject, Approve */}
            <div className="flex justify-between items-center w-full mt-[15px] mb-[10px]">
              <button
                onClick={handleDownloadAll}
                disabled={downloadableCount === 0}
                className="flex items-center gap-[15px] text-white hover:text-white/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={downloadableCount === 0 ? "No files to download" : `Download ${downloadableCount} file(s)`}
              >
                <Icon icon="lucide:download" className="w-[30px] h-[30px]" />
                <span className="text-[16px]">
                  {downloadableCount === 0 ? "No Files to Download" : `Download All (${downloadableCount})`}
                </span>
              </button>

              <div className="flex gap-[15px]">
                <button
                  onClick={handleReject}
                  disabled={isApproving || isRejecting}
                  className="w-[110px] h-[40px] border-2 border-red-500 rounded-[15px] text-red-500 text-[16px] hover:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isApproving || isRejecting}
                  className="w-[110px] h-[40px] bg-[#0038FF] rounded-[15px] text-white text-[16px] shadow-[0px_0px_15px_#284CCC] disabled:opacity-50"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Confirmation Dialog */}
      {showApproveConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
          <div
            className="w-[618px] flex flex-col items-center justify-center p-[50px] relative"
            style={{
              background: "rgba(0, 0, 0, 0.4)",
              border: "2px solid #0038FF",
              boxShadow: "0px 4px 15px #D78DE5",
              backdropFilter: "blur(40px)",
              borderRadius: "15px"
            }}
          >
            <button onClick={() => !isApproving && setShowApproveConfirm(false)} disabled={isApproving} className="absolute top-[26px] right-[26px] text-white hover:text-gray-300">
              <Icon icon="lucide:x" className="w-[15px] h-[15px]" />
            </button>
            <div className="flex flex-col items-center gap-[30px] w-[470px]">
              <h2 className="text-[25px] font-bold text-white text-center">
                Are you sure you want to approve {partnerName}&apos;s output?
              </h2>
              <div className="flex gap-[25px]">
                <button onClick={() => setShowApproveConfirm(false)} disabled={isApproving} className="w-[160px] h-[40px] border-2 border-[#0038FF] rounded-[15px] text-[#0038FF] text-[16px] disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleConfirmApprove} disabled={isApproving} className="w-[168px] h-[40px] bg-[#0038FF] rounded-[15px] text-white text-[16px] shadow-[0px_0px_15px_#284CCC] disabled:opacity-50 flex items-center justify-center">
                  {isApproving ? (
                    <div className="flex items-center gap-[8px]">
                      <Icon icon="lucide:loader-2" className="w-[16px] h-[16px] animate-spin" />
                      <span>Approving...</span>
                    </div>
                  ) : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Dialog */}
      {showRejectConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
          <div
            className="w-[618px] flex flex-col items-center justify-center p-[50px] relative"
            style={{
              background: "rgba(0, 0, 0, 0.4)",
              border: "2px solid #FF3838",
              boxShadow: "0px 4px 15px #E58D8D",
              backdropFilter: "blur(40px)",
              borderRadius: "15px"
            }}
          >
            <button onClick={() => !isRejecting && setShowRejectConfirm(false)} disabled={isRejecting} className="absolute top-[26px] right-[26px] text-white hover:text-gray-300">
              <Icon icon="lucide:x" className="w-[15px] h-[15px]" />
            </button>
            <div className="flex flex-col items-center gap-[30px] w-[470px]">
              <h2 className="text-[25px] font-bold text-white text-center">
                Are you sure you want to reject {partnerName}&apos;s output?
              </h2>
              <div className="flex gap-[25px]">
                <button onClick={() => setShowRejectConfirm(false)} disabled={isRejecting} className="w-[160px] h-[40px] border-2 border-[#FF3838] rounded-[15px] text-[#FF3838] text-[16px] disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleConfirmReject} disabled={isRejecting} className="w-[168px] h-[40px] bg-[#FF3838] rounded-[15px] text-white text-[16px] shadow-[0px_0px_15px_#CC4242] disabled:opacity-50 flex items-center justify-center">
                  {isRejecting ? (
                    <div className="flex items-center gap-[8px]">
                      <Icon icon="lucide:loader-2" className="w-[16px] h-[16px] animate-spin" />
                      <span>Rejecting...</span>
                    </div>
                  ) : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}