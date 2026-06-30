"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { KineticProfile } from "../../core/types";
import { useStreakEngine } from "../../hooks/useStreakEngine";
import { Map, BarChart3, Flame, Snowflake, Shield, User, Sparkles, LogOut } from "lucide-react";
import KineticLogo from "../KineticLogo";

interface AppShellProps {
  children: React.ReactNode;
  profile?: KineticProfile | null;
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export default function AppShell({ 
  children, 
  profile: propProfile,
  currentPath: propPath,
  onNavigate
}: AppShellProps) {
  const { profile: contextProfile, signOut } = useAuth();
  const profile = propProfile !== undefined ? propProfile : contextProfile;

  const [currentPath, setCurrentPath] = useState(propPath || typeof window !== "undefined" ? window.location.pathname : "/roadmap");

  useEffect(() => {
    if (propPath) {
      setCurrentPath(propPath);
      return;
    }
    const onPopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [propPath]);

  const handleNav = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
      return;
    }
    try {
      window.history.pushState(null, "", path);
    } catch (e) {
      console.warn("History pushState blocked by iframe sandbox:", e);
    }
    window.dispatchEvent(new PopStateEvent("popstate"));
    setCurrentPath(path);
  };

  const { getFireState } = useStreakEngine();
  const streakCount = profile?.currentStreak ?? 0;
  const fireState = profile ? getFireState(profile) : "greyed";
  const bronzeCount = profile?.shields?.bronze ?? 0;
  const silverCount = profile?.shields?.silver ?? 0;
  const goldenUnlocked = profile?.shields?.goldenUnlocked ?? false;

  const pushLevel = profile?.progressionLevels?.push?.level ?? 1;
  const pullLevel = profile?.progressionLevels?.pull?.level ?? 1;
  const legsLevel = profile?.progressionLevels?.legs_core?.level ?? 1;

  const phaseLabel =
    profile?.currentPhase === "conditioning" ? "Conditioning" :
    profile?.currentPhase === "calibration" ? "Calibration" :
    profile?.currentPhase === "infinite_overload" ? "Infinite Overload" :
    "Conditioning";

  const phaseColor =
    profile?.currentPhase === "conditioning" ? "text-sky-400 bg-sky-500/10 border-sky-500/20" :
    profile?.currentPhase === "calibration" ? "text-amber-500 bg-amber-500/10 border-amber-500/20" :
    "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";

  const activePathClean = currentPath.split("?")[0].split("#")[0];

  return (
    <div className="min-h-screen bg-[#040406] flex text-white font-sans antialiased">
      {/* ─── DESKTOP SIDEBAR NAVIGATION (hidden on mobile) ─── */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#1A1A26] bg-[#0C0C12]/50 backdrop-blur-md sticky top-0 h-screen select-none text-left p-6 z-40 justify-between sidebar-short-shrink">
        <div className="flex flex-col gap-8 sidebar-content-container">
          {/* Brand Logo & Tagline */}
          <div className="sidebar-logo-container relative">
            <KineticLogo size="md" variant="horizontal" />
            <p className="text-[10px] text-text-tertiary font-mono uppercase tracking-[0.2em] mt-1.5 ml-9">
              Strength Intelligence
            </p>
          </div>

          {/* User Profile Summary */}
          <div className="bg-[#11111A] border border-[#1A1A26] rounded-2xl p-4 flex flex-col gap-3 sidebar-profile-card">
            <div className="flex items-center gap-3">
              {profile?.photoURL ? (
                <div className="relative">
                  <img
                    src={profile.photoURL}
                    alt="User avatar"
                    referrerPolicy="no-referrer"
                    className={`w-9 h-9 rounded-full object-cover border ${goldenUnlocked ? "border-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.3)]" : "border-[#1A1A26]"}`}
                  />
                  {goldenUnlocked && (
                    <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#040406]">
                      ★
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#040406] border border-[#1A1A26] flex items-center justify-center">
                  <User size={16} className="text-[#A3A3B3]" />
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {profile?.displayName || "Athlete"}
                </p>
                <p className="text-[10px] text-[#646473] truncate mt-0.5 font-mono">
                  ATHLETE
                </p>
              </div>
            </div>

            {/* Training Phase Badge */}
            <div className={`text-[10px] font-black uppercase tracking-wider border px-2.5 py-1.5 rounded-xl text-center sidebar-phase-badge ${phaseColor}`}>
              {phaseLabel}
            </div>
          </div>

          {/* Sidebar Menu Items */}
          <div className="flex flex-col gap-1.5 sidebar-nav-list">
            {[
              { path: "/roadmap", label: "Roadmap", icon: Map },
              { path: "/dashboard", label: "Dashboard", icon: BarChart3 }
            ].map((item) => {
              const isActive = activePathClean === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={`
                    w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer text-left select-none relative group sidebar-nav-btn
                    ${isActive 
                      ? "bg-[#1C1A2E] text-white border-l-4 border-indigo-500 font-bold" 
                      : "text-text-secondary hover:text-white hover:bg-[#11111A]/60"
                    }
                  `}
                >
                  <Icon size={18} className={isActive ? "text-[#6366F1] glow-indigo" : "text-[#646473] group-hover:text-white transition-colors"} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute right-4 w-1.5 h-1.5 bg-indigo-400 rounded-full glow-indigo animate-ping" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Daily Streak & Shields Card */}
          <div className={`border rounded-2xl p-4 flex flex-col gap-3.5 sidebar-streak-card relative overflow-hidden transition-all duration-300
            ${fireState === "lit" ? "bg-[#1C120C]/30 border-[#E97E24]/25 shadow-[0_0_15px_rgba(233,126,36,0.05)]" : ""}
            ${fireState === "freeze" ? "bg-[#0C161F]/30 border-[#38BDF8]/25 shadow-[0_0_15px_rgba(56,189,248,0.05)]" : ""}
            ${fireState === "greyed" || fireState === "none" ? "bg-[#0C0C12] border-[#1A1A26]" : ""}
          `}>
            {fireState === "lit" && (
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#E97E24]/5 rounded-full blur-2xl pointer-events-none -mr-4 -mt-4" />
            )}
            {fireState === "freeze" && (
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#38BDF8]/5 rounded-full blur-2xl pointer-events-none -mr-4 -mt-4" />
            )}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300
                ${fireState === "lit" ? "bg-[#E97E24]/10 border border-[#E97E24]/20 shadow-[0_0_12px_rgba(233,126,36,0.15)]" : ""}
                ${fireState === "freeze" ? "bg-[#38BDF8]/10 border border-[#38BDF8]/20 shadow-[0_0_12px_rgba(56,189,248,0.15)]" : ""}
                ${fireState === "greyed" || fireState === "none" ? "bg-neutral-800/10 border border-neutral-700/20" : ""}
              `}>
                {fireState === "freeze" ? (
                  <Flame size={20} className="text-[#38BDF8] fill-[#38BDF8] opacity-90 animate-pulse" />
                ) : (
                  <Flame 
                    size={20} 
                    className={`transition-colors duration-500
                      ${fireState === "lit" ? "text-[#FF5A00] fill-[#FF5A00] animate-pulse" : "text-[#646473] fill-none opacity-35"}
                    `} 
                  />
                )}
              </div>
              <div>
                <p className="text-[10px] text-[#A3A3B3] font-mono uppercase tracking-[0.15em] font-bold">CURRENT STREAK</p>
                <p className={`text-xl font-black font-mono leading-none mt-1 transition-colors duration-500
                  ${fireState === "lit" ? "text-[#FFA057]" : ""}
                  ${fireState === "freeze" ? "text-[#38BDF8]" : ""}
                  ${fireState === "greyed" || fireState === "none" ? "text-[#646473]" : ""}
                `}>
                  {streakCount} {streakCount === 1 ? "DAY" : "DAYS"}
                </p>
              </div>
            </div>

            <div className="border-t border-[#1A1A26] pt-3 flex flex-col gap-2">
              <span className="text-[9px] text-[#646473] font-mono uppercase tracking-wider">SHIELDS BANK</span>
              <div className="flex gap-2 items-center">
                <div className="flex-1 bg-[#11111A] border border-[#1A1A26] rounded-xl px-2.5 py-1.5 flex justify-between items-center">
                  <span className="text-[9px] text-amber-500 font-mono font-black">BRONZE</span>
                  <span className="text-xs font-bold text-white font-mono">{bronzeCount}</span>
                </div>
                <div className="flex-1 bg-[#11111A] border border-[#1A1A26] rounded-xl px-2.5 py-1.5 flex justify-between items-center">
                  <span className="text-[9px] text-slate-300 font-mono font-black">SILVER</span>
                  <span className="text-xs font-bold text-white font-mono">{silverCount}</span>
                </div>
                {goldenUnlocked && (
                  <div className="flex-shrink-0 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-2 py-1.5 flex items-center justify-center">
                    <span className="text-xs text-yellow-400 font-bold">★</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions & Simplified Metrics */}
        <div className="flex flex-col gap-4 border-t border-[#1A1A26] pt-4 sidebar-footer">
          {/* Subtle Workload indicator - De-emphasized as it is already on the dashboard */}
          <div className="flex items-center justify-between text-[9px] text-[#4E4E5A] font-mono uppercase tracking-widest px-1 font-bold">
            <span>PUSH: LV.{pushLevel}</span>
            <span>PULL: LV.{pullLevel}</span>
            <span>LEGS: LV.{legsLevel}</span>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={() => signOut()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 text-red-400 text-xs font-bold transition-all duration-200 cursor-pointer select-none text-center"
            >
              <LogOut size={12} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ─── MAIN WORKSPACE (Adapts to desktop screen size) ─── */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden">
        {/* On Mobile: Center-column simulator width. On PC: Fluid wide layout! */}
        <div className="w-full flex-1 flex flex-col md:max-w-5xl md:mx-auto md:px-8 py-0">
          <div className="w-full max-w-md mx-auto md:max-w-none flex-1 flex flex-col relative">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
