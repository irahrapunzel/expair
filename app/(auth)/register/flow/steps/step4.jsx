"use client";

import { useState } from "react";
import { Button } from "../../../../../components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

// Category data with icons and selection state
const categories = [
  { id: 1, name: "Technical & IT", icon: "laptop" },
  { id: 2, name: "Creative & Design", icon: "palette" },
  { id: 3, name: "Business & Management", icon: "user-business" },
  { id: 4, name: "Communication & Interpersonal", icon: "communication" },
  { id: 5, name: "Health & Wellness", icon: "health" },
  { id: 6, name: "Education & Training", icon: "education" },
  { id: 7, name: "Home & Lifestyle", icon: "home" },
  { id: 8, name: "Handiwork & Maintenance", icon: "wrench" },
  { id: 9, name: "Digital & Social Media", icon: "people" },
  { id: 10, name: "Languages & Translation", icon: "language" },
  { id: 11, name: "Financial & Accounting", icon: "money" },
  { id: 12, name: "Sports & Fitness", icon: "running" },
  { id: 13, name: "Arts & Performance", icon: "arts" },
  { id: 14, name: "Culture & Diversity", icon: "world" },
  { id: 15, name: "Research & Critical Thinking", icon: "book" },
];

export default function Step4({ onNext, onPrev }) {
  const [selectedCategories, setSelectedCategories] = useState([]);

  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleContinue = () => {
    // Save selected categories to state or context if needed
    onNext();
  };

  // Get the appropriate icon for each category
  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case "laptop":
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4h16v12H4z" fill="currentColor" />
          </svg>
        );
      case "palette":
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.67 0 1.19-.56 1.19-1.24 0-.32-.12-.6-.32-.82-.21-.22-.33-.5-.33-.82 0-.67.55-1.24 1.22-1.24h1.52c3.05 0 5.72-2.73 5.72-6 0-4.42-4.03-9.88-9-9.88zM6.5 12c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4c-.83 0-1.5-.67-1.5-1.5S8.67 5 9.5 5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="currentColor" />
          </svg>
        );
      case "user-business":
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C9.38 2 7.25 4.13 7.25 6.75c0 2.57 2.01 4.65 4.63 4.74.08-.01.16-.01.22 0h.07c2.7 0 4.83-2.18 4.83-4.75C17 4.15 14.87 2 12 2z" fill="currentColor" />
            <path d="M7 20v-3.08c0-1.86 3.13-2.56 5-2.56s5 .7 5 2.56V20" fill="currentColor" />
          </svg>
        );
      case "communication":
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="currentColor" />
          </svg>
        );
      case "health":
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.5 2.25h3v19.5h-3V2.25z" fill="currentColor" />
            <path d="M2.25 10.5h19.5v3H2.25v-3z" fill="currentColor" />
          </svg>
        );
      case "education":
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" fill="currentColor" />
            <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" fill="currentColor" />
          </svg>
        );
      case "home":
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3L4 9v12h16V9l-8-6z" fill="currentColor" />
          </svg>
        );
      case "wrench":
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" fill="currentColor" />
          </svg>
        );
      case "people":
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor" />
          </svg>
        );
      case "language":
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor" />
          </svg>
        );
      case "money":
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill="currentColor" />
          </svg>
        );
      case "running":
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z" fill="currentColor" />
          </svg>
        );
      case "arts":
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor" />
            <path d="M12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="currentColor" />
            <circle cx="12" cy="12" r="2.5" fill="currentColor" />
          </svg>
        );
      case "world":
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor" />
          </svg>
        );
      case "book":
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" fill="currentColor" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`pt-[50px] pb-[50px] flex min-h-screen items-center justify-center bg-cover bg-center ${inter.className} relative overflow-hidden`}
      style={{ backgroundImage: "url('/assets/bg_register.png')" }}
    >
      {/* Background glows */}
      <div className="absolute w-[673px] h-[673px] left-[-611.5px] top-[-336px] bg-[#906EFF] opacity-35 blur-[200px]"></div>
      <div className="absolute w-[673px] h-[673px] right-[-354px] bottom-[-454px] bg-[#0038FF] opacity-35 blur-[200px]"></div>
      
      <div className="relative z-10 w-full max-w-5xl text-center px-4 flex flex-col items-center">
        {/* Header */}
        <div className="flex flex-col items-center">
          <Image
            src="/assets/logos/Logotype=Logotype M.png"
            alt="Logo"
            width={249.3}
            height={76}
            className="mb-[30px]"
          />
          <h1 className="font-[600] text-[25px] text-center mb-[30px]">
            Set up your skills.
          </h1>
        </div>
        
        {/* Main content */}
        <div className="flex flex-col items-center justify-center w-full max-w-[907px] mx-auto gap-[30px]">
          <h2 className="text-[20px] font-[500] text-white">
            Select the categories you're interested in.
          </h2>
          
          {/* Categories grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-[12px] gap-y-[12px] w-full max-w-[907px] px-2">
            {categories.map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              // Determine appropriate width based on category name
              let width;
              if (category.name === "Communication & Interpersonal") {
                width = "100%"; // Specific width for this category
              } else if (category.name.length > 20) {
                width = "100%";
              } else if (category.name.length > 15) {
                width = "100%";
              } else if (category.name.length > 10) {
                width = "100%";
              } else {
                width = "100%";
              }
              
              return (
                <div
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`flex flex-col justify-center items-start p-5 gap-[5px] rounded-[20px] cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? "bg-[#120A2A] shadow-[0px_5px_40px_rgba(40,76,204,0.2)]"
                      : "bg-[rgba(88,36,144,0.15)] border-[3px] border-[#7E59F8] shadow-[0px_4px_4px_rgba(0,0,0,0.25),0px_5px_15px_#906EFF]"
                  }`}
                  style={{
                    width: width,
                    height: "80px",
                    background: isSelected
                      ? "radial-gradient(100% 275% at 100% 0%, #500582 0%, #120A2A 69.23%)"
                      : "radial-gradient(100% 275% at 100% 0%, rgba(88, 36, 144, 0.15) 0%, rgba(18, 10, 42, 0.15) 69.23%)"
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="text-white">
                      <span className={`${isSelected ? "text-white" : "text-white/40"}`}>
                        {getCategoryIcon(category.icon)}
                      </span>
                    </div>
                    {isSelected && (
                      <svg className="w-4 h-4 text-white ml-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="currentColor" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-[14px] ${isSelected ? "text-white" : "text-white/40"}`}>
                    {category.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Continue Button */}
        <div className="flex justify-center mt-[50px] mb-[25px]">
          <Button
            className="cursor-pointer flex w-[280px] h-[50px] justify-center items-center px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm sm:text-[20px] font-[500] transition rounded-[15px]"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
        
        {/* Pagination - Centered at bottom */}
        <div className="flex justify-center items-center gap-2 text-sm text-white opacity-60 mt-[20px] mb-[20px]">
          <ChevronLeft
            className="w-5 h-5 cursor-pointer text-gray-300 hover:text-white"
            onClick={onPrev}
          />
          <span>4 of 6</span>
          <ChevronRight
            className="w-5 h-5 cursor-pointer text-gray-300 hover:text-white"
            onClick={onNext}
          />
        </div>
      </div>
    </div>
  );
}
