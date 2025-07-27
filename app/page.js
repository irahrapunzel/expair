"use client";

import Image from "next/image";
import { Button } from "../components/ui/button";
import { Inter, Archivo } from "next/font/google";
import FaqSection from "./(landing)/faqs";
import LandingNav from "../components/landingnav";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });
const archivo = Archivo({ subsets: ["latin"] });

export default function LandingPage() {
  return (
    <section
      className={`min-h-screen flex flex-col justify-between bg-[#050015] text-white font-sans ${inter.className}`}
    >
      {/* Hero Section */}
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center px-6 pt-0 pb-20 md:pb-32 gap-6">
        <div className="flex flex-col items-center gap-0 w-full max-w-md md:max-w-3xl">
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
              className={`text-[45px] font-bold m-0 mb-[15px] z-0 ${archivo.className}`}
              style={{ position: "relative", zIndex: 0 }}
            >
              Start pairing now.
            </h1>
          </div>
          <p className="text-[16px] leading-[120%] max-w-xl text-white font-sans">
            Change the way you obtain skills and services. <br />
            Meet people who need what you have, and have what you don’t.
          </p>
        </div>

        {/* Button na may Link */}
        <Link href="/signin">
          <Button
            variant="default"
            size="default"
            className="mt-[20px] w-[160px] h-[50px] text-white bg-[#0038FF] hover:bg-[#1a4dff] rounded-[15px] shadow-[0px_0px_15px_0px_#284CCC] text-base md:text-lg"
          >
            Join us
          </Button>
        </Link>
      </div>

      {/* Our Goal Section */}
      <div
        id="our-goal"
        className="scroll-mt-[60px] w-full py-20 px-6 md:px-10 lg:px-20 bg-[#050015] text-white"
      >
        <h2
          className={`text-[32px] md:text-[40px] font-bold text-center mb-16 ${inter.className}`}
        >
          What we aim to achieve
        </h2>

        <div className="flex flex-col md:flex-row items-center justify-center gap-10">
          {/* Card 1 */}
          <div className="flex flex-col items-center text-center w-[270px]">
            <Image
              src="/assets/landing_swiftness.png"
              alt="Swiftness Illustration"
              width={270}
              height={180}
              className="mb-6"
            />
            <h4
              className={`text-[25px] font-bold mb-[20px] ${archivo.className}`}
            >
              Swiftness.
            </h4>
            <p className="text-[16px] leading-[120%]">
              No more wasted time. We make it quick and easy for you to find the
              right people to trade with, so you can get started right away.
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
          <div className="flex flex-col items-center text-center w-[270px]">
            <Image
              src="/assets/landing_fairness.png"
              alt="Fairness Illustration"
              width={270}
              height={180}
              className="mb-6"
            />
            <h4
              className={`text-[25px] font-bold mb-[20px] ${archivo.className}`}
            >
              Fairness.
            </h4>
            <p className="text-[16px] leading-[120%]">
              Get what you deserve. Expair matches and evaluates whose time and
              effort align with yours—so trades always feel fair.
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
          <div className="flex flex-col items-center text-center w-[270px]">
            <Image
              src="/assets/landing_access.png"
              alt="Access Illustration"
              width={270}
              height={180}
              className="mb-6"
            />
            <h4
              className={`text-[25px] font-bold mb-[20px] ${archivo.className}`}
            >
              Access.
            </h4>
            <p className="text-[16px] leading-[120%]">
              Easy and no money. No paywalls, no payments. Just real and
              accessible opportunities to share your skills with others.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div
        id="how-it-works"
        className="scroll-mt-[60px] w-full relative py-20 px-6 md:px-10 lg:px-20 bg-[#050015] text-white"
      >
        <Image
          src="/assets/stars1.png"
          alt="Stars Left"
          width={500}
          height={500}
          className="absolute left-[100px] bottom-[75px]"
        />
        <Image
          src="/assets/stars2.png"
          alt="Stars Right"
          width={500}
          height={500}
          className="absolute right-[100px] top-[75px]"
        />

        <h2
          className={`text-[32px] md:text-[40px] font-bold text-center mb-16 ${inter.className}`}
        >
          How it works
        </h2>

        <div className="flex flex-col gap-10 items-center">
          <div className="flex flex-col gap-8 w-full max-w-[700px]">
            <div className="flex items-center gap-[15px]">
              <Image
                src="/assets/icon_1.png"
                alt="Step 1"
                width={30}
                height={30}
              />
              <p className="text-[16px] leading-[120%]">
                Build your profile — list your skills and make your first
                request.
              </p>
            </div>

            <div className="flex items-center gap-[15px]">
              <Image
                src="/assets/icon_2.png"
                alt="Step 2"
                width={30}
                height={30}
              />
              <p className="text-[16px] leading-[120%]">
                Time to match! Look for your best picks from our
                recommendations.
              </p>
            </div>

            <div className="flex items-center gap-[15px]">
              <Image
                src="/assets/icon_3.png"
                alt="Step 3"
                width={30}
                height={30}
              />
              <p className="text-[16px] leading-[120%]">
                The exchange begins. We’ll help you evaluate if you’re getting
                the work you deserve.
              </p>
            </div>

            <div className="flex items-center gap-[15px]">
              <Image
                src="/assets/icon_4.png"
                alt="Step 4"
                width={30}
                height={30}
              />
              <p className="text-[16px] leading-[120%]">
                Done! Don’t forget to rate your partner and gain XP from each
                pair.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div id="FAQs" className="scroll-mt-[60px]">
        <FaqSection />
      </div>
    </section>
  );
}
