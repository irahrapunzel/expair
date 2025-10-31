import { useState } from "react";
import { Icon } from "@iconify/react";
import IDSelector from "./id-selector";
import IDUploadDropzone from "./id-upload-dropzone";

export default function VerificationModal({
  onClose,
  handleSubmitVerification,
  handleIdFileChange,
  idFile,
  idPreviewUrl,
  birthdate = "",  
  nationality = "",  
  idType = "",  
  onBirthdateChange,
  onNationalityChange,
  onIdTypeChange,
}) {
  const [step, setStep] = useState(1);
  
  // Local state for birthdate and nationality if not provided via props
  const [localBirthdate, setLocalBirthdate] = useState(birthdate);
  const [localNationality, setLocalNationality] = useState(nationality);
  const [localIdType, setLocalIdType] = useState(idType);
  const [birthdateError, setBirthdateError] = useState("");
  
  const goNext = () => setStep((s) => s + 1);
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  // Use props if provided, otherwise use local state
  const currentBirthdate = onBirthdateChange ? birthdate : localBirthdate;
  const currentNationality = onNationalityChange ? nationality : localNationality;
  const currentIdType = onIdTypeChange ? idType : localIdType;

  const handleBirthdateChange = (value) => {
    if (onBirthdateChange) {
      onBirthdateChange(value);
    } else {
      setLocalBirthdate(value);
    }
    setBirthdateError("");
  };

  const handleNationalityChange = (value) => {
    if (onNationalityChange) {
      onNationalityChange(value);
    } else {
      setLocalNationality(value);
    }
  };

  const handleIdTypeChange = (value) => {
    if (onIdTypeChange) {
      onIdTypeChange(value);
    } else {
      setLocalIdType(value);
    }
  };

  const isFilipino =
    (currentNationality || "").toLowerCase().includes("filipino") ||
    (currentNationality || "").toLowerCase().includes("philippine");

  const handleFinalSubmit = async () => {
    await handleSubmitVerification({
      birthdate: currentBirthdate,
      nationality: currentNationality,
      id_type: currentIdType,
    });
    setStep(5);
  };

  const nationalities = [
    "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan",
    "Argentine", "Armenian", "Australian", "Austrian", "Azerbaijani",
    "Bahamian", "Bahraini", "Bangladeshi", "Barbadian", "Belarusian",
    "Belgian", "Belizean", "Beninese", "Bhutanese", "Bolivian", "Bosnian",
    "Brazilian", "British", "Bruneian", "Bulgarian", "Burmese", "Cambodian",
    "Cameroonian", "Canadian", "Chilean", "Chinese", "Colombian", "Congolese",
    "Costa Rican", "Croatian", "Cuban", "Cypriot", "Czech", "Danish",
    "Dominican", "Dutch", "Ecuadorian", "Egyptian", "Emirati", "English",
    "Estonian", "Ethiopian", "Filipino", "Finnish", "French", "German",
    "Ghanaian", "Greek", "Guatemalan", "Haitian", "Honduran", "Hong Konger",
    "Hungarian", "Icelandic", "Indian", "Indonesian", "Iranian", "Iraqi",
    "Irish", "Israeli", "Italian", "Jamaican", "Japanese", "Jordanian",
    "Kazakh", "Kenyan", "Kuwaiti", "Lao", "Latvian", "Lebanese", "Libyan",
    "Lithuanian", "Luxembourgish", "Macanese", "Malaysian", "Maltese",
    "Mauritian", "Mexican", "Mongolian", "Moroccan", "Myanmar", "Nepalese",
    "New Zealander", "Nigerian", "Norwegian", "Pakistani", "Palestinian",
    "Panamanian", "Paraguayan", "Peruvian", "Polish", "Portuguese", "Qatari",
    "Romanian", "Russian", "Rwandan", "Saudi", "Scottish", "Senegalese",
    "Serbian", "Singaporean", "Slovak", "Slovenian", "Somali", "South African",
    "South Korean", "Spanish", "Sri Lankan", "Sudanese", "Swedish", "Swiss",
    "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai", "Tunisian", "Turkish",
    "Ugandan", "Ukrainian", "Uruguayan", "Uzbek", "Venezuelan", "Vietnamese",
    "Welsh", "Yemeni", "Zambian", "Zimbabwean",
  ];

  const validateAndContinue = () => {
    console.log("🔍 Validation check:", { currentBirthdate, currentNationality });
    
    if (!currentBirthdate || !currentNationality) {
      console.log("❌ Missing required fields");
      return;
    }

    const getAge = (birth) => {
      const birthDate = new Date(birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    };

    const age = getAge(currentBirthdate);
    console.log("📅 Calculated age:", age);
    
    if (age < 18) {
      setBirthdateError("You must be at least 18 years old to proceed.");
      return;
    }

    setBirthdateError("");
    goNext();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#120A2A] rounded-[15px] w-[440px] p-6 shadow-xl border border-white/20 relative overflow-hidden">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-white/70 hover:text-white"
        >
          <Icon icon="mdi:close" className="w-5 h-5" />
        </button>

        {/* STEP 1 – Intro */}
        {step === 1 && (
          <div className="text-center space-y-5">
            <h2 className="text-2xl font-bold text-white">
              Start using Expair. Verify now!
            </h2>
            <p className="text-white/70">
              Countless trades are waiting for you.
            </p>
            <ol className="text-left text-white/80 space-y-2 mt-4">
              {[
                "Make sure the photo of your ID is readable.",
                "Use an original ID, not a photocopy.",
                "Information submitted must match your ID.",
              ].map((rule, i) => (
                <li key={i} className="flex gap-3">
                  <span className="bg-[#284CCC] w-6 h-6 rounded-full flex items-center justify-center text-sm">
                    {i + 1}
                  </span>
                  {rule}
                </li>
              ))}
            </ol>
            <button
              onClick={goNext}
              className="bg-[#0038FF] hover:bg-[#1a4dff] text-white rounded-[12px] px-6 py-2 mt-3"
            >
              Get Verified
            </button>
          </div>
        )}

        {/* STEP 2 – Birthdate & Nationality */}
        {step === 2 && (
          <div className="text-white space-y-5">
            <h2 className="text-xl font-bold text-center">
              Tell us a bit about you
            </h2>

            <div className="text-left space-y-3 w-full">
              <label className="block">
                <span className="text-white/70 text-sm">Birthdate</span>
                <input
                  type="date"
                  value={currentBirthdate}
                  onChange={(e) => handleBirthdateChange(e.target.value)}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  className="w-full bg-[#1a1240] border border-white/20 rounded-[10px] p-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#6DDFFF] mt-1"
                />
                {birthdateError && (
                  <p className="text-red-400 text-xs mt-1">{birthdateError}</p>
                )}
              </label>

              <label className="block">
                <span className="text-white/70 text-sm">Nationality</span>
                <select
                  value={currentNationality}
                  onChange={(e) => handleNationalityChange(e.target.value)}
                  className="w-full bg-[#1a1240] border border-white/20 rounded-[10px] p-2 mt-1 text-white"
                >
                  <option value="">Select your nationality</option>
                  {nationalities.map((nat) => (
                    <option key={nat} value={nat}>
                      {nat}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex justify-between">
              <button
                onClick={goBack}
                className="text-white/70 hover:text-white text-sm"
              >
                ← Back
              </button>
              <button
                disabled={!currentBirthdate || !currentNationality}
                onClick={validateAndContinue}
                className={`rounded-[10px] px-5 py-2 transition ${
                  currentBirthdate && currentNationality
                    ? "bg-[#0038FF] hover:bg-[#1a4dff] text-white"
                    : "bg-white/10 text-white/40 cursor-not-allowed"
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 – Choose ID */}
        {step === 3 && (
          <IDSelector
            isFilipino={isFilipino}
            onBack={goBack}
            onSelect={(idName) => {
              handleIdTypeChange(idName);
              goNext();
            }}
          />
        )}

        {/* STEP 4 – Upload */}
        {step === 4 && (
          <div className="text-white space-y-5">
            <h2 className="text-xl font-bold text-center">
              Upload your {currentIdType}
            </h2>
            <IDUploadDropzone
              idFile={idFile}
              idPreviewUrl={idPreviewUrl}
              handleIdFileChange={handleIdFileChange}
            />

            <ol className="text-left text-white/80 space-y-2">
              {[
                "Your ID details are clear and readable in the photo.",
                "Take a photo of your actual ID, not a photocopy.",
                "Make sure your personal information is complete and correct.",
              ].map((rule, i) => (
                <li key={i} className="flex gap-3 items-center">
                  <span className="bg-[#284CCC] min-w-[26px] min-h-[26px] rounded-full flex items-center justify-center text-sm font-semibold leading-none">
                    {i + 1}
                  </span>
                  <span className="flex-1">{rule}</span>
                </li>
              ))}
            </ol>

            <div className="flex justify-between mt-4">
              <button
                onClick={goBack}
                className="text-white/70 hover:text-white text-sm"
              >
                ← Back
              </button>
              <button
                disabled={!idFile}
                onClick={handleFinalSubmit}
                className={`rounded-[10px] px-5 py-2 transition ${
                  idFile
                    ? "bg-[#0038FF] hover:bg-[#1a4dff] text-white"
                    : "bg-white/10 text-white/40 cursor-not-allowed"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        )}

        {/* STEP 5 – Thank you */}
        {step === 5 && (
          <div className="text-center space-y-5 text-white">
            <Icon
              icon="mdi:check-circle"
              className="w-14 h-14 text-[#00ffb7] mx-auto"
            />
            <h2 className="text-xl font-semibold">Thank you!</h2>
            <p>Your verification is being reviewed. We'll notify you soon.</p>
            <button
              onClick={onClose}
              className="bg-[#0038FF] hover:bg-[#1a4dff] rounded-[10px] px-6 py-2"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}