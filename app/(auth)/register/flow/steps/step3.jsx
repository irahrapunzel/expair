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
      className={`pt-[50px] pb-[50px] flex min-h-screen items-start justify-center bg-cover bg-center px-4 ${inter.className}`}
      style={{ backgroundImage: "url('/assets/bg_register.png')" }}
    >
      <div className="relative z-10 w-full max-w-6xl text-white">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-[100px] items-start text-left">
          <div className="flex flex-col items-center gap-[100px]">
            <div className="flex flex-col items-center gap-4">
              <label className="text-sm self-start">Upload a photo</label>
              <label
                htmlFor="photo-upload"
                className="w-[200px] h-[200px] border-5 border-white/40 rounded-full flex items-center justify-center bg-black/30 cursor-pointer overflow-hidden relative"
              >
                <Image
                  src={photo}
                  alt="Profile Photo"
                  width={200}
                  height={200}
                  className="object-cover w-full h-full"
                />
                <div className="absolute">
                  <Upload className="w-8 h-8 text-white opacity-80" />
                </div>
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />

              <label className="text-sm self-start">Connect your socials</label>
              <div className="flex gap-4 mt-2">
                {[
                  { src: "/assets/google.png", alt: "Google" },
                  { src: "/assets/linkedin.png", alt: "LinkedIn" },
                  { src: "/assets/facebook.png", alt: "Facebook" },
                ].map(({ src, alt }) => (
                  <Image
                    key={alt}
                    src={src}
                    width={30}
                    height={30}
                    alt={alt}
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => handleSocialSignUp(alt)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-[100px]">
            <div className="flex flex-col gap-4">
              <label className="text-sm">Get verified by uploading an ID</label>
              <div className="relative w-[400px]">
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  className="bg-[#120A2A] text-white border border-white/40 rounded-[15px] pr-12"
                />
                <Upload className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm">Write a stellar introduction</label>
              <textarea
                rows={5}
                maxLength={500}
                className="w-[400px] rounded-[15px] px-4 py-2 text-white bg-[#120A2A] border border-white/40 resize-none"
                placeholder="Tell us more about yourself"
                value={introduction}
                onChange={(e) => setIntroduction(e.target.value)}
              />
              <p className="text-xs text-white opacity-60 text-right w-full">
                {500 - introduction.length} characters left
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-[100px]">
            <div className="flex flex-col gap-4">
              <label className="text-sm">Add a website or a link</label>
              {links.map((link, index) => (
                <div key={index} className="relative w-[400px]">
                  <Input
                    type="url"
                    value={link}
                    onChange={(e) => handleLinkChange(index, e.target.value)}
                    placeholder="Link here"
                    className="bg-[#120A2A] text-white border border-white/40 rounded-[15px] w-full pr-10"
                  />
                  {index > 0 && (
                    <X
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 cursor-pointer"
                      onClick={() => handleRemoveLink(index)}
                    />
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddLink}
                className="text-sm text-blue-400 hover:underline"
              >
                + Add another link
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-[47.5px]">
          <Button
            className="cursor-pointer flex w-[240px] h-[50px] justify-center items-center px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm sm:text-[20px] font-normal transition rounded-[15px]"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>

        <p className="underline text-center text-sm text-[16px] mt-[44px] mb-[100px]">
          <a href="/signin" className="text-[#6DDFFF]">
            Skip for now
          </a>
        </p>

        <div className="flex justify-center items-center gap-2 text-sm text-white opacity-60 mt-4">
          <ChevronLeft
            className="w-5 h-5 cursor-pointer text-gray-300 hover:text-white"
            onClick={onPrev}
          />
          <span>3 of 7</span>
          <ChevronRight
            className="w-5 h-5 cursor-pointer text-gray-300 hover:text-white"
            onClick={onNext}
          />
        </div>
      </div>
    </div>
  );
}
