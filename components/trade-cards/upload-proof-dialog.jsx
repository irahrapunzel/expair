"use client";

import { useState, useRef } from "react";
import { Icon } from "@iconify/react";

export default function UploadProofDialog({ isOpen, onClose, onSubmit }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const newFiles = Array.from(files).map(file => ({
      name: file.name,
      file: file
    }));
    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };

  const removeFile = (fileName) => {
    setUploadedFiles(uploadedFiles.filter(file => file.name !== fileName));
  };

  const viewFile = (file) => {
    // Create a URL for the file
    const url = URL.createObjectURL(file);
    window.open(url, '_blank');
  };

  const handleSubmit = () => {
    if (uploadedFiles.length > 0) {
      onSubmit(uploadedFiles);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div 
        className="w-[618px] h-[685px] flex flex-col items-center justify-center p-[50px] relative"
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
          className="absolute top-[30px] right-[30px] text-white hover:text-gray-300"
        >
          <Icon icon="lucide:x" className="w-[15px] h-[15px]" />
        </button>

        <div className="flex flex-col items-center gap-[40px] w-[470px] h-[585px]">
          {/* Title */}
          <div className="flex flex-col items-center w-full">
            <h2 className="text-[25px] font-bold text-white text-center">
              Upload your proof
            </h2>
          </div>

          {/* Upload area */}
          <div 
            className={`w-[470px] h-[250px] border-2 border-dashed rounded-[25px] flex flex-col items-center justify-center ${dragActive ? 'border-white' : 'border-white/60'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-[10px]">
              <Icon icon="lucide:cloud-upload" className="w-[100px] h-[72px] text-white/40" />
              <p className="text-[16px] text-white/60 text-center">
                Drag and drop your files here
              </p>
            </div>
            <button 
              onClick={() => fileInputRef.current.click()}
              className="mt-[25px] px-[54px] py-[13px] border border-white rounded-[10px] text-[13px] text-white hover:bg-[#1A0F3E] transition-colors"
            >
              Browse files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleChange}
              className="hidden"
            />
          </div>

          {/* Uploaded files */}
          <div className="flex flex-col gap-[20px] w-full">
            <p className="text-[16px] text-white">Uploaded file(s)</p>
            
            <div className="flex flex-col gap-[10px] w-full">
              {uploadedFiles.length > 0 ? (
                uploadedFiles.map((file, index) => (
                  <div 
                    key={index} 
                    className="flex flex-row justify-between items-center p-[17px] bg-[#120A2A] rounded-[10px] shadow-lg w-full"
                  >
                    <div className="flex items-center gap-[15px]">
                      <Icon icon="lucide:file" className="w-[20px] h-[20px] text-white" />
                      <span className="text-[16px] text-white">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-[10px]">
                      <button onClick={() => viewFile(file.file)}>
                        <Icon icon="lucide:eye" className="w-[20px] h-[20px] text-white" />
                      </button>
                      <button onClick={() => removeFile(file.name)}>
                        <Icon icon="lucide:x" className="w-[20px] h-[20px] text-white" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-[54px]"></div>
              )}
            </div>
            
            <p className="text-[13px] text-white/40 text-center mt-[10px]">
              Files and final approval are withheld from the other party until both users upload their outputs.
            </p>
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={uploadedFiles.length === 0}
            className="w-[161px] h-[40px] bg-[#0038FF] rounded-[15px] text-white text-[16px] shadow-[0px_0px_15px_#284CCC] disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}