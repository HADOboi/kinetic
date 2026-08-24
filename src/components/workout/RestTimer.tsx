"use client";
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Plus, Minus, FastForward, Bell } from "lucide-react";

interface RestTimerProps {
  durationSeconds?: number; // default 90
  onComplete: () => void;
  onSkip: () => void;
}

// ── Web Audio Synthesizer for Crystal-Clear Bell "Ding" ──
function playDingBell() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;
    const frequencies = [1046.5, 2093.0, 3135.9]; // C6 and harmonics
    const gains = [0.4, 0.2, 0.1];

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(gains[idx], now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.8);
    });

    // Attempt backup audio file if available
    try {
      const backupAudio = new Audio("/audio/sfx/timer_bell.mp3");
      backupAudio.volume = 0.5;
      backupAudio.play().catch(() => {});
    } catch {}
  } catch (e) {
    console.warn("Audio bell synthesis fallback error:", e);
  }
}

export default function RestTimer({ durationSeconds = 90, onComplete, onSkip }: RestTimerProps) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [initialDuration, setInitialDuration] = useState(durationSeconds);
  const bellPlayedRef = useRef(false);

  useEffect(() => {
    if (remaining <= 0) {
      if (!bellPlayedRef.current) {
        bellPlayedRef.current = true;
        playDingBell();
      }
      const timeout = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(timeout);
    }

    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onComplete]);

  const addTime = (seconds: number) => {
    setRemaining((prev) => {
      const next = Math.max(5, prev + seconds);
      if (next > initialDuration) {
        setInitialDuration(next);
      }
      return next;
    });
  };

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${mins}:${String(secs).padStart(2, "0")}`;
  const progress = initialDuration > 0 ? 1 - remaining / initialDuration : 0;

  return (
    <div className="fixed inset-0 bg-[#040406]/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
      {/* Ambient background glow */}
      <div className="absolute w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        className="w-full max-w-sm bg-[#0C0C14] border-2 border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(99,102,241,0.25)] flex flex-col items-center gap-6 text-center relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 30 }}
        transition={{ type: "spring", damping: 22, stiffness: 320 }}
      >
        {/* Header Tag */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
          <Bell size={12} className="text-indigo-400 animate-bounce" />
          <span className="text-[11px] text-indigo-300 font-mono uppercase tracking-[0.2em] font-bold">
            NEUROMUSCULAR RECOVERY
          </span>
        </div>

        {/* Big Pop-Out Circular Timer */}
        <div className="relative w-44 h-44 sm:w-48 sm:h-48 my-1 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {/* Background track */}
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#141422"
              strokeWidth="6"
            />
            {/* Active progress ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#6366F1"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress)}`}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>

          {/* Center Timer Typography */}
          <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
            <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              {display}
            </span>
            <span className="text-[10px] text-indigo-400 font-mono uppercase mt-1 tracking-widest font-bold">
              {remaining <= 3 ? "GET READY!" : "RESTING"}
            </span>
          </div>
        </div>

        {/* Quick Duration Adjusters */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => addTime(-15)}
            className="px-3 py-1.5 rounded-xl bg-[#141422] border border-[#232338] text-xs font-mono font-bold text-[#A3A3B3] hover:text-white hover:border-indigo-500/40 active:scale-95 transition-all cursor-pointer"
          >
            -15s
          </button>
          <button
            onClick={() => addTime(30)}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-xs font-mono font-bold text-indigo-300 hover:text-white hover:bg-indigo-600/40 active:scale-95 transition-all cursor-pointer"
          >
            +30s
          </button>
          <button
            onClick={() => addTime(60)}
            className="px-3 py-1.5 rounded-xl bg-[#141422] border border-[#232338] text-xs font-mono font-bold text-[#A3A3B3] hover:text-white hover:border-indigo-500/40 active:scale-95 transition-all cursor-pointer"
          >
            +60s
          </button>
        </div>

        {/* Hydration / Breath Guidance Box */}
        <div className="flex items-center gap-3 bg-[#11111C] border border-[#1E1E2E] rounded-2xl px-4 py-3 w-full text-left">
          <span className="text-xl flex-shrink-0">💧</span>
          <p className="text-xs text-[#D4D4D8] leading-relaxed font-medium">
            Take a slow breath. Inhale 4s, hold 4s, exhale 4s to replenish cellular ATP.
          </p>
        </div>

        {/* Skip Action Button */}
        <button
          onClick={() => {
            playDingBell();
            onSkip();
          }}
          className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-sm tracking-wider uppercase transition-all cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2"
        >
          <FastForward size={16} />
          <span>Ready Now — Skip Rest</span>
        </button>
      </motion.div>
    </div>
  );
}
