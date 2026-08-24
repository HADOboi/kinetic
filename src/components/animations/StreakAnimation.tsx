"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as confettiModule from "canvas-confetti";
import { playSound } from "../../core/audio";
import { Flame, Shield, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

const confetti = (confettiModule as any).default || confettiModule;

export type StreakAnimationType =
  | "daily_lit"
  | "daily_unfreeze"
  | "weekly_complete"
  | "monthly_complete"
  | "yearly_complete"
  | "shield_silver_convert"
  | "monster_cap"
  | "beast_730"
  | "streak_break"
  | null;

interface StreakAnimationProps {
  type: StreakAnimationType;
  streakCount?: number;
  onComplete: () => void;
  startColorBlue?: boolean;
}

export default function StreakAnimation({
  type,
  streakCount = 1,
  onComplete,
  startColorBlue,
}: StreakAnimationProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [phase, setPhase] = useState<"greyed" | "freeze" | "igniting" | "lit">("greyed");

  // Helper to trigger confetti
  const fireConfetti = (opts: any) => {
    try {
      const enhancedOpts = { zIndex: 10010, ...opts };
      if (typeof confetti === "function") {
        confetti(enhancedOpts);
      } else if (confetti && typeof (confetti as any).default === "function") {
        (confetti as any).default(enhancedOpts);
      }
    } catch (err) {
      console.warn("Confetti failed:", err);
    }
  };

  useEffect(() => {
    if (!type) return;

    setStep(1);
    setPhase(startColorBlue ? "freeze" : "greyed");

    if (["daily_lit", "daily_unfreeze", "weekly_complete", "monthly_complete"].includes(type)) {
      // Step 1: Ignite start
      const t1 = setTimeout(() => {
        setPhase("igniting");
        playSound("fire_lit_standard", 0.4);
      }, 300);

      // Step 2: Fully lit & celebration burst
      const t2 = setTimeout(() => {
        setPhase("lit");
        playSound(type === "daily_unfreeze" ? "fire_lit_unfreeze" : "fire_lit_standard", 0.7);

        fireConfetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.75 },
          colors: type === "daily_unfreeze"
            ? ["#38BDF8", "#0EA5E9", "#E0F2FE"]
            : ["#FF5A00", "#FFA057", "#ffedd5"],
        });
        fireConfetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.75 },
          colors: type === "daily_unfreeze"
            ? ["#38BDF8", "#0EA5E9", "#E0F2FE"]
            : ["#FF5A00", "#FFA057", "#ffedd5"],
        });
      }, 1100);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    if (type === "yearly_complete") {
      setPhase("lit");
      playSound("eternal_unlock", 0.9);
      fireConfetti({
        particleCount: 70,
        spread: 90,
        origin: { y: 0.6 },
        colors: ["#eab308", "#fbbf24", "#fef08a", "#ffffff"],
      });
    } else if (type === "shield_silver_convert") {
      setPhase("lit");
      playSound("shield_add_metal", 0.8);
      fireConfetti({
        particleCount: 60,
        spread: 75,
        origin: { y: 0.65 },
        colors: ["#94a3b8", "#cbd5e1", "#f1f5f9", "#ffffff"],
      });
    } else if (type === "beast_730") {
      setPhase("lit");
      playSound("beast_activated", 0.9);
      fireConfetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.6 },
        colors: ["#dc2626", "#ea580c", "#f97316", "#ffffff"],
      });
    } else if (type === "streak_break") {
      playSound("streak_vaporize", 0.8);
    } else if (type === "monster_cap") {
      playSound("monster_alert", 0.8);
    }
  }, [type, startColorBlue]);

  if (!type) return null;

  // Determine if this animation has a sequential shield reward step
  const hasShieldStep = [
    "weekly_complete",
    "monthly_complete",
    "shield_silver_convert",
    "yearly_complete",
  ].includes(type);

  // Transition from Step 1 to Step 2
  const handleNextStep = () => {
    setStep(2);
    if (type === "weekly_complete") {
      playSound("shield_add_metal", 0.85);
      fireConfetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#b45309", "#d97706", "#f59e0b", "#ffffff"],
      });
    } else if (type === "monthly_complete" || type === "shield_silver_convert") {
      playSound("shield_add_metal", 0.9);
      fireConfetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#94a3b8", "#cbd5e1", "#f1f5f9", "#ffffff"],
      });
    } else if (type === "yearly_complete") {
      playSound("eternal_unlock", 0.95);
      fireConfetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ["#eab308", "#fbbf24", "#fde047", "#ffffff"],
      });
    }
  };

  const handleFinalContinue = () => {
    onComplete();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none overflow-y-auto pointer-events-auto">
        <motion.div
          key={`${type}_step_${step}`}
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -15 }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="w-full max-w-sm bg-[#08080E] border border-[#1E1E2C] rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col items-center gap-5 text-center relative"
        >
          {/* STEP 1: Streak / Core Completion */}
          {step === 1 && (
            <>
              {/* Central Visual Icon / Flame Vessel */}
              <div className="relative w-32 h-32 flex items-center justify-center my-1">
                {/* Background Glow */}
                <motion.div
                  className="absolute inset-0 rounded-full blur-2xl opacity-30"
                  animate={{
                    scale: [1, 1.2, 1],
                    backgroundColor:
                      type === "daily_unfreeze"
                        ? "#38BDF8"
                        : type === "weekly_complete"
                        ? "#f59e0b"
                        : type === "monthly_complete"
                        ? "#94a3b8"
                        : type === "yearly_complete"
                        ? "#eab308"
                        : type === "beast_730"
                        ? "#dc2626"
                        : type === "streak_break"
                        ? "#525252"
                        : "#f97316",
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Vessel */}
                <div className="relative z-10 w-28 h-28 rounded-full bg-[#0E0E16] border border-[#222234] flex items-center justify-center shadow-inner">
                  {type === "streak_break" ? (
                    <motion.div
                      initial={{ scale: 0.7 }}
                      animate={{ scale: [1, 0.9, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="text-4xl"
                    >
                      💨
                    </motion.div>
                  ) : type === "monster_cap" ? (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-4xl"
                    >
                      ⚠️
                    </motion.div>
                  ) : type === "beast_730" ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 12 }}
                      className="text-5xl"
                    >
                      💀
                    </motion.div>
                  ) : (
                    <motion.div
                      animate={{
                        scale: phase !== "greyed" && phase !== "freeze" ? [1, 1.08, 1] : 1,
                        rotate: phase !== "greyed" && phase !== "freeze" ? [0, -3, 3, 0] : 0,
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Flame
                        size={64}
                        className="transition-all duration-[1200ms] ease-out fill-current"
                        style={{
                          color:
                            phase === "greyed"
                              ? "#4b5563"
                              : phase === "freeze" || type === "daily_unfreeze"
                              ? "#38bdf8"
                              : type === "yearly_complete"
                              ? "#eab308"
                              : "#f97316",
                          filter:
                            phase === "greyed"
                              ? "grayscale(1) opacity(0.4)"
                              : `drop-shadow(0 0 16px ${
                                  type === "daily_unfreeze" ? "rgba(56,189,248,0.7)" : "rgba(249,115,22,0.7)"
                                })`,
                        }}
                      />
                    </motion.div>
                  )}

                  {phase === "lit" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute top-2 right-2 text-amber-300"
                    >
                      <Sparkles size={16} />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Title & Streak Info */}
              <div className="flex flex-col items-center gap-1.5">
                <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white uppercase">
                  {type === "daily_lit" && "Daily Target Complete"}
                  {type === "daily_unfreeze" && "Streak Unfrozen"}
                  {type === "weekly_complete" && "Weekly Cycle Complete"}
                  {type === "monthly_complete" && "Monthly Master Complete"}
                  {type === "yearly_complete" && "Solar Cycle Achieved"}
                  {type === "shield_silver_convert" && "Weekly Cycle Complete"}
                  {type === "monster_cap" && "Monster Shield Capacity"}
                  {type === "beast_730" && "730-Day Double Orbit"}
                  {type === "streak_break" && "Streak Matrix Reset"}
                </h2>

                {streakCount > 0 && type !== "streak_break" && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono text-xs font-bold mt-0.5">
                    <Flame size={13} className="fill-orange-400" />
                    <span>{streakCount} Day Streak Active</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="w-full mt-2">
                {hasShieldStep ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>
                      {type === "weekly_complete" && "Claim Bronze Shield"}
                      {type === "monthly_complete" && "Claim Silver Shield"}
                      {type === "shield_silver_convert" && "Forge Silver Shield"}
                      {type === "yearly_complete" && "Unlock Golden Shield"}
                    </span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinalContinue}
                    className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>Continue to Roadmap</span>
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </>
          )}

          {/* STEP 2: Shield Receiving Animation */}
          {step === 2 && (
            <>
              {/* Central Shield Visual */}
              <div className="relative w-32 h-32 flex items-center justify-center my-1">
                {/* Glow */}
                <motion.div
                  className="absolute inset-0 rounded-full blur-2xl opacity-40"
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    backgroundColor:
                      type === "weekly_complete"
                        ? "#f59e0b"
                        : type === "monthly_complete" || type === "shield_silver_convert"
                        ? "#94a3b8"
                        : "#eab308",
                  }}
                />

                {/* Shield Vessel */}
                <motion.div
                  initial={{ scale: 0, rotate: -25 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 15, stiffness: 180 }}
                  className="relative z-10 w-28 h-28 rounded-full bg-[#0E0E16] border-2 border-white/10 flex items-center justify-center shadow-2xl"
                  style={{
                    borderColor:
                      type === "weekly_complete"
                        ? "rgba(245, 158, 11, 0.4)"
                        : type === "monthly_complete" || type === "shield_silver_convert"
                        ? "rgba(148, 163, 184, 0.4)"
                        : "rgba(234, 179, 8, 0.6)",
                  }}
                >
                  <Shield
                    size={60}
                    className="fill-current"
                    style={{
                      color:
                        type === "weekly_complete"
                          ? "#f59e0b"
                          : type === "monthly_complete" || type === "shield_silver_convert"
                          ? "#cbd5e1"
                          : "#eab308",
                      filter:
                        type === "weekly_complete"
                          ? "drop-shadow(0 0 14px rgba(245, 158, 11, 0.6))"
                          : type === "monthly_complete" || type === "shield_silver_convert"
                          ? "drop-shadow(0 0 14px rgba(203, 213, 225, 0.6))"
                          : "drop-shadow(0 0 18px rgba(234, 179, 8, 0.8))",
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.3, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute top-2 right-2 text-white"
                  >
                    <Sparkles size={18} />
                  </motion.div>
                </motion.div>
              </div>

              {/* Reward Header */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-1 text-emerald-400 font-mono text-[11px] font-bold uppercase tracking-wider">
                  <CheckCircle2 size={13} />
                  <span>Shield Added to Bank</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white uppercase">
                  {type === "weekly_complete" && "+1 Bronze Shield"}
                  {type === "monthly_complete" && "+1 Silver Shield"}
                  {type === "shield_silver_convert" && "Silver Shield Forged"}
                  {type === "yearly_complete" && "Golden Shield Active"}
                </h2>
                <p className="text-xs text-[#A3A3B3] font-mono">
                  {type === "weekly_complete" && "1-day missed workout buffer"}
                  {type === "monthly_complete" && "3-day missed workout protection window"}
                  {type === "shield_silver_convert" && "3 Bronze shields upgraded to 1 Silver shield"}
                  {type === "yearly_complete" && "Permanent legacy protection"}
                </p>
              </div>

              {/* Final Continue Button */}
              <div className="w-full mt-2">
                <button
                  type="button"
                  onClick={handleFinalContinue}
                  className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-lg flex items-center justify-center gap-2"
                >
                  <span>Continue to Roadmap</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
