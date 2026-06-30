import React from "react";
import { Map, BarChart3 } from "lucide-react";

interface BottomNavProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export default function BottomNav({ currentPath, onNavigate }: BottomNavProps) {
  const activePath = currentPath || window.location.pathname;
  const activePathClean = activePath.split("?")[0].split("#")[0];
  const handleNav = onNavigate || ((path: string) => {
    try {
      window.history.pushState(null, "", path);
    } catch (e) {
      console.warn("History pushState blocked by iframe sandbox:", e);
    }
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-md border-x border-[#1A1A26] h-16 bg-[#040406]/95 backdrop-blur-sm border-t border-[#1A1A26] z-50 flex md:hidden items-center justify-around select-none">
      {/* ROADMAP BUTTON */}
      <button
        onClick={() => handleNav("/roadmap")}
        className="flex-1 h-full flex flex-col items-center justify-center gap-1 transition-colors duration-200 cursor-pointer"
      >
        <Map
          size={20}
          className={
            activePathClean === "/roadmap"
              ? "text-[#6366F1] glow-indigo"
              : "text-[#646473] hover:text-[#A3A3B3]"
          }
        />
        <span
          className={`text-xs font-medium tracking-wide ${
            activePathClean === "/roadmap" ? "text-[#6366F1] font-semibold" : "text-[#646473]"
          }`}
        >
          Roadmap
        </span>
      </button>

      {/* DASHBOARD BUTTON */}
      <button
        onClick={() => handleNav("/dashboard")}
        className="flex-1 h-full flex flex-col items-center justify-center gap-1 transition-colors duration-200 cursor-pointer"
      >
        <BarChart3
          size={20}
          className={
            activePathClean === "/dashboard"
              ? "text-[#6366F1] glow-indigo"
              : "text-[#646473] hover:text-[#A3A3B3]"
          }
        />
        <span
          className={`text-xs font-medium tracking-wide ${
            activePathClean === "/dashboard" ? "text-[#6366F1] font-semibold" : "text-[#646473]"
          }`}
        >
          Dashboard
        </span>
      </button>
    </nav>
  );
}
