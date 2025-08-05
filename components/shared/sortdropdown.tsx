"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";

type SortDropdownProps = {
  selected: string;
  onChange: (option: string) => void;
  options?: string[];
};

export default function SortDropdown({
  selected,
  onChange,
  options = ["Date", "Level", "Rating"],
}: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-4 py-2 bg-[#120A2A] rounded-[15px] hover:bg-[#1A0F3E] transition text-sm"
      >
        <Icon icon="mdi:sort" className="text-lg" />
        {selected}
        <Icon icon="mdi:chevron-down" className="text-base" />
      </button>

      {open && (
        <div className="absolute z-10 mt-2 w-full bg-[#15042C] rounded-[10px] border border-[#2B124C] shadow-md">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={`block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#1A0F3E] ${
                selected === option ? "font-semibold text-[#6C8BFF]" : ""
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}