"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { StarIcon } from "../icons/star-icon";
import { Star } from "lucide-react";

export default function OffersPopup({ isOpen, onClose, service }) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showMainPopup, setShowMainPopup] = useState(isOpen);

  useEffect(() => {
    setShowMainPopup(isOpen);
  }, [isOpen]);

  if (!isOpen && !showConfirmModal && !showSuccessModal) return null;

  // Mock data for offers
  const offers = [
    {
      id: 1,
      name: "Michael Lee",
      rating: "4.9",
      reviews: "30",
      level: "17",
      needs: "Design Kit for Site",
      offers: "Plumbing",
      until: "July 1",
      isBestPick: true
    },
    {
      id: 2,
      name: "Emily Rivera",
      rating: "4.7",
      reviews: "14",
      level: "14",
      needs: "Acting Help",
      offers: "Plumbing",
      until: "July 7",
      isBestPick: false
    },
    {
      id: 3,
      name: "Sarah Kim",
      rating: "4.9",
      reviews: "23",
      level: "18",
      needs: "5-min Video Edit",
      offers: "Plumbing",
      until: "July 4",
      isBestPick: false
    }
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {showMainPopup && (
        <>
          <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
          <div 
            className="relative w-[743px] max-h-[90vh] overflow-y-auto flex flex-col items-center p-[50px_25px] gap-10 bg-black/40 border-2 border-[#0038FF] shadow-[0px_4px_15px_#D78DE5] backdrop-blur-[40px] rounded-[15px] z-50"
          >
        {/* Close button */}
        <button 
          className="absolute top-8 right-8 text-white hover:text-gray-300 cursor-pointer"
          onClick={onClose}
        >
          <X className="w-[15px] h-[15px]" />
        </button>
        
        <div className="flex flex-col items-center justify-center gap-[15px] w-[622px]">
          {/* Title */}
          <h2 className="font-[700] text-[25px] text-center text-white">
            Offers you received for {service}
          </h2>
          
          {/* Best Pick Label */}
          {offers.some(offer => offer.isBestPick) && (
            <div className="flex items-center gap-[10px] self-start">
              <span className="font-[700] text-[16px] text-white">Best Pick</span>
              <StarIcon className="w-[19px] h-[19px]" />
            </div>
          )}
          
          {/* Offers List */}
          <div className="flex flex-col gap-[25px] w-full">
            {offers.map((offer) => (
              <div 
                key={offer.id}
                className="w-full p-[25px] flex flex-col gap-[15px] rounded-[20px] border-[3px] border-[#284CCC]/80 transition-all duration-300 overflow-hidden"
                style={{
                  background: "radial-gradient(100% 275% at 100% 0%, #3D2490 0%, #120A2A 69.23%)",
                  boxShadow: "0px 5px 40px rgba(40, 76, 204, 0.2)"
                }}
              >
                <div className="flex justify-between items-start w-full">
                  {/* User Info */}
                  <div className="flex items-start gap-[10px]">
                    <img src="/defaultavatar.png" alt="Default Avatar" className="w-[25px] h-[25px] rounded-full object-cover" />
                    <div className="flex flex-col items-start gap-[5px]">
                      <span className="text-[16px] text-white">{offer.name}</span>
                      <div className="flex items-center gap-[15px]">
                        <div className="flex items-center gap-[5px]">
                          <Star className="w-4 h-4 text-[#906EFF] fill-[#906EFF]" />
                          <span className="text-[13px] font-bold text-white">{offer.rating} ({offer.reviews})</span>
                        </div>
                        <div className="flex items-center gap-[5px]">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 13" fill="none"><path d="M6 1.41516C6.09178 1.41516 6.17096 1.42794 6.22461 1.44446C6.23598 1.44797 6.2447 1.4517 6.25098 1.45422L11.0693 6.66516L6.25098 11.8751C6.24467 11.8777 6.23618 11.8823 6.22461 11.8859C6.17096 11.9024 6.09178 11.9152 6 11.9152C5.90822 11.9152 5.82904 11.9024 5.77539 11.8859C5.76329 11.8821 5.75441 11.8777 5.74805 11.8751L0.929688 6.66516L5.74805 1.45422C5.75439 1.45164 5.76351 1.44812 5.77539 1.44446C5.82904 1.42794 5.90822 1.41516 6 1.41516Z" fill="url(#paint0_radial_1202_2090)" stroke="url(#paint1_linear_1202_2090)" strokeWidth="1.5"/><defs><radialGradient id="paint0_radial_1202_2090" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(6.00002 6.66516) scale(6.09125 6.58732)"><stop offset="0.4" stopColor="#933BFF"/><stop offset="1" stopColor="#34188D"/></radialGradient><linearGradient id="paint1_linear_1202_2090" x1="6.00002" y1="0.0778344" x2="6.00002" y2="13.2525" gradientUnits="userSpaceOnUse"><stop stopColor="white"/><stop offset="0.5" stopColor="#999999"/><stop offset="1" stopColor="white"/></linearGradient></defs></svg>
                          <span className="text-[13px] text-white">LVL {offer.level}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Needs/Offers */}
                  <div className="flex items-start gap-[10px]">
                    <div className="flex flex-col items-end gap-[10px]">
                      <span className="text-[13px] text-white">Needs</span>
                      <div className="px-[10px] py-[5px] bg-[rgba(40,76,204,0.2)] border-[2px] border-[#0038FF] rounded-[15px]">
                        <span className="text-[13px] text-white leading-tight">{offer.needs}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-[10px]">
                      <span className="text-[13px] text-white">Can offer</span>
                      <div className="px-[10px] py-[5px] bg-[rgba(144,110,255,0.2)] border-[2px] border-[#906EFF] rounded-[15px]">
                        <span className="text-[13px] text-white leading-tight">{offer.offers}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Date and Buttons */}
                <div className="flex flex-col">
                  <div className="flex justify-end">
                    <span className="text-[13px] text-white/60">until {offer.until}</span>
                  </div>
                  <div className="flex gap-[15px]">
                    <button className="w-[120px] h-[30px] flex justify-center items-center border-2 border-[#0038FF] text-[#0038FF] rounded-[10px] hover:bg-[#0038FF]/10 transition-colors cursor-pointer">
                      <span className="text-[13px]">Decline</span>
                    </button>
                    <button 
                      className="w-[120px] h-[30px] flex justify-center items-center bg-[#0038FF] text-white rounded-[10px] shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedOffer(offer);
                        setShowMainPopup(false); // Hide main popup
                        setTimeout(() => {
                          setShowConfirmModal(true); // Show confirmation after a small delay
                        }, 100);
                      }}
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
          <div className="relative w-[600px] h-[220px] flex flex-col items-center justify-center bg-black/40 border-2 border-[#0038FF] shadow-[0px_4px_15px_#284CCC] backdrop-blur-[40px] rounded-[15px] z-[60]">
            {/* Close button */}
            <button 
              className="absolute top-7 right-7 text-white hover:text-gray-300 cursor-pointer"
              onClick={() => setShowConfirmModal(false)}
            >
              <X className="w-[15px] h-[15px]" />
            </button>
            
            <div className="flex flex-col items-center gap-[25px] w-[450px]">
              <h2 className="font-bold text-[22px] text-center text-white">
                Are you sure you want to accept this trade?
              </h2>
              
              <div className="flex flex-row gap-[25px]">
                <button 
                  className="w-[160px] h-[40px] flex justify-center items-center border-2 border-[#0038FF] text-[#0038FF] rounded-[15px] hover:bg-[#0038FF]/10 transition-colors cursor-pointer shadow-[0px_0px_15px_#284CCC]"
                  onClick={() => setShowConfirmModal(false)}
                >
                  <span className="text-[16px]">Cancel</span>
                </button>
                <button 
                  className="w-[168px] h-[40px] flex justify-center items-center bg-[#0038FF] text-white rounded-[15px] shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors cursor-pointer"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setTimeout(() => {
                      setShowSuccessModal(true);
                    }, 100);
                  }}
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
          <div className="relative w-[600px] h-[220px] flex flex-col items-center justify-center bg-black/40 border-2 border-[#0038FF] shadow-[0px_4px_15px_#D78DE5] backdrop-blur-[40px] rounded-[15px] z-[60]">
            {/* Close button */}
            <button 
              className="absolute top-7 right-7 text-white hover:text-gray-300 cursor-pointer"
              onClick={() => setShowSuccessModal(false)}
            >
              <X className="w-[15px] h-[15px]" />
            </button>
            
            <div className="flex flex-col items-center gap-[25px] w-[450px]">
              <h2 className="font-bold text-[22px] text-center text-white">
                Success! Added to your trades for finalization.
              </h2>
              
              <button 
                className="w-[168px] h-[40px] flex justify-center items-center bg-[#0038FF] text-white rounded-[15px] shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors cursor-pointer"
                onClick={() => {
                  setShowSuccessModal(false);
                  // Reload the page to refresh the trades data
                  window.location.reload();
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