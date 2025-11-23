"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReCAPTCHA from "react-google-recaptcha";
import { useLoginStore } from "@/stores/loginStore";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [captcha, setCaptcha] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const { username, password, setUsername, setPassword } = useLoginStore();

  const handleLogin = async (e) => {
    e?.preventDefault?.();
    setErrorMessage("");

    if (!username || !password) {
      setErrorMessage("Please enter both username and password");
      return;
    }
    if (!captcha) {
      setErrorMessage("Please verify CAPTCHA");
      return;
    }

    // Execute NextAuth login
    const result = await signIn("credentials", {
      redirect: false,
      identifier: username,
      password: password,
    });

    console.log("NextAuth Sign-in Result:", result);

    // ✅ DON'T redirect to suspension here - let the useEffect handle it
    // The session will be updated after successful signIn
    
    if (result?.error) {
      // Only handle non-suspension errors here
      let errorMsg = "Invalid login credentials.";
      
      try {
        const errorData = JSON.parse(result.error);
        // If it's a sanction error, the useEffect will handle the redirect
        if (!errorData.sanction) {
          setErrorMessage(errorMsg);
        }
      } catch (e) {
        setErrorMessage(errorMsg);
      }
    }
  };

  // ✅ THIS is where suspension redirect should happen
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const user = session.user;
      
      console.log("Session user data:", user);
      console.log("Sanction status:", user.sanction_status);
      console.log("Sanction details:", user.sanction_details);

      // 1. CHECK FOR SUSPENSION/BAN FIRST
      if (user.sanction_status === 'SUSPENSION' || user.sanction_status === 'BAN') {
        const sanctionDetails = user.sanction_details || {};
        const reason = sanctionDetails.reason || "Violation of platform policies";
        const until = sanctionDetails.until || null;
        
        // ✅ Handle multiple possible key names for report ID
        const originalReportId = sanctionDetails.source_report_id || 
                                 sanctionDetails.report_id || 
                                 null;

        console.log("🔍 Suspension redirect debug:", {
          reason,
          until,
          originalReportId,
          fullSanctionDetails: sanctionDetails
        });

        // Build the suspension URL
        const params = new URLSearchParams({
          reason: reason,
        });

        // ✅ Handle 'until' timestamp properly
        if (until && until !== 'PERMANENT') {
          try {
            // Try to parse and format the date
            const dateObj = new Date(until);
            if (!isNaN(dateObj.getTime())) {
              params.append('until', dateObj.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }));
            } else {
              params.append('until', until);
            }
          } catch (e) {
            params.append('until', until);
          }
        } else if (until === 'PERMANENT') {
          params.append('until', 'PERMANENT');
        }

        // ✅ Only add originalReportId if it's a valid number
        if (originalReportId && !isNaN(parseInt(originalReportId))) {
          params.append('originalReportId', originalReportId);
          console.log(`✅ Valid report ID found: ${originalReportId}`);
        } else {
          console.warn("⚠️ No valid report ID found in sanction_details");
          console.warn("   Full sanction_details:", JSON.stringify(sanctionDetails, null, 2));
        }

        const suspensionUrl = `/suspension?${params.toString()}`;
        console.log("📍 Redirecting to:", suspensionUrl);

        router.push(suspensionUrl);
        return;
      }

      // 2. CHECK FOR ADMIN
      if (user.is_admin === true) {
        console.log("Admin detected. Redirecting to Admin Dashboard.");
        router.push("/admin/dashboard");
        return;
      }

      // 3. REGULAR USER - go to home
      router.push("/home");
    }
  }, [status, session, router]);

  // Show loading while checking auth status
  if (status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/bg_signin.png')" }}
      >
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div
        className={`flex min-h-screen items-center justify-center bg-no-repeat bg-center bg-cover ${inter.className}`}
        style={{ backgroundImage: "url('/assets/bg_signin.png')" }}
      >
        <div className="w-full max-w-md px-4 sm:px-6 text-white">
          {/* Header */}
          <div className="flex flex-col items-center space-y-2 mb-[20px]">
            <Image
              src="/assets/logos/Colored=Logo S.png"
              alt="Logo"
              width={100}
              height={100}
              className="rounded-full"
            />
            <h1 className="font-bold text-[22px] sm:text-[25px] mb-[20px]">
              Welcome back, star!
            </h1>
          </div>

          {/* Username */}
          <p className="text-white font-normal mb-[15px]">
            Username or email address
          </p>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mb-[20px] w-full"
          />

          {/* Password */}
          <p className="text-white font-normal mb-[15px]">Password</p>
          <div className="relative mb-[20px]">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10 appearance-none w-full"
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
          <div className="flex justify-between items-center text-[14px] sm:text-[16px] mb-[20px]">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="accent-blue-500"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <a
              href="/forgot-password"
              className="text-white opacity-50 hover:underline"
            >
              Forgot password?
            </a>
          </div>

          {/* Sign In Button */}
          <Button
            className="cursor-pointer flex w-full sm:w-[400px] h-[50px] justify-center items-center px-4 py-3 shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-base sm:text-[20px] font-normal transition rounded-[15px] mb-[20px] mx-auto"
            onClick={handleLogin}
          >
            Sign in
          </Button>

          {/* Google Login */}
          <Button
            variant="outline"
            className="cursor-pointer flex w-full sm:w-[400px] h-[50px] justify-center items-center gap-2 mt-3 text-black text-base sm:text-[20px] font-medium rounded-[15px] border border-gray-300 hover:bg-gray-100 mb-[35px] mx-auto"
          >
            <img
              src="/assets/google_logo.png"
              alt="Google Logo"
              className="w-5 h-5"
            />
            Sign in with Google
          </Button>

          {/* Register Link */}
          <p className="text-center text-sm sm:text-[16px] mt-4">
            Don't have an account yet?{" "}
            <a href="/register" className="text-[#6DDFFF] hover:underline">
              Register now!
            </a>
          </p>
        </div>
      </div>
    );
  }

  // If authenticated but still rendering (before redirect), show loading
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/assets/bg_signin.png')" }}
    >
      <div className="text-white">Redirecting...</div>
    </div>
  );
}