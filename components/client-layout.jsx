"use client";

import { usePathname } from "next/navigation";
import Navbar from "./navbar";
import LandingNav from "./landingnav";
import Footer from "./footer";

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  // Show LandingNav only on the landing page ("/" or "/landing")
  const isLanding =
    pathname === "/" || pathname === "/landing";

  // TODO: Replace this with your actual authentication logic
  const isLoggedIn = false;

  return (
    <body className="bg-[#0B0521] text-white font-sans flex flex-col min-h-screen">
      {isLanding ? (
        <LandingNav />
      ) : (
        <Navbar />
      )}
      <main className="flex-grow">{children}</main>
      <div className="bg-[#050015]">
        <Footer />
      </div>
    </body>
  );
}