"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import { useStreakEngine, getDaysBetweenDates, reconstructProfile } from "../../hooks/useStreakEngine";
import { saveProfile } from "../../core/firestore";
import { WEEKLY_SCHEDULE, getLevelDefinition } from "../../core/exerciseMatrix";
import { KineticProfile, NodeState, ScheduleNodeType, RoutineType } from "../../core/types";
import StreakAnimation, { StreakAnimationType } from "../../components/animations/StreakAnimation";
import WeightModal from "../../components/dashboard/WeightModal";
import { Check, Lock, Play, Sparkles, User as UserIcon } from "lucide-react";

// Custom browser router to emulate Next.js router in custom single-page environment
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

// Helper to determine the dynamic phase based on days & tier
export function getUserPhase(profile: KineticProfile): string {
  const days = profile.currentStreak || 0;
  if (days <= 7) {
    return "Conditioning Phase";
  }

  // Calculate average current tier from progression levels
  const todayNode = WEEKLY_SCHEDULE[profile.currentScheduleIndex ?? 0] || WEEKLY_SCHEDULE[0];
  const routineType = (todayNode.type === "rest" ? "push" : todayNode.type) as RoutineType;
  const currentLevel = profile.progressionLevels[routineType]?.level ?? 1;
  const def = getLevelDefinition(routineType, currentLevel);
  const tier = def?.tier || "Foundation";

  return `${tier} Phase`;
}

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
  if (s % 30 === 0 && s > 0) {
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

// Horizontal Connector Component
function HorizontalNodeConnector({ completed }: { completed: boolean }) {
  return (
    <div
      className={`h-0.5 flex-1 mx-1 min-w-[12px] transition-colors duration-500 rounded-full ${
        completed
          ? "bg-emerald-500/70 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
          : "bg-[#1F1F2E]"
      }`}
    />
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
    completed:  <Check size={14} strokeWidth={3} className="text-emerald-400" />,
    active:     <Play size={12} className="text-white fill-white ml-0.5" />,
    rest_auto:  <Sparkles size={12} className="text-sky-400 fill-sky-400/20" />,
    locked:     <Lock size={10} className="text-[#4B5563]" />,
  }[state];

  const shortLabel = label === "Legs + Core" ? "Legs" : label;

  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      <motion.button
        onClick={state === "active" ? onTap : undefined}
        className={`w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 ${circleClass} ${
          state === "active" ? "cursor-pointer" : "cursor-default"
        }`}
        animate={
          state === "active"
            ? {
                scale: [1, 1.08, 1],
                boxShadow: [
                  "0 0 0px rgba(79,70,229,0)",
                  "0 0 16px rgba(79,70,229,0.6)",
                  "0 0 0px rgba(79,70,229,0)",
                ],
              }
            : {}
        }
        transition={
          state === "active"
            ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
            : {}
        }
        whileTap={state === "active" ? { scale: 0.94 } : {}}
      >
        {icon}
      </motion.button>

      {/* Node label pill */}
      <motion.div
        className={`mt-1.5 px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-md border text-[9px] md:text-xs font-semibold text-center truncate max-w-full
          ${state === "completed" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : ""}
          ${state === "active"    ? "bg-indigo-600/15 border-indigo-500/40 text-indigo-300" : ""}
          ${state === "rest_auto" ? "bg-sky-400/10 border-sky-400/30 text-sky-400" : ""}
          ${state === "locked"    ? "bg-[#121218] border-[#1F1F2E] text-[#71717A]" : ""}
        `}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {shortLabel}{level ? ` L${level}` : ""}
      </motion.div>
    </div>
  );
}

export default function RoadmapPage() {
  const router = useRouter();
  const { user, profile, setProfile, loading } = useAuth();
  const { processMissedDays, completeDay, getFireState, applyAbsenceRegression } = useStreakEngine();

  const [animType, setAnimType]         = useState<StreakAnimationType>(null);
  const [healing, setHealing]           = useState(true);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [pendingFeedbackProfile, setPendingFeedbackProfile] = useState<KineticProfile | null>(null);

  useEffect(() => {
    let anim: StreakAnimationType = null;
    try {
      const params = new URLSearchParams(window.location.search);
      anim = params.get("anim") as StreakAnimationType;
    } catch (e) {}

    if (!anim) {
      try {
        anim = sessionStorage.getItem("trigger_workout_anim") as StreakAnimationType;
        sessionStorage.removeItem("trigger_workout_anim");
      } catch (e) {}
    }

    if (!anim) {
      try {
        anim = (window as any).__pendingWorkoutAnim as StreakAnimationType;
        delete (window as any).__pendingWorkoutAnim;
      } catch (e) {}
    }

    if (anim) {
      setAnimType(anim);
      try {
        window.history.replaceState({}, "", "/roadmap");
      } catch (e) {
        console.warn("History replaceState blocked by iframe sandbox:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !profile) return;

    async function healProfile() {
      try {
        let logs: any[] = [];
        if (user.uid === "demo_athlete") {
          const offlineLogsKey = `workout_logs_${user.uid}`;
          const existingOffline = localStorage.getItem(offlineLogsKey);
          if (existingOffline) {
            logs = JSON.parse(existingOffline);
          }
        } else {
          try {
            const { collection, query, where, getDocs } = await import("firebase/firestore");
            const { db } = await import("../../core/firebase");
            const q = query(collection(db, "workoutLogs"), where("userId", "==", user.uid));
            const snap = await getDocs(q);
            logs = snap.docs.map(doc => doc.data());
          } catch (e) {
            console.warn("Firestore logs fetch failed, using local offline fallback:", e);
            const offlineLogsKey = `workout_logs_${user.uid}`;
            const existingOffline = localStorage.getItem(offlineLogsKey);
            if (existingOffline) {
              logs = JSON.parse(existingOffline);
            }
          }
        }

        let updated = reconstructProfile(profile, logs);
        updated = applyAbsenceRegression(updated);

        if (profile.currentStreak > 0 && updated.currentStreak === 0) {
          setAnimType("streak_break");
        }

        const todayNode = WEEKLY_SCHEDULE[updated.currentScheduleIndex];
        if (todayNode?.type === "rest") {
          const today = format(new Date(), "yyyy-MM-dd");
          if (updated.lastCompletedDate !== today) {
            const before = updated.currentStreak;
            updated = completeDay(updated);
            updated = { ...updated, currentScheduleIndex: (updated.currentScheduleIndex + 1) % 7 };
            updated.lastWasRestDay = true;

            const potentialAnim = resolveAchievementType(updated, before, profile);
            if (potentialAnim && potentialAnim !== "daily_lit" && potentialAnim !== "daily_unfreeze") {
              updated.deferredAnimation = potentialAnim;
            }
          }
        }

        if (JSON.stringify(updated) !== JSON.stringify(profile)) {
          setProfile(updated);
          await saveProfile(updated);
        }
      } catch (err) {
        console.error("Profile self-healing failed:", err);
      } finally {
        setHealing(false);
      }
    }

    healProfile();
  }, [user?.uid]);

  if (loading || healing || !profile) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center">
        <div className="kinetic-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  const phaseName = getUserPhase(profile);

  function handleNodeTap() {
    router.push("/workout");
  }

  return (
    <div className="px-3 py-6 md:px-0 md:py-6 max-w-2xl mx-auto flex flex-col gap-6">
      {/* User Profile Card Header */}
      <div className="bg-[#0C0C12] border border-[#1A1A26] rounded-3xl p-4 md:p-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3 md:gap-4">
          {profile.photoURL ? (
            <img
              src={profile.photoURL}
              alt="User photo"
              referrerPolicy="no-referrer"
              className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-indigo-500/40"
            />
          ) : (
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#121218] border-2 border-indigo-500/40 flex items-center justify-center">
              <UserIcon size={20} className="text-indigo-400" />
            </div>
          )}
          <div>
            <h2 className="text-sm md:text-lg font-bold text-white font-display">
              {profile.displayName || "Athlete"}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] md:text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-sky-400/10 border border-sky-400/30 text-sky-400">
                🌱 {phaseName}
              </span>
              <span className="text-[10px] md:text-xs text-[#71717A] font-mono">
                Day {profile.currentStreak || 1}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs md:text-sm font-extrabold font-mono text-indigo-400">
            {profile.currentStreak} 🔥
          </p>
          <p className="text-[9px] md:text-[10px] text-[#646473] font-mono uppercase tracking-wider">
            Streak
          </p>
        </div>
      </div>

      {/* Header Title for Desktop */}
      <div className="hidden md:flex flex-col gap-1 border-b border-[#1A1A26] pb-3">
        <h1 className="font-display font-black text-2xl tracking-tight">Kinetic Sequence</h1>
        <p className="text-xs text-[#646473] font-mono uppercase tracking-wider">
          Weekly progression timeline and neuromuscular calibration
        </p>
      </div>

      {/* STACKED HORIZONTAL ROADMAP CONTAINER */}
      <div className="bg-[#0C0C12]/40 border border-[#1A1A26]/80 rounded-3xl p-4 md:p-8 shadow-xl">
        <p className="text-[10px] font-mono font-bold text-[#646473] uppercase tracking-wider mb-4 text-center">
          7-Day Training Cycle
        </p>

        <div className="flex items-center justify-between w-full">
          {WEEKLY_SCHEDULE.map((node, i) => {
            const today = format(new Date(), "yyyy-MM-dd");
            const state = getNodeState(i, profile.currentScheduleIndex, profile.lastCompletedDate, today);
            const level = node.type !== "rest"
              ? profile.progressionLevels[node.type as "push" | "pull" | "legs_core"]?.level
              : undefined;

            return (
              <React.Fragment key={i}>
                <RoadmapNode
                  state={state}
                  nodeType={node.type}
                  label={node.label}
                  level={level}
                  onTap={handleNodeTap}
                />
                {i < WEEKLY_SCHEDULE.length - 1 && (
                  <HorizontalNodeConnector completed={state === "completed"} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Shield Usage Notification Popup */}
      <AnimatePresence>
        {profile.lastShieldUsedNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md bg-[#121218] border border-amber-500/40 rounded-2xl p-4 shadow-[0_0_30px_rgba(245,158,11,0.2)] flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">
                🛡️
              </div>
              <div>
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Shield Protection Activated
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  A <span className="text-white font-bold capitalize">{profile.lastShieldUsedNotification.shieldType} Shield</span> was used for {profile.lastShieldUsedNotification.date} to protect your streak!
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const updated = { ...profile, lastShieldUsedNotification: null };
                setProfile(updated);
                saveProfile(updated).catch(console.error);
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs transition-colors shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <StreakAnimation
        type={animType}
        streakCount={profile.currentStreak}
        startColorBlue={profile.lastWasRestDay}
        onComplete={() => {
          const isMilestone = ["weekly_complete", "monthly_complete", "yearly_complete", "shield_silver_convert"].includes(animType || "");
          setAnimType(null);
          if (pendingFeedbackProfile || isMilestone) {
            setShowWeightModal(true);
          }

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
