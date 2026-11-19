import React from "react";

interface BideanLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function BideanLogo({ size = "md", className = "" }: BideanLogoProps) {
  const dims =
    size === "sm"
      ? "w-8 h-8"
      : size === "lg"
      ? "w-14 h-14"
      : "w-10 h-10";

  return (
    <div
      className={`${dims} rounded-xl bg-gradient-to-br from-[#144B5E] via-[#103C4C] to-[#0B2A36] text-white flex items-center justify-center border border-sea/25 shadow-2xs shrink-0 ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[68%] h-[68%]"
      >
        <line x1="4.5" y1="26.5" x2="27.5" y2="26.5" stroke="#F7F5F0" strokeOpacity="0.25" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="6" y="18" width="4.8" height="7.5" rx="1.2" fill="#F7F5F0" fillOpacity="0.4" />
        <rect x="13.6" y="13.5" width="4.8" height="12" rx="1.2" fill="#F7F5F0" fillOpacity="0.75" />
        <rect x="21.2" y="8" width="4.8" height="17.5" rx="1.2" fill="#34D399" />
        <path
          d="M7.8 14.5C12.2 12.2 17 8.5 23.6 5.2"
          stroke="#F7F5F0"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="23.6" cy="5.2" r="2" fill="#F7F5F0" />
      </svg>
    </div>
  );
}
