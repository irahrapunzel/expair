"use client";

import { useState } from "react";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import { ChevronLeft, ChevronRight, Upload, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Step3({ onNext, onPrev }) {
  const [introduction, setIntroduction] = useState("");
  const [photo, setPhoto] = useState("/defaultavatar.png");
  const [links, setLinks] = useState([""]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContinue = () => {
    onNext();
  };

  const handleSocialSignUp = (platform) => {
    alert(`Signing up with ${platform}`);
  };

  const handleAddLink = () => {
    setLinks([...links, ""]);
  };

  const handleLinkChange = (index, value) => {
    const updatedLinks = [...links];
    updatedLinks[index] = value;
    setLinks(updatedLinks);
  };

  const handleRemoveLink = (index) => {
    const updatedLinks = links.filter((_, i) => i !== index);
    setLinks(updatedLinks);
  };

  return (
    <div
      className={`pt-[50px] pb-[50px] flex min-h-screen items-center justify-center bg-cover bg-center ${inter.className} relative`}
      style={{ backgroundImage: "url('/assets/bg_register.png')" }}
    >
      {/* Disclaimer - Positioned at the bottom left edge of screen, aligned with pagination */}
      <div className="fixed bottom-[60px] left-[40px] max-w-[422px] text-[13px] text-white/40 text-left z-50">
        Disclaimer: By linking your social media accounts, you agree to share selected public information for verification purposes. Expair will not post on your behalf or access private data. Use caution when linking accounts. Expair is not liable for third-party misuse.
      </div>
      
      <div className="relative z-10 w-full max-w-4xl text-center px-4">
        {/* Header */}
        <div className="flex flex-col items-center">
          <Image
            src="/assets/logos/Logotype=Logotype M.png"
            alt="Logo"
            width={250}
            height={76}
            className="rounded-full mb-[30px]"
          />
          <h1 className="font-[600] text-[25px] text-center mb-[40px]">
            Customize your profile for further verification.
          </h1>
        </div>
        
        {/* Main content */}
        <div className="flex justify-center gap-[30px] mb-[40px]">
          {/* Left column - Photo upload */}
          <div className="flex flex-col items-center w-[220px]">
            <p className="text-white font-normal mb-[8px] text-center w-full">Upload a photo</p>
            <div className="relative w-[200px] h-[200px] mb-[30px]">
              <label htmlFor="photo-upload" className="cursor-pointer">
                <div className="w-[200px] h-[200px] bg-[#120A2A] rounded-full shadow-[0px_20px_60px_rgba(0,0,0,0.35)] relative">
                  <Image
                    src={photo}
                    alt="Profile Photo"
                    width={200}
                    height={200}
                    className="object-cover w-full h-full rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[60px] h-[60px] rounded-full bg-[#0038FF] flex items-center justify-center shadow-[0px_0px_15px_#284CCC]">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="absolute inset-0 border-[3px] border-white/80 rounded-full"></div>
                </div>
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
            
            <p className="text-white font-normal mb-[8px] text-left w-full">Connect your socials</p>
            <div className="flex gap-[15px]">
              {[
                { src: "/assets/google.png", alt: "Google" },
                { src: "/assets/linkedin.png", alt: "LinkedIn" },
                { src: "/assets/facebook.png", alt: "Facebook" },
              ].map(({ src, alt }) => (
                <Image
                  key={alt}
                  src={src}
                  width={40}
                  height={40}
                  alt={alt}
                  className="cursor-pointer rounded-[10px]"
                  onClick={() => handleSocialSignUp(alt)}
                />
              ))}
            </div>
          </div>
          
          {/* Middle and Right columns */}
          <div className="flex flex-col gap-[30px]">
            {/* Top row with ID upload and website links */}
            <div className="flex gap-[30px]">
              {/* ID upload */}
              <div className="w-[350px]">
                <p className="text-white font-normal mb-[8px] text-left">Get verified by uploading an ID</p>
                <div className="relative">
                  <div className="w-full h-[50px] rounded-[15px] border border-white/40 bg-[#120A2A] px-4 flex items-center justify-between cursor-pointer">
                    <span className="text-[#413663] text-[16px]">Upload file or photo</span>
                    <Upload className="text-white" />
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              
              {/* Links */}
              <div className="w-[350px]">
                <p className="text-white font-normal mb-[8px] text-left">Add a website or a link</p>
                <div className="max-h-[120px] overflow-y-auto custom-scrollbar">
                  {links.map((link, index) => (
                    <div key={index} className="relative mb-[10px]">
                      <Input
                        type="url"
                        value={link}
                        onChange={(e) => handleLinkChange(index, e.target.value)}
                        placeholder="Link here"
                        className="bg-[#120A2A] text-white border border-white/40 rounded-[15px] w-full pr-10 h-[50px] placeholder-[#413663] placeholder:text-[16px]"
                      />
                      {index > 0 && (
                        <X
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 cursor-pointer"
                          onClick={() => handleRemoveLink(index)}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="text-sm text-[#6DDFFF] hover:underline text-left mt-1"
                >
                  + Add another link
                </button>
              </div>
            </div>
            
            {/* Introduction - Same width as ID upload */}
            <div className="w-[350px]">
              <p className="text-white font-normal mb-[8px] text-left">Write a stellar introduction</p>
              <div className="relative">
                <textarea
                  rows={6}
                  maxLength={500}
                  className="w-full h-[200px] rounded-[15px] px-4 py-3 text-white bg-[#120A2A] border border-white/40 resize-none placeholder-[#413663] placeholder:text-[16px]"
                  placeholder="Tell us more about yourself"
                  value={introduction}
                  onChange={(e) => setIntroduction(e.target.value)}
                />
                <span className="absolute bottom-3 right-4 text-xs text-gray-400">
                  {500 - introduction.length} characters left
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Continue Button */}
        <div className="flex justify-center mb-[25px]">
          <Button
            className="cursor-pointer flex w-[240px] h-[50px] justify-center items-center px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm sm:text-[20px] font-normal transition rounded-[15px]"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
        
        {/* Skip for now */}
        <p className="underline text-center text-sm text-[16px] mb-[25px]">
          <a href="/signin" className="text-[#6DDFFF]">
            Skip for now
          </a>
        </p>
        
        {/* Pagination - Centered at bottom */}
        <div className="flex justify-center items-center gap-2 text-sm text-white opacity-60">
          <ChevronLeft
            className="w-5 h-5 cursor-pointer text-gray-300 hover:text-white"
            onClick={onPrev}
          />
          <span>3 of 6</span>
          <ChevronRight
            className="w-5 h-5 cursor-pointer text-gray-300 hover:text-white"
            onClick={onNext}
          />
        </div>
      </div>
    </div>
  );
}