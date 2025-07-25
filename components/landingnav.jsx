"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

// Section IDs to observe
const sections = ["our-goal", "how-it-works", "FAQs"];

export default function LandingNav() {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        threshold: 0.5,
      }
    );

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={`${inter.className} w-full sticky top-0 z-50 py-4 sm:py-6 text-[16px] leading-[120%]`}
      style={{
        background:
          "linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)",
        backdropFilter: "blur(50px)",
        WebkitBackdropFilter: "blur(50px)",
      }}
    >
      <div
        className="flex items-center justify-between mx-auto max-w-[1440px] px-6 md:px-[80px]"
      >
        {/* Left: Logo */}
        <div className="flex-shrink-0">
          <Image
            src="/expair.png"
            alt="Expair Logo"
            width={120}
            height={40}
            className="w-auto h-[40px]"
          />
        </div>

        {/* Center: Menu */}
        <nav className="flex items-center gap-[50px] px-[35px] py-[20px] rounded-[20px] bg-[#120A2A]">
          {sections.map((section) => (
            <a
              key={section}
              href={`#${section}`}
              className={`transition text-white hover:text-[#6C8BFF] ${
                activeSection === section ? "font-semibold text-[#0038FF]" : ""
              }`}
            >
              {section === "FAQs"
                ? "FAQs"
                : section
                    .replaceAll("-", " ")
                    .replace(/\b\w/g, (char) => char.toUpperCase())}
            </a>
          ))}
          <Link
            href="/help"
            className="text-white hover:text-[#6C8BFF] transition"
          >
            Help
          </Link>
        </nav>

        {/* Right: Sign In Button */}
        <div className="flex-shrink-0 ml-[50px]">
          <Link href="/signin">
            <Button className="font-normal w-[160px] h-[40px] px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] text-white text-sm sm:text-[16px] hover:bg-[#1a4dff] transition rounded-[15px]">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
