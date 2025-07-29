"use client";

import { useState } from "react";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import Image from "next/image";
import { Eye, EyeOff, ChevronRight } from "lucide-react";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function SignUpStepOne() {
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

    if (
      !firstName ||
      !lastName ||
      !email ||
      !username ||
      !password ||
      !repeatPassword
    ) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (password !== repeatPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    // Proceed to step 2
    console.log("Go to step 2...");
  };

  return (
    <div
      className={`flex min-h-screen items-center justify-center bg-cover bg-center ${inter.className}`}
      style={{ backgroundImage: "url('/assets/bg_register.png')" }}
    >
      <div className="w-full max-w-md p-6 text-white">
        {/* Header */}
        <div className="flex flex-col items-center space-y-2 mb-[20px]">
          <Image
            src="/assets/logos/Logotype=Logotype M.png"
            alt="Logo"
            width={250}
            height={76}
            className="rounded-full"
          />
          <h1 className="font-bold text-[25px] text-center mb-[20px]">
            Let’s get your account started.
          </h1>
        </div>

        {/* First Name */}
        <p className="text-white font-normal mb-[15px]">First name</p>
        <Input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="mb-[20px]"
          placeholder="First name"
        />

        {/* Last Name */}
        <p className="text-white font-normal mb-[15px]">Last name</p>
        <Input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="mb-[20px]"
          placeholder="Last name"
        />

        {/* Email */}
        <p className="text-white font-normal mb-[15px]">Email address</p>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-[20px]"
          placeholder="you@example.com"
        />

        {/* Username */}
        <p className="text-white font-normal mb-[15px]">Username</p>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-[20px]"
          placeholder="Choose a username"
        />

        {/* Password */}
        <p className="text-white font-normal mb-[15px]">Password</p>
        <div className="relative mb-[20px]">
          <Input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Repeat Password */}
        <p className="text-white font-normal mb-[15px]">Repeat password</p>
        <div className="relative mb-[20px]">
          <Input
            type={showRepeatPassword ? "text" : "password"}
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            className="pr-10"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowRepeatPassword(!showRepeatPassword)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
          >
            {showRepeatPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Error */}
        {errorMessage && (
          <p className="text-red-500 text-sm mb-3">{errorMessage}</p>
        )}

        {/* Already have account */}
        <p className="underline text-center text-sm mb-[20px] text-[16px]">
          <a href="/signin" className="text-[#6DDFFF] hover:underline">
            I have an account already.
          </a>
        </p>

        {/* Continue Button */}
        <Button
          className="flex w-full h-[50px] justify-center items-center px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm sm:text-[20px] font-normal transition rounded-[15px] mb-[20px]"
          onClick={handleContinue}
        >
          Continue
        </Button>

        {/* Pagination */}
        <div className="flex justify-between items-center text-sm text-white opacity-60">
          <span>1 of 7</span>
          <ChevronRight className="w-5 h-5 cursor-pointer hover:text-white text-gray-300" />
        </div>
      </div>
    </div>
  );
}
