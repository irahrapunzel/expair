// components/navbar.jsx

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

// NOTE: Removed 'import { usePathname } from 'next/navigation';'

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

  // FIX APPLIED HERE: Relying purely on session status (case-insensitive check)
  const isSuspended = 
    session?.user?.sanction_status?.toUpperCase() === "SUSPENSION" ||
    session?.user?.sanction_status?.toUpperCase() === "BAN";


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
    if (!notificationOpen && bellRef.current) {
      setBellRect(bellRef.current.getBoundingClientRect());
    }
    setNotificationOpen(!notificationOpen);
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

  return (
<header
          className={`${inter.className} w-full py-4 lg:py-10 text-[16px] leading-[120%] sticky top-0 z-50 bg-[#050015]/80 backdrop-blur-xl transition-all duration-300`}
        >
          <div className="flex items-center justify-between max-w-[1440px] mx-auto px-4 lg:px-[250px] relative"> 
            {/* Added 'relative' to parent just in case, though standard header behavior usually handles it */}

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
              
              {/* MOBILE ICONS: Messages & Notifications (Visible only on mobile lg:hidden) */}
              {!isSuspended && (
                <div className="flex lg:hidden items-center gap-3 mr-1">
                    <Link href="/home/messages">
                      <div className="relative cursor-pointer p-1">
                        <MessageSquareText className="text-white w-5 h-5" />
                      </div>
                    </Link>

                    {/* Mobile Notification Bell */}
                    <div 
                      className="relative cursor-pointer p-1" 
                      onClick={toggleNotification}
                      ref={bellRef} // Attach ref here too so portal knows where to anchor on mobile
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

              {/* Hamburger (Mobile) */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="block lg:hidden text-white focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

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
            </div>

            {/* Shared Notification Portal (Works for both Mobile and Desktop now) */}
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

          {/* Mobile Menu Content - DITO YUNG PAGBABAGO: FLOATING STYLE */}
          {mobileMenuOpen && (
            <div className="absolute top-full left-0 w-full lg:hidden px-4 pb-6 space-y-3 bg-[#0A0519] border-t border-[#1a1a3a] shadow-xl z-50">
              {isSuspended ? (
                <div
                  className="flex items-center gap-2 text-red-400 py-4 cursor-pointer"
                  onClick={handleLogout}
                  role="button"
                  tabIndex={0}
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-4">
                  <Link href="/home">
                    <p className="text-white py-2 font-medium">Home</p>
                  </Link>
                  <Link href="/home/help">
                    <p className="text-white py-2 font-medium">Help</p>
                  </Link>

                  <div className="pl-2 border-l-2 border-[#1a1a3a] my-2">
                    <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Trades</p>
                    <Link href="/home/trades/pending">
                      <p className="text-white py-1 text-sm">Pending</p>
                    </Link>
                    <Link href="/home/trades/active">
                      <p className="text-white py-1 text-sm">Active</p>
                    </Link>
                    <Link href="/home/trades/completed">
                      <p className="text-white py-1 text-sm">Completed</p>
                    </Link>
                  </div>

                  {/* Messages and Notifications removed here since they are now on the header bar */}

                  <Link href="/home/request" className="my-2">
                    <Button className="w-full font-normal flex h-[40px] px-[38px] py-[13px] justify-center items-center gap-[5px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] text-white hover:bg-[#1a4dff] transition rounded-[15px]">
                      ✦ New request
                    </Button>
                  </Link>

                  <div className="h-[1px] bg-[#2B124C] my-2" />

                  <Link href={profileHref} className="flex items-center gap-3 text-white py-2">
                    <User className="w-5 h-5" />
                    Your profile
                  </Link>
                  
                  <Link href={settingsHref} className="flex items-center gap-3 text-white py-2">
                    <Settings className="w-5 h-5" />
                    Settings
                  </Link>

                  <div
                    className="flex items-center gap-3 text-red-400 py-2 cursor-pointer"
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