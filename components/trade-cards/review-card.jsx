"use client";

import { Icon } from "@iconify/react";
import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/**
 * Renders the star rating for a review.
 * @param {number} rating The numerical rating.
 * @returns {JSX.Element[]} An array of star icons.
 */
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

/**
 * A component to display a single user review.
 * @param {object} props The props for the component.
 * @param {string} props.reviewerFirstName The first name of the user who wrote the review.
 * @param {string} props.reviewerLastName The last name of the user who wrote the review.
 * @param {string} props.reviewerUsername The username of the reviewer (for profile link).
 * @param {string} props.reviewerAvatar The avatar URL of the reviewer.
 * @param {string} props.tradeCompletionDate The date the trade was completed.
 * @param {string} props.requestTitle The title of the requested skill.
 * @param {string} props.offerTitle The title of the offered skill.
 * @param {number} props.rating The numerical rating given in the review.
 * @param {string} props.reviewDescription The main body of the review.
 * @returns {JSX.Element} The rendered ReviewCard component.
 */
const ReviewCard = ({
  reviewerFirstName,
  reviewerLastName,
  reviewerUsername,
  reviewerAvatar,
  tradeCompletionDate,
  requestTitle,
  offerTitle,
  rating,
  reviewDescription,
}) => {
  const reviewerFullName = `${reviewerFirstName} ${reviewerLastName}`.trim();
  const avatarUrl = reviewerAvatar || "/assets/defaultavatar.png";

  return (
    <div className="border border-white/20 rounded-[15px] p-[25px] flex flex-col gap-4 bg-[#050015]">
      {/* Reviewer and date */}
      <div className="flex items-center gap-[15px]">
        {/* Clickable Avatar */}
        <Link href={`/home/profile/${reviewerUsername}`} className="flex-shrink-0">
          <div className="w-[40px] h-[40px] rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#906EFF] transition-all">
            <Image
              src={avatarUrl}
              alt={`${reviewerFullName}'s avatar`}
              width={40}
              height={40}
              className="w-full h-full object-cover"
              onError={(e) => { 
                e.target.src = '/assets/defaultavatar.png'; 
              }}
            />
          </div>
        </Link>

        <div className="flex-1">
          {/* Clickable Name */}
          <Link href={`/home/profile/${reviewerUsername}`} className="hover:text-[#906EFF] transition-colors">
            <h6 className="text-[16px] font-semibold">{reviewerFullName}</h6>
          </Link>
          <p className="text-[13px] text-white/50 leading-none">
            {tradeCompletionDate}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {renderStars(rating)}
        </div>
      </div>

      {/* Trade details */}
      <div className="text-[13px] text-white/50 border-l-2 border-white/20 pl-4">
        <span>Trade completed for</span>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-semibold text-white">{requestTitle}</span>
          <Icon icon="lucide:arrow-right" className="w-4 h-4 text-white/50" />
          <span className="font-semibold text-white">{offerTitle}</span>
        </div>
      </div>

      {/* Review content */}
      <div className="flex flex-col gap-2">
        <p className="text-[15px] leading-[1.6] text-white/80">{reviewDescription}</p>
      </div>
    </div>
  );
};

export default ReviewCard;