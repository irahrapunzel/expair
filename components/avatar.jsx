"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function ProfileAvatar({ src, size = 40, className = "" }) {
  const DEFAULT_AVATAR = "/assets/defaultavatar.png";
  const [imgSrc, setImgSrc] = useState(src);
  const [isError, setIsError] = useState(false);

  // 🔍 DEBUG: Log when src changes
  useEffect(() => {
    console.log("🖼️ ProfileAvatar received src:", src);
    console.log("🖼️ Final image source:", getImageSrc(src));
    setImgSrc(src);
    setIsError(false); // Reset error state when src changes
  }, [src]);

  // Helper to handle both Cloudinary and local URLs
  const getImageSrc = (imagePath) => {
    if (!imagePath) {
      return DEFAULT_AVATAR;
    }

    // prevent Cloudinary from trying to load the local default
    if (imagePath.includes("defaultavatar.png")) {
      return DEFAULT_AVATAR;
    }

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    if (imagePath.includes("/")) {
      return `https://res.cloudinary.com/dyj3ojsip/image/upload/${imagePath.replace(
        /^\/+/,
        ""
      )}`;
    }

    return `/media/${imagePath}`;
  };

  const finalSrc = isError ? DEFAULT_AVATAR : getImageSrc(imgSrc);

  return (
    <div
      className={`relative overflow-hidden rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        border: "2px solid #ccc", // 🔍 DEBUG: Visual indicator
      }}
    >
      <Image
        src={finalSrc}
        alt="Profile picture"
        fill
        sizes={`${size}px`}
        className="object-cover object-center"
        onError={(e) => {
          console.error("❌ Image failed to load:", finalSrc, e);
          setIsError(true);
        }}
        onLoad={() => {
          console.log("✅ Image loaded successfully:", finalSrc);
        }}
        unoptimized={finalSrc.startsWith("http")}
      />
    </div>
  );
}
