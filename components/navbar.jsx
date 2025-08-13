"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Bell, MessageSquareText, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { NotificationPortal } from "./notifications/notification-portal";
import { usePathname } from "next/navigation"; // ✅ For detecting page change

import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [bellRect, setBellRect] = useState(null);

  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(true); // ✅ New state

  const bellRef = useRef(null);
  const pathname = usePathname();

  // ✅ Clear message notification when on messages page
  useEffect(() => {
    if (pathname === "/home/messages") {
      setHasUnreadMessages(false);
    }
  }, [pathname]);

  // Close notification dialog when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        const notificationPortal = document.querySelector(
          "[data-notification-portal]"
        );
        if (notificationPortal && notificationPortal.contains(event.target)) {
          return;
        }
        setNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleNotification = () => {
    if (!notificationOpen && bellRef.current) {
      setBellRect(bellRef.current.getBoundingClientRect());
    }
    setNotificationOpen(!notificationOpen);
  };

  const handleAllNotificationsRead = () => {
    setHasUnreadNotifications(false);
  };

  return (
    <header
      className={`${inter.className} w-full py-4 sm:py-10 text-[16px] leading-[120%] sticky top-0 z-50 bg-[#050015]/80 backdrop-blur-xl transition-all duration-300`}
    >
      <div className="flex items-center justify-between max-w-[1440px] mx-auto px-6 sm:px-[250px]">
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
          <Link href="/home/request">
            <Button className="font-normal flex w-[160px] h-[40px] px-[38px] py-[13px] justify-center items-center gap-[5px] flex-shrink-0 shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] text-white text-sm sm:text-[16px] hover:bg-[#1a4dff] transition rounded-[15px]">
              ✦ New request
            </Button>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center bg-[#120A2A] rounded-[20px] w-[337px] h-[60px] overflow-hidden">
          <Link href="/home" className="flex-1 h-full">
            <button
              className={`w-full h-full transition text-white hover:text-[#6C8BFF] ${
                pathname === "/home" ? "font-semibold text-[#0038FF]" : ""
              }`}
            >
              Home
            </button>
          </Link>

          <Link href="/home/help" className="flex-1 h-full">
            <button
              className={`w-full h-full transition text-white hover:text-[#6C8BFF] ${
                pathname === "/home/help" ? "font-semibold text-[#0038FF]" : ""
              }`}
            >
              Help
            </button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`flex-1 h-full transition text-white hover:text-[#6C8BFF] flex items-center justify-center gap-1 ${
                  pathname.startsWith("/home/trades")
                    ? "font-semibold text-[#0038FF]"
                    : ""
                }`}
              >
                Trades <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>

            {/* dropdown menu content unchanged */}
            <DropdownMenuContent className="bg-[#120A2A] text-white border border-[#2B124C] rounded-[15px] shadow-[0_5px_15px_rgba(0,0,0,0.25)]">
              <Link href="/home/trades/pending">
                <DropdownMenuItem className="text-white data-[highlighted]:bg-transparent data-[highlighted]:text-white data-[highlighted]:font-semibold">
                  Pending
                </DropdownMenuItem>
              </Link>
              <Link href="/home/trades/active">
                <DropdownMenuItem className="text-white data-[highlighted]:bg-transparent data-[highlighted]:text-white data-[highlighted]:font-semibold">
                  Active
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Icons */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/home/messages">
            <div className="relative cursor-pointer">
              <MessageSquareText className="text-white w-5 h-5" />
              {hasUnreadMessages && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </div>
          </Link>
          <div className="relative" ref={bellRef}>
            <div className="cursor-pointer" onClick={toggleNotification}>
              <Bell className="text-white w-5 h-5" />
              {hasUnreadNotifications && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </div>
          </div>
          <NotificationPortal
            isOpen={notificationOpen}
            onClose={() => setNotificationOpen(false)}
            onMarkAllAsRead={handleAllNotificationsRead}
            anchorRect={bellRect}
          />
          <Link href="/home/profile/anything">
            <Image
              src="/defaultavatar.png"
              alt="User Avatar"
              width={25}
              height={25}
              className="rounded-full border border-white cursor-pointer"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
