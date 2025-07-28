"use client";

import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function HelpLayout({ children }) {
  return (
    <div className={`min-h-screen bg-[#050015] text-white ${inter.className}`}>
      <section className="mx-[250px] pt-[55px]" style={{ width: "941px" }}>
        {/* Title */}
        <h1 className="text-[25px] font-semibold mb-[25px]">
          What do you need help with?
        </h1>

        {/* Search Bar */}
        <div className="relative w-full mb-[35px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white w-5 h-5" />
          <Input
            type="search"
            placeholder="Search"
            className="pl-10 bg-[#1C1B45] text-white placeholder:text-gray-400 border-none focus:ring-0 w-full"
          />
        </div>

        {/* Dynamic Content */}
        {children}
      </section>
    </div>
  );
}
