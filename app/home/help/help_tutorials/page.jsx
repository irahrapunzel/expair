"use client";

import React from "react";
import HelpLayout from "../../../../components/help/helplayout";

export default function GettingStartedTutorialsPage() {
  return (
    <HelpLayout>
      <div className="space-y-10 pb-[116px]">
        {/* Title */}
        <h1 className="text-[31px] font-[700] mb-[20px] flex items-center gap-2">
          <img
            src="/assets/icons/start.png"
            alt="Icon"
            className="w-[32px] h-[32px]"
          />
          Getting Started & Tutorials
        </h1>

        {/* Section: Getting Started with Expair */}
        <div>
          <h2 className="text-xl font-semibold mb-2">
            Getting Started with Expair
          </h2>
          <p className="mb-4">
            To begin using Expair, log in and click the “New Request” button on
            your dashboard. From there, you can post what skills or services
            you’re looking for and view your matches. The system will help
            connect you with nearby users who can trade with you fairly based on
            shared availability and needs.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> How do I start a skill trade?
              <br />
              <strong>A:</strong> Click “New Request” on the navigation bar and
              enter what you're looking for.
            </li>
            <li>
              <strong>Q:</strong> Can I edit my request after posting?
              <br />
              <strong>A:</strong> Yes, you can go back and modify your request
              at any time on Pending Trades.
            </li>
          </ul>
        </div>

        {/* Section: Community Help on Reddit and Socials */}
        <div>
          <h2 className="text-xl font-semibold mb-2">
            Community Help on Socials
          </h2>
          <p className="mb-4">
            For real-life tips and community feedback, check out our social
            media channels.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> Where can I view any updates Expair will have?
              <br />
              <strong>A:</strong> Any major patches to Expair will be posted on
              our social media accounts. Stay updated!
            </li>
            <li>
              <strong>Q:</strong> Do you post updates on social media?
              <br />
              <strong>A:</strong> Yes, follow us on X (Twitter), Facebook, and
              Instagram.
            </li>
          </ul>
        </div>

        {/* Section: Live Support and Announcements */}
        <div>
          <h2 className="text-xl font-semibold mb-2">
            Live Support and Announcements
          </h2>
          <p className="mb-4">
            While we don’t host live webinars yet, we regularly post visual
            explainers and short demo videos on our social pages. These can
            guide you through setting up your first trade, understanding
            reviews, and customizing your profile.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> Are there tutorials available?
              <br />
              <strong>A:</strong> Yes, we share them through our socials.
            </li>
            <li>
              <strong>Q:</strong> What if I still need help?
              <br />
              <strong>A:</strong> You can message us through the Help Center or
              reach out via our social channels.
            </li>
          </ul>
        </div>
      </div>
    </HelpLayout>
  );
}
