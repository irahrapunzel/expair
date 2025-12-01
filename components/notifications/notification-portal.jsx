"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, X, User, Check, GitMerge, MessageSquare, MoreVertical, CheckCheck, Trash2} from "lucide-react";
import { cn } from "../../lib/utils";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { useSession } from "next-auth/react";

const inter = Inter({ subsets: ["latin"] });

export function NotificationPortal({
  isOpen,
  onClose,
  onMarkAllAsRead,
  onDeleteAllRead,
  anchorRect,
  notifications,
  fetchNotifications,
}) {
  const [mounted, setMounted] = useState(false);
  const [readNotifications, setReadNotifications] = useState({});
  const router = useRouter();
  const { data: session } = useSession(); 

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const portalRef = useRef(null); // Ref for the portal content itself

  useEffect(() => {
    setMounted(true);
    
    function handleClickOutside(event) {
      // Check if the click happened inside the menu options dropdown
      if (menuRef.current && menuRef.current.contains(event.target)) {
        return;
      }
      
      // Check if the click was inside the main portal itself
      if (portalRef.current && portalRef.current.contains(event.target)) {
        return;
      }
      
      // If the portal is open, but the click was neither the bell nor inside the portal, close it.
      // This is primarily for desktop where positioning is relative to the bell.
      if (isOpen) {
        // The check against the bell icon is handled in navbar.jsx via global listener.
        // We only close if the target is outside the portal AND outside the bell.
        const notificationPortal = document.querySelector(
          "[data-notification-portal]"
        );
        if (notificationPortal && !notificationPortal.contains(event.target)) {
            onClose();
        }
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      setMounted(false);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const markOneAsRead = async (notification) => {
    // Mark as read in the UI immediately
    setReadNotifications((prev) => ({
      ...prev,
      [notification.notification_id]: true,
    }));

    if (!session?.access) {
      console.error("No session found, cannot mark as read.");
      // Still navigate if there's a link
      if (notification.link) {
        router.push(notification.link);
        onClose();
      }
      return;
    }

    try {
      // Send request to backend to mark as read
      await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"
        }/api/accounts/notifications/${notification.notification_id}/mark-read/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access}`, // <-- ADDED AUTH HEADER
          },
        }
      );
      
      // Re-fetch notifications to update the count in the navbar
      if (fetchNotifications) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Failed to mark one as read:", error);
    }

    // Navigate to the link
    if (notification.link) {
      router.push(notification.link);
      onClose(); // Close portal on navigation
    }
  };

  const handleDeleteOne = async (e, notification_id) => {
    e.stopPropagation(); // Para 'di ma-trigger 'yung click ng buong item
    
    if (!session?.access) return;
    
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"}/api/accounts/notifications/${notification_id}/delete/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access}`,
          },
        }
      );
      // I-fetch ulit lahat ng notifications para ma-update 'yung list
      if (fetchNotifications) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const markAllAsRead = () => {
    // Clear local read state
    setReadNotifications({});
    // Call the prop function from navbar
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };

  if (!mounted || !isOpen || !anchorRect) return null;

  // Calculate position based on the bell icon's position (Desktop)
  const desktopTop = anchorRect.bottom + 10;
  const desktopRight = window.innerWidth - anchorRect.right;
  
  // Mobile check (viewport width less than lg breakpoint, typically 1024px)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  
  // Dynamic Styles
  const portalStyles = isMobile
    ? {
        top: '64px', // Adjust based on your Navbar height on mobile
        right: '0',
        left: '0',
        width: '100%',
        maxHeight: 'calc(100vh - 64px)', // Take up remaining viewport height
        borderRadius: '0', // Full width/no rounded corners for full panel effect
        padding: '20px 16px',
        boxShadow: "0px 4px 15px rgba(0,0,0,0.5)",
      }
    : {
        top: `${desktopTop}px`,
        right: `${desktopRight}px`,
        width: '388px',
        maxHeight: '571px',
        borderRadius: '15px',
        padding: '32px',
        boxShadow: "0px 4px 15px #D78DE5",
      };


  return createPortal(
    <div
      data-notification-portal
      className={`fixed z-[9999] flex flex-col items-start gap-[20px] sm:gap-[25px] ${inter.className}`}
      ref={portalRef} // Attach ref here
      style={{
        background: "rgba(10, 1, 24, 0.95)",
        backdropFilter: "blur(30px)",
        isolation: "isolate",
        ...portalStyles, // Apply dynamic styles
      }}
    >
      
      <div className="flex items-center justify-between w-full">
        <h2 className="text-white text-[20px] sm:text-[25px] font-semibold leading-[120%]">
          Notifications
        </h2>
        
        <div className="flex items-center gap-2">
          
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)} 
              title="Notification options"
              className="text-white/60 hover:text-white"
            >
              <MoreVertical size={isMobile ? 20 : 18} />
            </button>

            {menuOpen && (
              <div 
                className="absolute right-0 top-full mt-2 w-52 z-50 rounded-md shadow-lg"
                style={{
                  background: "#15042C", 
                  border: "1px solid #2B124C" 
                }}
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      onMarkAllAsRead();
                      setMenuOpen(false); 
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-white hover:font-semibold"
                  >
                    <CheckCheck size={14} />
                    Mark all as read
                  </button>
                  <button
                    onClick={() => {
                      onDeleteAllRead();
                      setMenuOpen(false); 
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300" 
                  >
                    <Trash2 size={14} />
                    Delete all read
                  </button>
                </div>
              </div>
            )}
          </div>

          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X size={isMobile ? 22 : 18} />
          </button>
        </div>
      </div>

      <div
        className="w-full flex flex-col gap-[15px] overflow-y-auto custom-scrollbar pr-2 pl-1"
        style={{ maxHeight: isMobile ? 'calc(100vh - 120px)' : '452px' }} // Adjusted max-height for mobile
      >
        {notifications.length === 0 ? (
          <div className="text-white/60 text-sm text-center py-10">
            No new notifications
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n.notification_id}
              notification={n}
              isRead={readNotifications[n.notification_id] || n.is_read}
              onClick={() => markOneAsRead(n)}
              onDelete={(e) => handleDeleteOne(e, n.notification_id)}
            />
          ))
        )}
      </div>
    </div>,
    document.body
  );
}

// Helper component for relative time
function formatTimeAgo(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
}

function NotificationItem({ notification, isRead, onClick, onDelete }) {
  
  const { notification_type, message, created_at } = notification;

  const getIconComponent = (iconType) => {
    switch (iconType) {
      case "TRADE_INTEREST":
        return ( <div className="w-4 h-4 bg-[#6DDFFF] rounded-full flex items-center justify-center"> <User size={10} className="text-white" /> </div> );
      case "TRADE_ACCEPTED":
      case "TRADE_CONFIRMED":
        return ( <div className="w-4 h-4 bg-[#4ADE80] rounded-full flex items-center justify-center"> <Check size={10} className="text-white" /> </div> );
      case "PROOF_SUBMITTED":
        return ( <div className="w-4 h-4 bg-[#F59E0B] rounded-full flex items-center justify-center"> <GitMerge size={10} className="text-white" /> </div> );
      case "PROOF_APPROVED":
        return ( <div className="w-4 h-4 bg-[#4ADE80] rounded-full flex items-center justify-center"> <Check size={10} className="text-white" /> </div> );
      case "VERIF_ACCEPTED":
        return ( <div className="w-4 h-4 bg-[#4ADE80] rounded-full flex items-center justify-center"> <Check size={10} className="text-white" /> </div> );
      case "VERIF_REJECTED":
        return ( <div className="w-4 h-4 bg-[#FF4D4D] rounded-full flex items-center justify-center"> <X size={10} className="text-white" /> </div> );
      case "NEW_MESSAGE":
        return ( <div className="w-4 h-4 bg-[#8B5CF6] rounded-full flex items-center justify-center"> <MessageSquare size={10} className="text-white" /> </div> );
      default:
        return <AlertCircle className="w-4 h-4 text-white/60" />;
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-white/5",
        isRead ? "opacity-60" : "" 
      )}
      onClick={onClick} 
    >
      <div className="w-2 flex-shrink-0 mt-2">
        {!isRead && (
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#6DDFFF" }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm leading-relaxed mb-1">{message}</p>
        <p className="text-white/40 text-xs">{formatTimeAgo(created_at)}</p>
      </div>
      <div className="flex-shrink-0 mt-1">
        <button 
          onClick={onDelete} 
          className="text-white/40 hover:text-white"
          title="Delete notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}