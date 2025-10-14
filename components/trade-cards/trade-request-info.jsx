"use client";

export default function TradeRequestInfo({ requested, exchange }) {
  return (
    <div className="px-8 py-6 bg-[#0A0519] rounded-[20px] mb-[15px]">
      <div className="flex flex-wrap items-start gap-8">
        {/* You're requesting */}
        <div className="flex flex-col gap-2 flex-1 min-w-[45%] items-start">
          <span className="text-[18px] text-white/80 font-medium">You're requesting</span>
          <div
            className="inline-block px-[15px] py-[7px] rounded-[15px] border-[2px] border-[#906EFF] bg-[#906EFF33] text-[15px] text-white/90 max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap"
            title={requested}
          >
            {requested}
          </div>
        </div>

        {/* In exchange, you'll provide */}
        <div className="flex flex-col gap-2 flex-1 min-w-[45%] items-end">
          <span className="text-[18px] text-white/80 font-medium">In exchange, you'll provide</span>
          <div
            className="inline-block px-[15px] py-[7px] rounded-[15px] border-[2px] border-[#0038FF] bg-[#0038FF33] text-[15px] text-white/90 max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap text-right"
            title={exchange}
          >
            {exchange}
          </div>
        </div>
      </div>
    </div>
  );
}
