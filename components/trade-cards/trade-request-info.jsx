"use client";

export default function TradeRequestInfo({ requested, exchange }) {
  return (
    <div className="px-8 py-6 bg-[#0A0519] rounded-[20px] mb-[15px]">
      <div className="flex flex-wrap justify-between items-start gap-8">
        {/* You're requesting */}
        <div className="flex flex-col flex-1 min-w-[200px]">
          <span className="text-[18px] text-white mb-2">You're requesting</span>
          <div
            className="inline-block px-[15px] py-[8px] rounded-[15px] border-[2px] border-[#906EFF] bg-[#906EFF33] text-[15px] text-white max-w-full sm:max-w-[300px] truncate cursor-default transition-all hover:scale-[1.02]"
            title={requested}
          >
            {requested}
          </div>
        </div>

        {/* In exchange, you'll provide */}
        <div className="flex flex-col flex-1 min-w-[200px] items-end text-right">
          <span className="text-[18px] text-white mb-2">
            In exchange, you'll provide
          </span>
          <div
            className="inline-block px-[15px] py-[8px] rounded-[15px] border-[2px] border-[#5A5AFF] bg-[#5A5AFF33] text-[15px] text-white max-w-full sm:max-w-[300px] truncate cursor-default transition-all hover:scale-[1.02] text-right"
            title={exchange}
          >
            {exchange}
          </div>
        </div>
      </div>
    </div>
  );
}
