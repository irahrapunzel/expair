"use client";

import React from "react";
import HelpLayout from "../../components/help/helplayout";

export default function ProductInfoUsagePage() {
  return (
    <HelpLayout>
      <div className="space-y-10 pb-[116px]">
        {/* Title */}
        <h1 className="text-[31px] font-[700] mb-[20px] flex items-center gap-2">
          <img src="/assets/icons/product.png" alt="Icon" className="w-[32px] h-[32px]" />
           Product Information and Usage</h1>

        {/* Section: Understanding Skill Matching */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Understanding Skill Matching</h2>
          <p className="mb-4">
            Our platform uses your skills, needs, and location to match you with the most relevant users. This ensures fair and meaningful exchanges.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> How are trade partners matched?<br />
              <strong>A:</strong> Through AI, based on skill needs and proximity.
            </li>
            <li>
              <strong>Q:</strong> Can I opt out of matching?<br />
              <strong>A:</strong> You may disable auto-match from your preferences.
            </li>
          </ul>
        </div>

        {/* Section: Using New Features */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Using New Features</h2>
          <p className="mb-4">
            When new features are launched on Expair, a walkthrough or video tutorial is typically made available in our Notion page. You can also find detailed documentation in the “Features” section under “Product Updates.”
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> Where do I learn about new tools?<br />
              <strong>A:</strong> Visit the “Features” section on our Notion one-pager.
            </li>
            <li>
              <strong>Q:</strong> Are there tutorials for new updates?<br />
              <strong>A:</strong> Yes, video tutorials are uploaded for major updates.
            </li>
          </ul>
        </div>

        {/* Section: System Requirements */}
        <div>
          <h2 className="text-xl font-semibold mb-2">System Requirements</h2>
          <p className="mb-4">
            For the best experience, Expair runs on Windows 10 or later, macOS 10.15+, and at least 4GB RAM. For mobile, iOS 13+ and Android 8+ are supported.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> Can I run Expair on older devices?<br />
              <strong>A:</strong> Some features may not work properly on outdated systems.
            </li>
            <li>
              <strong>Q:</strong> Do I need a strong internet connection?<br />
              <strong>A:</strong> Yes, a stable connection ensures smoother performance.
            </li>
          </ul>
        </div>

        {/* Section: Profile Customization */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Profile Customization</h2>
          <p className="mb-4">
            You can customize your workspace layout and preferences. Change themes, adjust notification settings, and set your personal skill tags under Settings &gt; Preferences.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> Can I change how my workspace looks?<br />
              <strong>A:</strong> Yes, head to the Setting tab under Preferences.
            </li>
            <li>
              <strong>Q:</strong> Where can I update my skills list?<br />
              <strong>A:</strong> Go to your profile and edit your skill inventory.
            </li>
          </ul>
        </div>

        {/* Section: Mobile and Desktop Experience */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Mobile and Desktop Experience</h2>
          <p className="mb-4">
            The web and mobile versions of Expair are optimized for different uses. While all features are accessible from both, the layout and workflow are adapted for convenience.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> Can I use Expair on both mobile and desktop?<br />
              <strong>A:</strong> Yes, both versions are synced across devices.
            </li>
            <li>
              <strong>Q:</strong> Are mobile features limited?<br />
              <strong>A:</strong> Some advanced tools are desktop-exclusive.
            </li>
          </ul>
        </div>
      </div>
    </HelpLayout>
  );
}
