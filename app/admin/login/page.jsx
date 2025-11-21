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

// --- IMPORTANT NOTE ---
// This page relies on your NextAuth configuration being set up to:
// 1. Check the 'is_superuser' flag in the Django login response.
// 2. ONLY allow login if is_superuser is true (or return an error).
// 3. Expose the JWT token and user role in the session data.
// ----------------------

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [captcha, setCaptcha] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false); // New loading state

  const { username, password, setUsername, setPassword } = useLoginStore();

  const handleLogin = async (e) => {
    e?.preventDefault?.();
    setErrorMessage("");
    setIsAuthenticating(true);

    if (!username || !password) {
      setErrorMessage("Please enter both username and password");
      setIsAuthenticating(false);
      return;
    }
    if (!captcha) {
      setErrorMessage("Please verify CAPTCHA");
      setIsAuthenticating(false);
      return;
    }

    // --- SECURE ADMIN LOGIN FLOW ---
    // NOTE: If the backend successfully authenticates a user who is NOT an admin, 
    // NextAuth will successfully set the session, which is what we need to prevent.
    // The primary gate is the backend returning an error if they are non-admin, 
    // or the NextAuth authorize function throwing an error based on the is_admin flag.

    const result = await signIn("credentials", {
      redirect: false,
      identifier: username,
      password: password,
    });

    if (result?.error) {
      let errorMsg = "Invalid login credentials or insufficient privileges.";

      try {
        // Attempt to parse the error message if it's the custom JSON error from NextAuth
        const errorData = JSON.parse(result.error);

        if (errorData.sanction) {
          // REDIRECT SANCTIONED USER TO SUSPENSION PAGE
          const { reason, until } = errorData.sanction;

          // We use the router to push to the suspension page with URL parameters
          router.push(`/suspension?reason=${encodeURIComponent(reason)}&until=${encodeURIComponent(until)}`);
          return; // Stop execution after redirect
        }
      } catch (e) {
        // Error was not the custom JSON format (it's a generic "Non-admin" error or wrong password)
        // The default error message (Invalid login credentials or insufficient privileges.) remains.
      }

      setErrorMessage(errorMsg); // Display the generic failure message
      setIsAuthenticating(false);
      return;
    }

    if (result?.ok) {
      // Successful Admin Login
      router.push("/admin/dashboard");
    }

    setIsAuthenticating(false);
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      // Check if session data contains a flag that confirms Admin role
      // Example: if (session?.user?.is_admin)
      // Since your Django backend check is robust, we rely on the session being set.
      router.push("/admin/dashboard");
    }
  }, [status, router, session]);

  // Show loading while checking auth status
  if (status === "loading" || isAuthenticating) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/bg_signin.png')" }}
      >
        <div className="text-white">Authenticating Admin Access...</div>
      </div>
    );
  }

  // If status is unauthenticated, show the login form
  if (status === "unauthenticated") {
    return (
      <div
        className={`flex min-h-screen items-center justify-center bg-no-repeat bg-center bg-cover ${inter.className}`}
        style={{ backgroundImage: "url('/assets/bg_signin.png')" }}
      >
        <div className="w-full max-w-md px-4 sm:px-6 text-white">
          {/* Header */}
          <div className="flex flex-col items-center space-y-2 mb-[20px] ">
            <Image
              src="/assets/logos/Colored=Logo S.png"
              alt="Logo"
              width={100}
              height={100}
              className="rounded-full"
            />
            <h1 className="font-bold text-[22px] sm:text-[25px] mb-[20px] text-red-400">
              Admin Access Required
            </h1>
            <p className="text-sm text-white/70">
              Sign in with your Expair administrator credentials.
            </p>
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

          {/* Remember Me + Forgot Password (Kept for visual parity) */}
          <div className="flex justify-between items-center text-[14px] sm:text-[16px] mb-[20px]">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="accent-red-500"
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
            className="cursor-pointer flex w-full sm:w-[400px] h-[50px] justify-center items-center px-4 py-3 shadow-[0px_0px_15px_0px_#cc2828] bg-red-700 hover:bg-red-800 text-white text-base sm:text-[20px] font-normal transition rounded-[15px] mb-[20px] mx-auto"
            onClick={handleLogin}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? "Verifying..." : "Admin Sign In"}
          </Button>

          {/* Back to User Login Link */}
          <p className="text-center text-sm sm:text-[16px] mt-4">
            <a href="/signin" className="text-[#6DDFFF] hover:underline">
              ← Return to regular user login
            </a>
          </p>

        </div>
      </div>
    );
  }
}