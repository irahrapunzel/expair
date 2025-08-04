import { Button } from "../ui/button";
import Link from "next/link";

export function HelpCategoryCard({ title, desc, iconSrc, className, href }) {
  return (
    <div
      className={
        "relative flex flex-col items-center text-center rounded-[20px] border-[3px] border-[#284ccccc] shadow-[0_5px_40px_0_rgba(40,76,204,0.2)] " +
        className
      }
      style={{
        padding: "25px",
        background:
          "radial-gradient(277.39% 141.42% at 100% 0%, #3D2490 0%, #120A2A 69.23%)",
      }}
    >
      <img
        src={iconSrc}
        alt={title}
        className="w-10 h-10 mb-[11px] object-contain"
      />

      <h2
        className="text-white mb-[11px]"
        style={{
          fontSize: "20px",
          fontWeight: "600",
        }}
      >
        {title}
      </h2>

      <p
        className="mb-[25px] px-2"
        style={{
          color: "rgba(255, 255, 255, 0.60)",
          fontSize: "13px",
          fontStyle: 'normal',
        }}
      >
        {desc}
      </p>

      {/* Button */}
      <div className="absolute bottom-[25px]">
        <Link href={href}>
          <Button className="font-normal w-[120px] h-[30px] px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] text-white text-sm sm:text-[16px] hover:bg-[#1a4dff] transition rounded-[10px]">
            View
          </Button>
        </Link>
      </div>
    </div>
  );
}
