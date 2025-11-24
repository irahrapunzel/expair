// components/navbar.jsx

"use client";

import { signOut, useSession } from "next-auth/react";
import { useState, useRef, useEffect, useMemo } from "react";
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
  Send,
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

  // State for real notifications
  const [notifications, setNotifications] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  
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

  const isSuspended = 
    session?.user?.sanction_status?.toUpperCase() === "SUSPENSION" ||
    session?.user?.sanction_status?.toUpperCase() === "BAN";
    
  const userDisplayName = useMemo(() => {
    if (session?.user?.first_name || session?.user?.last_name) {
      return `${session.user.first_name || ''} ${session.user.last_name || ''}`.trim();
    }
    return session?.user?.username || 'Guest';
  }, [session]);

  // Fetches notifications
  const fetchNotifications = async () => {
    // Prevent fetching if not logged in OR if the user is suspended
    if (!session?.access || isSuspended) return; 

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"}/api/accounts/notifications/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access}`, // <-- Auth header
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setNotifCount(data.count);
        setHasUnreadNotifications(data.count > 0);
      } else {
        console.error("Failed to fetch notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Fetch notifications on load and poll
  useEffect(() => {
    if (session) { // Only run when session is available
      fetchNotifications();
      
      const interval = setInterval(fetchNotifications, 60000); // Poll every 60 seconds
      return () => clearInterval(interval);
    }
  }, [session]); // Re-run when session changes

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
    if (isSuspended) return; // Prevent opening if suspended
    // Get bell position only when opening and the reference exists
    if (!notificationOpen && bellRef.current) {
      setBellRect(bellRef.current.getBoundingClientRect());
    }
    setNotificationOpen(!notificationOpen);
    // Close mobile menu if notification is opened from the mobile menu
    if (!notificationOpen) setMobileMenuOpen(false); 
  };

  const handleAllNotificationsRead = async () => {
    if (!session?.access || isSuspended) return; // Prevent action if suspended
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"}/api/accounts/notifications/mark-all-read/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access}`,
          },
        }
      );
      if (res.ok) {
        fetchNotifications(); // Refresh ang list
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDeleteAllRead = async () => {
    if (!session?.access || isSuspended) return; // Prevent action if suspended
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"}/api/accounts/notifications/delete-all-read/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access}`,
          },
        }
      );
      if (res.ok) {
        fetchNotifications(); // Refresh ang list
      }
    } catch (error) {
      console.error("Failed to delete all read notifications:", error);
    }
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
  
  // Helper function to close menu after clicking a link
  const handleLinkClick = () => setMobileMenuOpen(false);


  return (
<header
          className={`${inter.className} w-full py-4 lg:py-10 text-[16px] leading-[120%] sticky top-0 z-50 bg-[#050015]/80 backdrop-blur-xl transition-all duration-300`}
        >
          <div className="flex items-center justify-between max-w-[1440px] mx-auto px-4 lg:px-[250px] relative"> 
            
            {/* Logo and Button */}
            <div className="flex items-center gap-4 lg:gap-6">
              {/* LOGO LINK */}
              {isSuspended ? (
                <div className="cursor-default">
                  <Image
                    src="/expair.png"
                    alt="Expair Logo"
                    width={120}
                    height={40}
                    className="w-auto h-[40px]" 
                  />
                </div>
              ) : (
                <Link href="/home">
                  <Image
                    src="/expair.png"
                    alt="Expair Logo"
                    width={120}
                    height={40}
                    className="w-auto h-[40px] cursor-pointer"
                  />
                </Link>
              )}

              {/* New request (Desktop only) */}
              {!isSuspended && ( 
                <Link href="/home/request" className="hidden lg:block">
                  <Button className="font-normal flex w-[160px] h-[40px] px-[38px] py-[13px] justify-center items-center gap-[5px] flex-shrink-0 shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] text-white text-sm sm:text-[16px] hover:bg-[#1a4dff] transition rounded-[15px]">
                    ✦ New request
                  </Button>
                </Link>
              )}
            </div>

            {/* Desktop Navigation (Hidden on Mobile) */}
            {!isSuspended && ( 
                <nav className="hidden lg:flex items-center bg-[#120A2A] rounded-[20px] w-[337px] h-[60px] overflow-hidden">
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
                    <DropdownMenuContent
                      align="center"
                      className={`${inter.className} bg-[#15042C] text-white border border-[#2B124C]`}
                    >
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
                      <Link href="/home/trades/completed">
                        <DropdownMenuItem className="text-white data-[highlighted]:bg-transparent data-[highlighted]:text-white data-[highlighted]:font-semibold">
                          Completed
                        </DropdownMenuItem>
                      </Link>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </nav>
            )}

            {/* Right Section (Icons & Hamburger) */}
            <div className="flex items-center gap-4 lg:gap-6">
              
              {/* === START FIX: MOBILE ICONS (Visible only on mobile lg:hidden) === */}
              {!isSuspended && (
                <div className="flex lg:hidden items-center gap-3 mr-1">
                    <Link href="/home/messages" onClick={handleLinkClick}>
                      <div className="relative cursor-pointer p-1">
                        <MessageSquareText className="text-white w-5 h-5" />
                      </div>
                    </Link>

                    {/* Mobile Notification Bell */}
                    <div 
                      className="relative cursor-pointer p-1" 
                      onClick={toggleNotification}
                      ref={bellRef} // Attach ref here too
                    >
                      <Bell className="text-white w-5 h-5" />
                      {hasUnreadNotifications && (
                        <span className="absolute top-0 right-0 min-w-[14px] h-[14px] px-[2px] bg-[#0038FF] text-white text-[9px] leading-[14px] rounded-full text-center flex items-center justify-center">
                          {notifCount}
                        </span>
                      )}
                    </div>
                </div>
              )}
              {/* === END FIX: MOBILE ICONS === */}


              {/* Desktop Icons (Hidden on Mobile) */}
              <div className="hidden lg:flex items-center gap-4 lg:gap-6">
                {!isSuspended && ( 
                  <>
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
                  </>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-full border border-white focus:outline-none focus:ring-2 focus:ring-[#6DDFFF]">
                      <ProfileAvatar src={profileImage} size={25} />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className={`${inter.className} bg-[#15042C] text-white border border-[#2B124C] min-w-[200px]`}
                  >
                    {!isSuspended && ( 
                      <>
                        <Link href={profileHref}>
                          <DropdownMenuItem className="flex items-center gap-2 text-white data-[highlighted]:bg-transparent data-[highlighted]:text-white data-[highlighted]:font-semibold cursor-pointer">
                            <User className="w-4 h-4" />
                            Your profile
                          </DropdownMenuItem>
                        </Link>

                        <Link href={settingsHref}>
                          <DropdownMenuItem className="flex items-center gap-2 text-white data-[highlighted]:bg-transparent data-[highlighted]:text-white data-[highlighted]:font-semibold cursor-pointer">
                            <Settings className="w-4 h-4" />
                            Settings
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}
                    <DropdownMenuItem
                      className="flex items-center gap-2 text-red-400 data-[highlighted]:bg-transparent data-[highlighted]:text-red-300 cursor-pointer"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Hamburger (Mobile/Tablet) */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="block lg:hidden text-white p-2 focus:outline-none rounded-full hover:bg-white/10 transition-colors"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Shared Notification Portal */}
            {!isSuspended && (
                <NotificationPortal
                  isOpen={notificationOpen}
                  onClose={() => setNotificationOpen(false)}
                  onMarkAllAsRead={handleAllNotificationsRead}
                  onDeleteAllRead={handleDeleteAllRead}
                  anchorRect={bellRect}
                  notifications={notifications} 
                  fetchNotifications={fetchNotifications} 
                />
            )}
          </div>

          {/* Mobile Menu Content - IMPROVED FLOATING STYLE */}
          {mobileMenuOpen && (
            <div className="absolute top-full left-0 w-full lg:hidden px-4 pb-4 space-y-4 bg-[#15042C] border-t border-[#2B124C] shadow-xl z-50">
              
              {isSuspended ? (
                // Menu for SUSPENDED USERS (Omitted for brevity)
                <div className="flex flex-col gap-2 pt-4">
                  <div className="text-gray-400 py-2 text-sm text-center">
                    Account is suspended. Access restricted.
                  </div>
                  <div
                    className="flex items-center gap-3 text-red-400 py-2 cursor-pointer border-t border-[#2B124C] mt-2 pt-3"
                    onClick={handleLogout}
                    role="button"
                    tabIndex={0}
                  >
                    <LogOut className="w-5 h-5" />
                    Log out
                  </div>
                </div>
              ) : (
                // Full Menu for ACTIVE USERS
                <div className="flex flex-col gap-1 pt-2">

                  {/* ACCOUNT/PROFILE LINKS (Top of Mobile Menu) */}
                  <div className="flex items-center justify-between py-2 border-b border-[#2B124C]">
                    <div className="flex items-center gap-3">
                      <ProfileAvatar src={profileImage} size={35} />
                      <div className="flex flex-col">
                        {/* The name itself is now the primary link */}
                        <Link href={profileHref} onClick={handleLinkClick} className="hover:text-[#6DDFFF] transition-colors">
                            <p className="text-white font-semibold hover:text-[#6DDFFF]">{userDisplayName}</p>
                        </Link>
                        {/* Secondary link for "View Profile" remains for clarity */}
                        <Link href={profileHref} onClick={handleLinkClick}>
                          <p className="text-gray-400 text-xs hover:text-[#6DDFFF] mt-[2px]">View Profile</p>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* MAIN NAVIGATION */}
                  <div className="py-2 space-y-1 border-b border-[#2B124C]">
                    <Link href="/home" onClick={handleLinkClick}>
                      <p className="text-white py-2 font-medium hover:bg-white/5 rounded-lg pl-3">Home</p>
                    </Link>
                    <Link href="/home/help" onClick={handleLinkClick}>
                      <p className="text-white py-2 font-medium hover:bg-white/5 rounded-lg pl-3">Help</p>
                    </Link>
                  </div>

                  {/* TRADES SUB-MENU (FIXED) */}
                  <div className="py-2 space-y-1">
                    <p className="text-[#6DDFFF] text-sm mb-2 uppercase tracking-wider font-semibold pl-3">Trades</p>
                    <Link href="/home/trades/pending" onClick={handleLinkClick}>
                      <p className="text-white py-1 text-base hover:bg-white/5 rounded-lg pl-3">Pending</p>
                    </Link>
                    <Link href="/home/trades/active" onClick={handleLinkClick}>
                      <p className="text-white py-1 text-base hover:bg-white/5 rounded-lg pl-3">Active</p>
                    </Link>
                    <Link href="/home/trades/completed" onClick={handleLinkClick}>
                      <p className="text-white py-1 text-base hover:bg-white/5 rounded-lg pl-3">Completed</p>
                    </Link>
                  </div>
                  
                  <div className="h-[1px] bg-[#2B124C] my-2" />

                  {/* NEW REQUEST BUTTON (Full width call to action) */}
                  <Link href="/home/request" onClick={handleLinkClick} className="my-3 block">
                    <Button className="w-full font-normal flex h-[45px] px-[38px] py-[13px] justify-center items-center gap-3 shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] text-white hover:bg-[#1a4dff] transition rounded-[15px] text-base">
                      ✦ New request
                    </Button>
                  </Link>

                  <div className="h-[1px] bg-[#2B124C] my-2" />

                  {/* ACCOUNT ACTIONS */}
                  <Link href={settingsHref} onClick={handleLinkClick} className="flex items-center gap-3 text-white py-2 hover:bg-white/5 rounded-lg pl-3">
                    <Settings className="w-5 h-5" />
                    Settings
                  </Link>

                  <div
                    className="flex items-center gap-3 text-red-400 py-2 cursor-pointer hover:bg-white/5 rounded-lg pl-3"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-5 h-5" />
                    Log out
                  </div>
                </div>
              )}
            </div>
          )}
        </header>
  );
}