"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import Image from "next/image";
import { StarIcon } from "../icons/star-icon";
import { Star } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function OffersPopup({ isOpen, onClose, service, trade, onTradeUpdate }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showMainPopup, setShowMainPopup] = useState(isOpen);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableSkills, setAvailableSkills] = useState([]);

  // Fetch available skills from backend to use as fallback
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/skills/general/`);
        if (response.ok) {
          const data = await response.json();
          setAvailableSkills(data);
        }
      } catch (error) {
        console.error('Error fetching skills:', error);
      }
    };

    fetchSkills();
  }, []);

  useEffect(() => {
    setShowMainPopup(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !trade) {
      setOffers([]);
      return;
    }

    console.log("=== OFFERS POPUP DEBUG ===");
    // Get a fallback skill name from available skills
    const getFallbackSkill = () => {
      if (availableSkills.length > 0) {
        return availableSkills[0].genCateg;
      }
      return "Skills & Services";
    };

    // Primary: use data passed from parent
    if (trade?.interested_users?.length) {
      // Transform the interested_users data to match the expected format
      const transformedOffers = trade.interested_users
        .filter(user => {
          if (trade.status === 'PENDING') {
            return user.status === 'ACCEPTED';
          }
          return user.status === 'PENDING';
        })
        .map(user => {
          const current_interest_id = user.interest_id || user.trade_interests_id;

          return {
            id: user.id,
            interest_id: current_interest_id,
            name: user.name,
            username: user.username,
            rating: user.rating?.toFixed(1) || "0.0",
            reviews: user.rating_count?.toString() || "0",
            level: user.level?.toString() || "1",
            needs: user.matching_skill || getFallbackSkill(),
            offers: service,
            until: trade.deadline || trade.until || "No deadline",
            isBestPick: user.level > 15 && user.rating > 4.5,
            avatar: user.profilePic || "/assets/defaultavatar.png",
            status: user.status
          };
        });

      transformedOffers.sort((a, b) => {
        if (a.isBestPick && !b.isBestPick) return -1;
        if (!a.isBestPick && b.isBestPick) return 1;
        return 0;
      });

      setOffers(transformedOffers);
      return;
    }

    // Fallback: fetch from API
    if (trade?.tradereq_id) {
      setLoading(true);

      (async () => {
        try {
          const resp = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-requests/${trade.tradereq_id}/interests/`
          );

          if (!resp.ok) {
            throw new Error(`HTTP ${resp.status}`);
          }

          const data = await resp.json();

          const transformedOffers = (data.interests || [])
            .filter(interest => interest.status === 'PENDING')
            .map(interest => ({
              id: interest.user_id,
              interest_id: interest.interest_id,
              name: interest.name,
              username: interest.username,
              rating: interest.rating?.toFixed(1) || "0.0",
              reviews: "0",
              level: interest.level?.toString() || "1",
              needs: service,
              offers: getFallbackSkill(),
              until: trade.deadline || trade.until || "No deadline",
              isBestPick: interest.level > 15 && interest.rating > 4.5,
              avatar: interest.profilePic || "/assets/defaultavatar.png"
            }));

          setOffers(transformedOffers);
        } catch (e) {
          console.error('Error fetching trade interests:', e);
          setOffers([]);
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setOffers([]);
    }
  }, [isOpen, trade, service, availableSkills]);

  if (!isOpen && !showConfirmModal && !showSuccessModal) return null;

  const handleAcceptOffer = async (offer) => {
    setSelectedOffer(offer);
    setShowMainPopup(false);
    setTimeout(() => {
      setShowConfirmModal(true);
    }, 100);
  };

  const handleDeclineOffer = async (offer) => {
    if (!offer.interest_id) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-interests/${offer.interest_id}/decline/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400 && errorData.error?.includes('already been declined')) {
          setOffers(prevOffers => prevOffers.filter(o => o.interest_id !== offer.interest_id));
          if (onTradeUpdate) await onTradeUpdate();
          return;
        }
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      setOffers(prevOffers => prevOffers.filter(o => o.interest_id !== offer.interest_id));
      if (onTradeUpdate) await onTradeUpdate();

      const remainingOffers = offers.filter(o => o.interest_id !== offer.interest_id);
      if (remainingOffers.length === 0) {
        setTimeout(() => {
          onClose();
        }, 500);
      }

    } catch (error) {
      console.error('Error declining offer:', error);
      alert(`Failed to decline offer: ${error.message}`);
    }
  };

  const handleConfirmAccept = async () => {
    if (!selectedOffer || !selectedOffer.interest_id) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-interests/${selectedOffer.interest_id}/accept/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setShowConfirmModal(false);

      if (onTradeUpdate) await onTradeUpdate();

      onClose?.();
      const targetUser = selectedOffer?.username || selectedOffer?.name || "";
      const url = data?.conversation_id
        ? `/home/messages?thread=${encodeURIComponent(data.conversation_id)}`
        : (targetUser ? `/home/messages?user=${encodeURIComponent(targetUser)}` : '/home/messages');
      router.push(url);

    } catch (error) {
      console.error('Error accepting offer:', error);
      setShowConfirmModal(false);
      alert(`Failed to accept offer: ${error.message}`);
    }
  };

  const handleImageError = (e) => {
    e.target.src = '/assets/defaultavatar.png';
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {showMainPopup && (
        <>
          <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
          <div
            // ✅ Responsive: Width changed to % and max-width, padding responsive
            className="relative w-[95%] max-w-[743px] max-h-[90vh] overflow-y-auto flex flex-col items-center p-6 md:p-[50px_25px] gap-6 md:gap-10 bg-black/40 border-2 border-[#0038FF] shadow-[0px_4px_15px_#D78DE5] backdrop-blur-[40px] rounded-[15px] z-50"
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 md:top-8 md:right-8 text-white hover:text-gray-300 cursor-pointer"
              onClick={onClose}
            >
              <X className="w-[15px] h-[15px]" />
            </button>

            <div className="flex flex-col items-center justify-center gap-[15px] w-full max-w-[622px]">
              {/* Title - Responsive text size */}
              <h2 className="font-[700] text-xl md:text-[25px] text-center text-white px-6">
                Offers you received for {service}
              </h2>

              {/* Best Pick Label */}
              {offers.some(offer => offer.isBestPick) && (
                <div className="flex items-center gap-[10px] self-start">
                  <span className="font-[700] text-[16px] text-white">Best Pick</span>
                  <StarIcon className="w-[19px] h-[19px]" />
                </div>
              )}

              {/* Loading state */}
              {loading && (
                <div className="text-white/60 text-center">
                  Loading offers...
                </div>
              )}

              {/* No offers message */}
              {!loading && offers.length === 0 && (
                <div className="text-white/60 text-center">
                  No pending offers for this trade.
                </div>
              )}

              {/* Offers List */}
              <div className="flex flex-col gap-[25px] w-full">
                {offers.map((offer) => (
                  <div
                    key={`${offer.id}-${offer.interest_id}`}
                    // ✅ Responsive: Padding adjusted
                    className="w-full p-4 md:p-[25px] flex flex-col gap-[15px] rounded-[20px] border-[3px] border-[#284CCC]/80 transition-all duration-300 overflow-hidden"
                    style={{
                      background: "radial-gradient(100% 275% at 100% 0%, #3D2490 0%, #120A2A 69.23%)",
                      boxShadow: "0px 5px 40px rgba(40, 76, 204, 0.2)"
                    }}
                  >
                    {/* ✅ Responsive: Stack columns on mobile, row on desktop */}
                    <div className="flex flex-col md:flex-row justify-between items-start w-full gap-4 md:gap-0">
                      {/* User Info */}
                      <div className="flex items-start gap-[10px]">
                        <Link
                          href={`/home/profile/${offer.username || offer.id}`}
                          className="flex-shrink-0"
                        >
                          <div className="relative w-[25px] h-[25px] rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#0038FF] transition-all">
                            <Image
                              src={offer.avatar}
                              alt={`${offer.name}'s profile picture`}
                              width={25}
                              height={25}
                              className="rounded-full object-cover"
                              onError={handleImageError}
                              unoptimized={offer.avatar?.startsWith('http')}
                            />
                          </div>
                        </Link>

                        <div className="flex flex-col items-start gap-[5px]">
                          <Link
                            href={`/home/profile/${offer.username || offer.id}`}
                            className="text-[16px] text-white hover:text-[#0038FF] transition-colors cursor-pointer"
                          >
                            {offer.name}
                          </Link>

                          <div className="flex items-center gap-[15px]">
                            <div className="flex items-center gap-[5px]">
                              <Star className="w-4 h-4 text-[#906EFF] fill-[#906EFF]" />
                              <span className="text-[13px] font-bold text-white">{offer.rating} ({offer.reviews})</span>
                            </div>
                            <div className="flex items-center gap-[5px]">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 13" fill="none"><path d="M6 1.41516C6.09178 1.41516 6.17096 1.42794 6.22461 1.44446C6.23598 1.44797 6.2447 1.4517 6.25098 1.45422L11.0693 6.66516L6.25098 11.8751C6.24467 11.8777 6.23618 11.8823 6.22461 11.8859C6.17096 11.9024 6.09178 11.9152 6 11.9152C5.90822 11.9152 5.82904 11.9024 5.77539 11.8859C5.76329 11.8821 5.75441 11.8777 5.74805 11.8751L0.929688 6.66516L5.74805 1.45422C5.75439 1.45164 5.76351 1.44812 5.77539 1.44446C5.82904 1.42794 5.90822 1.41516 6 1.41516Z" fill="url(#paint0_radial_1202_2090)" stroke="url(#paint1_linear_1202_2090)" strokeWidth="1.5" /><defs><radialGradient id="paint0_radial_1202_2090" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(6.00002 6.66516) scale(6.09125 6.58732)"><stop offset="0.4" stopColor="#933BFF" /><stop offset="1" stopColor="#34188D" /></radialGradient><linearGradient id="paint1_linear_1202_2090" x1="6.00002" y1="0.0778344" x2="6.00002" y2="13.2525" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="0.5" stopColor="#999999" /><stop offset="1" stopColor="white" /></linearGradient></defs></svg>
                              <span className="text-[13px] text-white">LVL {offer.level}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col w-full md:w-auto md:items-end gap-[10px]">
                        {/* Best Pick Badge */}
                        {offer.isBestPick && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-[#906EFF]/20 border border-[#906EFF] rounded-full self-start md:self-end">
                            <StarIcon className="w-3 h-3" />
                            <span className="text-xs text-white">Best Pick</span>
                          </div>
                        )}

                        {/* Needs/Offers - Responsive spacing */}
                        <div className="flex justify-between md:justify-end items-start gap-[10px] w-full md:w-auto">
                          <div className="flex flex-col items-start md:items-end gap-[5px] flex-1 md:flex-none">
                            <span className="text-[13px] text-white">Needs</span>
                            <div className="px-[10px] py-[5px] bg-[rgba(40,76,204,0.2)] border-[2px] border-[#0038FF] rounded-[15px] w-full md:w-auto text-center md:text-right">
                              <span className="text-[13px] text-white leading-tight break-words">{offer.needs}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-[5px] flex-1 md:flex-none">
                            <span className="text-[13px] text-white">Can offer</span>
                            <div className="px-[10px] py-[5px] bg-[rgba(144,110,255,0.2)] border-[2px] border-[#906EFF] rounded-[15px] w-full md:w-auto text-center md:text-right">
                              <span className="text-[13px] text-white leading-tight break-words">{offer.offers}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Date and Buttons */}
                    <div className="flex flex-col gap-[10px]">
                      {trade?.status === 'PENDING' && (
                        <div className="flex justify-end">
                          <div className="px-[10px] py-[5px] bg-[#6DDFFF]/20 border border-[#6DDFFF] rounded-[10px]">
                            <span className="text-[11px] text-[#6DDFFF]">Locked - Pending</span>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <span className="text-[13px] text-white/60">until {offer.until}</span>
                      </div>

                      {/* ✅ Responsive: Buttons fill width on small screens */}
                      <div className="flex flex-row justify-between sm:justify-end gap-3 sm:gap-[15px]">
                        <button
                          className={`flex-1 sm:flex-none sm:w-[120px] h-[30px] flex justify-center items-center border-2 rounded-[10px] transition-colors ${trade?.status === 'PENDING'
                              ? 'border-gray-500 text-gray-500 cursor-not-allowed opacity-50'
                              : 'border-[#0038FF] text-[#0038FF] hover:bg-[#0038FF]/10 cursor-pointer'
                            }`}
                          onClick={() => handleDeclineOffer(offer)}
                          disabled={trade?.status === 'PENDING'}
                        >
                          <span className="text-[13px]">Decline</span>
                        </button>
                        <button
                          className={`flex-1 sm:flex-none sm:w-[120px] h-[30px] flex justify-center items-center rounded-[10px] transition-colors ${trade?.status === 'PENDING'
                              ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'
                              : 'bg-[#0038FF] text-white shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] cursor-pointer'
                            }`}
                          onClick={() => handleAcceptOffer(offer)}
                          disabled={trade?.status === 'PENDING'}
                        >
                          <span className="text-[13px]">Accept</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Disclaimer */}
              <p className="text-[13px] text-white/60 text-center mt-[15px]">
                Disclaimer: Please exercise caution when proceeding with trades with other users. Expair is not liable for any losses arising from this trade. All trades are handled solely by its users and it is the user's discretion.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirmModal(false)}></div>
          {/* ✅ Responsive Modal Size */}
          <div className="relative w-[90%] max-w-[600px] min-h-[220px] flex flex-col items-center justify-center bg-black/40 border-2 border-[#0038FF] shadow-[0px_4px_15px_#284CCC] backdrop-blur-[40px] rounded-[15px] z-[60] p-6">
            <button
              className="absolute top-4 right-4 md:top-7 md:right-7 text-white hover:text-gray-300 cursor-pointer"
              onClick={() => setShowConfirmModal(false)}
            >
              <X className="w-[15px] h-[15px]" />
            </button>

            <div className="flex flex-col items-center gap-[25px] w-full max-w-[450px]">
              <h2 className="font-bold text-lg md:text-[22px] text-center text-white">
                Are you sure you want to accept this trade?
              </h2>

              <div className="flex flex-row gap-4 md:gap-[25px] w-full justify-center">
                <button
                  className="flex-1 md:flex-none md:w-[160px] h-[40px] flex justify-center items-center border-2 border-[#0038FF] text-[#0038FF] rounded-[15px] hover:bg-[#0038FF]/10 transition-colors cursor-pointer shadow-[0px_0px_15px_#284CCC]"
                  onClick={() => setShowConfirmModal(false)}
                >
                  <span className="text-[16px]">Cancel</span>
                </button>
                <button
                  className="flex-1 md:flex-none md:w-[168px] h-[40px] flex justify-center items-center bg-[#0038FF] text-white rounded-[15px] shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors cursor-pointer"
                  onClick={handleConfirmAccept}
                >
                  <span className="text-[16px]">Confirm</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSuccessModal(false)}></div>
          {/* ✅ Responsive Modal Size */}
          <div className="relative w-[90%] max-w-[600px] min-h-[220px] flex flex-col items-center justify-center bg-black/40 border-2 border-[#0038FF] shadow-[0px_4px_15px_#D78DE5] backdrop-blur-[40px] rounded-[15px] z-[60] p-6">
            <button
              className="absolute top-4 right-4 md:top-7 md:right-7 text-white hover:text-gray-300 cursor-pointer"
              onClick={() => setShowSuccessModal(false)}
            >
              <X className="w-[15px] h-[15px]" />
            </button>

            <div className="flex flex-col items-center gap-[25px] w-full max-w-[450px]">
              <h2 className="font-bold text-lg md:text-[22px] text-center text-white">
                Success! Trade accepted and moved to finalization.
              </h2>

              <button
                className="w-full md:w-[168px] h-[40px] flex justify-center items-center bg-[#0038FF] text-white rounded-[15px] shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors cursor-pointer"
                onClick={async () => {
                  setShowSuccessModal(false);
                  onClose();
                  router.push('/home/messages');
                }}
              >
                <span className="text-[16px]">Confirm</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}