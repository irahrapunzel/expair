"use client";

import React, { useCallback, useRef, useState } from "react";

/**
 * Simple drag & drop uploader.
 * Props:
 *  - maxFiles (number)
 *  - onFilesChange (filesArray)
 */
export default function DragDropUploader({ maxFiles = 5, onFilesChange }) {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef();

  const handleFiles = useCallback(
    (incoming) => {
      const arr = Array.from(incoming || []);
      const combined = [...files, ...arr].slice(0, maxFiles);
      setFiles(combined);
      onFilesChange?.(combined);
    },
    [files, maxFiles, onFilesChange]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const onChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = null;
  };

  const removeFile = (index) => {
    const copy = [...files];
    copy.splice(index, 1);
    setFiles(copy);
    onFilesChange?.(copy);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDrop={onDrop}
        className={`w-full border-2 rounded-md p-4 cursor-pointer ${dragActive ? "border-dashed border-[#6DDFFF]" : "border-[#2a2140]"} bg-[#050015]`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={onChange}
          className="hidden"
          accept="image/*,application/pdf,text/plain,application/json"
        />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300">Drag & drop files here, or click to browse.</p>
            <p className="text-xs text-gray-400 mt-1">Accepted: images, PDFs, text. Max {maxFiles} files.</p>
          </div>
          <div className="text-xs text-gray-400">Max {maxFiles}</div>
        </div>

        {files.length > 0 && (
          <div className="mt-3 space-y-2">
            {files.map((f, idx) => (
              <div key={idx} className="flex items-center justify-between bg-[#0B0521] p-2 rounded-md border border-[#2a2140]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#050015] rounded">
                    <span className="text-xs text-gray-300">{f.name.split(".").pop()?.toUpperCase()}</span>
                  </div>
                  <div className="text-sm text-gray-200 truncate">{f.name}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-gray-400">{Math.round(f.size / 1024)} KB</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="text-xs text-red-400 px-2 py-1 rounded hover:bg-red-900/30"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
