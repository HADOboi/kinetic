"use client";
import React from "react";
import { motion } from "framer-motion";
import { Compass, ArrowLeft, Home, BarChart3 } from "lucide-react";
import KineticLogo from "../KineticLogo";

interface NotFoundViewProps {
  onNavigate?: (path: string) => void;
}

export default function NotFoundView({ onNavigate }: NotFoundViewProps) {
  const handleGo = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
      return;
    }
    try {
      window.history.pushState(null, "", path);
    } catch (e) {
      console.warn("PushState error:", e);
    }
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-[#0C0C12] border border-[#1A1A26] rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden"
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mt-16" />

        <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Compass size={32} className="animate-spin-slow" />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-widest">
            404 // VECTOR OFFLINE
          </span>
          <h1 className="text-2xl font-black font-display text-white tracking-tight">
            Trajectory Not Found
          </h1>
          <p className="text-xs text-[#A3A3B3] leading-relaxed max-w-xs mx-auto">
            This training sector is unmapped or has been recalibrated into a different progression track.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
          <button
            onClick={() => handleGo("/roadmap")}
            className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg cursor-pointer"
          >
            <Home size={14} />
            <span>Return to Roadmap</span>
          </button>

          <button
            onClick={() => handleGo("/dashboard")}
            className="flex-1 py-3 px-4 rounded-xl bg-[#14141E] hover:bg-[#1C1A2E] border border-[#2D2D3F] text-[#E4E4E7] font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <BarChart3 size={14} />
            <span>Performance Hub</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
