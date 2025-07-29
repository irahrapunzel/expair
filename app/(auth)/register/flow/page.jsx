"use client";

import { useState } from "react";
import Step1 from "./steps/Step1";
import Step2 from "./steps/Step2";
import Step3 from "./steps/Step3";
import Step4 from "./steps/Step4";
import Step5 from "./steps/Step5";
import Step6 from "./steps/Step6";
import Step7 from "./steps/Step7";

export default function RegisterFlow() {
  const [step, setStep] = useState(1);

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  return (
    <div>
      {step === 1 && <Step1 onNext={nextStep} />}
      {step === 2 && <Step2 onNext={nextStep} onPrev={prevStep} />}
      {step === 3 && <Step3 onNext={nextStep} onPrev={prevStep} />}
      {step === 4 && <Step4 onNext={nextStep} onPrev={prevStep} />}
      {step === 5 && <Step5 onNext={nextStep} onPrev={prevStep} />}
      {step === 6 && <Step6 onNext={nextStep} onPrev={prevStep} />}
      {step === 7 && <Step7 onNext={nextStep} onPrev={prevStep} />}
    </div>
  );
}
