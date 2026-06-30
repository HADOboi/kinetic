"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import { useStreakEngine, getDaysBetweenDates } from "../../hooks/useStreakEngine";
import { saveProfile } from "../../core/firestore";
import { WEEKLY_SCHEDULE } from "../../core/exerciseMatrix";
import { KineticProfile, NodeState, ScheduleNodeType } from "../../core/types";
import StreakAnimation, { StreakAnimationType } from "../../components/animations/StreakAnimation";
import WeightModal from "../../components/dashboard/WeightModal";

// Custom browser router to emulate Next.js router in our custom single-page environment
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

import { Check, Lock, Play, Sparkles } from "lucide-react";

// ─── Node state derivation ───────────────────────────────────────────
function getNodeState(
  nodeIndex: number,
  currentScheduleIndex: number,
  lastCompletedDate: string,
  todayStr: string
): NodeState {
  if (nodeIndex < currentScheduleIndex)  return "completed";
  if (nodeIndex === currentScheduleIndex) {
    if (lastCompletedDate === todayStr) {
      return "locked";
    }
    const node = WEEKLY_SCHEDULE[nodeIndex];
    if (node.type === "rest") return "rest_auto";
    return "active";
  }
  // future node — check if rest (show differently but still locked)
  return "locked";
}

function resolveAchievementType(
  updated: KineticProfile,
  prevStreak: number,
  oldProfile: KineticProfile | null
): StreakAnimationType {
  if ((updated as any)._silverCapTriggered) {
    return "monster_cap";
  }

  const s = updated.currentStreak;

  if (s >= 730 && prevStreak < 730) {
    return "beast_730";
  }
  if (s === 365) {
    return "yearly_complete";
  }
  if (s % 28 === 0 && s > 0) {
    return "monthly_complete";
  }
  if (s % 7 === 0 && s > 0) {
    if (updated.shields.silver > (oldProfile?.shields.silver ?? 0)) {
      return "shield_silver_convert";
    } else {
      return "weekly_complete";
    }
  }
  return "daily_lit";
}

// ─── Sub-components ──────────────────────────────────────────────────
function NodeConnector({ completed }: { completed: boolean }) {
  return (
    <div className={`w-0.5 h-10 mx-auto transition-colors duration-500 ${completed ? "bg-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-[#1F1F2E]"}`} />
  );
}

function RoadmapNode({
  state,
  nodeType,
  label,
  level,
  onTap,
}: {
  state: NodeState;
  nodeType: ScheduleNodeType;
  label: string;
  level?: number;
  onTap?: () => void;
}) {
  const circleClass = {
    completed:  "bg-emerald-500/10 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
    active:     "bg-indigo-600 border-[3px] border-[#0B0B0F] shadow-[0_0_15px_rgba(79,70,229,0.4)]",
    rest_auto:  "bg-sky-500/10 border border-sky-400/40",
    locked:     "bg-[#0C0C12] border border-[#1A1A26]",
  }[state];

  const icon = {
    completed:  <Check size={16} strokeWidth={3} className="text-emerald-400" />,
    active:     <Play size={14} className="text-white fill-white ml-0.5" />,
    rest_auto:  <Sparkles size={14} className="text-sky-400 fill-sky-400/20" />,
    locked:     <Lock size={12} className="text-[#4B5563]" />,
  }[state];

  return (
    <div className="flex flex-col items-center">
      <motion.button
        onClick={state === "active" ? onTap : undefined}
        className={`w-12 h-12 rounded-full flex items-center justify-center ${circleClass} ${state === "active" ? "cursor-pointer" : "cursor-default"}`}
        animate={state === "active" ? { scale: [1, 1.08, 1], boxShadow: ["0 0 0px rgba(79,70,229,0)", "0 0 16px rgba(79,70,229,0.6)", "0 0 0px rgba(79,70,229,0)"] } : {}}
        transition={state === "active" ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
        whileTap={state === "active" ? { scale: 0.94 } : {}}
      >
        {icon}
      </motion.button>

      {/* Node label pill */}
      <motion.div
        className={`mt-2 px-3 py-1 rounded-lg border text-xs font-semibold
          ${state === "completed"  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : ""}
          ${state === "active"     ? "bg-indigo-600/15 border-indigo-500/40 text-indigo-300" : ""}
          ${state === "rest_auto"  ? "bg-sky-400/10 border-sky-400/30 text-sky-400" : ""}
          ${state === "locked"     ? "bg-[#121218] border-[#1F1F2E] text-[#71717A]" : ""}
        `}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {label}{level ? ` · Lv.${level}` : ""}
      </motion.div>
    </div>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────
export default function RoadmapPage() {
  const router = useRouter();
  const { user, profile, setProfile, loading } = useAuth();
  const { processMissedDays, completeDay, getFireState, applyAbsenceRegression } = useStreakEngine();

  const [animType, setAnimType]         = useState<StreakAnimationType>(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [pendingFeedbackProfile, setPendingFeedbackProfile] = useState<KineticProfile | null>(null);

  // Read search param on mount with robust storage fallbacks
  useEffect(() => {
    let anim: StreakAnimationType = null;

    // 1. Try URL search params
    try {
      const params = new URLSearchParams(window.location.search);
      anim = params.get("anim") as StreakAnimationType;
    } catch (e) {}

    // 2. Try sessionStorage fallback
    if (!anim) {
      try {
        anim = sessionStorage.getItem("trigger_workout_anim") as StreakAnimationType;
        sessionStorage.removeItem("trigger_workout_anim");
      } catch (e) {}
    }

    // 3. Try window global fallback
    if (!anim) {
      try {
        anim = (window as any).__pendingWorkoutAnim as StreakAnimationType;
        delete (window as any).__pendingWorkoutAnim;
      } catch (e) {}
    }

    if (anim) {
      setAnimType(anim);
      // Clear param without reload
      try {
        window.history.replaceState({}, "", "/roadmap");
      } catch (e) {
        console.warn("History replaceState blocked by iframe sandbox:", e);
      }
    }
  }, []);

  function triggerPostComplete(updated: KineticProfile, prevStreak: number) {
    if ((updated as any)._silverCapTriggered) {
      setAnimType("monster_cap");
      return;
    }

    const s = updated.currentStreak;

    if (s >= 730 && prevStreak < 730) {
      setAnimType("beast_730"); return;
    }
    if (s === 365) {
      setAnimType("yearly_complete"); return;
    }
    if (s % 28 === 0 && s > 0) {
      setAnimType("monthly_complete"); return;
    }
    if (s % 7 === 0 && s > 0) {
      // Check if silver convert happened
      if (updated.shields.silver > (profile?.shields.silver ?? 0)) {
        setAnimType("shield_silver_convert");
      } else {
        setAnimType("weekly_complete");
      }
      // Show weight modal after animation
      setPendingFeedbackProfile(updated);
      return;
    }
    // Daily lit
    const fireState = getFireState(profile!);
    if (fireState === "freeze") {
      setAnimType("daily_unfreeze");
    } else {
      setAnimType("daily_lit");
    }
  }

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading]);

  // Process missed days on load
  useEffect(() => {
    if (!profile) return;
    let updated = processMissedDays(profile);
    updated     = applyAbsenceRegression(updated);

    // Self-healing: If yesterday was completed, the streak should be at least 1!
    if (updated.lastCompletedDate) {
      const today = format(new Date(), "yyyy-MM-dd");
      const daysSince = getDaysBetweenDates(today, updated.lastCompletedDate);
      if (daysSince === 1 && updated.currentStreak === 0) {
        updated = { ...updated, currentStreak: 1 };
      }
    }

    // Detect streak break
    if (updated.currentStreak === 0 && profile.currentStreak > 0) {
      setAnimType("streak_break");
    }

    // Auto-complete rest days
    const todayNode = WEEKLY_SCHEDULE[updated.currentScheduleIndex];
    if (todayNode?.type === "rest") {
      const today = format(new Date(), "yyyy-MM-dd");
      if (updated.lastCompletedDate !== today) {
        const before = updated.currentStreak;
        updated = completeDay(updated);
        updated = { ...updated, currentScheduleIndex: (updated.currentScheduleIndex + 1) % 7 };
        
        // Mark that yesterday was a rest day
        updated.lastWasRestDay = true;

        // Check if there is any milestone achievement to defer
        const potentialAnim = resolveAchievementType(updated, before, profile);
        if (potentialAnim && potentialAnim !== "daily_lit" && potentialAnim !== "daily_unfreeze") {
          updated.deferredAnimation = potentialAnim;
        }
        // No animation is triggered on rest days!
      }
    }

    if (JSON.stringify(updated) !== JSON.stringify(profile)) {
      setProfile(updated);
      saveProfile(updated).catch(console.error);
    }
  }, [profile?.userId]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center">
        <div className="kinetic-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  const fireState    = getFireState(profile);
  const todayNode    = WEEKLY_SCHEDULE[profile.currentScheduleIndex];
  const dailyLabel   = todayNode.type === "rest" ? "Rest" : todayNode.label;
  const currentLevel = todayNode.type !== "rest"
    ? profile.progressionLevels[todayNode.type as "push" | "pull" | "legs_core"]?.level
    : undefined;

  function handleNodeTap() {
    router.push("/workout");
  }

  return (
    <div className="px-4 py-8 md:px-0 md:py-6">
      {/* Header Title for Desktop */}
      <div className="hidden md:flex flex-col gap-1.5 border-b border-[#1A1A26] pb-4 mb-8">
        <h1 className="font-display font-black text-3xl tracking-tight">Kinetic Sequence</h1>
        <p className="text-xs text-[#646473] font-mono uppercase tracking-wider">
          Weekly progression timeline and neuromuscular calibration
        </p>
      </div>

      <div className="flex flex-col items-center py-4 bg-[#0C0C12]/30 border border-[#1A1A26]/40 rounded-3xl p-6 md:p-12 max-w-xl mx-auto shadow-xl">
        {WEEKLY_SCHEDULE.map((node, i) => {
          const today = format(new Date(), "yyyy-MM-dd");
          const state = getNodeState(i, profile.currentScheduleIndex, profile.lastCompletedDate, today);
          const level = node.type !== "rest"
            ? profile.progressionLevels[node.type as "push" | "pull" | "legs_core"]?.level
            : undefined;

          return (
            <div key={i} className="flex flex-col items-center">
              <RoadmapNode
                state={state}
                nodeType={node.type}
                label={node.label}
                level={level}
                onTap={handleNodeTap}
              />
              {i < WEEKLY_SCHEDULE.length - 1 && (
                <NodeConnector completed={state === "completed"} />
              )}
            </div>
          );
        })}
      </div>

      <StreakAnimation
        type={animType}
        streakCount={profile.currentStreak}
        startColorBlue={profile.lastWasRestDay}
        onComplete={() => {
          const isMilestone = ["weekly_complete", "monthly_complete", "yearly_complete", "shield_silver_convert"].includes(animType || "");
          setAnimType(null);
          // Show weight modal after weekly/monthly/yearly
          if (pendingFeedbackProfile || isMilestone) {
            setShowWeightModal(true);
          }

          // Clear deferred animation and lastWasRestDay flags on completion of the animation
          if (profile.deferredAnimation || profile.lastWasRestDay) {
            const updated = {
              ...profile,
              deferredAnimation: null,
              lastWasRestDay: false,
            };
            setProfile(updated);
            saveProfile(updated).catch(console.error);
          }
        }}
      />

      <AnimatePresence>
        {showWeightModal && (pendingFeedbackProfile || profile) && (
          <WeightModal
            profile={pendingFeedbackProfile || profile}
            onSave={(kg) => {
              const activeProfile = pendingFeedbackProfile || profile;
              if (!activeProfile) return;
              const updated = {
                ...activeProfile,
                weightLog: [...activeProfile.weightLog, {
                  date: new Date().toISOString().slice(0, 10), kg,
                }],
              };
              setProfile(updated);
              saveProfile(updated).catch(console.error);
              setShowWeightModal(false);
              setPendingFeedbackProfile(null);
            }}
            onSkip={() => {
              setShowWeightModal(false);
              setPendingFeedbackProfile(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
