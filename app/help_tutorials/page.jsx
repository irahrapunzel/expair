"use client";

import React from "react";
import HelpLayout from "../../components/help/helplayout";

export default function GettingStartedTutorialsPage() {
  return (
    <HelpLayout>
      <div className="space-y-10 pb-[116px]">
        {/* Title */}
        <h1 className="text-[31px] font-[700] mb-[20px]">🚀 Getting Started & Tutorials</h1>

        {/* Section: Getting Started with Expair */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Getting Started with Expair</h2>
          <p className="mb-4">
            To begin using Expair, log in and click the “New Request” button on your dashboard. From there, you can post what skills or services you’re looking for and view your matches. The system will help connect you with nearby users who can trade with you fairly based on shared availability and needs.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> How do I start a skill trade?<br />
              <strong>A:</strong> Click “New Request” on the dashboard and enter the skills you’re looking for and can offer.
            </li>
            <li>
              <strong>Q:</strong> Can I edit my request after posting?<br />
              <strong>A:</strong> Yes, you can go back and modify your request at any time.
            </li>
          </ul>
        </div>

        {/* Section: Where to Find User Guides */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Where to Find User Guides</h2>
          <p className="mb-4">
            Expair doesn’t have built-in tutorial tabs in-app, but we publish helpful resources and user guides on our official Notion workspace. These step-by-step guides walk you through the platform's key features, including how to set up your profile, post trade requests, and use safety tools. You can access this Notion page through our Help Center or social media bios.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> Is there a place where I can read more about how Expair works?<br />
              <strong>A:</strong> Yes! Visit our official Notion page for user guides.
            </li>
            <li>
              <strong>Q:</strong> Where do I find the Notion link?<br />
              <strong>A:</strong> It’s linked in the Help Center and our social media profiles.
            </li>
          </ul>
        </div>

        {/* Section: Community Help on Reddit and Socials */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Community Help on Reddit and Socials</h2>
          <p className="mb-4">
            For real-life tips and community feedback, check out our Reddit thread, where users share experiences, tips, and workarounds. You can also find announcements, walkthroughs, and explainer posts on our official X (Twitter), Facebook, and Instagram accounts. These channels are great for staying up to date or asking quick questions.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> Where can I talk to other users?<br />
              <strong>A:</strong> Join the Expair subreddit to exchange tips with the community.
            </li>
            <li>
              <strong>Q:</strong> Do you post updates on social media?<br />
              <strong>A:</strong> Yes, follow us on X (Twitter), Facebook, and Instagram.
            </li>
          </ul>
        </div>

        {/* Section: Live Support and Announcements */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Live Support and Announcements</h2>
          <p className="mb-4">
            While we don’t host live webinars yet, we regularly post visual explainers and short demo videos on our social pages. These can guide you through setting up your first trade, understanding reviews, and customizing your profile.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> Are there video tutorials available?<br />
              <strong>A:</strong> Yes, we share them through our socials and Notion.
            </li>
            <li>
              <strong>Q:</strong> What if I still need help?<br />
              <strong>A:</strong> You can message us through the Help Center or reach out via our social channels.
            </li>
          </ul>
        </div>

        {/* Section: Workspace Personalization */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Workspace Personalization</h2>
          <p className="mb-4">
            Users can customize their experience by adjusting layout preferences, skill tags, and notification settings. While some advanced layout features are still in development, you can update your skill list and preferences at any time via the Settings page.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> How do I update my skills and trade preferences?<br />
              <strong>A:</strong> Go to Settings &gt; Skills and Preferences.
            </li>
            <li>
              <strong>Q:</strong> Can I personalize how my dashboard looks?<br />
              <strong>A:</strong> Basic customization options are available, and more are coming soon.
            </li>
          </ul>
        </div>
      </div>
    </HelpLayout>
  );
}
