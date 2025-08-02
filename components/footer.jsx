'use client';

import { Icon } from '@iconify/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function Footer() {
  const pathname = usePathname();

  return (
    <footer className={`${inter.className} w-full bg-[#120A2A] text-white pt-[39px] pb-[20px] px-[67px] rounded-t-[50px] shadow-[0px_-10px_4px_0px_rgba(0,0,0,0.25)]`}>
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between gap-10">

        {/* Left Section: Logo + Links */}
        <div>
          <div className="mb-6">
            <img src="/expair.png" alt="Expair Logo" className="w-[150px] h-[46px]" />
          </div>
          <ul className="space-y-2 text-[16px] leading-[120%] font-normal">
            <li>
              <Link
                href="/privacy-policy"
                className={`hover:underline ${
                  pathname === '/privacy-policy' ? 'text-white' : 'text-white/50'
                }`}
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className={`hover:underline ${
                  pathname === '/terms' ? 'text-white' : 'text-white/50'
                }`}
              >
                Terms and Conditions
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className={`hover:underline ${
                  pathname === '/about' ? 'text-white' : 'text-white/50'
                }`}
              >
                About Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Right Section: Help & Sign In */}
        <div className="flex flex-col items-start md:items-end text-sm gap-2">
          <Link
            href="/help"
            className="text-white text-[20px] leading-[120%] font-[500] hover:underline"
          >
            Help
          </Link>
          <Link
            href="/signin"
            className="text-white text-[20px] leading-[120%] font-[700] hover:underline"
            style={{
              textShadow: '0px 0px 15px #284CCC',
            }}
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* Social Links */}
      <div className="mt-10 text-center">
        <p className="text-white text-center text-[16px] leading-[120%] font-normal mb-3">Follow us!</p>
        <div className="flex justify-center gap-6">
          <a href="mailto:hello@expair.com" className="hover:text-purple-300 transition" aria-label="Email">
            <Icon icon="mdi:email-outline" width="30" />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-purple-300 transition" aria-label="LinkedIn">
            <Icon icon="mdi:linkedin" width="30" />
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-purple-300 transition" aria-label="Facebook">
            <Icon icon="mdi:facebook" width="30" />
          </a>
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="mt-8 text-[10px] leading-[12px] font-normal text-white text-center opacity-50 px-4 max-w-[845px] mx-auto">
        <p>© 2025 Expair. All rights reserved.</p>
        <p className="mt-1">
          The content, design, and functionality of this website are the intellectual property of Expair and may not be copied, reproduced, or distributed without prior written permission. All trademarks, logos, and brand names are the property of their respective owners. Unauthorized use is strictly prohibited.
        </p>
      </div>
    </footer>
  );
}
