"use client";

import { useState } from "react";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import Image from "next/image";
import { Eye, EyeOff, ChevronRight } from "lucide-react";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Step1({ onNext }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleContinue = () => {
    setErrorMessage("");

    if (!firstName || !lastName || !email || !username || !password || !repeatPassword) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (password !== repeatPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    onNext();
  };

  return (
    <div
      className={`pt-[50px] pb-[50px] flex min-h-screen items-center justify-center bg-cover bg-center px-4 ${inter.className}`}
      style={{ backgroundImage: "url('/assets/bg_register.png')" }}
    >
      <div className="relative z-10 w-full max-w-4xl text-center">
        {/* Header */}
        <div className="flex flex-col items-center">
          <Image
            src="/assets/logos/Logotype=Logotype M.png"
            alt="Logo"
            width={250}
            height={76}
            className="rounded-full mb-[30px]"
          />
          <h1 className="font-[600] text-[25px] text-center mb-[90px]">
            Let’s get your account started.
          </h1>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[44px] gap-y-[20px] justify-center">
          {/* First Name */}
          <div className="w-full max-w-[400px] text-left">
            <p className="text-white font-normal mb-[8px]">First name</p>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full h-[50px] p-4"
            />
          </div>

          {/* Last Name */}
          <div className="w-full max-w-[400px] text-left">
            <p className="text-white font-normal mb-[8px]">Last name</p>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full h-[50px] p-4"
            />
          </div>

          {/* Username */}
          <div className="w-full max-w-[400px] text-left">
            <p className="text-white font-normal mb-[8px]">Username</p>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-[50px] p-4"
            />
          </div>

          {/* Email */}
          <div className="w-full max-w-[400px] text-left">
            <p className="text-white font-normal mb-[8px]">Email address</p>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-[50px] p-4"
            />
          </div>

          {/* Password */}
          <div className="relative w-full max-w-[400px] text-left">
            <p className="text-white font-normal mb-[8px]">Password</p>
            <div className="relative flex items-center">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[50px] p-4 pr-12"
              />
              <div className="absolute right-4 top-0 h-full flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Repeat Password */}
          <div className="relative w-full max-w-[400px] text-left">
            <p className="text-white font-normal mb-[8px]">Repeat password</p>
            <div className="relative flex items-center">
              <Input
                type={showRepeatPassword ? "text" : "password"}
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                className="w-full h-[50px] p-4 pr-12"
              />
              <div className="absolute right-4 top-0 h-full flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                  className="text-gray-400 hover:text-white"
                >
                  {showRepeatPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <p className="text-red-500 text-sm mt-4">{errorMessage}</p>
        )}

        {/* Already have account */}
        <p className="underline text-center text-sm text-[16px] mt-[44px] mb-[100px]">
          <a href="/signin" className="text-[#6DDFFF]">
            I have an account already.
          </a>
        </p>

        {/* Continue Button */}
        <div className="flex justify-center mb-[47.5px]">
          <Button
            className="cursor-pointer flex w-[240px] h-[50px] justify-center items-center px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm sm:text-[20px] font-normal transition rounded-[15px]"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-2 text-sm text-white opacity-60">
          <span>1 of 6</span>
          <ChevronRight
            className="w-5 h-5 cursor-pointer text-gray-300 hover:text-white"
            onClick={onNext}
          />
        </div>
      </div>
    </div>
  );
}
