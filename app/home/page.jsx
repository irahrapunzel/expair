"use client";

import { useEffect, useState } from "react";
import { Inter } from "next/font/google";
import { Archivo } from "next/font/google";
import { Button } from "../../components/ui/button";
import { Icon } from "@iconify/react";
import ActiveTradeCardHome from "../../components/trade-cards/active-home";

const inter = Inter({ subsets: ["latin"] });
const archivo = Archivo({ subsets: ["latin"] });

export default function HomePage() {
  const [greeting, setGreeting] = useState("Starry evening, voyager");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedSort, setSelectedSort] = useState("Date");
  const [showSortOptions, setShowSortOptions] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      setGreeting("Bright morning, voyager");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good afternoon, voyager");
    } else if (hour >= 17 && hour < 22) {
      setGreeting("Stellar evening, voyager");
    } else {
      setGreeting("Starry night, voyager");
    }
  }, []);

  return (
    <div
      className={`w-[950px] mx-auto pt-10 pb-20 text-white ${inter.className}`}
    >
      {/* Greeting Header */}
      <h1
        className={`text-[40px] font-bold mb-10 ${archivo.className}`}
        style={{
          textShadow: "0px 3px 25px rgba(126, 89, 248, 0.8)",
        }}
      >
        {greeting}
      </h1>

      {/* Active Trades Header */}
      <div className="flex justify-between items-center mb-8">
        <h4 className="text-[22px] font-bold">Active trades</h4>

        <div className="flex items-center gap-4">
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortOptions((prev) => !prev)}
              className="flex items-center gap-2 px-4 py-2 bg-[#120A2A] rounded-[15px] hover:bg-[#1A0F3E] transition text-sm"
            >
              <Icon icon="mdi:sort" className="text-lg" />
              {selectedSort}
              <Icon icon="mdi:chevron-down" className="text-base" />
            </button>

            {showSortOptions && (
              <div className="absolute z-10 mt-2 w-full bg-[#15042C] rounded-[10px] border border-[#2B124C] shadow-md">
                {["Date", "Level", "Rating"].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSelectedSort(option);
                      setShowSortOptions(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#1A0F3E] ${
                      selectedSort === option
                        ? "font-semibold text-[#6C8BFF]"
                        : ""
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Asc/Desc Toggle */}
          <button
            onClick={() => setSortAsc((prev) => !prev)}
            className="w-9 h-9 bg-[#120A2A] rounded-full flex items-center justify-center hover:bg-[#1A0F3E] transition"
          >
            <Icon
              icon={sortAsc ? "mdi:arrow-up" : "mdi:arrow-down"}
              className="text-lg"
            />
          </button>
        </div>
      </div>

      {/* Active Trade Cards Grid */}
      <div className="w-full max-w-[940px] flex flex-wrap gap-[25px] mt-6">
        <ActiveTradeCardHome />
      </div>

      {/* Placeholder for Explore Section */}
      <div className="mt-20">
        <h4 className="text-[22px] font-bold mb-4">Explore</h4>
        <div className="w-full text-sm text-gray-400">
          (Explore page content coming soon)
        </div>
      </div>
    </div>
  );
}
