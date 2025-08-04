"use client";

import dynamic from 'next/dynamic';

const DynamicMapWithNoSSR = dynamic(
  () => import('./dynamic-map'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#120A2A] rounded-[30px]">
        <div className="text-white">Loading map...</div>
      </div>
    )
  }
);

export default function MapWrapper(props) {
  return (
    <DynamicMapWithNoSSR {...props} />
  );
}
