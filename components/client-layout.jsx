'use client';

import { usePathname } from 'next/navigation';
import Navbar from './navbar';
import LandingNav from './landingnav';
import Footer from './footer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const [queryClient] = useState(() => new QueryClient());

  // no navbar and footer
  const isAuthPage =
    pathname.startsWith('/signin') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/verify-code') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/register');

  // w landingNav and Footer
  const isLanding =
    pathname === '/' ||
    pathname === '/landing' ||
    pathname.startsWith('/help');

  return (
    <QueryClientProvider client={queryClient}>
      {/* Navbar */}
      {!isAuthPage && (isLanding ? <LandingNav /> : <Navbar />)}

      {/* Content */}
      <main className="flex-grow">{children}</main>

      {/* Footer */}
      {!isAuthPage && (
        <div className="bg-[#050015]">
          <Footer />
        </div>
      )}
    </QueryClientProvider>
  );
}
