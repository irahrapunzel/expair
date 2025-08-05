"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

const sections = ["our-goal", "how-it-works", "FAQs"];
const helpSections = [
  "technical",
  "reporting",
  "product",
  "account",
  "tutorials",
  "policies",
  "contact",
];

export default function LandingNav() {
  const [activeSection, setActiveSection] = useState("");
  const [menuOpen, setMenuOpen] = useState(false); // <-- for mobile menu toggle
  const pathname = usePathname();

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

    if (pathname === "/help") {
      helpSections.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }

    return () => observer.disconnect();
  }, [pathname]);

  const isOnHelpPage = pathname === "/help";

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
      <div className="flex items-center justify-between mx-auto max-w-[1440px] px-6 md:px-[80px]">
        {/* Left: Logo */}
        <div className="flex-shrink-0">
          <Link href="/#hero" scroll={true}>
            <Image
              src="/expair.png"
              alt="Expair Logo"
              width={120}
              height={40}
              className="cursor-pointer"
            />
          </Link>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-[50px] px-[35px] py-[20px] rounded-[20px] bg-[#120A2A]">
          {sections.map((section) => {
            const href = isOnHelpPage ? `/#${section}` : `#${section}`;

            return (
              <a
                key={section}
                href={href}
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
            );
          })}
          <Link
            href="/help"
            className={`transition text-white hover:text-[#6C8BFF] ${
              activeSection && helpSections.includes(activeSection)
                ? "font-semibold text-[#0038FF]"
                : ""
            }`}
          >
            Help
          </Link>
        </nav>

        {/* Sign In Button (Desktop) */}
        <div className="hidden md:flex flex-shrink-0 ml-[50px]">
          <Link href="/signin">
            <Button className="cursor-pointer font-normal w-[160px] h-[40px] px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] text-white text-sm sm:text-[16px] hover:bg-[#1a4dff] transition rounded-[15px]">
              Sign in
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {/* Hamburger Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-8 h-8"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#120A2A] px-6 py-4 flex flex-col gap-4">
          {sections.map((section) => {
            const href = isOnHelpPage ? `/#${section}` : `#${section}`;
            return (
              <a
                key={section}
                href={href}
                onClick={() => setMenuOpen(false)}
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
            );
          })}
          <Link
            href="/help"
            onClick={() => setMenuOpen(false)}
            className={`transition text-white hover:text-[#6C8BFF] ${
              activeSection && helpSections.includes(activeSection)
                ? "font-semibold text-[#0038FF]"
                : ""
            }`}
          >
            Help
          </Link>
          <Link href="/signin" onClick={() => setMenuOpen(false)}>
            <Button className="mt-2 w-full bg-[#0038FF] hover:bg-[#1a4dff] transition rounded-[15px] text-white text-sm sm:text-[16px]">
              Sign in
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
