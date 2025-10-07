"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProfileAvatar({ src, size = 40, className = "" }) {
  const DEFAULT_AVATAR = "/assets/defaultavatar.png";
  const [imgSrc, setImgSrc] = useState(src);
  const [isError, setIsError] = useState(false);

  // Helper to handle both Cloudinary and local URLs
  const getImageSrc = (imagePath) => {
    if (!imagePath) return DEFAULT_AVATAR;
    
    // If it's already a full URL (Cloudinary), use as-is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Otherwise, it's a local path - prepend /media/
    return `/media/${imagePath}`;
  };

  return (
    <div
      className={`relative overflow-hidden rounded-full ${className}`}
      style={{
        width: size,
        height: size,
      }}
    >
      <Image
        src={isError ? DEFAULT_AVATAR : getImageSrc(imgSrc)}
        alt="Profile picture"
        fill
        sizes={`${size}px`}
        className="object-cover object-center"
        onError={() => {
          console.error("❌ Image failed to load:", imgSrc);
          setIsError(true);
        }}
        unoptimized={getImageSrc(imgSrc).startsWith('http')} // ✅ Important for Cloudinary
      />
    </div>
  );
}