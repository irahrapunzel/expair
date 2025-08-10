"use client";

import { useState } from "react";
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
  const [formData, setFormData] = useState({
    selectedSkills: [],
    specializations: {}
  });
  const router = useRouter();

  const nextStep = (data) => {
    if (data) {
      setFormData(prev => ({...prev, ...data}));
    }
    setStep((prev) => prev + 1);
  };
  
  const prevStep = () => setStep((prev) => prev - 1);
  const completeRegistration = () => router.push("/home");
  const goToOnboarding = (data) => {
    if (data) {
      setFormData(prev => ({...prev, specializations: data}));
    }
    setStep(7);
  };

  return (
    <div>
      {step === 1 && <Step1 onNext={nextStep} />}
      {step === 2 && <Step2 onNext={nextStep} onPrev={prevStep} />}
      {step === 3 && <Step3 onNext={nextStep} onPrev={prevStep} />}
      {step === 4 && <Step4 onNext={nextStep} onPrev={prevStep} />}
      {step === 5 && <Step5 onNext={(selectedSkills) => nextStep({selectedSkills})} onPrev={prevStep} initialSelectedSkills={formData.selectedSkills} />}
      {step === 6 && <Step6 onNext={goToOnboarding} onPrev={prevStep} selectedSkills={formData.selectedSkills} />}
      {step === 7 && <Onboarding1 onNext={() => setStep(8)} onPrev={() => setStep(6)} />}
      {step === 8 && <Onboarding2 onNext={completeRegistration} onPrev={() => setStep(7)} />}
    </div>
  );
}
