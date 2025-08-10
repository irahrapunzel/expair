'use client';

import { usePathname } from 'next/navigation';
import Navbar from './navbar';
import LandingNav from './landingnav';
import Footer from './footer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isAuthPage =
    pathname.startsWith('/signin') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/verify-code') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/register');

  const isLanding =
    pathname === '/' ||
    pathname === '/landing' ||
    (pathname.startsWith('/help') && !pathname.startsWith('/home/help')) ||
    pathname.startsWith('/privacy-policy') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/about');

  const isHome = pathname.startsWith('/home');

  // Bagong condition para hindi magpakita ang footer sa request at messages page
  const hideFooterPages =
    pathname.startsWith('/home/request') ||
    pathname.startsWith('/home/messages');

  return (
    <QueryClientProvider client={queryClient}>
      {!isAuthPage && !isHome && (isLanding ? <LandingNav /> : <Navbar />)}

      <main className="flex-grow">{children}</main>

      {!isAuthPage && !hideFooterPages && (
        <div className="bg-[#050015]">
          <Footer />
        </div>
      )}
    </QueryClientProvider>
  );
}
