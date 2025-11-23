// components/trade-cards/browse-section.jsx 

"use client";

import { useEffect, useState, useRef } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import ExploreCardLanding from "./explore-card-landing";
import { Archivo } from "next/font/google";

const archivo = Archivo({ subsets: ["latin"] });

const CAROUSEL_MAX_WIDTH = 1350;

const initialLoadData = Array(5).fill({
    name: "Loading...",
    rating: 0.0,
    ratingCount: 0,
    level: 1,
    need: "Fetching data...",
    offer: "Fetching data...",
    deadline: "N/A",
    profilePicUrl: null,
    username: null,
    isVerified: false,
});

export default function BrowseSection() {
    const [trades, setTrades] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const scrollContainerRef = useRef(null);

    // --- Data Fetching Logic (Public Endpoint) ---
    useEffect(() => {
        async function fetchPublicTrades() {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/explore/feed/`
                );
                if (!response.ok) {
                    throw new Error("Failed to fetch public trade feed.");
                }
                const data = await response.json();

                const validTrades = (data.items || []).filter(item => item.offer && item.need);

                setTrades(validTrades);

            } catch (err) {
                console.error("Error fetching trades:", err);
                setError("Could not load available trades. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        }

        fetchPublicTrades();
    }, []);

    // --- Carousel/Scroll Logic (Standard Finite Scroll) ---

    // Check scroll position and enable/disable arrows
    const checkScrollState = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;

            setCanScrollLeft(scrollLeft > 0);
            // Ensure it can scroll right if content exceeds container width
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
        }
    };

    useEffect(() => {
        if (!isLoading) {
            checkScrollState(); // Check initial state after component mount and data load
        }

        const container = scrollContainerRef.current;

        if (container) {

            let rafId;
            const throttledCheck = () => {
                if (rafId) return;
                rafId = requestAnimationFrame(() => {
                    checkScrollState();
                    rafId = 0;
                });
            };

            container.addEventListener('scroll', throttledCheck);
            window.addEventListener('resize', throttledCheck);

            return () => {
                container.removeEventListener('scroll', throttledCheck);
                window.removeEventListener('resize', throttledCheck);
            };
        }
        // Handle cases where container is null (e.g., initial render before ref is set)
        return () => {
            window.removeEventListener('resize', checkScrollState);
        };

    }, [isLoading, trades]); // Dependency arrays are correct

    // Smooth scroll handler
    const handleScroll = (direction) => {
        if (scrollContainerRef.current) {
            // 2 cards (455px each) + 2 gaps (32px each) -> Total: 974px
            const scrollAmount = 455 * 2 + 32;

            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    const dataToRender = isLoading ? initialLoadData : trades;
    const showContent = !isLoading && trades.length > 0;
    const showFallback = !isLoading && trades.length === 0 && !error;
    
    return (
        <div
            id="browse"
            className="scroll-mt-[60px] w-full relative py-16 sm:py-20 px-4 sm:px-6 md:px-10 lg:px-20 bg-[#050015] text-white overflow-hidden"
        >

            {/* Title and Header */}
            <div className="flex justify-center items-end text-center mb-12 sm:mb-16">
                <h2
                    className={`text-2xl sm:text-3xl md:text-4xl font-bold ${archivo.className}`}
                >
                    Browse Recent Trades
                </h2>
            </div>

            {error && (
                <p className="text-center text-red-400 mb-8">{error}</p>
            )}

            {showFallback && (
                <div className="text-center py-20">
                    <Icon icon="mdi:package-variant-remove" className="text-white/70 mx-auto text-6xl mb-4" />
                    <p className="text-xl font-medium text-white/70">
                        No trades to show.
                    </p>
                    <p className="text-white/50 mt-2">
                        Be the first to post a request! Sign up now.
                    </p>
                </div>
            )}

            {/* Main Carousel Wrapper */}
            <div className="relative w-full flex justify-center mx-auto" style={{ maxWidth: CAROUSEL_MAX_WIDTH + 'px' }}>

                {/* Left Scroll Button */}
                <button
                    onClick={() => handleScroll('left')}
                    disabled={!canScrollLeft || isLoading}
                    className={`absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 p-2 bg-black/50 rounded-full transition-all duration-300 ${canScrollLeft && !isLoading
                        ? 'opacity-100 hover:bg-black/70'
                        : 'opacity-0 pointer-events-none'
                        }`}
                >
                    <Icon icon="mdi:chevron-left" className="text-white text-3xl" />
                </button>

                {/* Trade Card List - Horizontal Scroll Container */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-8 overflow-x-scroll no-scrollbar py-2 px-1 relative snap-x snap-mandatory"
                    style={{
                        maxWidth: CAROUSEL_MAX_WIDTH + 'px',
                        scrollSnapType: 'x mandatory'
                    }}
                >
                    {dataToRender.map((trade, index) => (
                        <div
                            key={index}
                            className="flex-shrink-0 snap-center"
                            style={{ width: '455px' }}
                        >
                            <ExploreCardLanding
                                name={trade.name || "Anonymous"}
                                rating={trade.rating || 0.0}
                                ratingCount={trade.ratingCount || 0}
                                level={trade.level || 1}
                                need={trade.need || "Need unspecified"}
                                offer={trade.offer || "Offer unspecified"}
                                deadline={trade.deadline || "No Deadline"}
                                profilePicUrl={trade.profilePicUrl}
                                username={trade.username}
                                isVerified={trade.isVerified || false}
                            />
                        </div>
                    ))}

                    {/* Add padding element to ensure the last card can scroll into view */}
                    <div className="flex-shrink-0" style={{ width: '100px' }} />
                </div>

                {/* Right Scroll Button */}
                <button
                    onClick={() => handleScroll('right')}
                    disabled={!canScrollRight || isLoading}
                    className={`absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 z-20 p-2 bg-black/50 rounded-full transition-all duration-300 ${canScrollRight && !isLoading
                        ? 'opacity-100 hover:bg-black/70'
                        : 'opacity-0 pointer-events-none'
                        }`}
                >
                    <Icon icon="mdi:chevron-right" className="text-white text-3xl" />
                </button>
            </div>

            {/* See All Trades CTA (Like the image provided) */}
            <div className="text-center mt-12">
                <Link href="/signin">
                    <button
                        className="px-6 py-3 bg-[#0038FF] hover:bg-[#1a4dff] rounded-xl text-white text-base font-medium shadow-[0px_0px_15px_0px_#284CCC] transition-colors"
                    >
                        Sign Up to See All Trades
                    </button>
                </Link>
            </div>
        </div>
    );
}