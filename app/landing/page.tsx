'use client'

import Image from 'next/image'
import { Button } from '../../components/ui/button'

export default function LandingPage() {
  return (
    <section className="min-h-screen flex flex-col justify-between bg-black text-white">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 bg-black">
        {/* Already created by teammate, assumed imported globally */}
      </header>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center px-6 py-20 md:py-32">
        <div className="relative w-full max-w-md md:max-w-3xl aspect-[3/2]">
          <Image
            src="/bg_landing.png"
            alt="Landing background"
            fill
            className="object-contain"
            priority
          />
        </div>

        <h1 className="text-[32px] md:text-[49px] font-bold mt-12">Start pairing now.</h1>

        <p className="text-[14px] md:text-[16px] max-w-xl mt-4 md:mt-6 leading-relaxed text-purple-400">
          Change the way you obtain skills and services. <br />
          Meet people who need what you have, and have what you don’t.
        </p>

        <Button variant="default" size="default" className="mt-8 md:mt-10 text-white bg-[#0038FF] hover:bg-blue-700 px-6 py-3 rounded-md text-sm md:text-base">
          Get Started
        </Button>
      </div>
    </section>
  )
}