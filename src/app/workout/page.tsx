"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../core/firebase";
import { useAuth } from "../../context/AuthContext";
import { saveProfile, handleFirestoreError, OperationType } from "../../core/firestore";
import { useStreakEngine } from "../../hooks/useStreakEngine";
import { useProgression } from "../../hooks/useProgression";
import {
  WEEKLY_SCHEDULE,
  getLevelDefinition,
  resolveExercises,
} from "../../core/exerciseMatrix";
import {
  FeedbackType, RoutineType, WorkoutLog, ExerciseDefinition, KineticProfile,
} from "../../core/types";
import ProgressTracker from "../../components/workout/ProgressTracker";
import ExerciseCard from "../../components/workout/ExerciseCard";
import { format } from "date-fns";

// ── Next.js standard Navigation emulation inside custom Client-side SPA ──
function useRouter() {
  return {
    push(path: string) {
      try {
        window.history.pushState(null, "", path);
      } catch (e) {
        console.warn("History pushState blocked by iframe sandbox:", e);
      }
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    replace(path: string) {
      try {
        window.history.replaceState(null, "", path);
      } catch (e) {
        console.warn("History replaceState blocked by iframe sandbox:", e);
      }
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };
}

// ── Phase types ──────────────────────────────────────────────────────
type WizardPhase = "warmup" | "exercise" | "cooldown" | "feedback";

// ── Warmup movements ─────────────────────────────────────────────────
const WARMUP_MOVEMENTS = [
  "Arm Circles — 30s each direction",
  "Leg Swings — 20 reps each leg",
  "Hip Circles — 10 each direction",
  "Shoulder Rolls — 10 each direction",
  "Ankle Rotations — 10 each",
  "Torso Twists — 15 reps",
  "Cat-Cow Stretch — 10 reps",
];

// ── Cooldown stretches ───────────────────────────────────────────────
const COOLDOWN_STRETCHES = [
  { name: "Child's Pose",                  duration: "45s" },
  { name: "Doorway Chest Stretch (ea.)",   duration: "30s" },
  { name: "Lying Quad Stretch (ea.)",      duration: "30s" },
  { name: "Seated Hamstring Stretch",      duration: "45s" },
  { name: "Pigeon / Figure-4 Hip (ea.)",   duration: "45s" },
  { name: "Lat Stretch (ea.)",             duration: "30s" },
  { name: "Gentle Neck Rolls",             duration: "10 each" },
];

// ── Exit confirm modal ───────────────────────────────────────────────
function ExitModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-md bg-[#121218] border border-[#2D2D3F] rounded-3xl p-6 flex flex-col gap-4"
        initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
      >
        <h3 className="text-white font-bold text-base">Exit session?</h3>
        <p className="text-[#A0A0AB] text-sm">
          This won't count as today's workout. Streak won't update.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-[#2D2D3F] text-[#A0A0AB] text-sm font-semibold"
          >
            Keep Going
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-semibold"
          >
            Exit
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function WorkoutPage() {
  const router  = useRouter();
  const { user, profile, setProfile } = useAuth();
  const { completeDay }               = useStreakEngine();
  const { applyFeedback, getWorkingTarget, saveCalibration } = useProgression();

  const [phase, setPhase]             = useState<WizardPhase>("warmup");
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const [sessionLogs, setSessionLogs] = useState<WorkoutLog["exercisesLogged"]>([]);
  const startTimeRef                  = useRef<Date>(new Date());

  useEffect(() => {
    if (!user) router.replace("/");
  }, [user, router]);

  // Derive current routine type safely for hooks declaration context
  const todayNode   = profile ? (WEEKLY_SCHEDULE[profile.currentScheduleIndex] || { type: "push", label: "Push" }) : { type: "push", label: "Push" };
  const routineType = (todayNode.type === "rest" ? "push" : todayNode.type) as RoutineType;
  const isCalibration = profile ? (profile.currentPhase === "calibration") : false;

  // ── Write workout log & update profile ──────────────────────────────
  const finalizeWorkout = useCallback(async (feedback: FeedbackType, calibMaxVolume?: number) => {
    if (!profile || !user) return;

    // 1. Update profile state locally FIRST
    let updated = { ...profile };
    if (isCalibration && calibMaxVolume !== undefined) {
      updated = saveCalibration(updated, routineType, calibMaxVolume);
    }
    if (!isCalibration) {
      updated = applyFeedback(updated, routineType, feedback);
    }
    const nextIndex = (updated.currentScheduleIndex + 1) % 7;
    updated = { ...updated, currentScheduleIndex: nextIndex };
    const prevStreak = updated.currentStreak;
    updated = completeDay(updated);

    // 3. Determine animation type NOW before routing
    const animType = resolveAnimType(updated, prevStreak, profile);

    // Clear deferred fields after consumption!
    updated.deferredAnimation = null;
    updated.lastWasRestDay = false;

    // 2. Set profile state immediately (no waiting for Firestore)
    setProfile(updated);

    // Store in sessionStorage and window global as an airtight fallback for sandboxed iframes
    try {
      sessionStorage.setItem("trigger_workout_anim", animType);
    } catch (e) {
      console.warn("sessionStorage block fallback:", e);
    }
    try {
      (window as any).__pendingWorkoutAnim = animType;
    } catch (e) {}

    // 4. Route to roadmap with animation param
    router.replace(`/roadmap?anim=${animType}`);

    // 5. Write to Firestore in background (don't await in main flow)
    const log: WorkoutLog = {
      logId: `${user.uid}_${Date.now()}`,
      userId: user.uid,
      habitId: "workout",
      date: format(new Date(), "yyyy-MM-dd"),
      routineType,
      durationMinutes: Math.round((Date.now() - startTimeRef.current.getTime()) / 60000),
      isDeloadSession: false,
      performanceFeedback: feedback,
      exercisesLogged: sessionLogs,
    };

    if (user.uid !== "demo_athlete") {
      addDoc(collection(db, "workoutLogs"), log).catch((err) => {
        console.error("Log write failed:", err);
      });
      saveProfile(updated).catch(console.error);
    } else {
      const offlineLogsKey = `workout_logs_${user.uid}`;
      const existingOffline = localStorage.getItem(offlineLogsKey);
      const list = existingOffline ? JSON.parse(existingOffline) : [];
      list.push(log);
      localStorage.setItem(offlineLogsKey, JSON.stringify(list));
      localStorage.setItem(`profile_${user.uid}`, JSON.stringify(updated));
    }
  }, [profile, user, routineType, sessionLogs, isCalibration, applyFeedback, saveCalibration, completeDay, setProfile, router]);

  function resolveAnimType(updated: KineticProfile, prevStreak: number, oldProfile: KineticProfile | null): string {
    if (oldProfile?.deferredAnimation && prevStreak > 0) {
      return oldProfile.deferredAnimation;
    }
    const s = updated.currentStreak;
    if (updated.shields && (updated.shields as any)._silverCapTriggered) {
      delete (updated.shields as any)._silverCapTriggered;
      return "monster_cap";
    }
    if (s >= 730 && prevStreak < 730) return "beast_730";
    if (s === 365)                     return "yearly_complete";
    if (s % 28 === 0 && s > 0)        return "monthly_complete";
    if (s % 7 === 0 && s > 0) {
      const silverGained = updated.shields.silver > (oldProfile?.shields.silver ?? 0);
      return silverGained ? "shield_silver_convert" : "weekly_complete";
    }
    return "daily_lit";
  }

  if (!profile) return null;

  const todayStr = format(new Date(), "yyyy-MM-dd");
  if (profile.lastCompletedDate === todayStr) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#121218] border border-[#2D2D3F] rounded-3xl p-6 text-center flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
            <span className="text-3xl text-emerald-400">✓</span>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Daily Target Complete!</h3>
            <p className="text-xs text-[#A0A0AB] mt-2 leading-relaxed">
              Your programmed physical block has already been successfully registered for today. Allow your neural and muscular pathways to complete their healing sequence.
            </p>
          </div>
          <button
            onClick={() => router.replace("/roadmap")}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm cursor-pointer hover:bg-indigo-700 transition-colors"
          >
            Return to Roadmap
          </button>
        </div>
      </div>
    );
  }

  const progState   = profile.progressionLevels[routineType];
  const levelDef    = getLevelDefinition(routineType, progState?.level ?? 1);

  const exercises: ExerciseDefinition[] = levelDef
    ? resolveExercises(levelDef, profile.equipmentInventory.hasPullupBar, profile.equipmentInventory.hasDumbbells)
    : [];

  const phaseLabel =
    profile.currentPhase === "conditioning"    ? "Conditioning"    :
    profile.currentPhase === "calibration"     ? "Calibration"     :
    "Infinite Overload";

  // ── Phase renders ────────────────────────────────────────────────────

  // WARMUP
  const WarmupPhase = (
    <div className="px-3 py-4 flex flex-col gap-4 select-none">
      <div>
        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Phase 1</p>
        <h2 className="text-lg font-black text-white uppercase tracking-wide">Mobility Preparation</h2>
        <p className="text-xs text-[#A0A0AB] mt-0.5">Neural and Articular joint priming sequence</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {WARMUP_MOVEMENTS.map((m, i) => (
          <div key={i} className="flex items-center gap-2.5 bg-[#0C0C12] border border-[#1A1A26] rounded-xl p-2.5">
            <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] font-mono font-bold text-indigo-400">{i + 1}</span>
            </div>
            <span className="text-xs text-[#A3A3B3] font-medium leading-snug">{m}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 bg-[#0C0C12]/40 border border-[#1A1A26]/80 rounded-xl px-3 py-2.5">
        <span className="text-base">💧</span>
        <p className="text-xs text-[#A0A0AB] leading-snug">
          <span className="text-sky-400 font-semibold">Pre-Hydrate:</span> Take 4–5 small sips of water now to hydrate and prime energy pathways.
        </p>
      </div>

      <button
        onClick={() => setPhase("exercise")}
        className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-all cursor-pointer shadow-[0_4px_16px_rgba(99,102,241,0.25)]"
      >
        Initialize Workout Loop
      </button>
    </div>
  );

  // EXERCISE LOOP
  const currentExercise = exercises[exerciseIndex];
  const workingTarget   = currentExercise
    ? getWorkingTarget(
        currentExercise.baseTarget,
        progState?.maxTestVolume ?? 0,
        profile.currentPhase,
        progState,
        currentExercise.trackingType
      )
    : 0;

  const ExercisePhase = currentExercise ? (
    <ExerciseCard
      key={currentExercise.id}
      exercise={currentExercise}
      exerciseIndex={exerciseIndex}
      totalExercises={exercises.length}
      phaseLabel={phaseLabel}
      workingTarget={workingTarget}
      isCalibrationPhase={isCalibration}
      onExit={() => setShowExitModal(true)}
      onAllSetsDone={(metrics) => {
        // Save log entry
        setSessionLogs((prev) => [
          ...prev,
          {
            exerciseId:      currentExercise.id,
            setsPerformed:   currentExercise.sets,
            metricsCompleted: metrics,
          },
        ]);

        if (isCalibration) {
          // Use first metric as max
          finalizeWorkout("comfortable", metrics[0]);
          return;
        }

        if (exerciseIndex < exercises.length - 1) {
          setExerciseIndex((i) => i + 1);
        } else {
          setPhase("cooldown");
        }
      }}
    />
  ) : null;

  // COOLDOWN
  const CooldownPhase = (
    <div className="px-3 py-4 flex flex-col gap-4 select-none">
      <div>
        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Phase 3</p>
        <h2 className="text-lg font-black text-white uppercase tracking-wide">Structural Decompression</h2>
        <p className="text-xs text-[#A0A0AB] mt-0.5">Post-exertion muscular restorative stretch</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {COOLDOWN_STRETCHES.map((s, i) => (
          <div key={i} className="flex items-center justify-between bg-[#0C0C12] border border-[#1A1A26] rounded-xl p-2.5">
            <span className="text-xs text-[#A3A3B3] font-medium truncate mr-1">{s.name}</span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/10 flex-shrink-0">{s.duration}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 bg-[#0C0C12]/40 border border-[#1A1A26]/80 rounded-xl px-3 py-2.5">
        <span className="text-base">💧</span>
        <p className="text-xs text-[#A0A0AB] leading-snug">
          <span className="text-emerald-400 font-semibold">Rehydrate:</span> Drink a full glass of water over the next 15 minutes to expedite tissue clearing.
        </p>
      </div>

      <button
        onClick={() => setPhase("feedback")}
        className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-all cursor-pointer shadow-[0_4px_16px_rgba(16,185,129,0.25)]"
      >
        Verify Session Log Completion
      </button>
    </div>
  );

  // FEEDBACK
  const FeedbackPhase = (
    <div className="px-3 py-6 flex flex-col gap-4 items-center text-center select-none">
      <motion.div
        className="w-14 h-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <span className="text-2xl">✓</span>
      </motion.div>

      <div>
        <h2 className="text-lg font-black text-white uppercase tracking-wide">Session Verified</h2>
        <p className="text-xs text-[#A0A0AB] mt-1 max-w-xs">
          Your muscular exertion baselines are logged. How did today's structural workload feel overall?
        </p>
      </div>

      {isCalibration ? (
        <div className="w-full bg-[#0C0C12] border border-amber-500/20 rounded-2xl p-4">
          <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1">Calibration Complete</p>
          <p className="text-xs text-[#A3A3B3] leading-relaxed">
            Week 3 baselines successfully recorded.<br />
            Reps target baseline = max × 0.65<br />
            Time target baseline = max × 0.60
          </p>
          <button
            onClick={() => finalizeWorkout("comfortable")}
            className="w-full mt-4 py-3 rounded-xl bg-amber-500 text-black font-black text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer shadow-[0_4px_12px_rgba(245,158,11,0.25)]"
          >
            Save Baselines & Exit
          </button>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-2 max-w-xs">
          {(
            [
              { value: "struggling",  emoji: "🔴", label: "Struggling — hold level",  color: "border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10" },
              { value: "comfortable", emoji: "🟡", label: "Comfortable — 3-cycle path", color: "border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10" },
              { value: "too_easy",    emoji: "🟢", label: "Too Easy! — level up now",  color: "border-indigo-500/40 bg-indigo-600/90 hover:bg-indigo-600 text-white" },
            ] as const
          ).map((opt) => (
            <motion.button
              key={opt.value}
              onClick={() => finalizeWorkout(opt.value)}
              className={`w-full py-3 rounded-xl border font-bold text-xs uppercase tracking-wider ${opt.color} transition-all cursor-pointer`}
              whileTap={{ scale: 0.96 }}
            >
              {opt.emoji} {opt.label}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#040406] flex justify-center items-center p-0 md:p-6">
      <div className="fixed inset-0 md:relative md:inset-auto w-full md:max-w-md md:h-[85vh] md:max-h-[90vh] md:border md:border-[#1A1A26] md:rounded-3xl bg-[#040406] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-40 bg-[#040406]/95 backdrop-blur-sm border-b border-[#1A1A26] border-solid">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-mono tracking-widest font-bold text-indigo-400">{(routineType || "push").replace("_", " + ").toUpperCase()}</span>
            <SessionTimer startTime={startTimeRef.current} />
            <button
              onClick={() => setShowExitModal(true)}
              className="w-8 h-8 rounded-full bg-[#0C0C12] border border-[#1A1A26] flex items-center justify-center text-[#A3A3B3] hover:text-white transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
          <ProgressTracker phase={phase} />
        </div>

        {/* Content */}
        <div className="pt-28 pb-8 overflow-y-auto flex-1 px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase + exerciseIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="h-full flex flex-col justify-start py-2"
            >
              {phase === "warmup"   && WarmupPhase}
              {phase === "exercise" && ExercisePhase}
              {phase === "cooldown" && CooldownPhase}
              {phase === "feedback" && FeedbackPhase}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Exit modal */}
        <AnimatePresence>
          {showExitModal && (
            <ExitModal
              onConfirm={() => router.replace("/roadmap")}
              onCancel={() => setShowExitModal(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Session timer display ─────────────────────────────────────────────
function SessionTimer({ startTime }: { startTime: Date }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [startTime]);

  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return (
    <span className="text-xs font-mono text-[#71717A]">
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}
