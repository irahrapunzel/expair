'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Bell,
  MessageSquareText,
  ChevronDown,
  Menu,
  X
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    
    <header
      className="w-full py-[50px]"
      style={{
        background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0) 100%)',
        backdropFilter: 'blur(25px)',
        WebkitBackdropFilter: 'blur(25px)',
      }}
    >
      <div className="flex items-center justify-between gap-[33px] px-[280px]">
        {/* ✅ Left: Logo + New Request */}
        <div className="flex items-center gap-[33px]">
          <Image src="/expair.png" alt="Expair Logo" width={150.89} height={46} />
          <Button className="w-[160px] h-[40px] rounded-[15px] bg-[#0038FF] text-white text-center font-normal text-[16px] leading-[120%] shadow-md hover:bg-[#1a4dff] transition">
            ✦  New request
          </Button>
        </div>

        {/* ✅ Center: Navigation */}
        <nav className="hidden md:flex items-center bg-[#120A2A] rounded-[20px] w-[336px] h-[60px] overflow-hidden">
          <button className="w-[89px] h-full text-white font-normal hover:text-blue-400 transition">
            Home
          </button>
          <button className="w-[90px] h-full text-white font-normal hover:text-blue-400 transition">
            Help
          </button>

          {/* Trades dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-[157px] h-full text-white font-semibold bg-[#1A0F3E] flex items-center justify-center gap-1 rounded-[20px] hover:text-blue-400 transition">
                Trades <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#15042C] text-white border border-[#2B124C]">
              <DropdownMenuItem>Active</DropdownMenuItem>
              <DropdownMenuItem>Pending</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* ✅ Right: Icons + Avatar */}
        <div className="flex items-center gap-[25px]">
          <div className="relative">
            <MessageSquareText className="text-white w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full" />
          </div>
          <div className="relative">
            <Bell className="text-white w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full" />
          </div>
          <Image
            src="/avatar.png"
            alt="User Avatar"
            width={25}
            height={25}
            className="rounded-full border border-white"
          />
        </div>
      </div>
    </header>


  )
}