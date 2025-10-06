"use client";

import Image from "next/image";

export default function ProfileAvatar({ src, size = 40, className = "" }) {
  const DEFAULT_AVATAR = "/assets/defaultavatar.png";

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
        src={getImageSrc(src)}
        alt="Profile picture"
        fill
        sizes={`${size}px`}
        className="object-cover object-center"
      />
    </div>
  );
}