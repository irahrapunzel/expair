"use client";

import { usePathname } from "next/navigation";
import Navbar from "./navbar";
import LandingNav from "./landingnav";
import Footer from "./footer";

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  // Check kung landing page
  const isLanding = pathname === "/" || pathname === "/landing";

  // Check kung auth page (e.g., signin)
  const isAuthPage = pathname.startsWith("/signin");

  return (
    <body className="bg-[#0B0521] text-white font-sans flex flex-col min-h-screen">
      {/* Render Navbar or LandingNav kung if auth page */}
      {!isAuthPage && (isLanding ? <LandingNav /> : <Navbar />)}

      <main className="flex-grow">{children}</main>

      {/* Render Footer if hindi auth page */}
      {!isAuthPage && (
        <div className="bg-[#050015]">
          <Footer />
        </div>
      )}
    </body>
  );
}
