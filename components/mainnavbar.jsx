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

export default function MainNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (    
    <header
      className="font-sans w-full py-6 sm:py-10"
      style={{
        background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0) 100%)',
        backdropFilter: 'blur(25px)',
        WebkitBackdropFilter: 'blur(25px)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-6 px-6 md:px-20 lg:px-[280px]">
        
        <div className="flex items-center gap-4 sm:gap-6">
          <Image src="/expair.png" alt="Expair Logo" width={120} height={40} className="w-auto h-[40px]" />
          <Button className="font-normal flex w-[160px] h-[40px] px-[38px] py-[13px] justify-center items-center gap-[5px] flex-shrink-0 shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] text-white text-sm sm:text-[16px] hover:bg-[#1a4dff] transition rounded-[15px]">
            ✦ New request
          </Button>
        </div>

        <nav className="hidden md:flex items-center bg-[#120A2A] rounded-[20px] w-[337px] h-[60px] overflow-hidden">
          <button className="flex-1 h-full text-white font-normal hover:bg-[#1A0F3E] rounded-[20px]">
            Home
          </button>
          <button className="flex-1 h-full text-white font-normal hover:bg-[#1A0F3E] rounded-[20px]">
            Help
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex-1 h-full text-white font-normal flex items-center justify-center gap-1 hover:bg-[#1A0F3E] rounded-[20px]">
                Trades <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#15042C] text-white border border-[#2B124C]">
              <DropdownMenuItem className="text-white data-[highlighted]:bg-transparent data-[highlighted]:text-white data-[highlighted]:font-semibold">Pending</DropdownMenuItem>
              <DropdownMenuItem className="text-white data-[highlighted]:bg-transparent data-[highlighted]:text-white data-[highlighted]:font-semibold">Active</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="relative">
            <MessageSquareText className="text-white w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full" />
          </div>
          <div className="relative">
            <Bell className="text-white w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full" />
          </div>
          <Image
            src="/defaultavatar.png"
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