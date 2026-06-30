import React from "react";
import { Flame, Snowflake, User as UserIcon, LogOut } from "lucide-react";
import KineticLogo from "../KineticLogo";
import { FireState } from "../../core/types";
import EternalAura from "../animations/EternalAura";
import { useAuth } from "../../context/AuthContext";

interface HeaderProps {
  dailyState: string;      // e.g. "Push" | "Pull" | "Legs + Core" | "Rest"
  currentLevel?: number;   // e.g. 1
  streakCount: number;
  fireState: FireState;
  userPhotoURL?: string;
  hasEternalAura?: boolean;
}

export default function Header({
  dailyState,
  currentLevel,
  streakCount,
  fireState,
  userPhotoURL,
  hasEternalAura = false,
}: HeaderProps) {
  const { signOut } = useAuth();
  
  // Left label text: e.g. "Push · Lv.1" or "Rest"
  const formattedDailyState = dailyState === "Legs + Core" ? "L + C" : dailyState;
  const labelText = formattedDailyState.toLowerCase() === "rest"
    ? "Rest"
    : `${formattedDailyState}${currentLevel !== undefined ? ` · Lv.${currentLevel}` : ""}`;

  return (
    <header className="fixed top-0 left-0 right-0 mx-auto w-full max-w-md border-x border-[#1A1A26] h-14 bg-[#040406]/95 backdrop-blur-sm border-b border-[#1A1A26] z-50 px-4 flex md:hidden items-center justify-between select-none">
      {/* LEFT: Avatar + Status */}
      <div className="flex items-center gap-3">
        {userPhotoURL ? (
          <img
            src={userPhotoURL}
            alt="User avatar"
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover border border-[#1A1A26]"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#0C0C12] border border-[#1A1A26] flex items-center justify-center">
            <UserIcon size={14} className="text-[#A3A3B3]" />
          </div>
        )}
        <span className="text-xs font-semibold text-[#A3A3B3] tracking-wide">
          {labelText}
        </span>
      </div>

      {/* CENTER: Logo (Text-Only on Mobile to save space) */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <span className="font-sans font-black uppercase text-sm tracking-[0.15em] text-white select-none">
          Kinetic
        </span>
      </div>

      {/* RIGHT: Streak Pill & Sign Out */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center">
          {hasEternalAura && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none scale-110">
              <EternalAura hasOrbital={streakCount >= 730} />
            </div>
          )}
          {fireState !== "none" && (
            <div
              className={`
                relative flex items-center gap-1.5 bg-[#0C0C12] border border-[#1A1A26] rounded-full px-3 py-1 text-sm font-bold transition-all duration-300 z-10
                ${hasEternalAura ? "shadow-[0_0_12px_rgba(79,70,229,0.5)]" : ""}
              `}
            >
              {fireState === "lit" && (
                <Flame size={16} className="text-[#FF5A00] fill-[#FF5A00] glow-fire" />
              )}
              {fireState === "freeze" && (
                <Flame size={16} className="text-[#38BDF8] fill-[#38BDF8] opacity-90 drop-shadow-[0_0_8px_rgba(56,189,248,0.75)]" />
              )}
              {fireState === "greyed" && (
                <Flame size={16} className="text-[#646473] opacity-30" />
              )}
              <span
                className={`
                  ${fireState === "lit" ? "text-white" : ""}
                  ${fireState === "freeze" ? "text-[#38BDF8]" : ""}
                  ${fireState === "greyed" ? "text-[#646473]" : ""}
                `}
              >
                {streakCount}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => signOut()}
          title="Sign Out"
          className="w-8 h-8 rounded-full bg-[#0C0C12] border border-[#1A1A26] flex items-center justify-center text-[#A3A3B3] hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer select-none"
        >
          <LogOut size={13} />
        </button>
      </div>
    </header>
  );
}
