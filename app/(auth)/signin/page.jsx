"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReCAPTCHA from "react-google-recaptcha";
import { useLoginStore } from "@/stores/loginStore";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react"; // Imported Loader2
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [captcha, setCaptcha] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  
  // New state for loading
  const [isSigningIn, setIsSigningIn] = useState(false);

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

    // Start loading
    setIsSigningIn(true);

    // Execute NextAuth login
    const result = await signIn("credentials", {
      redirect: false,
      identifier: username,
      password: password,
    });

    console.log("NextAuth Sign-in Result:", result);

    if (result?.error) {
      // Stop loading only on error
      setIsSigningIn(false);
      
      let errorMsg = "Invalid login credentials.";
      
      try {
        const errorData = JSON.parse(result.error);
        if (!errorData.sanction) {
          setErrorMessage(errorMsg);
        }
      } catch (e) {
        setErrorMessage(errorMsg);
      }
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const user = session.user;
      
      if (user.sanction_status === 'SUSPENSION' || user.sanction_status === 'BAN') {
        const sanctionDetails = user.sanction_details || {};
        const reason = sanctionDetails.reason || "Violation of platform policies";
        const until = sanctionDetails.until || null;
        
        const originalReportId = sanctionDetails.source_report_id || 
                                 sanctionDetails.report_id || 
                                 null;

        const params = new URLSearchParams({
          reason: reason,
        });

        if (until && until !== 'PERMANENT') {
          try {
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

        if (originalReportId && !isNaN(parseInt(originalReportId))) {
          params.append('originalReportId', originalReportId);
        }

        const suspensionUrl = `/suspension?${params.toString()}`;
        router.push(suspensionUrl);
        return;
      }

      if (user.is_admin === true) {
        router.push("/admin/dashboard");
        return;
      }

      router.push("/home");
    }
  }, [status, session, router]);

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

          <p className="text-white font-normal mb-[15px]">
            Username or email address
          </p>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mb-[20px] w-full"
          />

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

          <div className="flex justify-center mb-[20px]">
            <ReCAPTCHA
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
              onChange={(value) => setCaptcha(value)}
            />
          </div>

          {errorMessage && (
            <p className="text-red-500 text-sm mb-3">{errorMessage}</p>
          )}

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

          {/* UPDATED SIGN IN BUTTON */}
          <Button
            disabled={isSigningIn}
            className={`cursor-pointer flex w-full sm:w-[400px] h-[50px] justify-center items-center px-4 py-3 shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-base sm:text-[20px] font-normal transition rounded-[15px] mb-[20px] mx-auto ${
              isSigningIn ? "opacity-70 cursor-not-allowed" : ""
            }`}
            onClick={handleLogin}
          >
            {isSigningIn ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin h-5 w-5" />
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign in"
            )}
          </Button>

          <Button
            variant="outline"
            className="cursor-pointer flex w-full sm:w-[400px] h-[50px] justify-center items-center gap-2 mt-3 text-black text-base sm:text-[20px] font-medium rounded-[15px] border border-gray-300 hover:bg-gray-100 mb-[35px] mx-auto"
            onClick={() => signIn("google")}
          >
            <img
              src="/assets/google_logo.png"
              alt="Google Logo"
              className="w-5 h-5"
            />
            Sign in with Google
          </Button>

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

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/assets/bg_signin.png')" }}
    >
      <div className="text-white">Redirecting...</div>
    </div>
  );
}