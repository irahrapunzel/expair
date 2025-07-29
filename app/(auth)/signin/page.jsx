"use client";

import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import ReCAPTCHA from "react-google-recaptcha";
import { signIn } from "next-auth/react";
import { useLoginStore } from "../../../stores/loginStore";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });

export default function LoginPage() {
  const [captcha, setCaptcha] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); 
  const { username, password, setUsername, setPassword } = useLoginStore();

  const handleLogin = () => {
    setErrorMessage("");

    // Check required fields
    if (!username || !password) {
      setErrorMessage("Please enter both username and password");
      return;
    }

    // Check captcha
    if (!captcha) {
      setErrorMessage("Please verify CAPTCHA");
      return;
    }

    // Demo
    if (username !== "demo" || password !== "1234") {
      setErrorMessage("Invalid username or password");
      return;
    }

    // Redirect if successful
    window.location.href = "/dashboard";
  };

  const handleGoogleLogin = () => {
    signIn("google");
  };

  return (
    <div
      className={`flex min-h-screen items-center justify-center bg-cover bg-center ${inter.className}`}
      style={{ backgroundImage: "url('/assets/bg_signin.png')" }}
    >
      <div className="w-full max-w-md p-6 text-white">
        {/* Header */}
        <div className="flex flex-col items-center space-y-2 mb-[20px] ">
          <Image
            src="/assets/logos/Colored=Logo S.png"
            alt="Logo"
            width={100}
            height={100}
            className="rounded-full"
          />
          <h1 className="font-bold text-[25px] mb-[20px] ">Welcome back, star!</h1>
        </div>

        {/* Username */}
        <p className="text-white font-normal mb-[15px]">Username or email address</p>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-[20px]"
        />

        {/* Password */}
        <p className="text-white font-normal mb-[15px]">Password</p>
        <div className="relative mb-[20px] ">
          <Input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10 appearance-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* reCAPTCHA */}
        <div className="flex justify-center mb-[20px]">
          <ReCAPTCHA
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
            onChange={(value) => setCaptcha(value)}
          />
        </div>

        {/* Error message */}
        {errorMessage && (
          <p className="text-red-500 text-sm mb-3">{errorMessage}</p>
        )}

        {/* Remember Me + Forgot Password */}
        <div className="flex justify-between items-center text-[16px] mb-[20px]">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-blue-500" />
            Remember me
          </label>
          <a href="/forgot-password" className="text-white opacity-50 hover:opacity-50 hover:underline">
            Forgot password?
          </a>
        </div>

        {/* Sign In Button */}
        <Button
          className="flex w-[400px] h-[50px] justify-center items-center px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm sm:text-[20px] font-normal transition rounded-[15px] mb-[20px]"
          onClick={handleLogin}
        >
          Sign in
        </Button>

        {/* Google Login */}
        <Button
          variant="outline"
          className="flex w-full md:w-[400px] h-[50px] justify-center items-center gap-2 mt-3 text-black text-[20px] font-medium rounded-[15px] border border-gray-300 hover:bg-gray-100 mb-[35px]"
          onClick={handleGoogleLogin}
        >
          <img
            src="/assets/google_logo.png"
            alt="Google Logo"
            className="w-[19.602px] h-[20px]"
          />
          Sign in with Google
        </Button>

        {/* Register Link */}
        <p className="text-center text-sm mt-4 text-[16px]">
          Don’t have an account yet?{" "}
          <a href="/register" className="text-[#6DDFFF] hover:underline">
            Register now!
          </a>
        </p>
      </div>
    </div>
  );
}
