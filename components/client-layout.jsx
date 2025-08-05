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
    // Render nothing (or a skeleton) until hydrated
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
    (pathname.startsWith('/help') && !pathname.startsWith('/home/help'));

  const isHome = pathname.startsWith('/home');

  return (
    <QueryClientProvider client={queryClient}>
      {!isAuthPage && !isHome && (isLanding ? <LandingNav /> : <Navbar />)}

      <main className="flex-grow">{children}</main>

      {!isAuthPage && (
        <div className="bg-[#050015]">
          <Footer />
        </div>
      )}
    </QueryClientProvider>
  );
}
