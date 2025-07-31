"use client";

import { useEffect, useState } from "react";
import { Inter } from "next/font/google";
import { Archivo } from "next/font/google";
import { Button } from "../../components/ui/button";
import { Icon } from "@iconify/react";
import ActiveTradeCardHome from "../../components/trade-cards/active-home";
import SortDropdown from "../../components/shared/sortdropdown";
import ExploreCard from "../../components/trade-cards/explore-card";

const inter = Inter({ subsets: ["latin"] });
const archivo = Archivo({ subsets: ["latin"] });

export default function HomePage() {
  const [greeting, setGreeting] = useState("Starry evening, voyager");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedActiveSort, setSelectedActiveSort] = useState("Date");
  const [selectedExploreSort, setSelectedExploreSort] = useState("Date");
  const [showStarFilter, setShowStarFilter] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showRankFilter, setShowRankFilter] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      setGreeting("Bright morning, voyager ☀️");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good afternoon, voyager ☁️");
    } else if (hour >= 17 && hour < 22) {
      setGreeting("Stellar evening, voyager 🌙");
    } else {
      setGreeting("Starry night, voyager ⭐");
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
          <SortDropdown
            selected={selectedActiveSort}
            onChange={setSelectedActiveSort}
          />

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

      {/* Explore Section */}
      <div className="mt-20 w-full">
        {/* Header Row */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-[15px]">
            <h4 className="text-[22px] font-bold">Explore</h4>
            <img
              src="/assets/explore_icon.png"
              alt="Explore Icon"
              width={38}
              height={38}
            />
          </div>

          {/* Reusing Sort Dropdown */}
          <div className="flex items-center gap-4">
            <SortDropdown
              selected={selectedExploreSort}
              onChange={setSelectedExploreSort}
            />

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

        {/* Search Bar */}
        <div className="relative w-full mb-[35px]">
          <Icon
            icon="mdi:magnify"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white w-5 h-5"
          />
          <input
            type="search"
            placeholder="Search"
            className="pl-10 bg-[#1C1B45] text-white placeholder:text-gray-400 border-none focus:ring-0 w-full rounded-md py-2"
          />
        </div>

        {/* Explore Section */}
        <div className="flex gap-6 items-start w-full">
          {/* Filters */}
          <div className="w-[230px] flex-shrink-0 space-y-6">
            {/* Star Rating Filter */}
            <div className="bg-[#120A2A] rounded-[15px] p-4">
              <button
                onClick={() => setShowStarFilter((prev) => !prev)}
                className="w-full flex justify-between items-center font-semibold text-[16px]"
              >
                <span>Star Rating</span>
                <Icon
                  icon={showStarFilter ? "mdi:chevron-up" : "mdi:chevron-down"}
                />
              </button>
              {showStarFilter && (
                <div className="mt-4 flex justify-center">
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      className="w-[60px] bg-[#1C1B45] text-white text-sm rounded px-2 py-1 border-none"
                      placeholder="Min"
                    />
                    <span className="text-white">↔</span>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      className="w-[60px] bg-[#1C1B45] text-white text-sm rounded px-2 py-1 border-none"
                      placeholder="Max"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Skill Category Filter */}
            <div className="bg-[#120A2A] rounded-[15px] p-4">
              <button
                onClick={() => setShowCategoryFilter((prev) => !prev)}
                className="w-full flex justify-between items-center font-semibold text-[16px]"
              >
                <span>Skill Category</span>
                <Icon
                  icon={
                    showCategoryFilter ? "mdi:chevron-up" : "mdi:chevron-down"
                  }
                />
              </button>
              {showCategoryFilter && (
                <div className="mt-4 max-h-[220px] overflow-y-auto relative space-y-2 text-sm text-white pr-2 scrollbar-thin scrollbar-thumb-white scrollbar-track-transparent">
                  {[
                    "Creative & Design",
                    "Technical & IT",
                    "Business & Management",
                    "Communication & Interpersonal",
                    "Health & Wellness",
                    "Education & Training",
                    "Home & Lifestyle",
                    "Handiwork & Maintenance",
                    "Digital & Social Media",
                    "Language & Translation",
                    "Financial & Accounting",
                    "Sports & Fitness",
                    "Arts & Performance",
                    "Culture & Diversity",
                    "Research & Critical Thinking",
                  ].map((category) => (
                    <label key={category} className="flex items-center gap-2">
                      <input type="checkbox" className="accent-[#906EFF]" />
                      {category}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Rank Filter */}
            <div className="bg-[#120A2A] rounded-[15px] p-4">
              <button
                onClick={() => setShowRankFilter((prev) => !prev)}
                className="w-full flex justify-between items-center font-semibold text-[16px]"
              >
                <span>Rank Level</span>
                <Icon
                  icon={showRankFilter ? "mdi:chevron-up" : "mdi:chevron-down"}
                />
              </button>
              {showRankFilter && (
                <div className="mt-4 space-y-2 text-sm text-white">
                  {[
                    "Unranked (1–5)",
                    "Dwarf Star (6–10)",
                    "Rising Star (11–20)",
                    "Shining Star (21–30)",
                    "Giant (31–40)",
                    "Supergiant (41–50)",
                    "Stellar (51–60)",
                    "Radiant (61–70)",
                    "Cosmic (71–80)",
                    "Luminary (81–90)",
                    "Ethereal (91–99)",
                    "Celestial (100)",
                  ].map((rank) => (
                    <label key={rank} className="flex items-center gap-2">
                      <input type="checkbox" className="accent-[#906EFF]" />
                      {rank}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Explore Cards (Grid) */}
          <div className="grid grid-cols-2 gap-6 flex-1">
            <ExploreCard
              name="Olivia Brown"
              rating={4.5}
              ratingCount={12}
              level={8}
              need="Social Media Strategy"
              offer="Content Writing"
              deadline="Until August 5"
            />
            <ExploreCard
              name="James Wilson"
              rating={4.9}
              ratingCount={10}
              level={12}
              need="Algebra Tutoring"
              offer="Gardening"
              deadline="Until June 20"
            />
            <ExploreCard
              name="Sophia Garcia"
              rating={4.7}
              ratingCount={9}
              level={6}
              need="Illustration for Thesis"
              offer="Spanish Lessons"
              deadline="Until July 15"
            />
            <ExploreCard
              name="Daniel Kim"
              rating={5.0}
              ratingCount={18}
              level={15}
              need="Resume Review"
              offer="Interview Coaching"
              deadline="Until August 10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
