import Image from "next/image";
import { useState } from "react";

export default function AvatarNameCell({ name, username, avatarUrl }) {
  const [imgError, setImgError] = useState(false);
  const displayAvatar = imgError ? "/assets/defaultavatar.png" : (avatarUrl || "/assets/defaultavatar.png");
  
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/10">
        <Image
          src={displayAvatar}
          alt={name || username}
          fill
          className="object-cover"
          unoptimized={displayAvatar.startsWith("http")}
          onError={() => {
            console.log(`❌ Avatar failed to load: ${avatarUrl}`);
            setImgError(true);
          }}
        />
      </div>
      <div>
        <p className="text-white font-medium">{name}</p>
        <p className="text-white/40 text-sm">{username}</p>
      </div>
    </div>
  );
}