"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useSession } from "next-auth/react";

export default function UploadProofDialog({
  isOpen,
  onClose,
  onSubmit,
  title = "Upload your proof",
  mode = "upload",
  tradereq_id = null,
  showSuccess = false,
  successData = null,
  onSuccessClose = null,
}) {
  const { data: session } = useSession();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [linkProof, setLinkProof] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch existing proof when in view mode
  useEffect(() => {
    const fetchExistingProof = async () => {
      if (!isOpen || mode !== "view" || !tradereq_id || !session?.access) return;

      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-proof/${tradereq_id}/my-proof/`,
          {
            headers: { Authorization: `Bearer ${session.access}` },
          }
        );

        if (response.ok) {
          const proofData = await response.json();
          if (Array.isArray(proofData.proof_file)) {
            const existingProofs = proofData.proof_file.map(item => ({
              ...item,
              name: item.filename,
              isExisting: true,
              isLink: item.type === 'link',
              isImage: item.file_type?.startsWith("image/"),
              preview: item.file_type?.startsWith("image/") ? item.url : null,
            }));
            setUploadedFiles(existingProofs);
          }
        } else {
          console.error("Failed to fetch existing proof");
        }
      } catch (error) {
        console.error("Error fetching existing proof:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingProof();
  }, [isOpen, mode, tradereq_id, session?.access]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
        uploadedFiles.forEach(file => {
            if (file.preview && !file.isExisting) {
                URL.revokeObjectURL(file.preview);
            }
        });
        setUploadedFiles([]);
        setLinkProof("");
        setSubmitting(false);
    }
  }, [isOpen]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => {
        if (file.preview && !file.isExisting) {
            URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (mode !== 'upload') return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (mode !== 'upload') return;
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };
  
  const handleChange = (e) => {
    e.preventDefault();
    if (mode !== 'upload') return;
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const newFiles = Array.from(files).map((file) => ({
      name: file.name,
      file: file,
      isImage: file.type.startsWith("image/"),
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      isExisting: false,
      type: "file",
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };
  
  const handleAddLink = () => {
    if (!linkProof.trim()) return;
    try {
        new URL(linkProof);
    } catch (_) {
        alert("Please enter a valid URL.");
        return;
    }
    const newLink = {
      name: linkProof,
      url: linkProof,
      isExisting: false,
      isLink: true,
      type: "link",
    };
    setUploadedFiles(prev => [...prev, newLink]);
    setLinkProof("");
  };

  const removeFile = (name) => {
    const fileToRemove = uploadedFiles.find(f => f.name === name);
    if (fileToRemove?.preview && !fileToRemove.isExisting) {
        URL.revokeObjectURL(fileToRemove.preview);
    }
    setUploadedFiles(prev => prev.filter(item => item.name !== name));
  };
  
  const viewFile = (file) => {
      const urlToOpen = file.isExisting ? file.url : URL.createObjectURL(file.file);
      window.open(urlToOpen, "_blank");
  };

  const handleSubmit = () => {
    const newFiles = uploadedFiles.filter(item => !item.isExisting && item.type === 'file');
    const newLinks = uploadedFiles.filter(item => !item.isExisting && item.type === 'link');

    if (newFiles.length === 0 && newLinks.length === 0) {
      alert("Please add at least one new file or link to submit.");
      return;
    }

    setSubmitting(true);
    onSubmit({
      files: newFiles,
      links: newLinks
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

      {/* Main Upload Dialog */}
      <div 
        className="w-[650px] max-h-[90vh] flex flex-col p-[40px] relative overflow-y-auto" 
        style={{
          background: "rgba(0, 0, 0, 0.05)",
          border: "2px solid #0038FF",
          boxShadow: "0px 4px 15px #D78DE5",
          backdropFilter: "blur(30px)",
          borderRadius: "15px",
        }}
      >
        <button onClick={onClose} className="absolute top-[25px] right-[25px] text-white hover:text-gray-300">
          <Icon icon="lucide:x" className="w-[20px] h-[20px]" />
        </button>

        <div className="flex flex-col items-center gap-[30px] w-full mt-[20px]">
          <h2 className="text-[28px] font-bold text-white text-center">{title}</h2>

          {/* UPLOAD UI (only in upload mode) */}
          {mode === "upload" && (
            <>
              {/* Drag & Drop Area */}
              <div
                className={`w-full h-[200px] border-2 border-dashed rounded-[25px] flex flex-col items-center justify-center ${dragActive ? "border-white" : "border-white/60"}`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              >
                <Icon icon="lucide:cloud-upload" className="w-[80px] h-[60px] text-white/40" />
                <p className="text-[16px] text-white/60 text-center">Drag & drop files or</p>
                <button onClick={() => fileInputRef.current.click()} className="mt-2 text-[#6DDFFF] hover:underline">
                  Browse files
                </button>
                <input ref={fileInputRef} type="file" multiple onChange={handleChange} className="hidden" />
              </div>

              {/* Link Input Area */}
              <div className="flex flex-col w-full gap-2">
                <label className="text-[16px] text-white/80 font-medium">Or submit a link as proof</label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    placeholder="https://your-proof-link.com"
                    value={linkProof}
                    onChange={(e) => setLinkProof(e.target.value)}
                    className="flex-1 bg-[#120A2A] border border-white/40 rounded-[12px] p-3 text-white text-sm placeholder:text-white/40 outline-none"
                  />
                  <button onClick={handleAddLink} className="px-5 bg-[#0038FF] text-white rounded-[12px] text-sm font-medium hover:bg-[#1a4dff] transition-colors">
                    Add Link
                  </button>
                </div>
              </div>
            </>
          )}

          {/* PROOF LIST (for both upload and view modes) */}
          <div className="flex flex-col gap-[15px] w-full">
            <p className="text-[18px] text-white font-medium">
              {mode === "view" ? `Your submitted proof (${uploadedFiles.length})` : `Uploaded items (${uploadedFiles.length})`}
            </p>
            <div className="flex flex-col gap-[12px] w-full min-h-[70px]">
              {loading ? (
                <div className="flex justify-center items-center h-[70px]">
                  <p className="text-white/60">Loading proof...</p>
                </div>
              ) : uploadedFiles.length > 0 ? (
                uploadedFiles.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-[20px] bg-[#120A2A] rounded-[12px] shadow-lg">
                    <div className="flex items-center gap-[15px] min-w-0 flex-1">
                      {/* Thumbnail or Icon */}
                      {item.isImage && item.preview ? (
                        <div className="w-[50px] h-[50px] rounded-[8px] overflow-hidden shrink-0 border border-white/20">
                            <img src={item.preview} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-[50px] h-[50px] rounded-[8px] bg-[#1A0F3E] flex items-center justify-center shrink-0 border border-white/20">
                          <Icon icon={item.isLink ? "lucide:link" : "lucide:file"} className="w-6 h-6 text-white/80" />
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[16px] text-white truncate" title={item.name}>{item.name}</span>
                        <span className="text-[12px] text-white/50">{item.isLink ? "External Link" : "File"}</span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-[12px] text-white">
                      <button onClick={() => window.open(item.url || URL.createObjectURL(item.file), "_blank")} title={item.isLink ? "Open Link" : "View File"} className="hover:text-gray-300">
                        <Icon icon={item.isLink ? 'lucide:external-link' : 'lucide:eye'} className="w-5 h-5" />
                      </button>
                      {(mode === "upload" && !item.isExisting) && (
                        <button onClick={() => removeFile(item.name)} title="Remove" className="hover:text-red-400">
                            <Icon icon="lucide:x" className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex justify-center items-center h-[70px]">
                  <p className="text-white/40">{mode === 'view' ? "No proof submitted yet." : "No files or links added yet."}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center w-full mt-[25px]">
            {mode === "upload" && (
              <button
                onClick={handleSubmit}
                disabled={uploadedFiles.filter(f => !f.isExisting).length === 0 || submitting}
                className="w-[180px] h-[45px] bg-[#0038FF] rounded-[15px] text-white text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                    <>
                        <Icon icon="lucide:loader-2" className="animate-spin w-5 h-5" />
                        <span>Submitting...</span>
                    </>
                ) : "Submit"}
              </button>
            )}
            {mode === "view" && (
               <button onClick={onClose} className="w-[180px] h-[45px] bg-[#0038FF] rounded-[15px] text-white text-base font-medium">
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}