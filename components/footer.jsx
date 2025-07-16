'use client';

import { Icon } from '@iconify/react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-[#0B0521] text-white px-6 md:px-10 py-10 rounded-t-3xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-10 md:gap-0">
        {/* Left Side */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <img src="/expair.png" alt="Expair Logo" className="w-[150px] h-[46px]" />
          </div>

          <ul className="space-y-2 text-sm text-gray-300">
            <li><Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:underline">Terms and Conditions</Link></li>
            <li><Link href="/about" className="hover:underline">About Us</Link></li>
          </ul>
        </div>

        {/* Right Side (Help/Sign In) */}
        <div className="flex flex-col items-start md:items-end justify-start text-sm gap-2 text-gray-300">
          <p>Help</p>
          <Link href="/signin" className="text-white font-semibold hover:underline">Sign in</Link>
        </div>
      </div>

      {/* Socials */}
      <div className="mt-10 text-center">
        <p className="text-sm text-white mb-3">Follow us!</p>
        <div className="flex justify-center gap-6 text-white">
          <a href="mailto:hello@expair.com" className="hover:text-purple-300 transition" aria-label="Email">
            <Icon icon="mdi:email-outline" width="24" />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-purple-300 transition" aria-label="LinkedIn">
            <Icon icon="mdi:linkedin" width="24" />
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-purple-300 transition" aria-label="Facebook">
            <Icon icon="mdi:facebook" width="24" />
          </a>
        </div>
      </div>

      {/* Copyright */}
      <div className="mt-8 text-xs text-gray-400 text-center px-2">
        <p>© 2025 Expair. All rights reserved.</p>
        <p className="mt-1 max-w-2xl mx-auto">
          The content, design, and functionality of this website are the intellectual property of Expair and may not be copied, reproduced, or distributed without prior written permission. All trademarks, logos, and brand names are the property of their respective owners. Unauthorized use is strictly prohibited.
        </p>
      </div>
    </footer>
  );
}
