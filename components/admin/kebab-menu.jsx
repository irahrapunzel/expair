import { MoreVertical } from "lucide-react";

export default function KebabMenu({ isOpen, onToggle, children }) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="p-1 hover:bg-white/10 rounded transition-all"
      >
        <MoreVertical className="w-5 h-5 text-white/70" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-[#120A2A] border border-white/10 rounded-lg shadow-xl py-1 z-10">
          {children}
        </div>
      )}
    </div>
  );
}

export function KebabMenuItem({ icon: Icon, label, onClick, color = "text-white" }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full px-4 py-2 text-sm ${color} hover:bg-white/5 transition-all`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}



