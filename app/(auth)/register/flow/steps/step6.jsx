"use client";

import { useState } from "react";
import { Button } from "../../../../../components/ui/button";
import { ChevronLeft, Check, X } from "lucide-react";
import Image from "next/image";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Step6({ onComplete, onPrev }) {
  // Categories with subcategories
  const categories = [
    {
      name: "Creative & Design",
      subcategories: [
        "Graphic Design",
        "UI/UX Design",
        "Web Design",
        "Animation",
        "Photography",
        "Video Production"
      ]
    },
    {
      name: "Education & Training",
      subcategories: [
        "Academic Tutoring",
        "Professional Training",
        "Language Teaching",
        "Skill Development",
        "Course Creation"
      ]
    },
    {
      name: "Home & Lifestyle",
      subcategories: [
        "Interior Design",
        "Gardening",
        "Cooking",
        "Organization",
        "DIY Projects"
      ]
    },
    {
      name: "Sports & Fitness",
      subcategories: [
        "Personal Training",
        "Sports Coaching",
        "Yoga Instruction",
        "Nutrition Planning",
        "Fitness Programs"
      ]
    },
    {
      name: "Arts & Performance",
      subcategories: [
        "Music Lessons",
        "Dance Instruction",
        "Acting Coaching",
        "Visual Arts",
        "Creative Writing"
      ]
    }
  ];

  // State for dropdown selections and checkbox selections
  const [selectedSubcategories, setSelectedSubcategories] = useState({
    "Creative & Design": "",
    "Education & Training": "",
    "Home & Lifestyle": "",
    "Sports & Fitness": "",
    "Arts & Performance": []
  });

  // Toggle dropdown visibility
  const [openDropdown, setOpenDropdown] = useState({
    "Creative & Design": false,
    "Education & Training": false,
    "Home & Lifestyle": false,
    "Sports & Fitness": false,
    "Arts & Performance": false
  });

  // Handle dropdown selection
  const handleDropdownSelect = (category, subcategory) => {
    setSelectedSubcategories(prev => ({
      ...prev,
      [category]: subcategory
    }));
    setOpenDropdown(prev => ({
      ...prev,
      [category]: false
    }));
  };

  // Toggle dropdown visibility
  const toggleDropdown = (category) => {
    setOpenDropdown(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Handle checkbox selection for Arts & Performance
  const toggleCheckbox = (subcategory) => {
    setSelectedSubcategories(prev => {
      const currentSelections = [...prev["Arts & Performance"]];
      
      if (currentSelections.includes(subcategory)) {
        return {
          ...prev,
          "Arts & Performance": currentSelections.filter(item => item !== subcategory)
        };
      } else {
        return {
          ...prev,
          "Arts & Performance": [...currentSelections, subcategory]
        };
      }
    });
  };

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleContinue = () => {
    // Show confirmation modal instead of completing registration
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    // Save selected specializations if needed
    setShowConfirmModal(false);
    onComplete();
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  return (
    <div
      className={`pt-[50px] pb-[50px] flex min-h-screen items-center justify-center bg-cover bg-center ${inter.className}`}
      style={{ backgroundImage: "url('/assets/bg_register.png')" }}
    >
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50" onClick={handleCancel}></div>
          <div className="relative flex flex-col items-center justify-center w-[500px] h-[220px] bg-black/40 border-2 border-[#0038FF] shadow-[0px_4px_15px_#D78DE5] backdrop-blur-[40px] rounded-[15px] z-50 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-[-100px] left-[-100px] w-[200px] h-[200px] rounded-full bg-[#0038FF]/20 blur-[60px]"></div>
            <div className="absolute bottom-[-80px] right-[-80px] w-[180px] h-[180px] rounded-full bg-[#D78DE5]/20 blur-[60px]"></div>
            
            {/* Close button */}
            <button 
              className="absolute top-4 right-4 text-white hover:text-gray-300"
              onClick={handleCancel}
            >
              <X className="w-[15px] h-[15px]" />
            </button>
            
            <div className="flex flex-col items-center gap-5 w-full px-8">
              {/* Title */}
              <h2 className="font-bold text-[22px] text-center text-white leading-tight">
                Are all your account details accurate?
              </h2>
              
              {/* Buttons */}
              <div className="flex flex-row gap-5 mt-3">
                <button 
                  className="flex items-center justify-center w-[130px] h-[38px] border-2 border-[#0038FF] rounded-[15px] text-[#0038FF] text-[15px] font-medium shadow-[0px_0px_15px_#284CCC] hover:bg-[#0038FF]/10 transition-colors"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button 
                  className="flex items-center justify-center w-[130px] h-[38px] bg-[#0038FF] rounded-[15px] text-white text-[15px] font-medium shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors"
                  onClick={handleConfirm}
                >
                  Confirm
                </button>
              </div>
              
              {/* Footer text */}
              <p className="text-[12px] text-white/60 text-center mt-1">
                You may edit these details again in your profile.
              </p>
            </div>
          </div>
        </div>
      )}

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
          <h1 className="font-[600] text-[25px] text-center mb-[76px]">
            Set up your skills.
          </h1>
        </div>
        
        {/* Main content */}
        <div className="flex flex-col items-center justify-center w-full max-w-[922px] mx-auto">
          <h2 className="text-[20px] font-[500] text-white mb-[20px]">
            Select your specializations in each skill category.
          </h2>
          
          {/* Two-column layout */}
          <div className="flex flex-row gap-[120px] w-full">
            {/* Left column */}
            <div className="flex flex-col gap-[20px] w-[401px]">
              {/* First dropdown */}
              <div className="flex flex-col gap-[15px]">
                <label className="text-white text-[16px] text-left">
                  {categories[0].name}
                </label>
                <div className="relative">
                  <div 
                    className="w-[400px] h-[50px] bg-[#120A2A] border border-white/40 rounded-[15px] flex items-center justify-between px-4 cursor-pointer"
                    onClick={() => toggleDropdown(categories[0].name)}
                  >
                    <span className={selectedSubcategories[categories[0].name] ? "text-white text-[16px]" : "text-[#413663] text-[16px]"}>
                      {selectedSubcategories[categories[0].name] || "Select subcategory"}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-6 h-6 text-white transition-transform ${openDropdown[categories[0].name] ? "rotate-90" : ""}`}><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                  
                  {openDropdown[categories[0].name] && (
                    <div className="absolute z-20 w-[400px] mt-2 bg-[#120A2A] border border-white/40 rounded-[15px] py-2 shadow-lg">
                      {categories[0].subcategories.map((subcategory) => (
                        <div
                          key={subcategory}
                          className="px-4 py-2 hover:bg-[#1D1542] cursor-pointer text-white text-[16px] text-left"
                          onClick={() => handleDropdownSelect(categories[0].name, subcategory)}
                        >
                          {subcategory}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Second dropdown */}
              <div className="flex flex-col gap-[15px]">
                <label className="text-white text-[16px] text-left">
                  {categories[1].name}
                </label>
                <div className="relative">
                  <div 
                    className="w-[400px] h-[50px] bg-[#120A2A] border border-white/40 rounded-[15px] flex items-center justify-between px-4 cursor-pointer"
                    onClick={() => toggleDropdown(categories[1].name)}
                  >
                    <span className={selectedSubcategories[categories[1].name] ? "text-white text-[16px]" : "text-[#413663] text-[16px]"}>
                      {selectedSubcategories[categories[1].name] || "Select subcategory"}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-6 h-6 text-white transition-transform ${openDropdown[categories[1].name] ? "rotate-90" : ""}`}><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                  
                  {openDropdown[categories[1].name] && (
                    <div className="absolute z-20 w-[400px] mt-2 bg-[#120A2A] border border-white/40 rounded-[15px] py-2 shadow-lg">
                      {categories[1].subcategories.map((subcategory) => (
                        <div
                          key={subcategory}
                          className="px-4 py-2 hover:bg-[#1D1542] cursor-pointer text-white text-[16px] text-left"
                          onClick={() => handleDropdownSelect(categories[1].name, subcategory)}
                        >
                          {subcategory}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Checkbox group */}
              <div className="mt-[20px]">
                <label className="text-white text-[16px] text-left block mb-[15px]">
                  {categories[4].name}
                </label>
                <div className="w-[400px] h-[199px] bg-[#120A2A] border border-white/40 rounded-[15px] p-[20px_15px_10px_20px] flex flex-col">
                  <div className="flex flex-col gap-[10px]">
                    {categories[4].subcategories.map((subcategory) => {
                      const isChecked = selectedSubcategories["Arts & Performance"].includes(subcategory);
                      
                      return (
                        <div key={subcategory} className="flex items-center gap-[15px]">
                          <input
                            type="checkbox"
                            id={`checkbox-${subcategory}`}
                            checked={isChecked}
                            onChange={() => toggleCheckbox(subcategory)}
                            className="w-[14px] h-[14px] border-2 border-white/60 cursor-pointer accent-[#0038FF] bg-transparent"
                          />
                          <label htmlFor={`checkbox-${subcategory}`} className="text-white text-[16px] cursor-pointer">
                            {subcategory}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right column */}
            <div className="flex flex-col gap-[20px] w-[401px]">
              {/* Third dropdown */}
              <div className="flex flex-col gap-[15px]">
                <label className="text-white text-[16px] text-left">
                  {categories[2].name}
                </label>
                <div className="relative">
                  <div 
                    className="w-[400px] h-[50px] bg-[#120A2A] border border-white/40 rounded-[15px] flex items-center justify-between px-4 cursor-pointer"
                    onClick={() => toggleDropdown(categories[2].name)}
                  >
                    <span className={selectedSubcategories[categories[2].name] ? "text-white text-[16px]" : "text-[#413663] text-[16px]"}>
                      {selectedSubcategories[categories[2].name] || "Select subcategory"}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-6 h-6 text-white transition-transform ${openDropdown[categories[2].name] ? "rotate-90" : ""}`}><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                  
                  {openDropdown[categories[2].name] && (
                    <div className="absolute z-20 w-[400px] mt-2 bg-[#120A2A] border border-white/40 rounded-[15px] py-2 shadow-lg">
                      {categories[2].subcategories.map((subcategory) => (
                        <div
                          key={subcategory}
                          className="px-4 py-2 hover:bg-[#1D1542] cursor-pointer text-white text-[16px] text-left"
                          onClick={() => handleDropdownSelect(categories[2].name, subcategory)}
                        >
                          {subcategory}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Fourth dropdown */}
              <div className="flex flex-col gap-[15px]">
                <label className="text-white text-[16px] text-left">
                  {categories[3].name}
                </label>
                <div className="relative">
                  <div 
                    className="w-[400px] h-[50px] bg-[#120A2A] border border-white/40 rounded-[15px] flex items-center justify-between px-4 cursor-pointer"
                    onClick={() => toggleDropdown(categories[3].name)}
                  >
                    <span className={selectedSubcategories[categories[3].name] ? "text-white text-[16px]" : "text-[#413663] text-[16px]"}>
                      {selectedSubcategories[categories[3].name] || "Select subcategory"}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-6 h-6 text-white transition-transform ${openDropdown[categories[3].name] ? "rotate-90" : ""}`}><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                  
                  {openDropdown[categories[3].name] && (
                    <div className="absolute z-20 w-[400px] mt-2 bg-[#120A2A] border border-white/40 rounded-[15px] py-2 shadow-lg">
                      {categories[3].subcategories.map((subcategory) => (
                        <div
                          key={subcategory}
                          className="px-4 py-2 hover:bg-[#1D1542] cursor-pointer text-white text-[16px] text-left"
                          onClick={() => handleDropdownSelect(categories[3].name, subcategory)}
                        >
                          {subcategory}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Continue Button */}
        <div className="flex justify-center mt-[50px] mb-[47.5px]">
          <Button
            className="cursor-pointer flex w-[240px] h-[50px] justify-center items-center px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm sm:text-[20px] font-[500] transition rounded-[15px]"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
        
        {/* Pagination - Centered at bottom */}
        <div className="flex justify-center items-center gap-2 text-sm text-white opacity-60 mt-[20px]">
          <ChevronLeft
            className="w-5 h-5 cursor-pointer text-gray-300 hover:text-white"
            onClick={onPrev}
          />
          <span>6 of 6</span>
        </div>
      </div>
    </div>
  );
}
