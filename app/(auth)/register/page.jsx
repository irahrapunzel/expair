"use client";

import Image from "next/image";
import { Button } from "../../../components/ui/button";
import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function SafetyGuidelines() {
  const router = useRouter();

  const handleAgree = () => {
    router.push("/register/flow"); // punta sa multi-step registration flow
  };

  return (
    <div
      className={`flex min-h-screen items-center justify-center bg-cover bg-center ${inter.className}`}
      style={{ backgroundImage: "url('/assets/bg_register.png')" }}
    >
      {/* Content */}
      <div className="relative z-10 max-w-4xl w-full text-center space-y-6 px-4 md:px-0">
        {/* Welcome */}
        <div className="flex flex-col items-center">
          <h1 className="text-2xl md:text-[39px] font-[700] mb-[15px] flex items-center justify-center gap-1">
            Welcome to
            <Image
              src="/assets/logos/Logotype=Logotype M.png"
              alt="Expair Logo"
              width={176}
              height={54}
              className="inline-block"
            />
            !
          </h1>
          <p className="text-[16px] font-[400] text-[rgba(255,255,255,0.60)] mb-[60px]">
            Your safety is our top priority. Please follow these guidelines to keep our community safe.
          </p>
        </div>

        {/* Guidelines */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-10">
          {/* Be Safe */}
          <div className="flex flex-col items-center text-center w-[270px]">
            <div className="h-[44px] flex items-center justify-center mb-6">
              <Image
                src="/assets/icons/shield.png"
                alt="Be Safe"
                width={43}
                height={43}
              />
            </div>
            <h4 className="text-[25px] font-bold mb-[20px] text-[#FFF] [text-shadow:0_0_25px_rgba(109,223,255,0.7)]">
              Be safe
            </h4>
            <p className="text-[16px] leading-[120%] text-white [text-shadow:0_0_25px_rgba(109,223,255,0.7)]">
              Exercise caution. If users want to conduct trades in their own homes, we highly encourage to check out
              each other's profiles first, such as their past trades, certificates, connected socials, links, etc.
            </p>
          </div>

          {/* Divider */}
          <Image
            src="/assets/divider.png"
            alt="Divider"
            width={20}
            height={150}
            className="hidden md:block"
          />

          {/* Stay Safe */}
          <div className="flex flex-col items-center text-center w-[270px]">
            <div className="h-[44px] flex items-center justify-center mb-6">
              <Image
                src="/assets/icons/smile.png"
                alt="Stay Safe"
                width={43}
                height={43}
              />
            </div>
            <h4 className="text-[25px] font-bold mb-[20px] text-[#FFF] [text-shadow:0_0_25px_var(--Orchid,#D78DE5)]">
              Stay safe
            </h4>
            <p className="text-[16px] leading-[120%] text-white [text-shadow:0_0_25px_var(--Orchid,#D78DE5)]">
              Be vigilant. We highly encourage that users start a conversation first or meet each other virtually before
              meeting for an onsite trade. Meetups should happen in public, if possible.
            </p>
          </div>

          {/* Divider */}
          <Image
            src="/assets/divider.png"
            alt="Divider"
            width={20}
            height={150}
            className="hidden md:block"
          />

          {/* Keep Safe */}
          <div className="flex flex-col items-center text-center w-[270px]">
            <div className="h-[44px] flex items-center justify-center mb-6">
              <Image
                src="/assets/icons/start.png"
                alt="Keep Safe"
                width={43}
                height={43}
              />
            </div>
            <h4 className="text-[25px] font-bold mb-[20px] text-white [text-shadow:0_0_25px_var(--Salmon,#FB9696)]">
              Keep safe
            </h4>
            <p className="text-[16px] leading-[120%] text-white [text-shadow:0_0_25px_var(--Salmon,#FB9696)]">
              Act prudently. Proper ratings help to reduce fraud and scams. Remember to rate and review other users
              accordingly, and report any bad behavior.
            </p>
          </div>
        </div>

        {/* Agreement */}
        <p className="text-[14px] font-[400] text-white max-w-md mx-auto mb-[30px] mt-[80px] px-4">
          By clicking on “I agree”, you acknowledge that you have read and agree to Expair’s{" "}
          <a href="#" className="underline text-[#6DDFFF]">
            Terms and Conditions
          </a>{" "}
          and{" "}
          <a href="#" className="underline text-[#6DDFFF]">
            Privacy Policy
          </a>
          .
        </p>

        {/* Button */}
        <div className="mt-4 flex justify-center items-center">
          <Button
            onClick={handleAgree}
            className="cursor-pointer w-[240px] h-[50px] px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-[20px] font-normal transition rounded-[15px]"
          >
            I agree
          </Button>
        </div>
      </div>
    </div>
  );
}
