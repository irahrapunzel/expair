'use client';

import Image from 'next/image';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function AboutPage() {
  return (
    <main className={`${inter.className} text-white overflow-x-hidden`}>
      {/* Hero Section */}
      <section className="relative w-full h-[767px] -mt-[50px]">
        <Image
          src="/assets/bg_about.png"
          alt="About Background"
          layout="fill"
          objectFit="cover"
          priority
        />

        {/* Plain Text Overlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center px-6 z-10">
          <h1 className="text-4xl font-bold mb-2">What’s Expair?</h1>
          <h5 className="text-lg italic mb-6">Pairing of expertise, made easy.</h5>
          <p className="text-sm text-white/90 max-w-[550px] mx-auto">
            Welcome to Expair — a community we built on the belief that growth happens best when we come together to share our unique skills and experiences.
          </p>
        </div>
      </section>

      {/* Wordpool Image with reduced gap */}
      <div className="w-full flex justify-center mt-[-135px]">
        <Image
          src="/assets/about_wordpool.png"
          alt="Wordpool Graphic"
          width={1075}
          height={542}
        />
      </div>

      {/* Mission & Vision Section */}
      <section className="relative mt-[100px] px-6 flex flex-col items-center gap-[50px]">
        {/* Centered Blue Glow Behind Section */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[300px] bg-[#0038FF] blur-[200px] z-0" />

        {/* Mission Container */}
        <div className="relative z-10 border-2 border-[#5A5AFF] bg-[#120A2A] shadow-[0_0_15px_#5A5AFF] p-[30px] rounded-[20px] w-full max-w-[940px]">
          <h3 className="text-2xl font-bold mb-4">The mission</h3>
          <p className="text-white/90 text-sm leading-relaxed">
            Expair is inspired by the “experience of pairing” and “pairing of expertise” — by bringing together people with different skills and expertise to create meaningful exchanges. It reflects our core mission: to foster the pairing of expertise, enabling an open and fair exchange and pair of skills that benefits everyone involved.
          </p>
        </div>

        {/* Vision Container */}
        <div className="relative z-10 border-2 border-[#906EFF] bg-[#1C0A2A] shadow-[0_0_15px_#906EFF] p-[30px] rounded-[20px] w-full max-w-[940px]">
          <h3 className="text-2xl font-bold mb-4">The vision</h3>
          <p className="text-white/90 text-sm leading-relaxed">
            At Expair, we envision a place where collaboration thrives, where individuals can learn from one another, and where fairness and mutual respect guide every interaction. Whether you’re seeking to develop new skills or offer your own talents, Expair is designed to connect you with like-minded people eager to grow together.
            <br /><br />
            Join us in building a vibrant community where knowledge is shared, connections are made, and everyone has the opportunity to contribute and benefit equally.
          </p>
        </div>
      </section>

      {/* Team Image */}
      <div className="w-full flex justify-center mt-[90px]">
        <Image
          src="/assets/about_team.png"
          alt="Team Graphic"
          width={1190}
          height={893}
        />
      </div>

      {/* Final CTA */}
      <div className="text-center mt-[65px] px-4 mb-[120px]">
        <h2 className="text-2xl font-bold leading-relaxed">
          Your skills can make a change.<br />
          Start pairing now.
        </h2>
      </div>
    </main>
  );
}
