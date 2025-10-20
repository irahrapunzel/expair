"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Inter } from "next/font/google";
import { LayoutDashboard, Users, LogOut, Menu, X, FileText } from "lucide-react";
import ProfileAvatar from "@/components/avatar";

const inter = Inter({ subsets: ["latin"] });

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminUser, setAdminUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const user =
      localStorage.getItem("adminUser") ||
      JSON.stringify({
        username: "admin",
        name: "Admin User",
        org: "expair",
        role: "Administrator",
      });
    setAdminUser(JSON.parse(user));
    
    // Set admin token for API calls
    if (!localStorage.getItem("adminToken")) {
      localStorage.setItem("adminToken", "admin-token-123");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    router.push("/");
  };

  const navigationItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    { name: "Users", icon: Users, href: "/admin/dashboard/users" },
    { name: "Reports", icon: FileText, href: "/admin/dashboard/reports" },
  ];

  if (!adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050015] text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen bg-[#050015] ${inter.className}`}>
      {/* Sidebar */}
      <aside
        className={`relative flex flex-col border-r border-white/10 text-white transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "w-[320px]" : "w-[80px]"
        }`}
        style={{
          borderRadius: "0 16px 16px 0",
          background:
            "radial-gradient(277.39% 141.42% at 100% 0%, #0A0028 0%, #050015 70%)",
        }}
      >
        {/* Top Section */}
        {isSidebarOpen ? (
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <img
              src="/assets/logos/Logotype=Logotype L.png"
              alt="Logo"
              className="w-36 transition-all duration-300 mx-auto"
            />
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-white/70 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        ) : (
          <div className="h-[100px] flex flex-col items-center justify-center border-b border-white/10">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-white/70 hover:text-white flex items-center justify-center mb-3"
            >
              <Menu className="w-7 h-7" />
            </button>
            <img
              src="/assets/logos/Colored=Logo M.png"
              alt="Mini Logo"
              className="w-7"
            />
          </div>
        )}

        {/* Admin Info */}
        {isSidebarOpen && (
          <div className="p-4 border-b border-white/10 flex items-center gap-3">
            <ProfileAvatar src="/assets/defaultavatar.png" size={40} />
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
                        ? "bg-[#0038FF] text-white shadow-lg shadow-blue-500/20 rounded-[100px]"
                        : "text-white/70 hover:text-white hover:bg-white/5 hover:rounded-[100px] active:rounded-[100px]"
                    } ${!isSidebarOpen ? "justify-center" : ""}`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {isSidebarOpen && (
                      <span className="text-sm font-medium">{item.name}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 w-full text-[#FB9696] hover:text-[#FFB6B6] hover:bg-white/5 rounded-lg transition-all ${
              !isSidebarOpen ? "justify-center" : ""
            }`}
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && (
              <span className="text-sm font-medium">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
