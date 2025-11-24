import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ActiveTradeHome({
  name,
  profilePic,
  userId, // 👈 Required for reporting
  username,
  offering,
  totalXp,
  deadline,
  tradereqId, // 👈 Required for reporting
  onReportOpen, // 👈 NEW PROP from page.jsx
  isVerified = false,
}) {
  const [imageError, setImageError] = useState(false);
  const router = useRouter();


  const handleImageError = () => {
    setImageError(true);
  };

  const handleCardClick = () => {
    // Redirect to the active trades page/detail page
    router.push('/home/trades/active'); 
  };

  // 🆕 Handler calls the parent's function to open the modal globally
  const handleReportClick = (e) => {
    e.stopPropagation(); // Prevent card click (handleCardClick)
    onReportOpen(userId, tradereqId); // Pass IDs up to the global state
  };
  
  return (
    <div
          className="flex flex-col w-full md:w-[455px] rounded-[20px] border-[3px] border-[#284CCC]/80 p-[25px] gap-[20px] relative cursor-pointer transition-all duration-300 hover:scale-[1.01]"
          style={{
            background: 'radial-gradient(circle at top right, #3D2490 0%, #120A2A 69%)'
          }}
          onClick={handleCardClick}
        >
          {/* Top Row */}
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-[10px]">
              {/* Clickable Profile Picture */}
              {username ? (
                <Link
                  href={`/home/profile/${username}`}
                  className="flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative w-[25px] h-[25px] rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#0038FF] transition-all">
                    <Image
                      src={
                        !imageError && profilePic
                          ? profilePic
                          : "/assets/defaultavatar.png"
                      }
                      alt={`${name}'s avatar`}
                      width={25}
                      height={25}
                      className="rounded-full object-cover"
                      onError={handleImageError}
                    />
                  </div>
                </Link>
              ) : (
                <Image
                  src={
                    !imageError && profilePic
                      ? profilePic
                      : "/assets/defaultavatar.png"
                  }
                  alt="Avatar"
                  width={25}
                  height={25}
                  className="rounded-full object-cover"
                  onError={handleImageError}
                />
              )}

              <div className="flex items-center gap-[8px]">
                {/* Clickable Name */}
                <div className="flex items-center gap-2">
                  {username ? (
                    <Link
                      href={`/home/profile/${username}`}
                      className="hover:text-[#0038FF] transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-base cursor-pointer">{name}</p>
                    </Link>
                  ) : (
                    <p className="text-base">{name}</p>
                  )}
                  {isVerified && (
                    <div className="relative group">
                      <div
                        className="w-[1.2em] h-[1.2em] bg-gradient-to-tr from-[#FF19FB] via-[#7B00FF] to-[#6DDFFF]"
                        style={{
                          WebkitMask:
                            "url('https://api.iconify.design/mdi/check-decagram.svg') no-repeat center / contain",
                          mask: "url('https://api.iconify.design/mdi/check-decagram.svg') no-repeat center / contain",
                        }}
                      />
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
                        Verified User
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-[4px]">
                </div>
              </div>
            </div>
            <button
              onClick={handleReportClick}
              className="flex items-center justify-center w-8 h-8 text-white hover:text-red-500 rounded-lg transition-colors"
              title="Report user"
            >
              <Icon icon="mdi:alert-circle-outline" className="text-lg" />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-[15px]">
            <div className="flex justify-between items-center w-full">
              <p className="text-base">{offering}</p>
              <p className="text-base font-semibold text-[#906EFF] whitespace-nowrap">{totalXp} XP</p>
            </div>
            <div className="flex justify-end w-full">
              <p className="text-sm text-white/50">Due on {deadline}</p>
            </div>
          </div>
        </div>
  );
}