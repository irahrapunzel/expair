'use client'

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function LandingNavbar() {
  return (
    <header className="w-full py-6 px-6 md:px-20 lg:px-[67px] bg-transparent z-50 relative">
      <div className="flex justify-between items-center w-full">
        {/* Left side: Logo */}
        <div className="flex items-center gap-2">
          <Image src="/expair.png" alt="Expair Logo" width={24} height={24} />
        </div>

        {/* Middle: Menu */}
        <nav className="hidden md:flex items-center bg-[#1A0F3E] rounded-[20px] overflow-hidden h-[60px]">
          {["Our goal", "How it works", "FAQs"].map((item, index) => (
            <button
              key={index}
              className="px-6 h-full text-white font-normal text-sm hover:bg-[#2B124C] transition"
            >
              {item}
            </button>
          ))}
          <button className="px-6 h-full text-white font-semibold text-sm bg-[#2B124C]">
            Help
          </button>
        </nav>

        {/* Right side: Sign in */}
        <Link href="/signin">
          <Button className="w-[120px] h-[44px] bg-[#0038FF] text-white rounded-[30px] text-sm hover:bg-[#1a4dff] shadow-[0_0_12px_0_rgba(0,56,255,0.7)] transition">
            Sign in
          </Button>
        </Link>
      </div>
    </header>
  )
}
