"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is Expair?",
    answer:
      "Expair is a platform where you can trade skills with others—no money involved. Whether you want to teach, learn, or exchange services, Expair helps you connect with the right people through fair, AI-powered matching.",
  },
  {
    question: "How does skill exchange work?",
    answer:
      "You offer a skill (like video editing), and in return, you get help with something you need (like learning web design). Our system finds a balanced match based on time, effort, and difficulty—so both sides win.",
  },
  {
    question: "Do I not need to pay anything?",
    answer:
      "Yes! Expair is completely free. There are no subscriptions, hidden charges, or paywalls. We believe learning and helping others shouldn’t cost a thing.",
  },
  {
    question: "How will I know if a trade is fair?",
    answer:
      "Expair’s AI evaluates trades based on effort and skill level, making sure both users get equal value. Plus, you can check user ratings before committing to a trade.",
  },
  {
    question: "What if I’m new and don’t have any ratings?",
    answer:
      "No worries! Everyone starts somewhere. As you complete exchanges, you’ll naturally build your credibility through reviews and experience. For an extra boost, you can also verify your profile by connecting your social media accounts or uploading certificates through platforms like Credly.",
  },
  {
    question: "Do I need to be an expert to offer a skill?",
    answer:
      "Not at all. As long as you’re confident in what you can offer, there’s likely someone out there who’d benefit from it. Whether you're a beginner or a pro—your skills matter.",
  },
  {
    question: "How is Expair different from platforms like Upwork or Fiverr?",
    answer:
      "Unlike freelancing platforms that rely on money and bidding, Expair is built on skill-for-skill exchange. You don’t need to pay or compete for gigs—just offer what you’re good at and get matched fairly with someone who can help you in return. It’s collaboration, not competition.",
  },
];

export default function FaqSection() {
  const [openItems, setOpenItems] = useState([]);

  const toggleItem = (index) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const collapseAll = () => setOpenItems([]);

  return (
    <section id="FAQs" className="w-full flex flex-col items-center justify-center px-6 py-20 relative">
      {/* Indigo glow background */}
      <div className="absolute inset-0 bg-indigo-600 blur-[200px] opacity-20 -z-10" />

      <h2 className="text-[32px] md:text-[40px] font-bold text-center mb-[50px] font-sans">
        Frequently asked questions
      </h2>

      {/* Collapse All Text */}
      {openItems.length > 0 && (
        <div className="w-full max-w-[940px] flex justify-end mb-4">
          <span
            onClick={collapseAll}
            className="text-[16px] text-[#6C8BFF] hover:underline cursor-pointer"
          >
            Collapse all
          </span>
        </div>
      )}

      <div className="w-full max-w-[940px] flex flex-col gap-[15px]">
        {faqs.map((faq, index) => {
          const isOpen = openItems.includes(index);
          return (
            <div
              key={index}
              className={`transition-all duration-300 rounded-[10px] px-[45px] py-[20px] text-white ${
                isOpen
                  ? "shadow-[0_0_15px_0_#0038FF] border border-[#0038FF]"
                  : "shadow-[0_4px_4px_rgba(0,0,0,0.4)]"
              } bg-[#120A2A]`}
            >
              <button
                onClick={() => toggleItem(index)}
                className="flex items-center justify-between w-full text-left"
              >
                <h5 className="text-[20px] font-regular">{faq.question}</h5>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`transition-all duration-300 overflow-hidden ${
                  isOpen ? "mt-[20px] max-h-[500px]" : "max-h-0"
                }`}
              >
                {isOpen && (
                  <p className="text-[16px] leading-[120%] text-justify">
                    {faq.answer}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
