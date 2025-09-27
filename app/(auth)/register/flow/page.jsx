"use client";

import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Step1 from "./steps/step1";
import Step2 from "./steps/step2";
import Step3 from "./steps/step3";
import Step4 from "./steps/step4";
import Step5 from "./steps/step5";
import Step6 from "./steps/step6";
import Onboarding1 from "./steps/onboarding1";
import Onboarding2 from "./steps/onboarding2";
import { useRouter } from "next/navigation";

export default function RegisterFlow() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isRegistering, setIsRegistering] = useState(false); // <--- ADD THIS LINE
  const [error, setError] = useState(null); // <--- ADD THIS LINE

  // REWRITTEN: Function to handle the final submission on Step 6
  const completeRegistration = async () => {
    let userId = null;

    try {
      // 1. GET SUPABASE USER ID
      // Assuming the Supabase Auth user was successfully created in a prior step
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // If the user isn't logged in, we can't insert the profile. This might indicate
        // that the Supabase sign-up step (often done in Step 1/6) failed.
        throw new Error(
          "Supabase Auth user not found. Cannot insert profile data."
        );
      }
      userId = user.id;

      const { data: newUser, error: userError } = await supabase
        .from("users_tbl")
        .insert([
          {
            auth_uuid: authUUID, // 👈 NEW
            first_name: step1Data.firstName,
            last_name: step1Data.lastName,
            username: step1Data.username,
            email: step1Data.email,
            bio: step3Data.introduction || null,
            links: (step3Data.links || []).filter((l) => l.trim()).join(", "),
            location: step2Data.searchQuery || null,
          },
        ])
        .select("user_id")
        .single();

      if (userError) throw userError;
      const newUserId = userInsert.user_id;

      // step5Data contains selected categories as IDs
      if (Array.isArray(step5Data) && step5Data.length > 0) {
        const interestsPayload = step5Data.map((catId) => ({
          user_id: newUserId,
          genskills_id: Number(catId),
        }));

        const { error: interestsError } = await supabase
          .from("userinterests_tbl")
          .insert(interestsPayload);

        if (interestsError) throw interestsError;
      }

      const specializationIds = Object.values(checkedOptions).flat();
      if (specializationIds.length > 0) {
        const specPayload = specializationIds.map((specId) => ({
          user_id: newUserId,
          specskills_id: specId,
        }));

        const { error: specError } = await supabase
          .from("users_specskills")
          .insert(specPayload);

        if (specError) throw specError;
      }

      // 3. CLEANUP AND NEXTAUTH SIGN-IN (Original logic follows)
      // Only proceed with cleanup and sign-in if profile insertion was successful

      // Clear registration flags
      setIsRegistering(false);
      sessionStorage.removeItem("registrationComplete");
      sessionStorage.removeItem("userEmail");

      // Sign in the user automatically using their credentials from step1Data
      const result = await signIn("credentials", {
        identifier: step1Data.username || step1Data.email,
        password: step1Data.password,
        redirect: false,
      });

      if (result?.ok) {
        setStep(7);
      } else {
        router.push("/signin?message=registration_complete_signin_required");
      }
    } catch (error) {
      console.error("Registration finalization failed:", error);
      // If anything fails (DB insert or sign-in), redirect to sign-in
      router.push("/signin?message=registration_complete");
    }
  };

  // Prevent step reset when session changes during registration
  // (Removed duplicate isRegistering state declaration)

  // Hold step data
  const [step1Data, setStep1Data] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
  });
  const [step2Data, setStep2Data] = useState({
    searchQuery: "",
    marker: null,
  });

  const [step3Data, setStep3Data] = useState({
    profilePicFile: null,
    introduction: "",
    links: [],
    userIDFile: null,
    userIDFileName: "",
  });

  const [step4Data, setStep4Data] = useState({
    selectedCategories: [],
  });

  const [step5Data, setStep5Data] = useState([]);

  const [step6Data, setStep6Data] = useState({});

  const handleStep1Submit = (data) => setStep1Data(data);
  const handleStep2Submit = (data) => setStep2Data(data);
  const handleStep3Submit = (data) => setStep3Data(data);
  const handleStep4Submit = (data) => setStep4Data(data);
  const handleStep5Submit = (data) => {
    setStep5Data(data);
    setStep6Data(data);
  };
  const handleStep6Submit = (data) => setStep6Data(data);

  const nextStep = () => {
    if (step === 6) {
      setIsRegistering(true); // Mark as in registration process
      setStep(7); // Jump to Onboarding1 after Step6
    } else {
      setStep((prev) => prev + 1);
    }
  };

  // Check which step we are at and update the corresponding step data
  const prevStep = (stepData) => {
    switch (step) {
      case 2:
        if (stepData) setStep2Data(stepData);
        break;
      case 3:
        if (stepData) setStep3Data(stepData);
        break;
      case 4:
        if (stepData) setStep4Data(stepData);
        break;
      case 5:
        if (stepData) setStep5Data(stepData);
        break;
      case 6:
        if (stepData) setStep6Data(stepData);
        break;
      case 7:
        setIsRegistering(false); // Clear registration flag when going back
        break;
      default:
        break;
    }
    setStep((prev) => prev - 1);
  };

  // Handle session changes - only redirect if not in registration flow
  useEffect(() => {
    // Don't redirect during registration or post-registration onboarding
    const inPostRegFlow =
      sessionStorage.getItem("postRegistrationFlow") === "true";

    if (isRegistering || step >= 7 || inPostRegFlow) {
      console.log("Skipping redirect - in registration/onboarding flow");
      return;
    }

    if (status === "authenticated" && session) {
      // User is already signed in and not in registration/onboarding
      console.log("User already authenticated, redirecting to home");
      router.push("/home");
    }
  }, [session, status, isRegistering, step, router]);

  return (
    <div>
      {step === 1 && (
        <Step1
          step1Data={step1Data}
          onDataSubmit={handleStep1Submit}
          onNext={nextStep}
        />
      )}
      {step === 2 && (
        <Step2
          step2Data={step2Data}
          onDataSubmit={handleStep2Submit}
          onNext={nextStep}
          onPrev={prevStep}
        />
      )}
      {step === 3 && (
        <Step3
          step3Data={step3Data}
          onDataSubmit={handleStep3Submit}
          onNext={nextStep}
          onPrev={prevStep}
        />
      )}
      {step === 4 && (
        <Step4
          step4Data={step4Data}
          onDataSubmit={handleStep4Submit}
          onNext={nextStep}
          onPrev={prevStep}
        />
      )}
      {step === 5 && (
        <Step5
          step5Data={step5Data}
          onDataSubmit={handleStep5Submit}
          onNext={nextStep}
          onPrev={prevStep}
        />
      )}
      {step === 6 && (
        <Step6
          step1Data={step1Data}
          step2Data={step2Data}
          step3Data={step3Data}
          step4Data={step4Data}
          step5Data={step5Data}
          step6Data={step6Data}
          onConfirm={completeRegistration}
          isSubmitting={isRegistering}
        />
      )}

      {step === 7 && (
        <Onboarding1 onNext={() => setStep(8)} onPrev={() => setStep(6)} />
      )}
      {step === 8 && (
        <Onboarding2 onNext={completeRegistration} onPrev={() => setStep(7)} />
      )}
    </div>
  );
}
