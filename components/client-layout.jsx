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

  // Pages na walang navbar at footer
  const isAuthPage =
    pathname.startsWith('/signin') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/verify-code') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/register');

  // Landing pages (landing home + landing help)
  const isLanding =
    pathname === '/' ||
    pathname === '/landing' ||
    // Landing help lang; exclude /home/help
    (pathname.startsWith('/help') && !pathname.startsWith('/home/help'));

  // Signed-in pages (/home/**)
  const isHome = pathname.startsWith('/home');

  return (
    <QueryClientProvider client={queryClient}>
      {/* Navbar */}
      {!isAuthPage && !isHome && (isLanding ? <LandingNav /> : <Navbar />)}

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
