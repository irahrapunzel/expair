"use client";

import { useState } from "react";
import { Button } from "../../../../../components/ui/button";
import { ChevronLeft, X } from "lucide-react";
import Image from "next/image";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

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

export default function Step6({ selectedSkills = [], onComplete, onPrev }) {
  const categories = allCategories.filter(cat => selectedSkills.includes(cat.id));
  const [openDropdown, setOpenDropdown] = useState({});
  const [selectedSubcategories, setSelectedSubcategories] = useState(() =>
    categories.reduce((acc, cat) => ({ ...acc, [cat.name]: "" }), {})
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const toggleDropdown = (categoryName) => {
    setOpenDropdown((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  const handleSelectSubcategory = (categoryName, subcategory) => {
    setSelectedSubcategories((prev) => ({
      ...prev,
      [categoryName]: subcategory,
    }));
    setOpenDropdown((prev) => ({
      ...prev,
      [categoryName]: false,
    }));
  };

  const handleContinue = () => {
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    setShowConfirmModal(false);
    onComplete(selectedSubcategories); // ✅ Pass data correctly
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
            <div className="absolute top-[-100px] left-[-100px] w-[200px] h-[200px] rounded-full bg-[#0038FF]/20 blur-[60px]"></div>
            <div className="absolute bottom-[-80px] right-[-80px] w-[180px] h-[180px] rounded-full bg-[#D78DE5]/20 blur-[60px]"></div>

            <button 
              className="absolute top-4 right-4 text-white hover:text-gray-300"
              onClick={handleCancel}
            >
              <X className="w-[15px] h-[15px]" />
            </button>

            <div className="flex flex-col items-center gap-5 w-full px-8">
              <h2 className="font-bold text-[22px] text-center text-white leading-tight">
                Are all your account details accurate?
              </h2>
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
              <p className="text-[12px] text-white/60 text-center mt-1">
                You may edit these details again in your profile.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-5xl text-center px-4 flex flex-col items-center">
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

        <div className="flex flex-col items-center justify-center w-full max-w-[922px] mx-auto">
          <h2 className="text-[20px] font-[500] text-white mb-[20px]">
            Select your specializations in each skill category.
          </h2>

          <div className="grid grid-cols-2 gap-x-[120px] gap-y-[30px] w-full">
            {categories.map((category) => (
              <div key={category.name} className="flex flex-col gap-[15px] w-[400px]">
                <label className="text-white text-[16px] text-left">
                  {category.name}
                </label>
                <div className="relative">
                  <div
                    className="w-[400px] h-[50px] bg-[#120A2A] border border-white/40 rounded-[15px] flex items-center justify-between px-4 cursor-pointer"
                    onClick={() => toggleDropdown(category.name)}
                  >
                    <span
                      className={
                        selectedSubcategories[category.name]
                          ? "text-white text-[16px]"
                          : "text-[#413663] text-[16px]"
                      }
                    >
                      {selectedSubcategories[category.name] || "Select subcategory"}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`w-6 h-6 text-white transition-transform ${
                        openDropdown[category.name] ? "rotate-90" : ""
                      }`}
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </div>

                  {openDropdown[category.name] && (
                    <div className="absolute z-20 w-[400px] mt-2 bg-[#120A2A] border border-white/40 rounded-[15px] py-2 shadow-lg max-h-[200px] overflow-auto">
                      {category.subcategories.map((subcategory) => (
                        <div
                          key={subcategory}
                          className="px-4 py-2 hover:bg-[#1D1542] cursor-pointer text-white text-[16px] text-left"
                          onClick={() => handleSelectSubcategory(category.name, subcategory)}
                        >
                          {subcategory}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-[50px] mb-[15px]">
            <Button
              className="cursor-pointer flex w-[240px] h-[50px] justify-center items-center px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm sm:text-[20px] font-[500] transition rounded-[15px]"
              onClick={handleContinue}
            >
              Continue
            </Button>
          </div>

          <div className="flex justify-center items-center gap-2 text-sm text-white opacity-60 mt-[20px]">
            <ChevronLeft
              className="w-5 h-5 cursor-pointer text-gray-300 hover:text-white"
              onClick={onPrev}
            />
            <span>6 of 6</span>
          </div>
        </div>
      </div>
    </div>
  );
}
