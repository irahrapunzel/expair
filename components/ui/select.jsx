"use client"

import * as React from "react"
import { Listbox } from "@headlessui/react"
import { ChevronDown } from "lucide-react"

export function Select({ options = [], value, onChange }) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <Listbox.Button className="w-full rounded-md border border-gray-600 bg-[#2E2C5A] px-4 py-2 text-white text-left focus:outline-none focus:ring-2 focus:ring-[#5E53FF] flex justify-between items-center">
          {value || "Select..."}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Listbox.Button>
        <Listbox.Options className="absolute mt-2 w-full rounded-md bg-white text-black shadow-lg z-50">
          {options.map((option, i) => (
            <Listbox.Option
              key={i}
              value={option}
              className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
            >
              {option}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  )
}