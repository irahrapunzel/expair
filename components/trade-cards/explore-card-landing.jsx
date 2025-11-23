import Image from "next/image";
import { Icon } from "@iconify/react";

export default function ExploreCardLanding({
    name,
    rating,
    ratingCount,
    level,
    need,
    offer,
    deadline,
    profilePicUrl,
    username,
    isVerified = false,
}) {
    const profileImageSrc = profilePicUrl || "/assets/defaultavatar.png";

    let formattedDeadline = "No Deadline";
    try {
        if (deadline && deadline !== "No Deadline") {
            // Create a Date object from the ISO string (e.g., "2025-12-01T00:00:00.000Z")
            const dateObj = new Date(deadline);
            if (!isNaN(dateObj)) {
                // Use Intl.DateTimeFormat for "Month Day, Year" format
                formattedDeadline = dateObj.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                formattedDeadline = `Deadline: ${formattedDeadline}`;
            }
        }
    } catch (e) {
        console.error("Error formatting deadline:", e);
        formattedDeadline = "Invalid Date";
    }

    return (
        <div
            className="w-[455px] rounded-[20px] border-[3px] border-[#284CCC]/80 p-[25px] gap-[15px] flex flex-col relative transition-all duration-300 hover:scale-[1.01]"
            style={{
                background:
                    "radial-gradient(circle at top right, #3D2490 0%, #120A2A 69%)",
            }}
        >
            {/* Top Row */}
            <div className="flex justify-between items-start w-full">
                {/* ... (Existing profile and rating code) ... */}

                <div className="flex gap-[10px]">
                    {/* Profile Picture (NO LINK) */}
                    <div className="flex-shrink-0">
                        <div className="relative w-[25px] h-[25px] rounded-full overflow-hidden">
                            <Image
                                src={profileImageSrc}
                                alt={`${name}'s avatar`}
                                width={25}
                                height={25}
                                className="rounded-full object-cover"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-[5px]">
                        <div className="flex items-center gap-2">
                            {/* Name (NO LINK) */}
                            <span className="text-base font-medium">
                                {name}
                            </span>

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
            </div>

            {/* Needs + Offer */}
            <div className="flex justify-between items-start gap-4 flex-wrap">
                {/* Needs */}
                <div className="flex flex-col gap-2 flex-1 min-w-[45%] items-start">
                    <span className="text-sm text-white/80 font-medium">Needs</span>
                    <div
                        className="inline-block px-[15px] py-[7px] rounded-[15px] border-[2px] border-[#5A5AFF] bg-[#5A5AFF33] text-sm text-white/90 max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap"
                        title={need}
                    >
                        {need}
                    </div>
                </div>

                {/* Can offer */}
                <div className="flex flex-col gap-2 flex-1 min-w-[45%] items-end">
                    <span className="text-sm text-white/80 font-medium">Can offer</span>
                    <div
                        className="inline-block px-[15px] py-[7px] rounded-[15px] border-[2px] border-[#906EFF] bg-[#906EFF33] text-sm text-white/90 max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap text-right"
                        title={offer}
                    >
                        {offer}
                    </div>
                </div>
            </div>

            {/* Date */}
            <div className="mt-[0px] flex justify-end">
                {/* 🚀 Using the new formatted deadline here */}
                <span className="text-sm text-white/50">{formattedDeadline}</span>
            </div>
        </div>
    );
}