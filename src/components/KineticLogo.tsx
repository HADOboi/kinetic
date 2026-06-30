import React from "react";

interface KineticLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "vertical" | "horizontal";
  className?: string;
}

export function KineticLogoMark({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="18" y="15" width="14" height="70" rx="7" fill="currentColor" />
      <path
        d="M40 48L76 16C79 13 84 15 84 20V34C84 37 82 40 80 42L58 60L81 83C83 85 84 88 84 91V93C84 98 79 101 75 98L40 57"
        fill="currentColor"
      />
    </svg>
  );
}

export default function KineticLogo({
  size = "md",
  variant = "vertical",
  className = "",
}: KineticLogoProps) {
  let markSize = "w-6 h-6";
  let textSize = "text-lg";
  let tracking = "tracking-[0.15em]";
  let gap = "gap-2";

  if (size === "sm") {
    markSize = "w-5 h-5";
    textSize = "text-sm";
    tracking = "tracking-[0.12em]";
    gap = "gap-1.5";
  } else if (size === "md") {
    markSize = "w-7 h-7";
    textSize = "text-xl";
    tracking = "tracking-[0.18em]";
    gap = "gap-2.5";
  } else if (size === "lg") {
    markSize = "w-14 h-14";
    textSize = "text-4xl";
    tracking = "tracking-[0.25em]";
    gap = "gap-4";
  } else if (size === "xl") {
    markSize = "w-20 h-20";
    textSize = "text-5xl";
    tracking = "tracking-[0.3em]";
    gap = "gap-5";
  }

  // Consistent single-color brand mark and text styling
  const logoColorClass = "text-indigo-500";

  if (variant === "horizontal") {
    return (
      <div className={`flex items-center ${gap} ${logoColorClass} ${className} select-none font-sans`}>
        <KineticLogoMark className={`${markSize}`} />
        <span className={`font-black uppercase ${textSize} ${tracking} text-white`}>
          Kinetic
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${gap} ${logoColorClass} ${className} select-none font-sans`}>
      <KineticLogoMark className={`${markSize}`} />
      <div className="flex flex-col items-center">
        <span className={`font-black uppercase ${textSize} ${tracking} text-white`}>
          Kinetic
        </span>
        {size === "lg" && (
          <p className="text-[10px] text-[#646473] font-mono uppercase tracking-[0.2em] mt-2">
            Strength Intelligence
          </p>
        )}
      </div>
    </div>
  );
}
