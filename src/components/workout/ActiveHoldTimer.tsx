"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Check, X, Plus, Minus, Volume2, Sparkles, Flame } from "lucide-react";
import { playDingSound, playCountdownBeep } from "../../core/audio";

interface ActiveHoldTimerProps {
  exerciseName: string;
  setIndex: number;
  totalSets: number;
  workingTarget: number;
  onComplete: (valueLogged: number) => void;
  onCancel: () => void;
}

export default function ActiveHoldTimer({
  exerciseName,
  setIndex,
  totalSets,
  workingTarget,
  onComplete,
  onCancel,
}: ActiveHoldTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [target, setTarget] = useState(workingTarget);
  const [isPaused, setIsPaused] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const dingPlayedRef = useRef(false);

  const remaining = Math.max(0, target - elapsed);
  const progressPercent = Math.min(100, (elapsed / target) * 100);

  // SVG circular gauge math
  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  useEffect(() => {
    if (isPaused || isDone) return;

    if (elapsed >= target) {
      if (!dingPlayedRef.current) {
        dingPlayedRef.current = true;
        playDingSound(0.9);
      }
      setIsDone(true);
      const timer = setTimeout(() => {
        onComplete(target);
      }, 700);
      return () => clearTimeout(timer);
    }

    // Play soft high beep on countdown 3, 2, 1
    if (remaining <= 3 && remaining > 0) {
      playCountdownBeep(true);
    }

    const interval = setTimeout(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearTimeout(interval);
  }, [elapsed, target, isPaused, isDone, remaining, onComplete]);

  const handleFinishEarly = () => {
    if (!dingPlayedRef.current) {
      dingPlayedRef.current = true;
      playDingSound(0.85);
    }
    setIsDone(true);
    setTimeout(() => {
      onComplete(Math.max(1, elapsed));
    }, 400);
  };

  const handleAdjustTarget = (delta: number) => {
    setTarget((prev) => Math.max(5, prev + delta));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#040408]/95 backdrop-blur-xl flex flex-col items-center justify-between p-6 select-none overflow-y-auto">
      {/* TOP: Header info */}
      <div className="w-full max-w-sm flex items-center justify-between pt-2">
        <div className="flex flex-col text-left">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-indigo-400">
            Set {setIndex + 1} of {totalSets}
          </span>
          <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wide line-clamp-1 mt-0.5">
            {exerciseName}
          </h2>
        </div>

        <button
          onClick={onCancel}
          className="p-2 rounded-xl bg-[#141420] border border-[#222234] text-[#A3A3B3] hover:text-white hover:border-red-500/40 transition-colors cursor-pointer"
          title="Abort timer"
        >
          <X size={18} />
        </button>
      </div>

      {/* CENTER: BIG PROMINENT CIRCULAR TIMER */}
      <div className="flex flex-col items-center justify-center my-auto py-6 relative">
        {/* Glow ambient background */}
        <motion.div
          className={`absolute w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500 ${
            isDone
              ? "bg-emerald-500"
              : isPaused
              ? "bg-amber-500"
              : remaining <= 3
              ? "bg-orange-500"
              : "bg-indigo-500"
          }`}
          animate={{ scale: isPaused ? 0.9 : [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Circular SVG Meter */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 220 220">
            {/* Background Track */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              className="stroke-[#141420]"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Progress Stroke */}
            <motion.circle
              cx="110"
              cy="110"
              r={radius}
              className={`transition-all duration-300 ${
                isDone
                  ? "stroke-emerald-400"
                  : isPaused
                  ? "stroke-amber-400"
                  : remaining <= 3
                  ? "stroke-orange-400"
                  : "stroke-indigo-500"
              }`}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                filter: isDone
                  ? "drop-shadow(0 0 12px rgba(52,211,153,0.8))"
                  : remaining <= 3
                  ? "drop-shadow(0 0 12px rgba(249,115,22,0.8))"
                  : "drop-shadow(0 0 12px rgba(99,102,241,0.6))",
              }}
            />
          </svg>

          {/* Inner Content Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {isDone ? (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mb-1">
                  <Check size={36} strokeWidth={3.5} className="text-emerald-400" />
                </div>
                <span className="text-xl font-black font-display text-white uppercase tracking-wider">
                  Hold Done!
                </span>
                <span className="text-xs text-emerald-400 font-mono font-bold">
                  {target}s Completed
                </span>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center">
                {/* Status chip */}
                {isPaused ? (
                  <span className="text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-1">
                    Paused
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#A3A3B3] mb-1 flex items-center gap-1">
                    <Flame size={12} className="text-orange-400 fill-orange-400 animate-pulse" />
                    Hold Strong
                  </span>
                )}

                {/* HUGE TIMER DIGITS */}
                <div className="flex items-baseline justify-center">
                  <span className="text-7xl sm:text-8xl font-black font-mono tracking-tight text-white tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    {remaining}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-mono text-indigo-400 ml-1">
                    s
                  </span>
                </div>

                {/* Sub-label */}
                <span className="text-xs text-[#8A8A9E] font-mono font-semibold mt-1">
                  {elapsed}s of {target}s target
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Time Adjusters */}
        {!isDone && (
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={() => handleAdjustTarget(-5)}
              className="px-3 py-1.5 rounded-xl bg-[#10101A] border border-[#202030] text-[#A3A3B3] hover:text-white font-mono text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1"
              title="Minus 5s"
            >
              <Minus size={12} />
              <span>5s</span>
            </button>
            <span className="text-[11px] font-mono text-[#525263] uppercase">Target Adjust</span>
            <button
              onClick={() => handleAdjustTarget(5)}
              className="px-3 py-1.5 rounded-xl bg-[#10101A] border border-[#202030] text-[#A3A3B3] hover:text-white font-mono text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1"
              title="Plus 5s"
            >
              <Plus size={12} />
              <span>5s</span>
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM: Action Controls */}
      <div className="w-full max-w-sm flex flex-col gap-3 pb-2">
        {!isDone && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`py-3.5 px-4 rounded-2xl border font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                isPaused
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  : "bg-[#141420] border-[#252538] text-white hover:bg-[#1E1E2E]"
              }`}
            >
              {isPaused ? <Play size={16} className="fill-amber-300" /> : <Pause size={16} />}
              <span>{isPaused ? "Resume" : "Pause"}</span>
            </button>

            <button
              onClick={handleFinishEarly}
              className="py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            >
              <Check size={16} strokeWidth={3} />
              <span>Done Hold</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
