"use client";

import Image from "next/image";
import { Inter } from "next/font/google";
import { Icon } from "@iconify/react";

const inter = Inter({ subsets: ["latin"] });

export default function ProfilePage() {
  const user = {
    name: "John Doe",
    verified: true,
    username: "@johndoe25",
    joined: "March 2025",
    rating: 5.0,
    reviews: 25,
    rank: "Rising Star",
    level: 15,
    bio: "Passionate video editor with 4+ years of experience crafting engaging content for creators and small brands. Always up to trade skills and help others grow—let’s connect and collaborate!",
    avatar: "/defaultavatar.png",
  };

  return (
    <div
      className={`px-6 pb-20 pt-10 mx-auto max-w-[940px] text-white ${inter.className}`}
    >
      {/* SECTION 0 - PAGE TITLE */}
      <h4 className="text-[22px] font-semibold mb-10">My Profile</h4>

      {/* SECTION 1 - BASIC INFORMATION */}
      <div className="flex gap-[50px] relative">
        {/* Profile Picture */}
        <div className="w-[200px] h-[200px] relative flex-shrink-0">
          <Image
            src={user.avatar}
            alt={`${user.name}'s avatar`}
            width={200}
            height={200}
            className="rounded-full shadow-[0_0_50px_#906EFF99] object-cover"
          />
        </div>

        {/* Right Section */}
        <div className="flex-1 flex flex-col">
          {/* Top Row: Name + Verified Badge */}
          <div className="flex items-center gap-3 mb-[15px]">
            <h3 className="text-[26px] font-semibold">{user.name}</h3>
            {user.verified && (
              <Icon
                icon="mdi:check-decagram"
                className="text-[#0038FF] w-6 h-6"
              />
            )}
          </div>

          {/* Username + Joined Date */}
          <div className="flex text-white/50 text-[16px] mb-[20px]">
            <span>{user.username}</span>
            <span className="mx-[25px]">•</span>
            <span>Joined {user.joined}</span>
          </div>

          {/* Buttons: Saved, Edit, Settings */}
          <div className="absolute top-0 right-0 flex gap-4">
            <button className="text-white hover:bg-[#1A0F3E] px-3 py-2 flex items-center gap-2 rounded-[10px] transition">
              <Icon icon="mdi:bookmark" className="w-5 h-5" />
              Saved
            </button>
            <button className="text-white hover:bg-[#1A0F3E] px-3 py-2 flex items-center gap-2 rounded-[10px] transition">
              <Icon icon="mdi:pencil" className="w-5 h-5" />
              Edit
            </button>
            <button className="text-white hover:bg-[#1A0F3E] p-2 rounded-[10px] transition">
              <Icon icon="mdi:cog" className="w-5 h-5" />
            </button>
          </div>

          {/* Rating + Rank + Level */}
          <div className="flex items-center gap-6 mb-[20px]">
            <div className="flex items-center gap-2">
              <Icon
                icon="lucide:star"
                className="text-[#906EFF] w-5 h-5 fill-current"
              />
              <span className="font-semibold text-[16px]">
                {user.rating.toFixed(1)}{" "}
                <span className="text-white/50">({user.reviews})</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Image
                src="/assets/lvlrank_icon.png"
                alt="Rank"
                width={20}
                height={20}
              />
              <span>{user.rank}</span>
            </div>

            <div className="flex items-center gap-2">
              <Image
                src="/assets/lvlbar.png"
                alt="Level bar"
                width={220}
                height={20}
              />
              <span className="text-[16px]">LVL {user.level}</span>
            </div>
          </div>

          {/* Bio + Get Verified */}
          <div className="flex justify-between items-end w-full">
            <p className="w-full leading-[1.6]">{user.bio}</p>
            {!user.verified && (
              <Button className="bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm rounded-[15px] px-5 py-2 shadow-[0px_0px_15px_#284CCC]">
                Get Verified
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
