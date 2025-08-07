"use client";

import { useState } from "react";
import Image from "next/image";
import { Inter } from "next/font/google";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import { ChevronDownIcon, PencilIcon, Star, Heart, MoreVertical, Trash2, Flag } from "lucide-react";

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
const ReviewCard = ({ review, onDelete }) => {
  const { requester, tradePartner, tradeCompletionDate, requestTitle, offerTitle, rating, reviewDescription, likes } = review;
  const [isLiked, setIsLiked] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // State for the delete confirmation modal

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
  
  // Function to handle actions from the dropdown menu
  const handleDropdownAction = (action) => {
    setShowDropdown(false); // Close dropdown first
    if (action === "Delete") {
      setShowDeleteModal(true); // Open the delete modal
    } else if (action === "Report") {
      // Simulate navigating to a help form on the help page
      // In a real app, this would be a client-side navigation or a more complex interaction
      console.log(`Navigating to help form for reporting review by ${requester}`);
      window.location.href = "/help#help-form"; 
    }
  };
  
  return (
    <div
      className="flex flex-col gap-[20px] rounded-[20px] border-[3px] border-[#284CCC]/80 p-[25px] relative transition-all duration-300 hover:scale-[1.01]"
      style={{
        background: 'radial-gradient(circle at top right, #3D2490 0%, #120A2A 69%)'
      }}
    >
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#120A2A] rounded-xl p-8 border border-white/20 shadow-lg max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-white">Confirm Deletion</h3>
            <p className="text-white/80 mb-6">Are you sure you want to delete this review? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <Button
                onClick={() => setShowDeleteModal(false)}
                className="bg-white/10 hover:bg-white/20 text-white rounded-lg px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onDelete(review);
                  setShowDeleteModal(false);
                }}
                className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-6"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start">
        {/* User and Partner Avatars with 'X' separator, names, and date */}
        <div className="flex items-start gap-[15px]">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Image
                src="/assets/defaultavatar.png"
                alt={`${tradePartner}'s avatar`}
                width={35}
                height={35}
                className="rounded-full object-cover"
              />
              <Icon icon="ic:baseline-close" className="w-4 h-4 text-white" />
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
          <button onClick={() => setShowDropdown(!showDropdown)} className="p-1 rounded-full hover:bg-white/10 transition">
            <MoreVertical className="w-5 h-5 cursor-pointer text-white/50" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute top-8 right-0 z-10 w-40 bg-[#120A2A] rounded-xl border border-white/20 shadow-lg py-1">
              <button 
                onClick={() => handleDropdownAction("Delete")}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition"
              >
                <Trash2 className="w-4 h-4 text-white/80" />
                Delete
              </button>
              <button 
                onClick={() => handleDropdownAction("Report")}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition"
              >
                <Flag className="w-4 h-4 text-white/80" />
                Report
              </button>
            </div>
          )}
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
  const [sortOption, setSortOption] = useState("Most Recent");
  
  // Use a state variable for the reviews so they can be modified (deleted)
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

  // Function to handle the deletion of a review
  const handleDeleteReview = (reviewToDelete) => {
    // Filter out the review to be deleted and update the state
    setReviews(reviews.filter(review => review !== reviewToDelete));
  };


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
    avatar: "/assets/defaultavatar.png",
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

  // Mock credentials
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
      title: "Certified Professional Tutor (CPT)",
      org: "National Tutoring Association (NTA)",
      issueDate: "January 2024",
      expiryDate: "January 2027",
      id: "CPT-456789123",
      url: "https://ntatutor.com/cert/CPT-456789123",
      skills: ["Tutoring", "Test Preparation"],
    },
  ];

  const [showAllCreds, setShowAllCreds] = useState(false);

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
          <Image
            src="/assets/defaultavatar.png" // Updated to use the local asset
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
              <Image
                src="/assets/lvlrank_icon.png" // Updated to use the local asset
                alt="Rank"
                width={20}
                height={20}
              />
              <span>{user.rank}</span>
            </div>

            <div className="flex items-center gap-2">
              <Image
                src="/assets/lvlbar.png" // Updated to use the local asset
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
        <div className="border-t border-white/20" />

        {/* SECTION 3 - Licenses & Certifications */}
        <div className="flex flex-col gap-[25px] mt-[25px]">
          <div className="flex items-center justify-between">
            <h5 className="text-white text-lg font-semibold flex items-center gap-[15px]">
              Your Licenses & Certifications
              <PencilIcon className="w-5 h-5 text-white cursor-pointer" />
            </h5>
          </div>

          {/* Grid */}
          <div
            className={clsx(
              "grid gap-[25px] grid-cols-2",
              !showAllCreds &&
                credentials.length > 4 &&
                "max-h-[420px] overflow-y-auto"
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
          {!showAllCreds && credentials.length > 4 && (
            <div className="w-full flex justify-center">
              <Button
                onClick={() => setShowAllCreds(true)}
                className="bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm rounded-[20px] px-5 py-2 shadow-[0px_0px_15px_#284CCC]"
              >
                View All
              </Button>
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
              <button className="flex items-center text-white text-[16px] border border-white/20 rounded-[10px] h-[30px] px-3">
                {sortOption} <ChevronDownIcon className="ml-2 h-4 w-4 text-white" />
              </button>
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
            {reviews.map((review, index) => (
              <ReviewCard key={index} review={review} onDelete={handleDeleteReview} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
