"use client";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Upload } from "lucide-react";
import { useState, Fragment } from "react";
import { Listbox } from "@headlessui/react";
import { ChevronDown } from "lucide-react";

export function HelpForm() {
  const [category, setCategory] = useState("");

  const options = [
    {
      label: "🔧 Technical Issues",
      items: [
        "I can’t log into my account",
        "I didn’t receive a verification email",
        "I’m having trouble uploading a certificate or ID",
        "I’m experiencing bugs or glitches on the platform",
        "I can’t connect my social media accounts",
      ],
    },
    {
      label: "👥 User or Trade Concerns",
      items: [
        "My trade partner isn’t responding",
        "My partner uploaded invalid or inappropriate proof",
        "I suspect my partner is a scammer",
        "I want to report a user",
        "I want to dispute a rating or feedback",
      ],
    },
    {
      label: "💬 Account & Settings",
      items: [
        "I want to change my password",
        "I want to delete or deactivate my account",
        "I want to edit my profile or skills list",
        "I can’t update my availability or location",
      ],
    },
    {
      label: "📄 Platform Use & Guidelines",
      items: [
        "I don’t understand how trades work",
        "I need help using the trade system",
        "I want to know how Expair’s fairness system works",
        "I have suggestions to improve Expair",
      ],
    },
    {
      label: "💸 Privacy & Security",
      items: [
        "I’m concerned about my data privacy",
        "I want to unlink a connected account",
        "I want to know how my data is used",
      ],
    },
  ];

  const [text, setText] = useState("");
  const maxChars = 500;

  return (
    <div className="w-[686px] mx-auto pt-[50px] text-white">
      <h2 className="text-[25px] font-semibold mb-[30px] text-center">Create a ticket</h2>

      <form className="space-y-[30px] flex flex-col">
        <p className="text-white font-normal mb-[15px]">Your name *</p>
        <Input
          placeholder="John Doe"
          className="w-[450px] h-[50px] rounded-[15px] border border-white/40 bg-[#120A2A] placeholder-[#413663] placeholder:text-[16px] text-white"
        />

        <p className="text-white font-normal mb-[15px]">Your email *</p>
        <Input
          type="email"
          placeholder="youremail@example.com"
          className="w-[450px] h-[50px] rounded-[15px] border border-white/40 bg-[#120A2A] placeholder-[#413663] placeholder:text-[16px] text-white"
        />

        {/* Select Dropdown */}
        <p className="text-white font-normal mb-[15px]">What’s your problem, concern, or suggestion? *</p>
        <div className="relative w-[450px]">
          <Listbox value={category} onChange={setCategory}>
            <div className="relative">
              <Listbox.Button
                className={`w-full h-[50px] rounded-[15px] border border-white/40 bg-[#120A2A] text-left pl-4 pr-10 flex items-center justify-between ${
                  category ? "text-white" : "text-[#413663]"
                } text-[16px]`}
              >
                {category || "Select category"}
                <ChevronDown className="h-6 w-6 absolute right-4 text-white" />
              </Listbox.Button>
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-[15px] bg-[#120A2A] text-white shadow-lg border border-white/20">
                {options.map((group, idx) => (
                  <Fragment key={idx}>
                    <div className="px-4 pt-2 pb-1 text-xs text-white/60 font-semibold">
                      {group.label}
                    </div>
                    {group.items.map((item, itemIdx) => (
                      <Listbox.Option
                        key={itemIdx}
                        value={item}
                        className={({ active }) =>
                          `cursor-pointer select-none px-4 py-2 text-sm ${
                            active ? "bg-[#1c1238]" : ""
                          }`
                        }
                      >
                        {item}
                      </Listbox.Option>
                    ))}
                  </Fragment>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>

        {/* Upload Photo Box */}
        <p className="text-white font-normal mb-[15px]">Upload a photo for context</p>
        <div className="w-[450px] h-[50px] rounded-[15px] border border-white/40 bg-[#120A2A] px-4 flex items-center justify-between cursor-pointer hover:bg-[#1c1238]">
          <span className="text-[#413663] text-[16px]">Upload photo</span>
          <Upload className="text-white" />
        </div>

        {/* Textarea with Counter */}
        <p className="text-white font-normal mb-[15px]">Describe the ticket in detail *</p>
        <div className="relative w-[656px]">
          <Textarea
            placeholder="Example: I am submitting a report concerning a potential scam incident. I was contacted by an individual claiming to be a licensed accountant, who requested that I provide my bank account details and a copy of my financial records. After complying, I have reason to believe the interaction was fraudulent. I have attached a detailed account of the events, including dates, communications, and any relevant transaction information to assist with the investigation."
            rows={6}
            maxLength={maxChars}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-[180px] bg-[#120A2A] border border-white/40 rounded-[15px] text-white placeholder-[#413663] placeholder:text-[16px] p-3"
          />
          <span className="absolute bottom-2 right-3 text-xs text-gray-400">
            {text.length}/{maxChars}
          </span>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mb-[195px]">
          <Button
            type="submit"
            className="font-normal w-[240px] h-[50px] px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] text-white text-sm sm:text-[16px] hover:bg-[#1a4dff] transition rounded-[15px]"
          >
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
}
