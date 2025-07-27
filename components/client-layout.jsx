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

  const isLanding = pathname === '/' || pathname === '/landing';
  const isAuthPage =
    pathname.startsWith('/signin') || pathname.startsWith('/forgot-password') || pathname.startsWith('/verify-code') || pathname.startsWith('/reset-password');

  return (
    <QueryClientProvider client={queryClient}>
      {/* Layout only, not full <body> */}
      {!isAuthPage && (isLanding ? <LandingNav /> : <Navbar />)}

      <main className="flex-grow">{children}</main>

      {!isAuthPage && (
        <div className="bg-[#050015]">
          <Footer />
        </div>
      )}
    </QueryClientProvider>
  );
}
