// @ts-nocheck
"use client";

import Image from "next/image";
import { Icon } from "@iconify/react";
import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ReportDialog from "../trade-cards/report-dialog";

export default function ExploreCard({
  name,
  rating,
  ratingCount,
  level,
  need,
  offer,
  deadline,
  profilePicUrl,
  userId,
  username,
  tradereqId,
  onInterestedClick,
}) {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef(null);
  const hiddenKey = "explore_hidden_trades";

  useEffect(() => {
    console.log("🧠 Session object:", session);
  }, [session]);

  // 🔹 Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleImageError = () => setImageError(true);

  const handleReport = () => {
    setShowMenu(false);
    setShowReportDialog(true);
  };

  const handleNotInterested = () => {
    setShowMenu(false);
    try {
      const list = JSON.parse(localStorage.getItem(hiddenKey) || "[]");
      const set = new Set(Array.isArray(list) ? list : []);
      if (tradereqId) set.add(tradereqId);
      localStorage.setItem(hiddenKey, JSON.stringify([...set]));
      window.dispatchEvent(new CustomEvent("explore:hide-updated"));
    } catch (e) {
      console.error("Failed to persist not interested:", e);
    }
  };

  // 🔹 Submit report handler
  const handleReportSubmit = async (reportData) => {
    try {
      const token =
        session?.access ||
        session?.user?.access ||
        session?.user?.accessToken ||
        localStorage.getItem("access");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/reports/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reported_user: userId,
            tradereq: tradereqId,
            category: reportData.category,
            issue_detail: reportData.issue,
            description: reportData.details,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to submit report");
      alert("✅ Report submitted successfully!");
    } catch (err) {
      console.error("❌ Error submitting report:", err);
      alert("Failed to submit report. Please try again.");
    }
  };

  return (
    <>
      <div
        className="w-full max-w-[440px] rounded-[20px] border-[3px] border-[#284CCC]/80 p-[25px] gap-[15px] flex flex-col relative"
        style={{
          background:
            "radial-gradient(circle at top right, #3D2490 0%, #120A2A 69%)",
        }}
      >
        {/* Top Row */}
        <div className="flex justify-between items-start w-full">
          <div className="flex gap-[10px]">
            {/* Profile Picture */}
            {username ? (
              <Link
                href={`/home/profile/${username}`}
                className="flex-shrink-0"
              >
                <div className="relative w-[25px] h-[25px] rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#0038FF] transition-all">
                  <Image
                    src={
                      !imageError && profilePicUrl
                        ? profilePicUrl
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
              <div className="relative w-[25px] h-[25px] rounded-full overflow-hidden">
                <Image
                  src={
                    !imageError && profilePicUrl
                      ? profilePicUrl
                      : "/assets/defaultavatar.png"
                  }
                  alt={`${name}'s avatar`}
                  width={25}
                  height={25}
                  className="rounded-full object-cover"
                  onError={handleImageError}
                />
              </div>
            )}

            <div className="flex flex-col gap-[5px]">
              {username ? (
                <Link
                  href={`/home/profile/${username}`}
                  className="hover:text-[#0038FF] transition-colors"
                >
                  <span className="text-base font-medium cursor-pointer">
                    {name}
                  </span>
                </Link>
              ) : (
                <span className="text-base font-medium">{name}</span>
              )}

              <div className="flex gap-[15px] items-center text-sm text-white/90">
                {/* Rating */}
                <div className="flex gap-1 items-center">
                  <Icon
                    icon="mdi:star"
                    className="text-[#B18AFF]"
                    width={14}
                    height={14}
                  />
                  <span className="font-bold">{rating.toFixed(1)}</span>
                  <span className="text-white/70">({ratingCount})</span>
                </div>

                {/* Level */}
                <div className="flex flex-col gap-1">
                  <div className="flex gap-1 items-center">
                    <Image
                      src="/assets/lvlrank_icon.png"
                      alt="Level"
                      width={12}
                      height={12}
                    />
                    <span className="text-white/80">LVL {level}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <Icon icon="mdi:dots-horizontal" className="text-white text-xl" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-[160px] bg-[#1A0F3E] rounded-[10px] border border-[#2B124C] z-20 shadow-lg overflow-hidden">
                <button
                  className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#2C1C52] w-full transition-colors"
                  onClick={handleReport}
                >
                  <Icon
                    icon="mdi:alert-circle-outline"
                    className="text-white text-base"
                  />
                  Report
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#2C1C52] w-full transition-colors"
                  onClick={handleNotInterested}
                >
                  <Icon
                    icon="mdi:eye-off-outline"
                    className="text-white text-base"
                  />
                  Not Interested
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Needs + Offer */}
        <div className="flex justify-between items-start gap-4 flex-wrap">
          {/* Needs */}
          <div className="flex flex-col gap-2 flex-1 min-w-[45%] items-start">
            <span className="text-sm text-white/80 font-medium">Needs</span>
            <div
              className="inline-block px-[15px] py-[7px] rounded-[15px] border-[2px] border-[#5A5AFF] bg-[#5A5AFF33] text-sm text-white/90 w-full max-w-full truncate"
              title={need} // para makita full text on hover
            >
              {need}
            </div>
          </div>

          {/* Can offer */}
          <div className="flex flex-col gap-2 flex-1 min-w-[45%] items-end">
            <span className="text-sm text-white/80 font-medium">Can offer</span>
            <div
              className="inline-block px-[15px] py-[7px] rounded-[15px] border-[2px] border-[#906EFF] bg-[#906EFF33] text-sm text-white/90 w-full max-w-full truncate text-right"
              title={offer}
            >
              {offer}
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="mt-[0px] flex justify-end">
          <span className="text-sm text-white/50">{deadline}</span>
        </div>

        {/* CTA Button */}
        <div className="mt-[0px] flex justify-center">
          <Button
            variant="default"
            size="default"
            className="px-[30px] py-[10px] text-white bg-[#0038FF] hover:bg-[#1a4dff] rounded-[15px] shadow-[0_0_15px_0_#284CCC] text-sm font-medium"
            onClick={onInterestedClick}
          >
            I'm interested
          </Button>
        </div>
      </div>

      {/* Report Dialog */}
      <ReportDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        reportedUser={userId}
        tradeId={tradereqId}
      />
    </>
  );
}
