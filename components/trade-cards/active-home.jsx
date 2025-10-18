import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ActiveTradeHome({ 
  name, 
  profilePic, 
  username,
  offering, 
  totalXp, 
  deadline 
}) {
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  const handleImageError = () => {
    setImageError(true);
  };

  const handleCardClick = () => {
    router.push('/home/trades/active');
  };

  return (
    <div
      className="flex flex-col w-[455px] rounded-[20px] border-[3px] border-[#284CCC]/80 p-[25px] gap-[20px] relative cursor-pointer transition-all duration-300 hover:scale-[1.01]"
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
            <div className="flex items-center gap-[4px]">
            </div>
          </div>
        </div>
        <Link 
          href="/home/help"
          onClick={(e) => e.stopPropagation()}
        >
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white hover:bg-white/10 rounded-lg transition-colors">
            <Icon
              icon="mdi:alert-circle-outline"
              className="text-white text-base"
            />
            Report
          </button>
        </Link>
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