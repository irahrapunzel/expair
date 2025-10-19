import { Icon } from "@iconify/react";

export default function IDSelector({ isFilipino, onBack, onSelect }) {
  const filipinoIDs = [
    "National ID (Card/Paper/Digital)",
    "Driver’s License (Philippine)",
    "UMID",
    "Postal ID",
    "Passport",
    "SSS ID",
    "PRC ID",
    "Pag-IBIG (HDMF)",
    "Barangay ID / Clearance",
    "NBI Clearance",
    "School ID (student ID)",
    "Voter’s ID / Certificate",
    "Company ID",
  ];

  const foreignIDs = [
    "Philippine Driver’s License",
    "Alien / Immigrant Certificate of Registration",
    "Special Resident Retiree’s Visa",
    "DOLE Alien Employment Permit",
    "Diplomat’s ID",
    "International Passport",
    "Resident ID Card",
    "Work Visa / Student Visa Document",
  ];

  const list = isFilipino ? filipinoIDs : foreignIDs;

  return (
    <div className="text-white space-y-4">
      <h2 className="text-xl font-bold text-center">Select your ID</h2>
      <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-1">
        {list.map((id, i) => (
          <button
            key={i}
            onClick={() => onSelect(id)}
            className="flex items-center justify-between bg-white/10 hover:bg-[#284CCC] rounded-[10px] px-4 py-2 transition"
          >
            <span>{id}</span>
            <Icon icon="mdi:chevron-right" className="w-4 h-4 text-white/70" />
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-4">
        <button
          onClick={onBack}
          className="text-white/70 hover:text-white text-sm"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
