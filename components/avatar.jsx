"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function ProfileAvatar({ src, size, className = "" }) {
  const DEFAULT_AVATAR = "/assets/defaultavatar.png";
  const [imgSrc, setImgSrc] = useState(src);
  const [isError, setIsError] = useState(false);

  // 🔍 DEBUG: Log when src changes
  useEffect(() => {
    // Optional: Remove logs for production to clean up console
    // console.log("🖼️ ProfileAvatar received src:", src);
    setImgSrc(src);
    setIsError(false); 
  }, [src]);

  // Helper to handle both Cloudinary and local URLs
  const getImageSrc = (imagePath) => {
    if (!imagePath) return DEFAULT_AVATAR;
    if (imagePath.includes("defaultavatar.png")) return DEFAULT_AVATAR;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;

    if (imagePath.includes("/")) {
      return `https://res.cloudinary.com/dyj3ojsip/image/upload/${imagePath.replace(
        /^\/+/,
        ""
      )}`;
    }
    return `/media/${imagePath}`;
  };

  const finalSrc = isError ? DEFAULT_AVATAR : getImageSrc(imgSrc);

  // ✅ FIX: Only apply fixed width/height style if 'size' is explicitly provided.
  // This allows className (Tailwind) to control dimensions if 'size' is omitted.
  const style = {
    border: "2px solid #ccc",
    ...(size ? { width: size, height: size } : {}),
  };

  return (
    <div
      className={`relative overflow-hidden rounded-full shrink-0 ${className}`}
      style={style}
    >
      <Image
        src={finalSrc}
        alt="Profile picture"
        fill
        // ✅ Kung walang size, assume responsive (fill parent/100vw)
        sizes={size ? `${size}px` : "(max-width: 768px) 100vw, 33vw"}
        className="object-cover object-center"
        onError={(e) => {
          setIsError(true);
        }}
        unoptimized={finalSrc.startsWith("http")}
      />
    </div>
  );
}