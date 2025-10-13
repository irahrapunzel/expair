"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "../components/ui/button";
import { Inter, Archivo } from "next/font/google";
import FaqSection from "./(landing)/faqs";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });
const archivo = Archivo({ subsets: ["latin"] });

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  // Smooth scroll when navigating with hash (e.g., from /help)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash; // e.g., #our-goal
      if (hash) {
        // Wait for content to render first
        setTimeout(() => {
          const el = document.querySelector(hash);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      }
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/home");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <section
        className={`min-h-screen flex flex-col justify-between bg-[#050015] text-white font-sans ${inter.className}`}
      >
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-0 pb-16 sm:pb-20 md:pb-32 gap-6">
          <div className="flex flex-col items-center gap-0 w-full max-w-sm sm:max-w-md md:max-w-3xl">
            <div className="relative w-full flex flex-col items-center">
              <div className="relative w-full aspect-[3/2] m-0 z-10">
                <Image
                  src="/assets/bg_landing.png"
                  alt="Landing background"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <h1
                className={`text-3xl sm:text-4xl md:text-5xl font-bold m-0 mb-4 z-0 ${archivo.className}`}
                style={{ position: "relative", zIndex: 0 }}
              >
                Start pairing now.
              </h1>
            </div>
            <p className="text-sm sm:text-base md:text-lg leading-[120%] max-w-xl text-white font-sans">
              Change the way you obtain skills and services. <br />
              Meet people who need what you have, and have what you don’t.
            </p>
          </div>

          {/* Button with Link */}
          <Link href="/signin">
            <Button
              variant="default"
              size="default"
              className="cursor-pointer mt-5 w-40 h-12 text-white bg-[#0038FF] hover:bg-[#1a4dff] rounded-xl shadow-[0px_0px_15px_0px_#284CCC] text-base md:text-lg"
            >
              Join us
            </Button>
          </Link>
        </div>

        {/* Our Goal Section */}
        <div
          id="our-goal"
          className="scroll-mt-[60px] w-full py-16 sm:py-20 px-4 sm:px-6 md:px-10 lg:px-20 bg-[#050015] text-white"
        >
          <h2
            className={`text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-12 sm:mb-16 ${inter.className}`}
          >
            What we aim to achieve
          </h2>

          <div className="flex flex-col md:flex-row items-center justify-center gap-10">
            {/* Card 1 */}
            <div className="flex flex-col items-center text-center max-w-[270px]">
              <Image
                src="/assets/landing_swiftness.png"
                alt="Swiftness Illustration"
                width={200}
                height={150}
                className="mb-6 w-full max-w-[200px] h-auto"
              />
              <h4
                className={`text-xl sm:text-2xl font-bold mb-5 ${archivo.className}`}
              >
                Swiftness.
              </h4>
              <p className="text-sm sm:text-base leading-[120%]">
                No more wasted time. We make it quick and easy for you to find
                the right people to trade with, so you can get started right
                away.
              </p>
            </div>

            <Image
              src="/assets/divider.png"
              alt="Divider"
              width={20}
              height={150}
              className="hidden md:block"
            />

            {/* Card 2 */}
            <div className="flex flex-col items-center text-center max-w-[270px]">
              <Image
                src="/assets/landing_fairness.png"
                alt="Fairness Illustration"
                width={200}
                height={150}
                className="mb-6 w-full max-w-[200px] h-auto"
              />
              <h4
                className={`text-xl sm:text-2xl font-bold mb-5 ${archivo.className}`}
              >
                Fairness.
              </h4>
              <p className="text-sm sm:text-base leading-[120%]">
                Get what you deserve. Expair matches and evaluates whose time
                and effort align with yours—so trades always feel fair.
              </p>
            </div>

            <Image
              src="/assets/divider.png"
              alt="Divider"
              width={20}
              height={150}
              className="hidden md:block"
            />

            {/* Card 3 */}
            <div className="flex flex-col items-center text-center max-w-[270px]">
              <Image
                src="/assets/landing_access.png"
                alt="Access Illustration"
                width={200}
                height={150}
                className="mb-6 w-full max-w-[200px] h-auto"
              />
              <h4
                className={`text-xl sm:text-2xl font-bold mb-5 ${archivo.className}`}
              >
                Access.
              </h4>
              <p className="text-sm sm:text-base leading-[120%]">
                Easy and no money. No paywalls, no payments. Just real and
                accessible opportunities to share your skills with others.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div
          id="how-it-works"
          className="scroll-mt-[60px] w-full relative py-16 sm:py-20 px-4 sm:px-6 md:px-10 lg:px-20 bg-[#050015] text-white"
        >
          {/* Decorative stars */}
          <Image
            src="/assets/stars1.png"
            alt="Stars Left"
            width={400}
            height={400}
            className="absolute left-5 sm:left-[120px] bottom-10 opacity-50 sm:opacity-100"
          />
          <Image
            src="/assets/stars2.png"
            alt="Stars Right"
            width={400}
            height={400}
            className="absolute right-5 sm:right-[120px] top-10 opacity-50 sm:opacity-100"
          />

          <h2
            className={`text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-12 sm:mb-16 ${inter.className}`}
          >
            How it works
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-16 md:gap-x-14 md:gap-y-20 max-w-5xl mx-auto place-items-center">
            {[
              {
                img: "/assets/step1.png",
                label: "STEP 1",
                text: "Build your profile — list your skills and make your first request.",
              },
              {
                img: "/assets/step2.png",
                label: "STEP 2",
                text: "Time to match! Look for your best picks from our recommendations.",
              },
              {
                img: "/assets/step3.png",
                label: "STEP 3",
                text: "The exchange begins. We’ll help you evaluate if you’re getting the work you deserve.",
              },
              {
                img: "/assets/step4.png",
                label: "STEP 4",
                text: "Done! Don’t forget to rate your partner and gain XP from each pair.",
              },
            ].map((step, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center w-full max-w-[300px]"
              >
                {/* Fixed-height image container so everything aligns */}
                <div className="w-full h-[220px] flex justify-center items-center mb-[15px]">
                  <Image
                    src={step.img}
                    alt={step.label}
                    width={260}
                    height={220}
                    className="w-auto max-h-[220px] object-contain"
                  />
                </div>

                {/* Step label and description */}
                <div className="flex flex-col items-center text-center min-h-[90px]">
                  <span className="text-white tracking-[0.25em] text-lg font-semibold mb-2">
                    {step.label}
                  </span>
                  <p className="text-sm sm:text-base leading-[130%] text-white max-w-[260px]">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div id="FAQs" className="scroll-mt-[60px]">
          <FaqSection />
        </div>
      </section>
    );
  }
}
