"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";
import { Shield, Heart, Star } from "lucide-react"; 
import Image from "next/image";
import clsx from "clsx";

const inter = Inter({ subsets: ["latin"] });

export default function SafetyGuidelines() {
  const router = useRouter();
  const [expandedCard, setExpandedCard] = useState(null);

  // Generate stars once (lazy init) — positions won't change on re-renders
  const [stars] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      size: Math.random() * 20 + 10,
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
    }))
  );

  const handleAgree = () => {
    router.push("/register/flow");
  };

  const cards = [
    {
      id: 1,
      icon: Shield,
      title: "Be safe",
      description:
        "Exercise caution. If users want to conduct trades in their own homes, we highly encourage to check out each other's profiles first, such as their past trades, certificates, connected socials, links, etc.",
      gradientBg:
        "linear-gradient(135deg, rgba(0, 56, 255, 0.35), rgba(0, 56, 255, 0.05))",
      gradientBorder:
        "linear-gradient(135deg, rgba(0, 56, 255, 0.6), rgba(0, 100, 255, 0.4))",
      shadow: "shadow-[0_0_30px_rgba(0,56,255,0.5)]",
    },
    {
      id: 2,
      icon: Heart,
      title: "Stay safe",
      description:
        "Be vigilant. We highly encourage that users start a conversation first or meet each other virtually before meeting for an onsite trade. Meetups should happen in public, if possible.",
      gradientBg:
        "linear-gradient(135deg, rgba(144, 110, 255, 0.35), rgba(144, 110, 255, 0.05))",
      gradientBorder:
        "linear-gradient(135deg, rgba(144, 110, 255, 0.6), rgba(180, 150, 255, 0.4))",
      shadow: "shadow-[0_0_30px_rgba(144,110,255,0.5)]",
    },
    {
      id: 3,
      icon: Star,
      title: "Keep safe",
      description:
        "Act prudently. Proper ratings help to reduce fraud and scams. Remember to rate and review other users accordingly, and report any bad behavior.",
      gradientBg:
        "linear-gradient(135deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.05))",
      gradientBorder:
        "linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.4))",
      shadow: "shadow-[0_0_30px_rgba(255,255,255,0.4)]",
    },
  ];

  return (
    <div
      className={`relative flex min-h-screen justify-center bg-cover bg-center overflow-hidden ${inter.className}`}
      style={{ backgroundImage: "url('/assets/bg_register.png')" }}
    >
      {/* Stars (fixed positions) */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute text-white pointer-events-none select-none"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            fontSize: `${star.size}px`,
            animation: `spin ${star.duration}s linear infinite`,
            animationDelay: `${star.delay}s`,
            opacity: 0.9,
          }}
        >
          +
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 max-w-6xl w-full text-center space-y-6 px-4 md:px-8 pt-[80px] md:pt-[123px] pb-[120px]">
        {/* Header */}
        <div
          className={`flex flex-col items-center mb-8 md:mb-12 transition-opacity duration-300 ${
            expandedCard ? "opacity-20" : "opacity-100"
          }`}
        >
          <h1 className="text-xl md:text-[39px] font-[700] mb-[10px] md:mb-[15px] flex items-center justify-center gap-3 text-white">
            Welcome to
            <Image
              src="/assets/logos/Logotype=Logotype M.png"
              alt="Expair Logo"
              width={176}
              height={54}
              className="inline-block w-[120px] md:w-[176px] h-auto"
            />
            !
          </h1>
          <p className="text-[14px] md:text-[16px] font-[400] text-[rgba(255,255,255,0.60)] px-2">
            Your safety is our top priority. Please follow these guidelines to keep our community safe.
          </p>
        </div>

        {/* Cards */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-8 justify-center items-stretch my-12 md:my-16">
          {cards.map((card) => {
            const Icon = card.icon;
            const isExpanded = expandedCard === card.id;
            const isDimmed = expandedCard && !isExpanded;

            return (
              <div
                key={card.id}
                onClick={() => setExpandedCard(isExpanded ? null : card.id)}
                className={clsx(
                  "backdrop-blur-xl p-6 cursor-pointer transition-all duration-500 ease-out rounded-[20px]",
                  card.shadow,
                  isExpanded
                    ? "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] md:w-[500px] h-auto scale-105"
                    : "relative w-full md:w-[280px] hover:scale-105",
                  isDimmed && "opacity-30 grayscale scale-95 pointer-events-none"
                )}
                style={{
                  background: card.gradientBg,
                  border: "2px solid transparent",
                  backgroundClip: "padding-box",
                  position: isExpanded ? "fixed" : "relative",
                }}
              >
                {/* Gradient border */}
                <div
                  className="absolute inset-0 rounded-[20px] p-[2px]"
                  style={{
                    background: card.gradientBorder,
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    pointerEvents: "none",
                  }}
                />

                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 rounded-full bg-white/20 text-white">
                    <Icon
                      size={isExpanded ? 48 : 32}
                      className="transition-all duration-500"
                      strokeWidth={1.5}
                      fill="white"
                      color="white"
                    />
                  </div>

                  <h3 className="text-[20px] md:text-[24px] font-[600] text-white">
                    {card.title}
                  </h3>

                  <p
                    className={clsx(
                      "text-[14px] md:text-[15px] font-[400] leading-relaxed text-white/90 transition-all duration-500",
                      isExpanded
                        ? "opacity-100 max-h-[500px]"
                        : "opacity-0 md:opacity-100 max-h-0 md:max-h-[200px] overflow-hidden md:overflow-visible"
                    )}
                  >
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={`transition-opacity duration-300 ${expandedCard ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
          <p className="text-[12px] md:text-[14px] font-[400] text-white max-w-md mx-auto mb-[20px] md:mb-[30px] mt-[40px] md:mt-[60px] px-2">
            By clicking on "I agree", you acknowledge that you have read and agree to Expair's{" "}
            <a href="/terms" className="underline text-[#6DDFFF] hover:text-[#8EECFF]">Terms and Conditions</a> and{" "}
            <a href="/privacy-policy" className="underline text-[#6DDFFF] hover:text-[#8EECFF]">Privacy Policy</a>.
          </p>

          <div className="mt-4 flex justify-center items-center">
            <Button
              onClick={handleAgree}
              className="cursor-pointer w-[200px] md:w-[240px] h-[45px] md:h-[50px] px-[20px] md:px-[38px] py-[10px] md:py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-[18px] md:text-[20px] font-normal transition rounded-[12px] md:rounded-[15px]"
            >
              I agree
            </Button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
