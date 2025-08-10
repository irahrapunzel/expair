"use client";

import { useState, useEffect } from "react";
import { Button } from "../../../../../components/ui/button";
import { ChevronLeft, ChevronDown } from "lucide-react";
import Image from "next/image";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

// All possible skill categories with their subcategories
const allCategories = [
  { id: 1, name: "Technical & IT", subcategories: ["Web Development", "Software Development", "IT Support", "Network Administration", "Cybersecurity"] },
  { id: 2, name: "Creative & Design", subcategories: ["Graphic Design", "Photography", "Video Editing", "Illustration", "Animation"] },
  { id: 3, name: "Business & Management", subcategories: ["Project Management", "Business Consulting", "Human Resources", "Operations Management", "Marketing Strategy"] },
  { id: 4, name: "Communication & Interpersonal", subcategories: ["Customer Service", "Public Relations", "Copywriting", "Translation", "Social Media Management"] },
  { id: 5, name: "Health & Wellness", subcategories: ["Nutrition Coaching", "Personal Training", "Mental Health Counseling", "Yoga Instruction", "Physical Therapy"] },
  { id: 6, name: "Education & Training", subcategories: ["Tutoring", "Language Instruction", "Corporate Training", "Curriculum Development", "Test Preparation"] },
  { id: 7, name: "Home & Lifestyle", subcategories: ["Interior Decorating", "Cleaning Services", "Gardening", "Event Planning", "Personal Assistance"] },
  { id: 8, name: "Handiwork & Maintenance", subcategories: ["Furniture Assembly", "Sewing & Alterations", "Handyman Services", "Painting & Decorating", "Crafting"] },
  { id: 9, name: "Digital & Social Media", subcategories: ["Social Media Management", "Content Creation", "SEO", "Digital Advertising", "Email Marketing"] },
  { id: 10, name: "Languages & Translation", subcategories: ["Translation", "Interpretation", "Language Tutoring", "Transcription", "Localization"] },
  { id: 11, name: "Financial & Accounting", subcategories: ["Bookkeeping", "Tax Preparation", "Financial Planning", "Payroll Services", "Auditing"] },
  { id: 12, name: "Sports & Fitness", subcategories: ["Personal Training", "Group Fitness Instruction", "Sports Coaching", "Nutrition for Athletes", "Physical Therapy"] },
  { id: 13, name: "Arts & Performance", subcategories: ["Music Lessons", "Dance Instruction", "Acting Coaching", "Visual Arts", "Creative Writing"] },
  { id: 14, name: "Culture & Diversity", subcategories: ["Diversity Training", "Cultural Consulting", "Language & Cultural Exchange", "Community Outreach", "Inclusion Workshops"] },
  { id: 15, name: "Research & Critical Thinking", subcategories: ["Market Research", "Data Analysis", "Academic Research", "Competitive Analysis", "Strategic Planning"] },
];

export default function Step6({ onNext, onPrev, selectedSkills = [] }) {
  // Debug log to check what skills are coming in
  useEffect(() => {
    console.log("Selected skills in Step6:", selectedSkills);
  }, [selectedSkills]);

  // Ensure selectedSkills is always an array
  const safeSelectedSkills = Array.isArray(selectedSkills) ? selectedSkills : [];

  // Filter categories based on skills selected in step5
  const categories = allCategories.filter(cat => safeSelectedSkills.includes(cat.id));
  
  // Track open/closed state for each dropdown
  const [openDropdowns, setOpenDropdowns] = useState({});
  
  // Track which checkboxes are checked for each category
  const [checkedOptions, setCheckedOptions] = useState({});
  
  // Track error message
  const [errorMessage, setErrorMessage] = useState("");

  // If no skills are selected, show a placeholder message
  if (!safeSelectedSkills || safeSelectedSkills.length === 0) {
    return (
      <div
        className={`pt-[50px] pb-[50px] flex min-h-screen items-center justify-center bg-cover bg-center ${inter.className}`}
        style={{ backgroundImage: "url('/assets/bg_register.png')" }}
      >
        <div className="relative z-10 w-full max-w-5xl text-center px-4 flex flex-col items-center">
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
          
          <div className="flex flex-col items-center justify-center w-full max-w-[922px] mx-auto">
            <h2 className="text-[20px] font-[500] text-center text-white mb-[20px]">
              Please go back and select skills first.
            </h2>
            
            <Button
              className="cursor-pointer flex w-[240px] h-[50px] justify-center items-center px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm sm:text-[20px] font-[500] transition rounded-[15px] mt-[50px]"
              onClick={onPrev}
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const toggleDropdown = (categoryId) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const toggleCheckbox = (categoryId, option) => {
    setCheckedOptions(prev => {
      const currentOptions = prev[categoryId] || [];
      
      if (currentOptions.includes(option)) {
        const newOptions = {
          ...prev,
          [categoryId]: currentOptions.filter(item => item !== option)
        };
        
        // Clear error if there's at least one selection across all categories
        const hasSelections = Object.values(newOptions).some(arr => arr && arr.length > 0);
        if (hasSelections) {
          setErrorMessage("");
        }
        
        return newOptions;
      } else {
        setErrorMessage(""); // Clear error when adding a selection
        return {
          ...prev,
          [categoryId]: [...currentOptions, option]
        };
      }
    });
  };

  const isOptionChecked = (categoryId, option) => {
    return (checkedOptions[categoryId] || []).includes(option);
  };

  const handleContinue = () => {
    // Check if at least one specialization is selected
    const hasSelections = Object.values(checkedOptions).some(arr => arr && arr.length > 0);
    
    if (!hasSelections) {
      setErrorMessage("Please select at least one specialization.");
      return;
    }
    
    setErrorMessage("");
    onNext(checkedOptions);
  };

  const handleNextClick = () => {
    handleContinue();
  };

  return (
    <div
      className={`pt-[50px] pb-[50px] flex min-h-screen items-center justify-center bg-cover bg-center ${inter.className}`}
      style={{ backgroundImage: "url('/assets/bg_register.png')" }}
    >
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
        <div className="flex flex-col items-center justify-center w-full max-w-[922px] mx-auto">
          <h2 className="text-[20px] font-[500] text-center text-white mb-[20px]">
            Select your specializations in each skill category.
          </h2>
          
          {/* Two column layout for form fields */}
          <div className="flex flex-row gap-[120px] w-full">
            {/* Left column */}
            <div className="flex flex-col gap-[20px] w-[401px]">
              {categories.slice(0, Math.ceil(categories.length / 2)).map((category) => (
                <div key={category.id} className="w-full">
                  <div className="flex flex-col gap-[15px]">
                    <label className="text-white text-[16px] text-left">
                      {category.name}
                    </label>
                    <div className="relative">
                      {/* Collapsed state */}
                      {!openDropdowns[category.id] && (
                        <div 
                          className="w-[400px] h-[50px] bg-[#120A2A] border border-white/40 rounded-[15px] flex items-center justify-between px-4 cursor-pointer"
                          onClick={() => toggleDropdown(category.id)}
                        >
                          <span className="text-[#413663] text-[16px]">
                            Select subcategory
                          </span>
                          <ChevronDown className="w-6 h-6 text-white" />
                        </div>
                      )}
                      
                      {/* Expanded state with checkboxes */}
                      {openDropdowns[category.id] && (
                        <div className="w-[400px] bg-[#120A2A] border border-white/40 rounded-[15px] p-[20px_15px_10px_20px] flex flex-col justify-between transition-all duration-300">
                          <div className="flex flex-col gap-[10px] w-full">
                            {category.subcategories.map((subcategory) => (
                              <div 
                                key={subcategory} 
                                className="flex flex-row items-center gap-[15px] cursor-pointer hover:bg-white/5 rounded-[8px] p-[5px] transition-colors duration-200"
                                onClick={() => toggleCheckbox(category.id, subcategory)}
                              >
                                <div className="w-[18px] h-[18px] flex items-center justify-center">
                                  {isOptionChecked(category.id, subcategory) ? (
                                    <div className="w-[18px] h-[18px] bg-gradient-to-br from-[#0038FF] to-[#906EFF] rounded-[4px] border border-[#0038FF] flex items-center justify-center shadow-[0px_2px_8px_rgba(0,56,255,0.3)]">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path d="M4.5 8.7L1.95 6.15L2.85 5.25L4.5 6.9L9.15 2.25L10.05 3.15L4.5 8.7Z" fill="white" strokeWidth="1.5"/>
                                      </svg>
                                    </div>
                                  ) : (
                                    <div className="w-[18px] h-[18px] border-2 border-white/40 rounded-[4px] hover:border-white/60 transition-colors duration-200 bg-transparent"></div>
                                  )}
                                </div>
                                <span className="text-white text-[16px] font-[400] leading-[19px] select-none">{subcategory}</span>
                              </div>
                            ))}
                          </div>
                          <ChevronDown 
                            className="w-6 h-6 text-white self-end transform rotate-180 cursor-pointer mt-[10px]" 
                            onClick={() => toggleDropdown(category.id)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Right column */}
            <div className="flex flex-col gap-[20px] w-[401px]">
              {categories.slice(Math.ceil(categories.length / 2)).map((category) => (
                <div key={category.id} className="w-full">
                  <div className="flex flex-col gap-[15px]">
                    <label className="text-white text-[16px] text-left">
                      {category.name}
                    </label>
                    <div className="relative">
                      {/* Collapsed state */}
                      {!openDropdowns[category.id] && (
                        <div 
                          className="w-[400px] h-[50px] bg-[#120A2A] border border-white/40 rounded-[15px] flex items-center justify-between px-4 cursor-pointer"
                          onClick={() => toggleDropdown(category.id)}
                        >
                          <span className="text-[#413663] text-[16px]">
                            Select subcategory
                          </span>
                          <ChevronDown className="w-6 h-6 text-white" />
                        </div>
                      )}
                      
                      {/* Expanded state with checkboxes */}
                      {openDropdowns[category.id] && (
                        <div className="w-[400px] bg-[#120A2A] border border-white/40 rounded-[15px] p-[20px_15px_10px_20px] flex flex-col justify-between transition-all duration-300">
                          <div className="flex flex-col gap-[10px] w-full">
                            {category.subcategories.map((subcategory) => (
                              <div 
                                key={subcategory} 
                                className="flex flex-row items-center gap-[15px] cursor-pointer hover:bg-white/5 rounded-[8px] p-[5px] transition-colors duration-200"
                                onClick={() => toggleCheckbox(category.id, subcategory)}
                              >
                                <div className="w-[18px] h-[18px] flex items-center justify-center">
                                  {isOptionChecked(category.id, subcategory) ? (
                                    <div className="w-[18px] h-[18px] bg-gradient-to-br from-[#0038FF] to-[#906EFF] rounded-[4px] border border-[#0038FF] flex items-center justify-center shadow-[0px_2px_8px_rgba(0,56,255,0.3)]">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path d="M4.5 8.7L1.95 6.15L2.85 5.25L4.5 6.9L9.15 2.25L10.05 3.15L4.5 8.7Z" fill="white" strokeWidth="1.5"/>
                                      </svg>
                                    </div>
                                  ) : (
                                    <div className="w-[18px] h-[18px] border-2 border-white/40 rounded-[4px] hover:border-white/60 transition-colors duration-200 bg-transparent"></div>
                                  )}
                                </div>
                                <span className="text-white text-[16px] font-[400] leading-[19px] select-none">{subcategory}</span>
                              </div>
                            ))}
                          </div>
                          <ChevronDown 
                            className="w-6 h-6 text-white self-end transform rotate-180 cursor-pointer mt-[10px]" 
                            onClick={() => toggleDropdown(category.id)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message (fixed height) */}
        <div className="h-[10px] mt-4">
          {errorMessage && (
            <p className="text-red-500 text-sm">{errorMessage}</p>
          )}
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
          <ChevronLeft
            className="w-5 h-5 cursor-pointer text-gray-300 hover:text-white transform rotate-180"
            onClick={handleNextClick}
          />
        </div>
      </div>
    </div>
  );
}
