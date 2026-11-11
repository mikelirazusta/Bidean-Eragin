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
      className={`${dims} rounded-xl bg-sea text-white flex items-center justify-center border border-sea/20 shrink-0 ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[62%] h-[62%]"
      >
        <rect x="4" y="18" width="5" height="9" rx="1.5" fill="currentColor" fillOpacity="0.45" />
        <rect x="12.5" y="12" width="5" height="15" rx="1.5" fill="currentColor" fillOpacity="0.78" />
        <rect x="21" y="5" width="5" height="22" rx="1.5" fill="#6EE7B7" />
        <path
          d="M6.5 14L15 8.5L23.5 3.5"
          stroke="#FFFFFF"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
