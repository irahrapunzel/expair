"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Bell, MessageSquareText, ChevronDown } from "lucide-react";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path) => pathname === path;
  const isGroupActive = (groupPath) => pathname.startsWith(groupPath);

  return (
    <header
      className={`${inter.className} w-full sticky top-0 z-50 py-6 sm:py-10 text-[16px] leading-[120%]`}
      style={{
        background:
          "linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)",
        backdropFilter: "blur(50px)",
        WebkitBackdropFilter: "blur(50px)",
      }}
    >
      <div className="flex items-center justify-between mx-auto max-w-[1440px] px-6 md:px-[80px]">
        {/* Logo and Button */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/home">
            <Image
              src="/expair.png"
              alt="Expair Logo"
              width={120}
              height={40}
              className="w-auto h-[40px] cursor-pointer"
            />
          </Link>

          <Button className="font-normal flex w-[160px] h-[40px] px-[38px] py-[13px] justify-center items-center gap-[5px] flex-shrink-0 shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] text-white text-sm sm:text-[16px] hover:bg-[#1a4dff] transition rounded-[15px]">
            ✦ New request
          </Button>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center bg-[#120A2A] rounded-[20px] w-[337px] h-[60px] overflow-hidden">
          <Link
            href="/home"
            className={`flex-1 h-full flex items-center justify-center hover:bg-[#1A0F3E] font-normal ${
              isActive("/home") ? "text-[#0038FF] font-semibold" : "text-white"
            }`}
          >
            Home
          </Link>

          <Link
            href="/help"
            className={`flex-1 h-full flex items-center justify-center hover:bg-[#1A0F3E] font-normal ${
              isGroupActive("/help")
                ? "text-[#0038FF] font-semibold"
                : "text-white"
            }`}
          >
            Help
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`flex-1 h-full flex items-center justify-center gap-1 hover:bg-[#1A0F3E] font-normal ${
                  isGroupActive("/trades")
                    ? "text-[#0038FF] font-semibold"
                    : "text-white"
                }`}
              >
                Trades <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className={`${inter.className} bg-[#15042C] text-white border border-[#2B124C]`}
            >
              <DropdownMenuItem asChild>
                <Link href="/trades/pending">Pending</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/trades/active">Active</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Icons */}
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
  );
}
