import { useRef, useState } from "react";
import { Icon } from "@iconify/react";

export default function IDUploadDropzone({
  idFile,
  idPreviewUrl,
  handleIdFileChange,
}) {
  const inputRef = useRef();
  const [isDragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateFile(file);
  };

  const validateFile = (file) => {
    const validTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      alert("Please upload an image (PNG, JPG, JPEG). PDFs are not allowed.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      alert("File is too large (max 15MB).");
      return;
    }
    handleIdFileChange(file);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-[12px] p-6 text-center cursor-pointer transition ${
        isDragging
          ? "border-[#0038FF] bg-[#0038FF]/10"
          : "border-white/20 bg-white/5 hover:bg-white/10"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current.click()}
    >
      {!idFile ? (
        <div className="text-white/70 space-y-2">
          <Icon icon="mdi:upload" className="w-8 h-8 mx-auto" />
          <p>
            Drag & drop your ID here, or{" "}
            <span className="text-white font-medium">browse</span>
          </p>
          <p className="text-xs text-white/50">
            Accepted: JPG, JPEG, PNG (Max 15MB)
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 w-full">
          {idPreviewUrl && (
            <img
              src={idPreviewUrl}
              alt="Preview"
              className="max-h-[120px] rounded-[10px] border border-white/10"
            />
          )}

          {/* filename row */}
          <div className="flex items-center gap-2 w-full max-w-[90%] justify-center">
            <span
              className="block text-white text-sm truncate max-w-[220px]"
              title={idFile.name}
            >
              {idFile.name}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleIdFileChange(null);
                inputRef.current.value = "";
              }}
              className="text-red-400 hover:text-red-300 text-xs flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg"
        className="hidden"
        onChange={(e) => validateFile(e.target.files?.[0] || null)}
      />
    </div>
  );
}
