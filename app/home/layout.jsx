"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/components/navbar";

export default function HomeLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isSuspended =
    session?.user?.sanction_status?.toUpperCase() === "SUSPENSION" ||
    session?.user?.sanction_status?.toUpperCase() === "BAN";

  const isExcludedPath = pathname.startsWith("/suspension") || pathname.startsWith("/appeal");

  // Enforce Redirection Guard
  useEffect(() => {
    if (status === 'loading') return; // Do nothing while loading session

    if (isSuspended && !isExcludedPath) {
      // User is suspended but trying to access a restricted page (like /home)
      console.log("SUSPENSION DETECTED: Redirecting to /suspension");
      router.replace("/suspension");
    }
    else if (!isSuspended && isExcludedPath) {
      router.replace("/home");
    }

  }, [status, isSuspended, isExcludedPath, router]);

  // If session is loading or if the user is suspended and we are not on the suspension page yet, 
  // we render a minimalist screen (or null) to prevent flashing the main content.
  if (status === 'loading' || (isSuspended && !isExcludedPath)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050015]">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  // Render the Navbar and children for valid, non-suspended users, or when the suspended user is viewing an excluded path (/suspension or /appeal).
  return (
    <>
      <Navbar />
      <main>
        {children}
      </main>
    </>
  );
}