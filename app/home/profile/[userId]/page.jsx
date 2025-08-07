"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Inter } from "next/font/google";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import { ChevronDownIcon, ChevronUpIcon, PencilIcon, Star, Heart, Flag } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

// Inline Button component
const Button = ({ children, className, onClick, ...props }) => {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Inline helper for Trade Details to keep code clean
const TradePill = ({ content }) => {
  return (
    <div
      className={clsx(
        "inline-flex items-center px-[15px] py-[10px] text-[13px] rounded-full border-2 text-white overflow-hidden"
      )}
    >
      <span className="whitespace-nowrap">{content}</span>
    </div>
  );
};


// Inline ReviewCard component with updated design
const ReviewCard = ({ review }) => {
  const { requester, tradePartner, tradeCompletionDate, requestTitle, offerTitle, rating, reviewDescription, likes } = review;
  const [isLiked, setIsLiked] = useState(false);

  // Function to render stars based on a rating
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    const stars = [];

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className="w-5 h-5 fill-[#906EFF] text-[#906EFF]" />
      );
    }
    // Half star
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative w-5 h-5">
          <Star className="absolute w-5 h-5 text-gray-300 stroke-2" />
          <div className="absolute top-0 left-0 overflow-hidden w-1/2">
            <Star className="w-5 h-5 fill-[#906EFF] text-[#906EFF]" />
          </div>
        </div>
      );
    }
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-5 h-5 text-gray-300 stroke-2" />
      );
    }
    return stars;
  };

  // Function to handle the report action
  const handleReport = () => {
    // In a real app, this would be a client-side navigation or a more complex interaction
    console.log(`Navigating to help form for reporting review by ${requester}`);
    window.location.href = "/help#help-form";
  };

  return (
    <div
      className="flex flex-col gap-[20px] rounded-[20px] border-[3px] border-[#284CCC]/80 p-[25px] relative transition-all duration-300 hover:scale-[1.01]"
      style={{
        background: 'radial-gradient(circle at top right, #3D2490 0%, #120A2A 69%)'
      }}
    >
      <div className="flex justify-between items-start">
        {/* User and Partner Avatars with 'X' separator, names, and date */}
        <div className="flex items-start gap-[15px]">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {/* Use the defaultavatar.png for the review cards */}
              <Image
                src="/assets/defaultavatar.png"
                alt={`${tradePartner}'s avatar`}
                width={35}
                height={35}
                className="rounded-full object-cover"
              />
              <Icon icon="ic:baseline-close" className="w-4 h-4 text-white" />
              {/* Use the defaultavatar.png for the review cards */}
              <Image
                src="/assets/defaultavatar.png"
                alt={`${requester}'s avatar`}
                width={35}
                height={35}
                className="rounded-full object-cover"
              />
              <div className="flex flex-col justify-start">
                <span className="font-semibold text-white text-base">{`${tradePartner} & ${requester}`}</span>
                <span className="text-white/50 text-base">{tradeCompletionDate}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-5 text-white text-sm">
          {/* Rating number on the left */}
          <span className="text-lg">{rating.toFixed(1)}</span>
          <div className="flex items-center gap-[5px]">
            {renderStars(rating)}
          </div>
          <button onClick={handleReport} className="p-1 rounded-full hover:bg-white/10 transition">
            <Flag className="w-5 h-5 cursor-pointer text-white/50" />
          </button>
        </div>
      </div>

      {/* Trade Details and Review Text */}
      <div className="flex flex-col md:flex-row gap-[25px] w-full">
        {/* Trade Details Section */}
        <div className="flex-1 flex flex-col gap-[25px]">
          <div className="flex items-center gap-[15px] w-full">
            <h6 className="text-white text-base text-white/50 whitespace-nowrap">Name requested</h6>
            <div className="inline-flex items-center px-[15px] py-[8px] text-[13px] rounded-full border-2 text-white bg-[#284CCC]/20 border-[#284CCC]/80 text-[#C1C9E1]">
              <span className="whitespace-nowrap">{requestTitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-[15px] w-full">
            <h6 className="text-white text-base text-white/50 whitespace-nowrap">In exchange for</h6>
            <div className="inline-flex items-center px-[15px] py-[8px] text-[13px] rounded-full border-2 text-white bg-[#3D2490]/20 border-[#3D2490]/80 text-[#C1C9E1]">
              <span className="whitespace-nowrap">{offerTitle}</span>
            </div>
          </div>
        </div>

        {/* Review Text Section */}
        <div className="flex-1 flex flex-col gap-2 md:text-right">
          <p className="text-white text-base">{reviewDescription}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center gap-1.5 text-white text-sm">
          <button onClick={() => setIsLiked(!isLiked)} className="transition-transform transform hover:scale-110">
            <Heart
              className={clsx(
                "w-5 h-5 transition-colors duration-300",
                isLiked ? "fill-[#906EFF] stroke-[#906EFF]" : "stroke-white"
              )}
            />
          </button>
          <span>{likes + (isLiked ? 1 : 0)}</span>
        </div>
        <div className="flex gap-4">
          <Button className="bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm rounded-[15px] px-5 py-2 shadow-[0px_0px_15px_#284CCC]">
            Trade again
          </Button>
          <Button className="bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm rounded-[15px] px-5 py-2 shadow-[0px_0px_15px_#284CCC]">
            View details
          </Button>
        </div>
      </div>
    </div>
  );
};


export default function ProfilePage() {
  const [expanded, setExpanded] = useState(Array(5).fill(false)); // Initialize state for all categories
  const [sortOption, setSortOption] = useState("Latest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [reviews, setReviews] = useState([
    {
      requester: "David Chen",
      tradePartner: "John Doe",
      tradeCompletionDate: "May 12",
      requestTitle: "Corporate Training",
      offerTitle: "Gardening",
      rating: 5.0,
      reviewDescription: "John was patient and clear in his corporate training sessions. He adapted well to my learning pace and made the experience enjoyable. I learned a lot thanks to his help.",
      likes: 42,
    },
    {
      requester: "Sarah Kim",
      tradePartner: "John Doe",
      tradeCompletionDate: "June 10",
      requestTitle: "Personal Training",
      offerTitle: "Graphic Design",
      rating: 4.5,
      reviewDescription: "John was a dedicated personal trainer who tailored workouts to my needs. He was punctual, encouraging, and professional throughout our sessions. I highly recommend him for anyone looking to improve their fitness.",
      likes: 34,
    },
    {
      requester: "Michael Lee",
      tradePartner: "John Doe",
      tradeCompletionDate: "June 2",
      requestTitle: "Illustration",
      offerTitle: "Web Development",
      rating: 4.0,
      reviewDescription: "John provided excellent illustration work for my website graphics. He was responsive to feedback and delivered quality designs on time. It was a pleasure collaborating with him.",
      likes: 21,
    },
    {
      requester: "Priya Patel",
      tradePartner: "John Doe",
      tradeCompletionDate: "May 20",
      requestTitle: "Tutoring",
      offerTitle: "Language Instruction",
      rating: 3.5,
      reviewDescription: "John helped me with tutoring sessions and was very organized. There were a few small misunderstandings initially, but he was quick to address them. Overall, a reliable trade partner.",
      likes: 15,
    },
    {
      requester: "Mark Thompson",
      tradePartner: "John Doe",
      tradeCompletionDate: "April 15",
      requestTitle: "Event Planning",
      offerTitle: "Handyman Services",
      rating: 4.2,
      reviewDescription: "John was very helpful setting up for my event and offered useful handyman services on site. He was punctual and easy to communicate with. I’d gladly trade with him again.",
      likes: 18,
    },
  ]);

  const toggleCategory = (index) => {
    setExpanded((prev) => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  const user = {
    name: "John Doe",
    verified: false,
    username: "@johndoe25",
    joined: "March 2025",
    rating: 4.3, // Updated to 4.3 as requested
    reviews: 25,
    rank: "Rising Star",
    level: 15,
    bio: "Passionate video editor with 4+ years of experience crafting engaging content for creators and small brands. Always up to trade skills and help others grow—le's connect and collaborate!",
    avatar: "/assets/image_d31b47.png", // Corrected path
  };

  // Mock data for review ratings to match a 4.3 average for 25 reviews
  const reviewRatings = {
    5: 12,
    4: 10,
    3: 2,
    2: 1,
    1: 0,
    0: 0,
  };

  // Function to render stars based on a rating, now using filled and outlined stars
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    const stars = [];

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className="w-4 h-4 fill-[#906EFF] text-[#906EFF]" />
      );
    }
    // Half star
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative w-4 h-4">
          <Star className="absolute w-4 h-4 text-gray-300 stroke-2" />
          <div className="absolute top-0 left-0 overflow-hidden w-1/2">
            <Star className="w-4 h-4 fill-[#906EFF] text-[#906EFF]" />
          </div>
        </div>
      );
    }
    // Empty stars with a clearer border
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300 stroke-2" />
      );
    }
    return stars;
  };

  const skillCategories = [
    {
      name: "Creative & Design",
      skills: ["Graphic Design", "Illustration", "Photography"],
    },
    {
      name: "Education & Training",
      skills: ["Tutoring", "Test Preparation"],
    },
    {
      name: "Home & Lifestyle",
      skills: ["Event Planning"],
    },
    {
      name: "Sports & Fitness",
      skills: ["Personal Training", "Sports Coaching", "Physical Therapy"],
    },
    {
      name: "Arts & Performance",
      skills: ["Creative Writing", "Visual Arts"],
    },
  ];

  const interests = [
    "Digital Art",
    "Photography",
    "Travel",
    "Indie Music",
    "Film Analysis",
  ];

  // Mock credentials with duplicates removed and new ones added
  const credentials = [
    {
      title: "Adobe Certified Expert (ACE)",
      org: "Adobe Systems Inc",
      issueDate: "March 2023",
      expiryDate: "March 2026",
      id: "ACE-123456789",
      url: "https://adobe.com/cert/ACE-123456789",
      skills: ["Graphic Design", "Illustration", "Animation"],
    },
    {
      title: "Certified Graphic Designer (CGD)",
      org: "Graphic Designers of Canada (GDC)",
      issueDate: "June 2022",
      expiryDate: "June 2025",
      id: "CGD-987654321",
      url: "https://gdc.net/cert/CGD-987654321",
      skills: ["Graphic Design", "Illustration"],
    },
    {
      title: "Google Analytics Certified",
      org: "Google",
      issueDate: "August 2023",
      expiryDate: "August 2026",
      id: "GA-123456789",
      url: "https://skillshop.exceedlms.com/student/award/GA-123456789",
      skills: ["Data Analysis", "Marketing", "SEO"],
    },
    {
      title: "Certified Photographer (CP)",
      org: "Professional Photographers of America (PPA)",
      issueDate: "December 2023",
      expiryDate: "December 2026",
      id: "PPA-11223344",
      url: "https://ppa.com/cert/PPA-11223344",
      skills: ["Photography", "Studio Lighting"],
    },
    {
      title: "Storytelling for Video Certificate",
      org: "Coursera",
      issueDate: "February 2024",
      expiryDate: "N/A",
      id: "COUR-987654321",
      url: "https://coursera.org/verify/COUR-987654321",
      skills: ["Video Editing", "Creative Writing"],
    },
  ];

  const [showAllCreds, setShowAllCreds] = useState(false);

  // Memoize the sorted reviews to prevent re-sorting on every render
  const sortedReviews = useMemo(() => {
    let sorted = [...reviews];
    if (sortOption === "Latest") {
      // Assuming `tradeCompletionDate` can be sorted as strings, or we would need a proper date object
      sorted.sort((a, b) => new Date(b.tradeCompletionDate) - new Date(a.tradeCompletionDate));
    } else if (sortOption === "Highest Rating") {
      sorted.sort((a, b) => b.rating - a.rating);
    } else if (sortOption === "Lowest Rating") {
      sorted.sort((a, b) => a.rating - b.rating);
    }
    return sorted;
  }, [reviews, sortOption]);
  
  const handleSortChange = (option) => {
    setSortOption(option);
    setShowSortDropdown(false);
  };

  return (
    <div
      className={`px-6 pb-20 pt-10 mx-auto max-w-[940px] text-white ${inter.className}`}
    >
      {/* SECTION 0 - PAGE TITLE */}
      <h4 className="text-[22px] font-semibold mb-10">My Profile</h4>

      {/* SECTION 1 - BASIC INFORMATION */}
      <div className="flex gap-[50px] relative">
        {/* Profile Picture */}
        <div className="w-[200px] h-[200px] relative flex-shrink-0">
          {/* Use the defaultavatar.png for the main profile picture */}
          <Image
            src="/assets/defaultavatar.png"
            alt={`${user.name}'s avatar`}
            width={200}
            height={200}
            className="rounded-full shadow-[0_0_50px_#906EFF99] object-cover"
          />
        </div>

        {/* Right Section */}
        <div className="flex-1 flex flex-col">
          {/* Top Row: Name + Verified Badge */}
          <div className="flex items-center gap-3 mb-[5px]">
            <h3 className="text-[26px] font-semibold">{user.name}</h3>
            {user.verified && (
              <Icon
                icon="mdi:check-decagram"
                className="text-[#0038FF] w-6 h-6"
              />
            )}
          </div>

          {/* Username + Joined Date */}
          <div className="flex text-white/50 text-[16px] mb-[20px] gap-[25px]">
            <span>{user.username}</span>
            <span>Joined {user.joined}</span>
          </div>

          {/* Buttons: Edit, Settings */}
          <div className="absolute top-0 right-0 flex gap-4">
            <button className="text-white hover:bg-[#1A0F3E] px-3 py-2 flex items-center gap-2 rounded-[10px] transition">
              <Icon icon="mdi:pencil" className="w-5 h-5" />
              Edit
            </button>
            <button className="text-white hover:bg-[#1A0F3E] p-2 rounded-[10px] transition">
              <Icon icon="mdi:cog" className="w-5 h-5" />
            </button>
          </div>

          {/* Rating + Rank + Level */}
          <div className="flex items-center gap-6 mb-[20px]">
            <div className="flex items-center gap-2">
              <Icon
                icon="lucide:star"
                className="text-[#906EFF] w-5 h-5 fill-current"
              />
              <span className="font-semibold text-[16px]">
                {user.rating.toFixed(1)}{" "}
                <span className="text-white/50">({user.reviews})</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Use the lvlrank_icon.png for the rank icon */}
              <Image
                src="/assets/lvlrank_icon.png"
                alt="Rank"
                width={20}
                height={20}
              />
              <span>{user.rank}</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Use the lvlbar.png for the level bar */}
              <Image
                src="/assets/lvlbar.png"
                alt="Level bar"
                width={220}
                height={20}
              />
              <span className="text-[16px]">LVL {user.level}</span>
            </div>
          </div>

          {/* Bio */}
          <div className="w-full mb-4">
            <p className="w-full leading-[1.6]">{user.bio}</p>
          </div>

          {/* Get Verified Button */}
          {!user.verified && (
            <div className="w-full flex justify-end">
              <Button className="bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm rounded-[15px] px-5 py-2 shadow-[0px_0px_15px_#284CCC] flex items-center gap-2">
                <Icon icon="material-symbols:verified" className="w-4 h-4" />
                Get Verified
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Skill Inventory */}
      <div className="mt-[50px] flex flex-col gap-[25px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[15px]">
            <h5 className="text-white text-lg font-semibold">Your Skills</h5>
            <PencilIcon className="w-5 h-5 text-white cursor-pointer" />
          </div>
        </div>

        {/* Skill Category Pills */}
        <div className="flex flex-wrap gap-x-4 gap-y-[10px]">
          {skillCategories.map((category, index) => (
            <div
              key={index}
              className="relative"
            >
              <div
                onClick={() => toggleCategory(index)}
                className={clsx(
                  "cursor-pointer inline-flex items-center h-[30px] px-[15px] text-[16px] gap-2 rounded-full border-2 transition-colors duration-300",
                  expanded[index]
                    ? "border-white bg-white text-black"
                    : "border-white text-white"
                )}
              >
                <span className="text-[16px] leading-none">
                  {category.name}
                </span>
                <Icon
                  icon={expanded[index] ? "mdi:chevron-up" : "mdi:chevron-down"}
                  className={clsx(
                    "transition-transform",
                    expanded[index] ? "text-black" : "text-white"
                  )}
                  width={16}
                />
              </div>

              {/* Skill dropdown */}
              {expanded[index] && (
                <div
                  className="absolute left-0 mt-2 p-3 rounded-xl border border-white/20 bg-[#050015] z-10 flex flex-col gap-2 transition-all duration-300 w-full"
                >
                  {category.skills.map((skill, i) => (
                    <div
                      key={i}
                      className="inline-flex items-center px-[15px] py-[8px] text-[13px] rounded-full border-[1.5px] border-white/50 text-white/50"
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/20" />

        {/* Interests */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[15px]">
            <h5 className="text-white text-lg font-semibold">Your Interests</h5>
            <PencilIcon className="w-5 h-5 text-white cursor-pointer" />
          </div>
        </div>

        <div className="flex flex-wrap gap-[15px]">
          {interests.map((interest, index) => (
            <div
              key={index}
              className="flex items-center gap-2 h-[30px] px-[15px] rounded-full border-2 border-white text-white text-[16px]"
            >
              {interest}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 mt-[50px]" />

        {/* SECTION 3 - Licenses & Certifications */}
        <div className="flex flex-col gap-[25px] mt-[25px]">
          <div className="flex items-center justify-between">
            <h5 className="text-white text-lg font-semibold flex items-center gap-[15px]">
              Your Licenses & Certifications
              <PencilIcon className="w-5 h-5 text-white cursor-pointer" />
            </h5>
          </div>

          {/* The scrollable container for the credentials */}
          <div
            className={clsx(
              "grid gap-[25px] grid-cols-2",
              !showAllCreds && "max-h-[420px] overflow-y-auto"
            )}
          >
            {credentials.map((cred, index) => (
              <div
                key={index}
                className="border border-white/20 rounded-[15px] p-[25px] flex flex-col justify-between"
              >
                {/* Group 1 */}
                <div>
                  <h6 className="text-[20px] font-semibold mb-[5px]">
                    {cred.title}
                  </h6>
                  <p className="text-[16px]">{cred.org}</p>
                </div>

                {/* Group 2 */}
                <div className="mt-[15px] text-[16px] text-white/50 leading-[1.6]">
                  Issued {cred.issueDate} • Expires {cred.expiryDate}
                  <br />
                  ID: {cred.id}
                </div>

                {/* Group 3 */}
                <div className="mt-[15px]">
                  <a
                    href={cred.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-[170px] h-[30px] rounded-[20px] text-white text-[13px] bg-[#0038FF] hover:bg-[#1a4dff] shadow-[0px_0px_15px_#284CCC]"
                  >
                    <Icon
                      icon="mdi:external-link"
                      className="w-4 h-4 mr-[15px]"
                    />
                    View Credential
                  </a>
                </div>

                {/* Skills */}
                <div className="mt-[25px] text-white text-sm">
                  <span className="text-white/50 mr-[10px]">Skills:</span>
                  {cred.skills.map((skill, i) => (
                    <span key={i} className="mr-[0px]">
                      {skill}
                      {i < cred.skills.length - 1 && (
                        <span className="mx-[10px] text-white/50">•</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          {credentials.length > 4 && (
            <div className="w-full flex justify-center mt-4">
              <button
                onClick={() => setShowAllCreds(!showAllCreds)}
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors font-medium text-base"
              >
                {showAllCreds ? (
                  <>
                    Show Less
                    <ChevronUpIcon className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    View All
                    <ChevronDownIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 mt-[50px]" />

        {/* SECTION 4 - REVIEWS */}
        <div className="flex flex-col gap-[25px] mt-[25px]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h5 className="text-white text-lg font-semibold">What others say</h5>
              <span className="text-[16px] text-white/50 mt-[5px]">25 trades & reviews</span>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center text-white text-[16px] border border-white/20 rounded-[10px] h-[30px] px-3"
              >
                {sortOption} <ChevronDownIcon className="ml-2 h-4 w-4 text-white" />
              </button>
              {showSortDropdown && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-[#120A2A] rounded-xl border border-white/20 shadow-lg py-1 z-10">
                  {["Latest", "Highest Rating", "Lowest Rating"].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleSortChange(option)}
                      className={clsx(
                        "block w-full text-left px-4 py-2 text-sm transition-colors",
                        option === sortOption ? "text-[#906EFF] bg-white/10" : "text-white hover:bg-white/10"
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Rating Analytics */}
          <div className="flex items-start gap-[50px]">
            {/* Overall Rating Group - now at the top left */}
            <div className="flex flex-col">
              <div className="flex items-end gap-[10px]">
                <span className="text-[40px] font-bold leading-none">
                  {user.rating.toFixed(1)}
                </span>
                <span className="text-[16px] text-white/50 pb-2">
                  ({user.reviews})
                </span>
              </div>
              <div className="flex items-center mt-[20px]">
                {renderStars(user.rating)}
              </div>
            </div>

            {/* Rating Bars */}
            <div className="flex flex-col gap-[10px]">
              {Object.keys(reviewRatings).reverse().map((rating) => (
                <div key={rating} className="flex items-center gap-[15px]">
                  <span className="text-[16px] w-[15px]">{rating}</span>
                  <div className="w-[270px] h-[15px] bg-white/20 rounded-full">
                    <div
                      style={{ width: `${(reviewRatings[rating] / user.reviews) * 100}%` }}
                      className="h-full bg-[#906EFF] rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews section using the new ReviewCard component */}
          <div className="mt-8 flex flex-col gap-6">
            {sortedReviews.map((review, index) => (
              <ReviewCard key={index} review={review} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
