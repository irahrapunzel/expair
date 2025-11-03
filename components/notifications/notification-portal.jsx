"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, X, User, Check, GitMerge, MessageSquare } from "lucide-react";
import { cn } from "../../lib/utils";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function NotificationPortal({
  isOpen,
  onClose,
  onMarkAllAsRead,
  anchorRect,
  notifications,
  fetchNotifications,
}) {
  const [mounted, setMounted] = useState(false);
  const [readNotifications, setReadNotifications] = useState({});
  const router = useRouter();
  const { data: session } = useSession(); 

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const markOneAsRead = async (notification) => {
    // Mark as read in the UI immediately
    setReadNotifications((prev) => ({
      ...prev,
      [notification.notification_id]: true,
    }));

    // --- [FIXED] markOneAsRead with Auth ---
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
    // --- [END FIX] ---

    // Navigate to the link
    if (notification.link) {
      router.push(notification.link);
      onClose(); // Close portal on navigation
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

  // Calculate position based on the bell icon's position
  const top = anchorRect.bottom + 10;
  const right = window.innerWidth - anchorRect.right;

  return createPortal(
    <div
      data-notification-portal
      className="fixed w-[388px] max-h-[571px] overflow-hidden rounded-[15px] z-[9999]"
      style={{
        background: "rgba(10, 1, 24, 0.95)",
        boxShadow: "0px 4px 15px #D78DE5",
        backdropFilter: "blur(30px)",
        top: `${top}px`,
        right: `${right}px`,
        isolation: "isolate",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "25px",
      }}
    >
      <div className="flex items-center justify-between w-full">
        <h2 className="text-white text-[25px] font-semibold leading-[120%]">
          Notifications
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={markAllAsRead}
            className="text-[#906EFF] text-[16px] font-normal underline leading-[120%]"
          >
            Mark all as read
          </button>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X size={18} />
          </button>
        </div>
      </div>

      <div
        className="w-full flex flex-col gap-[15px] overflow-y-auto custom-scrollbar pr-2 pl-1"
        style={{ maxHeight: "452px" }}
      >
        {notifications.length === 0 ? (
          <div className="text-white/60 text-sm text-center py-10">
            No new notifications
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n.notification_id}
              id={n.notification_id}
              icon={n.notification_type}
              message={n.message}
              time={n.created_at}
              isRead={readNotifications[n.notification_id] || n.is_read}
              dotColor={"#6DDFFF"} // You can customize this
              onClick={() => markOneAsRead(n)}
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

function NotificationItem({
  id,
  icon,
  message,
  time,
  isRead,
  dotColor,
  onClick,
}) {
  const getIconComponent = (iconType) => {
    switch (iconType) {
      case "TRADE_INTEREST":
        return (
          <div className="w-4 h-4 bg-[#6DDFFF] rounded-full flex items-center justify-center">
            <User size={10} className="text-white" />
          </div>
        );
      case "TRADE_ACCEPTED":
      case "TRADE_CONFIRMED":
        return (
          <div className="w-4 h-4 bg-[#4ADE80] rounded-full flex items-center justify-center">
            <Check size={10} className="text-white" />
          </div>
        );
      case "PROOF_SUBMITTED":
        return (
          <div className="w-4 h-4 bg-[#F59E0B] rounded-full flex items-center justify-center">
            <GitMerge size={10} className="text-white" />
          </div>
        );
      case "PROOF_APPROVED":
        return (
          <div className="w-4 h-4 bg-[#4ADE80] rounded-full flex items-center justify-center">
            <Check size={10} className="text-white" />
          </div>
        );
      case "VERIF_ACCEPTED":
        return (
          <div className="w-4 h-4 bg-[#4ADE80] rounded-full flex items-center justify-center">
            <Check size={10} className="text-white" />
          </div>
        );
      case "VERIF_REJECTED":
        return (
          <div className="w-4 h-4 bg-[#FF4D4D] rounded-full flex items-center justify-center">
            <X size={10} className="text-white" />
          </div>
        );
      case "NEW_MESSAGE":
        return (
          <div className="w-4 h-4 bg-[#8B5CF6] rounded-full flex items-center justify-center">
            <MessageSquare size={10} className="text-white" />
          </div>
        );
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
      <div className="flex-shrink-0 mt-1">{getIconComponent(icon)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm leading-relaxed mb-1">{message}</p>
        <p className="text-white/40 text-xs">{formatTimeAgo(time)}</p>
      </div>
      {!isRead && (
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
          style={{ backgroundColor: dotColor }}
        />
      )}
    </div>
  );
}