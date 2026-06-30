"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface RestTimerProps {
  durationSeconds?: number; // default 90
  onComplete: () => void;
  onSkip: () => void;
}

export default function RestTimer({ durationSeconds = 90, onComplete, onSkip }: RestTimerProps) {
  const [remaining, setRemaining] = useState(durationSeconds);

  useEffect(() => {
    if (remaining <= 0) {
      // Bell ting sound hook
      playSound("timer_bell");
      onComplete();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onComplete]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${mins}:${String(secs).padStart(2, "0")}`;
  const progress = 1 - remaining / durationSeconds;

  return (
    <div className="fixed inset-0 bg-[#040406]/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-xs bg-[#0C0C12] border border-[#1E1E2E] rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-5 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
      >
        <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-[0.2em] font-bold">RECOVERY PHASE</span>
        
        {/* Progress ring */}
        <div className="relative w-32 h-32 my-1">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#121218" strokeWidth="4.5" />
            <circle
              cx="40" cy="40" r="34"
              fill="none" stroke="#6366F1" strokeWidth="4.5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress)}`}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold font-mono text-white">
              {display}
            </span>
            <span className="text-[8px] text-[#646473] font-mono uppercase mt-0.5 tracking-wider">RESTING</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#11111A] border border-[#1A1A26] rounded-2xl px-3.5 py-3 w-full">
          <span className="text-base flex-shrink-0">💧</span>
          <span className="text-xs text-[#A3A3B3] text-left leading-relaxed font-medium">Take a small sip of water. Inhale for 4s, hold for 4s, exhale for 4s.</span>
        </div>

        <button
          onClick={onSkip}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wider uppercase transition-colors cursor-pointer select-none shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
        >
          Skip Rest
        </button>
      </motion.div>
    </div>
  );
}

// ── Sound hook placeholder ──
function playSound(id: string) {
  const SOUNDS: Record<string, string> = {
    timer_bell: "/audio/sfx/timer_bell.mp3",
  };
  try {
    const audio = new Audio(SOUNDS[id]);
    audio.volume = 0.6;
    audio.play().catch(() => {});
  } catch {}
}
