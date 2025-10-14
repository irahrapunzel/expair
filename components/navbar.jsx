"use client";

import { signOut, useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Bell,
  MessageSquareText,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { NotificationPortal } from "./notifications/notification-portal";
import { Inter } from "next/font/google";
import ProfileAvatar from "@/components/avatar";

const inter = Inter({ subsets: ["latin"] });

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [bellRect, setBellRect] = useState(null);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [notifCount, setNotifCount] = useState(5);
  const bellRef = useRef(null);

  const profileImage =
    session?.user?.profilePic ||
    session?.user?.image ||
    "/assets/defaultavatar.png";

  const profileSlug =
    session?.user?.username ??
    (session?.user?.id ? String(session.user.id) : "me");
  const profileHref = `/home/profile/${profileSlug}`;
  const settingsHref = `/home/profile/${profileSlug}/settings`;

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleNotification = () => {
    if (!notificationOpen && bellRef.current) {
      setBellRect(bellRef.current.getBoundingClientRect());
    }
    setNotificationOpen(!notificationOpen);
  };

  const handleAllNotificationsRead = () => {
    setNotifCount(0);
    setHasUnreadNotifications(false);
  };

  const handleLogout = async () => {
    try {
      const refresh = session?.refresh;
      if (refresh) {
        await fetch(
          `${
            process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"
          }/logout/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              ...(session?.access
                ? { Authorization: `Bearer ${session.access}` }
                : {}),
            },
            body: JSON.stringify({ refresh }),
            credentials: "include",
          }
        );
      }
    } finally {
      await signOut({ redirect: true, callbackUrl: "/" });
    }
  };

  return (
    <header
      className={`${inter.className} w-full py-4 sm:py-10 text-[16px] leading-[120%] sticky top-0 z-50 bg-[#050015]/80 backdrop-blur-xl transition-all duration-300`}
    >
      <div className="flex items-center justify-between max-w-[1440px] mx-auto px-4 sm:px-[250px]">
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
          <Link href="/home/request" className="hidden sm:block">
            <Button className="font-normal flex w-[160px] h-[40px] px-[38px] py-[13px] justify-center items-center gap-[5px] flex-shrink-0 shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] text-white text-sm sm:text-[16px] hover:bg-[#1a4dff] transition rounded-[15px]">
              ✦ New request
            </Button>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center bg-[#120A2A] rounded-[20px] w-[337px] h-[60px] overflow-hidden">
          <Link href="/home" className="flex-1 h-full">
            <button className="w-full h-full text-white font-normal hover:bg-[#1A0F3E] rounded-[20px]">
              Home
            </button>
          </Link>
          <Link href="/home/help" className="flex-1 h-full">
            <button className="w-full h-full text-white font-normal hover:bg-[#1A0F3E] rounded-[20px]">
              Help
            </button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex-1 h-full text-white font-normal flex items-center justify-center gap-1 hover:bg-[#1A0F3E] rounded-[20px]">
                Trades <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#15042C] text-white border border-[#2B124C]">
              <Link href="/home/trades/pending">
                <DropdownMenuItem>Pending</DropdownMenuItem>
              </Link>
              <Link href="/home/trades/active">
                <DropdownMenuItem>Active</DropdownMenuItem>
              </Link>
              <Link href="/home/trades/completed">
                <DropdownMenuItem>Completed</DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Desktop icons */}
          <div className="hidden md:flex items-center gap-4 sm:gap-6">
            <Link href="/home/messages">
              <div className="relative cursor-pointer">
                <MessageSquareText className="text-white w-5 h-5" />
              </div>
            </Link>
            <div className="relative" ref={bellRef}>
              <div className="cursor-pointer" onClick={toggleNotification}>
                <Bell className="text-white w-5 h-5" />
                {hasUnreadNotifications && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-[3px] bg-[#0038FF] text-white text-[10px] leading-[16px] rounded-full text-center">
                    {notifCount}
                  </span>
                )}
              </div>
            </div>
            <NotificationPortal
              isOpen={notificationOpen}
              onClose={() => setNotificationOpen(false)}
              onMarkAllAsRead={handleAllNotificationsRead}
              anchorRect={bellRect}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full border border-white focus:outline-none focus:ring-2 focus:ring-[#6DDFFF]">
                  <ProfileAvatar src={profileImage} size={25} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-[#15042C] text-white border border-[#2B124C] min-w-[200px]"
              >
                <Link href={profileHref}>
                  <DropdownMenuItem>
                    <User className="w-4 h-4" />
                    Your profile
                  </DropdownMenuItem>
                </Link>
                <Link href={settingsHref}>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4" />
                    Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                  className="text-red-400"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 px-4 pb-4 space-y-3 bg-[#0A0519] border-t border-[#1a1a3a]">
          <Link href="/home">
            <p className="text-white py-2">Home</p>
          </Link>
          <Link href="/home/help">
            <p className="text-white py-2">Help</p>
          </Link>
          <Link href="/home/trades/pending">
            <p className="text-white py-2">Pending Trades</p>
          </Link>
          <Link href="/home/trades/active">
            <p className="text-white py-2">Active Trades</p>
          </Link>
          <Link href="/home/trades/completed">
            <p className="text-white py-2">Completed Trades</p>
          </Link>
          <Link href="/home/request">
            <Button className="w-full font-normal bg-[#0038FF] hover:bg-[#1a4dff] text-white rounded-[15px]">
              ✦ New request
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
