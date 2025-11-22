"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Inter } from "next/font/google";
import { LayoutDashboard, Users, LogOut, Menu, X, FileText } from "lucide-react";
import ProfileAvatar from "@/components/avatar";
import { useSession, signOut } from "next-auth/react"; // Added signOut import

const inter = Inter({ subsets: ["latin"] });

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status: sessionStatus } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- LOGIC FOR AUTHENTICATION AND REDIRECTION ---
  useEffect(() => {
    // Redirect to login if not authenticated after loading is finished
    if (sessionStatus === "unauthenticated") {
        router.push("/admin/login");
    }
  }, [sessionStatus, router]);

  // --- LOGOUT FUNCTION ---
  const handleLogout = async () => {
    try {
      const refresh = session?.refresh;
      if (refresh) {
        // Call your backend logout endpoint to invalidate the refresh token
        // Use the same endpoint logic as in navbar.jsx
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
      // Regardless of backend success, sign out the NextAuth session
      // Redirects to the root "/" (or wherever your callbackUrl points)
      await signOut({ redirect: true, callbackUrl: "/" });
    }
  };

  const navigationItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    { name: "Users", icon: Users, href: "/admin/dashboard/users" },
    { name: "Reports", icon: FileText, href: "/admin/dashboard/reports" },
  ];

  // Logic for handling loading state
  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050015] text-white">
        Verifying Session...
      </div>
    );
  }

  // If not authenticated, return null to avoid rendering the admin layout
  if (sessionStatus !== "authenticated") {
      return null;
  }

  // Admin user details from session
  const adminUser = {
      username: session?.user?.username || 'Admin',
      name: session?.user?.name || 'Administrator',
      role: session?.user?.role || 'Administrator',
  };


  return (
    <div className={`flex min-h-screen bg-[#050015] ${inter.className}`}>
      {/* Sidebar */}
      <aside
        className={`relative flex flex-col border-r border-[#906EFF]/20 text-white transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "w-[320px]" : "w-[80px]"
        }`}
        style={{
          borderRadius: "0 16px 16px 0",
          background: "linear-gradient(135deg, #120A2A 0%, #050015 100%)",
        }}
      >
        {/* Top Section */}
        {isSidebarOpen ? (
          <div className="p-6 border-b border-[#906EFF]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#906EFF] to-[#3C2E64] flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">EXPAIR</h1>
                <p className="text-xs text-white/60">Admin Portal</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 border-b border-[#906EFF]/20">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#906EFF] to-[#3C2E64] flex items-center justify-center mx-auto">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
          </div>
        )}

        {/* Admin Info */}
        {isSidebarOpen && (
          <div className="p-4 border-b border-[#906EFF]/20 flex items-center gap-3">
            <ProfileAvatar src={session?.user?.image || "/defaultavatar.png"} size={40} />
            <div>
              <div className="font-medium">{adminUser.name}</div>
              <div className="text-xs text-white/60">{adminUser.role}</div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-all cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-[#906EFF] to-[#7D5FE6] text-white shadow-lg"
                        : "text-white/70 hover:bg-[#3C2E64] hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {isSidebarOpen && (
                      <span className="font-medium">{item.name}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-[#906EFF]/20">
          <button
            onClick={handleLogout} // Calls the updated logout function
            className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] w-full transition-all text-red-400 hover:bg-red-500/10 ${
              !isSidebarOpen && "justify-center"
            }`}
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-[#906EFF] rounded-full flex items-center justify-center text-white hover:bg-[#7D5FE6] transition-colors shadow-lg"
        >
          {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}