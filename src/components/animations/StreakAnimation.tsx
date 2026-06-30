"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as confettiModule from "canvas-confetti";
import { playSound } from "../../core/audio";
import { Flame, Shield, Sparkles } from "lucide-react";

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

export default function StreakAnimation({ type, streakCount, onComplete, startColorBlue }: StreakAnimationProps) {
  const [phase, setPhase] = useState<"greyed" | "freeze" | "igniting" | "lit" | "shield">("greyed");
  const [showShield, setShowShield] = useState(false);

  useEffect(() => {
    if (!type) {
      onComplete();
      return;
    }

    const validTypes = [
      "daily_lit",
      "daily_unfreeze",
      "weekly_complete",
      "monthly_complete",
      "yearly_complete",
      "shield_silver_convert",
      "monster_cap",
      "beast_730",
      "streak_break"
    ];

    if (!validTypes.includes(type)) {
      onComplete();
      return;
    }

    // Helper to run confetti safely
    const fireConfetti = (opts: any) => {
      try {
        const enhancedOpts = { zIndex: 10010, ...opts };
        if (typeof confetti === "function") {
          confetti(enhancedOpts);
        } else if (confetti && typeof (confetti as any).default === "function") {
          (confetti as any).default(enhancedOpts);
        }
      } catch (err) {
        console.warn("Confetti call failed:", err);
      }
    };

    setPhase(startColorBlue ? "freeze" : "greyed");
    setShowShield(false);

    if (["daily_lit", "daily_unfreeze", "weekly_complete", "monthly_complete"].includes(type)) {
      // Step 1: Slow ignite start at 500ms
      const igniteStartTimer = setTimeout(() => {
        setPhase("igniting");
        playSound("fire_lit_standard", 0.4);
      }, 500);

      // Step 2: Fully lit and shoot confetti at 1600ms (Slow color sweep completes)
      const litTimer = setTimeout(() => {
        setPhase("lit");
        playSound(type === "daily_unfreeze" ? "fire_lit_unfreeze" : "fire_lit_standard", 0.7);

        // Side-cannon confetti bursts to avoid covering center stage
        fireConfetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.75 },
          colors: type === "daily_unfreeze" 
            ? ["#38BDF8", "#0EA5E9", "#E0F2FE"] 
            : ["#FF5A00", "#FFA057", "#ffedd5"]
        });
        fireConfetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.75 },
          colors: type === "daily_unfreeze" 
            ? ["#38BDF8", "#0EA5E9", "#E0F2FE"] 
            : ["#FF5A00", "#FFA057", "#ffedd5"]
        });
      }, 1600);

      // Step 3: Trigger shield introduction if weekly/monthly at 2800ms
      let shieldTimer: NodeJS.Timeout | undefined;
      if (type === "weekly_complete" || type === "monthly_complete") {
        shieldTimer = setTimeout(() => {
          setPhase("shield");
          setShowShield(true);
          playSound("shield_add_metal", 0.8);

          const shieldColors = type === "weekly_complete"
            ? ["#b45309", "#d97706", "#f59e0b", "#ffffff"] // Bronze
            : ["#94a3b8", "#cbd5e1", "#f1f5f9", "#ffffff"]; // Silver

          fireConfetti({
            particleCount: 35,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors: shieldColors
          });
          fireConfetti({
            particleCount: 35,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors: shieldColors
          });
        }, 2800);
      }

      // Step 4: End animation sequence
      const totalDuration = (type === "weekly_complete" || type === "monthly_complete") ? 5800 : 4200;
      const endTimer = setTimeout(onComplete, totalDuration);

      return () => {
        clearTimeout(igniteStartTimer);
        clearTimeout(litTimer);
        if (shieldTimer) clearTimeout(shieldTimer);
        clearTimeout(endTimer);
      };
    }

    // Handlers for other standalone/special states
    if (type === "yearly_complete") {
      setPhase("lit");
      playSound("eternal_unlock", 0.9);
      const end = Date.now() + 3000;
      const interval = setInterval(() => {
        if (Date.now() > end) return clearInterval(interval);
        fireConfetti({
          particleCount: 40,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ["#eab308", "#fbbf24", "#fef08a", "#ffffff"]
        });
        fireConfetti({
          particleCount: 40,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ["#eab308", "#fbbf24", "#fef08a", "#ffffff"]
        });
      }, 150);

      const timer = setTimeout(() => {
        clearInterval(interval);
        onComplete();
      }, 7000);
      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }

    if (type === "shield_silver_convert") {
      setPhase("lit");
      playSound("shield_add_metal", 0.8);
      fireConfetti({
        particleCount: 60,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.7 },
        colors: ["#94a3b8", "#cbd5e1", "#f1f5f9", "#ffffff"]
      });
      fireConfetti({
        particleCount: 60,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.7 },
        colors: ["#94a3b8", "#cbd5e1", "#f1f5f9", "#ffffff"]
      });
      const timer = setTimeout(onComplete, 4500);
      return () => clearTimeout(timer);
    }

    if (type === "monster_cap") {
      setPhase("lit");
      playSound("monster_alert", 0.8);
      const timer = setTimeout(onComplete, 5000);
      return () => clearTimeout(timer);
    }

    if (type === "beast_730") {
      setPhase("lit");
      playSound("beast_activated", 0.9);
      fireConfetti({
        particleCount: 100,
        angle: 60,
        spread: 80,
        startVelocity: 55,
        origin: { x: 0, y: 0.8 },
        colors: ["#dc2626", "#ea580c", "#f97316", "#ffffff"]
      });
      fireConfetti({
        particleCount: 100,
        angle: 120,
        spread: 80,
        startVelocity: 55,
        origin: { x: 1, y: 0.8 },
        colors: ["#dc2626", "#ea580c", "#f97316", "#ffffff"]
      });
      const timer = setTimeout(onComplete, 7500);
      return () => clearTimeout(timer);
    }

    if (type === "streak_break") {
      playSound("streak_vaporize", 0.8);
      const timer = setTimeout(onComplete, 5500);
      return () => clearTimeout(timer);
    }
  }, [type, onComplete, startColorBlue]);

  if (!type) return null;

  const OVERLAYS: Record<string, { text: string; sub: string; color: string }> = {
    daily_lit: {
      text: "DAILY TARGET LIT",
      sub: "Active physical state registered",
      color: "from-orange-400 to-amber-500",
    },
    daily_unfreeze: {
      text: "STREAK UNFROZEN",
      sub: "Active state restored from ice",
      color: "from-sky-400 to-cyan-500",
    },
    weekly_complete: {
      text: "WEEKLY FLAWLESS CYCLE",
      sub: "7-day flawless execution. +1 Bronze Shield.",
      color: "from-amber-500 to-amber-600",
    },
    monthly_complete: {
      text: "MONTHLY MASTER",
      sub: "28-day flawless cycle. +1 Silver Shield.",
      color: "from-slate-300 to-slate-400",
    },
    yearly_complete: {
      text: "SOLAR CYCLE ACHIEVED",
      sub: "365 days of continuous power. Golden Shield active.",
      color: "from-yellow-400 to-amber-400",
    },
    shield_silver_convert: {
      text: "SILVER AUTO-CONVERT",
      sub: "3 Bronze shields upgraded to 1 Silver Shield",
      color: "from-slate-300 to-slate-400",
    },
    monster_cap: {
      text: "MONSTER CAPACITY",
      sub: "Maximum Silver Shields (5) reached",
      color: "from-red-400 to-red-500",
    },
    beast_730: {
      text: "730-DAY DOUBLE ORBIT",
      sub: "The Absolute Apex of Physical Consistency",
      color: "from-purple-400 to-indigo-500",
    },
    streak_break: {
      text: "STREAK EXPIRED",
      sub: "Time matrix has been reset",
      color: "from-neutral-400 to-neutral-500",
    },
  };

  const isCoreAnimation = ["daily_lit", "daily_unfreeze", "weekly_complete", "monthly_complete"].includes(type);
  const overlay = OVERLAYS[type];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] pointer-events-none select-none overflow-hidden">
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translate(0, 0); }
            10% { transform: translate(-4px, -2px); }
            20% { transform: translate(4px, 2px); }
            30% { transform: translate(-4px, 2px); }
            40% { transform: translate(4px, -2px); }
            50% { transform: translate(-2px, 1px); }
            60% { transform: translate(2px, -1px); }
            70% { transform: translate(-1px, -1px); }
            80% { transform: translate(1px, 1px); }
            90% { transform: translate(-2px, -1px); }
          }
          @keyframes floatUp {
            0% { transform: translateY(20px) scale(0.6); opacity: 0; }
            50% { opacity: 0.8; }
            100% { transform: translateY(-80px) scale(1); opacity: 0; }
          }
          .spark-particle {
            animation: floatUp 2s ease-out infinite;
          }
        `}</style>

        {/* Ash Particles for Broken Streak */}
        {type === "streak_break" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="absolute bg-neutral-600 rounded-full opacity-60"
                style={{
                  width: `${Math.random() * 8 + 4}px`,
                  height: `${Math.random() * 8 + 4}px`,
                  left: `${Math.random() * 100}%`,
                  top: `-5%`,
                  animation: `floatUp ${Math.random() * 3 + 2}s linear infinite`,
                  animationDelay: `${Math.random() * 3}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Monster Cap Red Vignette */}
        {type === "monster_cap" && (
          <div className="absolute inset-0 pointer-events-none border-[16px] border-red-500/20 z-50 animate-pulse" />
        )}

        {overlay && (
          <motion.div
            className={`fixed inset-0 z-[1000] flex flex-col items-center justify-center p-6 bg-black/85 backdrop-blur-md ${type === "monster_cap" ? "animate-shake" : ""}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Core Animation: No box, purely centered, elegant, borderless */}
            {isCoreAnimation ? (
              <div className="flex flex-col items-center justify-center relative w-full max-w-lg min-h-[400px]">
                
                {/* Spark Particles (Only visible when igniting or lit) */}
                {(phase === "igniting" || phase === "lit" || phase === "shield") && (
                  <div className="absolute inset-0 pointer-events-none z-10">
                    {Array.from({ length: 12 }).map((_, i) => {
                      const color = type === "daily_unfreeze" ? "bg-sky-400" : "bg-orange-500";
                      return (
                        <div
                          key={i}
                          className={`absolute rounded-full spark-particle ${color}`}
                          style={{
                            width: `${Math.random() * 6 + 3}px`,
                            height: `${Math.random() * 6 + 3}px`,
                            left: `${42 + Math.random() * 16}%`,
                            bottom: `${40 + Math.random() * 10}%`,
                            animationDelay: `${Math.random() * 1.5}s`,
                            filter: "blur(0.5px)"
                          }}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Animated Background Glow Ring */}
                <motion.div
                  className="absolute w-72 h-72 rounded-full blur-3xl opacity-25"
                  animate={{
                    scale: (phase !== "greyed" && phase !== "freeze") ? [1, 1.25, 1] : 0.8,
                    backgroundColor: 
                      phase === "greyed" ? "#374151" :
                      phase === "freeze" ? "#38bdf8" :
                      type === "daily_unfreeze" ? "#38bdf8" : "#f97316",
                  }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Centered Fire Vessel */}
                <motion.div
                  initial={{ scale: 0.8, y: 10 }}
                  animate={{ 
                    scale: (phase !== "greyed" && phase !== "freeze") ? 1.15 : 0.9, 
                    y: 0,
                    boxShadow: (phase !== "greyed" && phase !== "freeze") 
                      ? (type === "daily_unfreeze" ? "0 0 50px rgba(56,189,248,0.25)" : "0 0 50px rgba(249,115,22,0.25)")
                      : (phase === "freeze" ? "0 0 35px rgba(56,189,248,0.25)" : "0 0 20px rgba(0,0,0,0.5)")
                  }}
                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                  className="relative z-10 w-36 h-36 rounded-full bg-[#050508]/85 border border-white/5 flex items-center justify-center"
                >
                  {/* Giant Fire Icon with slow color sweep from grey or blue to active orange */}
                  <motion.div
                    animate={{
                      scale: (phase !== "greyed" && phase !== "freeze") ? [1, 1.1, 1] : 1,
                      rotate: (phase !== "greyed" && phase !== "freeze") ? [0, -3, 3, 0] : 0,
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Flame
                      size={82}
                      className="transition-all duration-[1800ms] ease-out fill-current"
                      style={{
                        color: phase === "greyed" ? "#4b5563" : 
                               phase === "freeze" ? "#38bdf8" :
                               type === "daily_unfreeze" ? "#38bdf8" : "#f97316",
                        filter: phase === "greyed" 
                          ? "grayscale(1) opacity(0.35)" 
                          : phase === "freeze"
                          ? "drop-shadow(0 0 15px rgba(56,189,248,0.8))"
                          : `drop-shadow(0 0 15px ${type === "daily_unfreeze" ? "rgba(56,189,248,0.8)" : "rgba(249,115,22,0.8)"})`
                      }}
                    />
                  </motion.div>

                  {/* Micro Sparkle Overlay */}
                  {phase === "lit" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute top-2 right-2 text-amber-300"
                    >
                      <Sparkles size={20} />
                    </motion.div>
                  )}
                </motion.div>

                {/* Elegant, Floating Shield Intro underneath */}
                <AnimatePresence>
                  {showShield && (type === "weekly_complete" || type === "monthly_complete") && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0, y: 30, rotate: -20 }}
                      animate={{ scale: 1.1, opacity: 1, y: 15, rotate: 0 }}
                      exit={{ scale: 0, opacity: 0, y: -20 }}
                      transition={{ type: "spring", stiffness: 160, damping: 12 }}
                      className="absolute z-20 flex flex-col items-center gap-1.5"
                      style={{ bottom: "25%" }}
                    >
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center relative shadow-2xl border
                        ${type === "weekly_complete"
                          ? "bg-[#27160c]/90 border-amber-500/40 text-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.35)]"
                          : "bg-[#0f172a]/90 border-slate-400/40 text-slate-300 shadow-[0_0_30px_rgba(203,213,225,0.35)]"
                        }
                      `}>
                        <Shield size={36} className="fill-current opacity-10 absolute" />
                        <span className="text-3xl z-10">{type === "weekly_complete" ? "🥉" : "🥈"}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Elegant Minimalist Typography below the visual vessel */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="mt-12 text-center flex flex-col items-center gap-2 z-10"
                >
                  <span className="text-[11px] font-mono font-black uppercase tracking-[0.3em] text-[#8e9196] opacity-80">
                    SEQUENCE STATUS
                  </span>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-[#f3f4f6] to-white">
                    {overlay.text}
                  </h1>
                  <p className="text-sm text-[#A0A0AB] font-medium max-w-[280px]">
                    {overlay.sub}
                  </p>

                  {/* Elegant Horizontal Streak Counter Indicator */}
                  {streakCount !== undefined && streakCount > 0 && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 1.2, type: "spring" }}
                      className="mt-4 bg-[#0a0a0c] border border-white/5 px-6 py-2 rounded-full flex items-center gap-3 shadow-xl"
                    >
                      <span className="text-xs font-mono font-bold text-[#71717A] uppercase tracking-wider">
                        STREAK:
                      </span>
                      <span className="text-lg font-black text-orange-400 font-mono">
                        {streakCount} {streakCount === 1 ? "DAY" : "DAYS"}
                      </span>
                    </motion.div>
                  )}
                </motion.div>

              </div>
            ) : (
              /* Fallback Card/Overlay rendering for non-core specialized milestones (beast mode, broken, etc) */
              <motion.div
                className="max-w-xs text-center flex flex-col items-center gap-6 bg-[#07070a]/95 border border-white/5 p-8 rounded-3xl"
                initial={{ scale: 0.8, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -20 }}
                transition={{ type: "spring", damping: 25, stiffness: 180 }}
              >
                <div className="flex items-center justify-center w-full min-h-[140px] relative">
                  {type === "streak_break" && (
                    <motion.div
                      initial={{ scale: 0.5, rotate: -15 }}
                      animate={{ scale: [1, 0.9, 1], rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="text-6xl filter drop-shadow-[0_0_12px_rgba(255,255,255,0.1)]"
                    >
                      💨
                    </motion.div>
                  )}
                  {type === "yearly_complete" && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 120, damping: 12 }}
                      className="text-6xl filter drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]"
                    >
                      🏅
                    </motion.div>
                  )}
                  {type === "shield_silver_convert" && (
                    <motion.div
                      initial={{ scale: 0, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 150, damping: 15 }}
                      className="text-6xl filter drop-shadow-[0_0_15px_rgba(148,163,184,0.4)]"
                    >
                      ⚔️
                    </motion.div>
                  )}
                  {type === "monster_cap" && (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-6xl filter drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                    >
                      ⚠️
                    </motion.div>
                  )}
                  {type === "beast_730" && (
                    <motion.div
                      initial={{ scale: 0, rotate: 45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 180, damping: 10 }}
                      className="text-6xl filter drop-shadow-[0_0_25px_rgba(168,85,247,0.5)]"
                    >
                      💀
                    </motion.div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-1">
                  <h2
                    className={`text-2xl font-black tracking-wider text-center bg-gradient-to-r bg-clip-text text-transparent ${overlay.color}`}
                    style={{ filter: "drop-shadow(0 0 10px rgba(255,255,255,0.15))" }}
                  >
                    {overlay.text}
                  </h2>
                  <p className="text-xs text-[#A0A0AB] leading-relaxed max-w-[240px]">
                    {overlay.sub}
                  </p>
                </div>

                {streakCount !== undefined && streakCount > 0 && (
                  <div className="bg-[#0c0c0e] px-4 py-2 rounded-xl border border-[#171721] w-full">
                    <span className="text-[10px] text-[#71717A] uppercase tracking-wider block font-bold">Current Streak</span>
                    <span className="text-xl font-black text-orange-400 font-mono">{streakCount} Days</span>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
