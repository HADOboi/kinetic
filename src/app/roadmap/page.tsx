"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import { useStreakEngine, getDaysBetweenDates, reconstructProfile } from "../../hooks/useStreakEngine";
import { saveProfile } from "../../core/firestore";
import { WEEKLY_SCHEDULE, getAthletePhaseInfo } from "../../core/exerciseMatrix";
import { KineticProfile, NodeState, ScheduleNodeType } from "../../core/types";
import StreakAnimation, { StreakAnimationType } from "../../components/animations/StreakAnimation";
import WeightModal from "../../components/dashboard/WeightModal";
import { Check, Lock, Play, Sparkles, ChevronRight, Zap, Dumbbell, ShieldCheck, Flame } from "lucide-react";

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

// ─── Node state derivation ───────────────────────────────────────────
function getNodeState(
  nodeIndex: number,
  currentScheduleIndex: number,
  lastCompletedDate: string,
  todayStr: string
): NodeState {
  if (nodeIndex < currentScheduleIndex) return "completed";
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

// ─── Horizontal Node Component ────────────────────────────────────────
function HorizontalNode({
  index,
  state,
  nodeType,
  label,
  level,
  isCurrent,
  onTap,
}: {
  index: number;
  state: NodeState;
  nodeType: ScheduleNodeType;
  label: string;
  level?: number;
  isCurrent: boolean;
  onTap?: () => void;
}) {
  const isRest = nodeType === "rest";

  const getBorderColor = () => {
    if (state === "completed") return "border-emerald-500/50 bg-emerald-950/20 text-emerald-400";
    if (state === "active") return "border-indigo-500 bg-indigo-600/20 text-white ring-2 ring-indigo-500/40";
    if (state === "rest_auto" || isRest) return "border-sky-500/40 bg-sky-950/20 text-sky-400";
    return "border-[#1E1E2C] bg-[#0C0C14] text-[#525263]";
  };

  const getIcon = () => {
    if (state === "completed") return <Check size={14} strokeWidth={3} className="text-emerald-400" />;
    if (state === "active") return <Play size={12} className="text-white fill-white ml-0.5" />;
    if (isRest) return <Sparkles size={12} className="text-sky-400 fill-sky-400/20" />;
    return <Lock size={11} className="text-[#525263]" />;
  };

  return (
    <div className="flex-1 flex flex-col items-center min-w-0">
      <motion.button
        onClick={state === "active" ? onTap : undefined}
        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center border transition-all duration-300 ${getBorderColor()} ${state === "active" ? "cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.4)] scale-105" : "cursor-default"}`}
        animate={state === "active" ? { scale: [1.02, 1.08, 1.02] } : {}}
        transition={state === "active" ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
        whileTap={state === "active" ? { scale: 0.94 } : {}}
      >
        {getIcon()}
      </motion.button>

      <div className="mt-2 text-center w-full px-0.5">
        <p className={`text-[10px] sm:text-[11px] font-mono font-bold truncate leading-tight ${isCurrent ? "text-indigo-300" : state === "completed" ? "text-emerald-400" : "text-[#717182]"}`}>
          D{index + 1}
        </p>
        <p className={`text-[9px] font-sans truncate font-medium mt-0.5 ${isCurrent ? "text-white font-semibold" : "text-[#525263]"}`}>
          {isRest ? "Rest" : label.replace("Upper (", "").replace("Lower (", "").replace(")", "")}
        </p>
      </div>
    </div>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────
export default function RoadmapPage() {
  const router = useRouter();
  const { user, profile, setProfile, loading } = useAuth();
  const { processMissedDays, completeDay, getFireState, applyAbsenceRegression } = useStreakEngine();

  const [animType, setAnimType] = useState<StreakAnimationType>(null);
  const [healing, setHealing] = useState(true);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [pendingFeedbackProfile, setPendingFeedbackProfile] = useState<KineticProfile | null>(null);

  // Read search param on mount with robust storage fallbacks
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
    if (s % 30 === 0 && s > 0) {
      setAnimType("monthly_complete"); return;
    }
    if (s % 7 === 0 && s > 0) {
      if (updated.shields.silver > (profile?.shields.silver ?? 0)) {
        setAnimType("shield_silver_convert");
      } else {
        setAnimType("weekly_complete");
      }
      setPendingFeedbackProfile(updated);
      return;
    }
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

  // Process missed days and self-heal on load with foolproof fallbacks
  useEffect(() => {
    if (!user) {
      if (!loading) setHealing(false);
      return;
    }
    if (!profile) return;

    let isMounted = true;
    async function healProfile() {
      try {
        let logs: any[] = [];
        if (user!.uid === "demo_athlete") {
          const offlineLogsKey = `workout_logs_${user!.uid}`;
          const existingOffline = localStorage.getItem(offlineLogsKey);
          if (existingOffline) {
            logs = JSON.parse(existingOffline);
          }
        } else {
          try {
            const { collection, query, where, getDocs } = await import("firebase/firestore");
            const { db } = await import("../../core/firebase");
            const q = query(collection(db, "workoutLogs"), where("userId", "==", user!.uid));
            const snap = await getDocs(q);
            logs = snap.docs.map(doc => doc.data());
          } catch (e) {
            console.warn("Firestore logs fetch failed, using local offline fallback:", e);
            const offlineLogsKey = `workout_logs_${user!.uid}`;
            const existingOffline = localStorage.getItem(offlineLogsKey);
            if (existingOffline) {
              logs = JSON.parse(existingOffline);
            }
          }
        }

        if (!isMounted) return;

        let updated = reconstructProfile(profile!, logs);
        updated = applyAbsenceRegression(updated);

        // Detect streak break
        if (profile!.currentStreak > 0 && updated.currentStreak === 0) {
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
            updated.lastWasRestDay = true;

            const potentialAnim = resolveAchievementType(updated, before, profile);
            if (potentialAnim && potentialAnim !== "daily_lit" && potentialAnim !== "daily_unfreeze") {
              updated.deferredAnimation = potentialAnim;
            }
          }
        }

        if (isMounted) {
          if (JSON.stringify(updated) !== JSON.stringify(profile)) {
            setProfile(updated);
            await saveProfile(updated);
          }
          setHealing(false);
        }
      } catch (err) {
        console.error("Profile self-healing failed:", err);
        if (isMounted) setHealing(false);
      }
    }

    healProfile();

    // Emergency safeguard timer against stuck loading
    const timer = setTimeout(() => {
      if (isMounted) setHealing(false);
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [user?.uid, Boolean(profile)]);

  if (loading || (healing && !profile)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-[11px] font-mono uppercase tracking-widest text-[#717182]">
          Calibrating Kinetic Sequence...
        </p>
      </div>
    );
  }

  if (!profile) return null;

  const today = format(new Date(), "yyyy-MM-dd");
  const isCompletedToday = profile.lastCompletedDate === today;
  const todayCompletedIndex = (profile.currentScheduleIndex - 1 + 7) % 7;
  const effectiveTodayIndex = isCompletedToday ? todayCompletedIndex : (profile.currentScheduleIndex ?? 0);
  const todayNode = WEEKLY_SCHEDULE[effectiveTodayIndex] || WEEKLY_SCHEDULE[0];
  const nextNode = WEEKLY_SCHEDULE[profile.currentScheduleIndex ?? 0] || WEEKLY_SCHEDULE[0];
  const currentNodeState = getNodeState(effectiveTodayIndex, profile.currentScheduleIndex ?? 0, profile.lastCompletedDate, today);
  const currentLevel = todayNode.type !== "rest"
    ? profile.progressionLevels[todayNode.type as "push" | "pull" | "legs_core"]?.level
    : undefined;

  const athletePhase = getAthletePhaseInfo(profile);

  function handleLaunchSession() {
    router.push("/workout");
  }

  // Segment 7 days into horizontal layout
  const daysRow1 = WEEKLY_SCHEDULE.slice(0, 4);
  const daysRow2 = WEEKLY_SCHEDULE.slice(4, 7);

  return (
    <div className="px-4 py-4 md:px-0 md:py-6 flex flex-col gap-6 max-w-4xl mx-auto w-full select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#1A1A26] pb-4">
        <h1 className="font-display font-black text-2xl md:text-3xl tracking-tight text-white">
          Weekly Trajectory
        </h1>
        <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${athletePhase.colorClass}`}>
          {athletePhase.badge}
        </span>
      </div>

      {/* ─── STACKED HORIZONTAL SCHEDULE MAP ─── */}
      <div className="bg-[#0C0C12] border border-[#1A1A26] rounded-3xl p-5 md:p-6 shadow-xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-[#161622] pb-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#A3A3B3]">
            7-Day Sequence Grid
          </span>
          <span className="text-[10px] font-mono text-[#6366F1]">
            {isCompletedToday 
              ? `Step ${effectiveTodayIndex + 1} of 7 Completed Today · Next: Step ${(profile.currentScheduleIndex ?? 0) + 1} Tomorrow` 
              : `Step ${(profile.currentScheduleIndex ?? 0) + 1} of 7 Active`}
          </span>
        </div>

        {/* Desktop View: Single 7-node continuous horizontal bar */}
        <div className="hidden md:flex items-center justify-between gap-2 relative">
          {WEEKLY_SCHEDULE.map((node, i) => {
            const state = getNodeState(i, profile.currentScheduleIndex ?? 0, profile.lastCompletedDate, today);
            const level = node.type !== "rest"
              ? profile.progressionLevels[node.type as "push" | "pull" | "legs_core"]?.level
              : undefined;
            const isCurrent = isCompletedToday ? i === effectiveTodayIndex : i === (profile.currentScheduleIndex ?? 0);

            return (
              <React.Fragment key={i}>
                <HorizontalNode
                  index={i}
                  state={state}
                  nodeType={node.type}
                  label={node.label}
                  level={level}
                  isCurrent={isCurrent}
                  onTap={handleLaunchSession}
                />
                {i < WEEKLY_SCHEDULE.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 rounded-full transition-colors ${
                    i < (profile.currentScheduleIndex ?? 0) ? "bg-emerald-500/50" : "bg-[#1A1A26]"
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile View: Stacked 2-row horizontal layout (no scrolling needed!) */}
        <div className="md:hidden flex flex-col gap-4">
          {/* Row 1: Days 1 - 4 */}
          <div className="flex items-center justify-between gap-1">
            {daysRow1.map((node, i) => {
              const state = getNodeState(i, profile.currentScheduleIndex ?? 0, profile.lastCompletedDate, today);
              const level = node.type !== "rest"
                ? profile.progressionLevels[node.type as "push" | "pull" | "legs_core"]?.level
                : undefined;
              const isCurrent = isCompletedToday ? i === effectiveTodayIndex : i === (profile.currentScheduleIndex ?? 0);

              return (
                <React.Fragment key={i}>
                  <HorizontalNode
                    index={i}
                    state={state}
                    nodeType={node.type}
                    label={node.label}
                    level={level}
                    isCurrent={isCurrent}
                    onTap={handleLaunchSession}
                  />
                  {i < 3 && (
                    <div className={`h-0.5 flex-1 mx-0.5 rounded-full ${
                      i < (profile.currentScheduleIndex ?? 0) ? "bg-emerald-500/50" : "bg-[#1A1A26]"
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Row 2: Days 5 - 7 */}
          <div className="flex items-center justify-between gap-1 pt-2 border-t border-[#14141E]">
            {daysRow2.map((node, idx) => {
              const i = idx + 4;
              const state = getNodeState(i, profile.currentScheduleIndex ?? 0, profile.lastCompletedDate, today);
              const level = node.type !== "rest"
                ? profile.progressionLevels[node.type as "push" | "pull" | "legs_core"]?.level
                : undefined;
              const isCurrent = isCompletedToday ? i === effectiveTodayIndex : i === (profile.currentScheduleIndex ?? 0);

              return (
                <React.Fragment key={i}>
                  <HorizontalNode
                    index={i}
                    state={state}
                    nodeType={node.type}
                    label={node.label}
                    level={level}
                    isCurrent={isCurrent}
                    onTap={handleLaunchSession}
                  />
                  {idx < 2 && (
                    <div className={`h-0.5 flex-1 mx-0.5 rounded-full ${
                      i < (profile.currentScheduleIndex ?? 0) ? "bg-emerald-500/50" : "bg-[#1A1A26]"
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── ACTIVE DAILY PROTOCOL CARD ─── */}
      <div className={`bg-[#0C0C12] border rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all ${
        isCompletedToday
          ? "border-emerald-500/30 bg-gradient-to-b from-[#0A1612] to-[#0C0C12]"
          : currentNodeState === "active" 
          ? "border-indigo-500/40 bg-gradient-to-b from-[#0F0E1D] to-[#0C0C12]" 
          : todayNode.type === "rest"
          ? "border-sky-500/30 bg-gradient-to-b from-[#0B151F] to-[#0C0C12]"
          : "border-[#1A1A26]"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isCompletedToday
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : currentNodeState === "active"
                ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                : todayNode.type === "rest"
                ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            }`}>
              {isCompletedToday ? (
                <Check size={22} strokeWidth={3} />
              ) : currentNodeState === "active" ? (
                <Dumbbell size={22} className="animate-pulse" />
              ) : todayNode.type === "rest" ? (
                <Sparkles size={22} />
              ) : (
                <Check size={22} strokeWidth={3} />
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#717182]">
                  {isCompletedToday 
                    ? `DAY ${effectiveTodayIndex + 1} PROTOCOL · COMPLETED TODAY`
                    : `DAY ${effectiveTodayIndex + 1} PROTOCOL`}
                </span>
                {currentLevel && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    LV.{currentLevel}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold font-display text-white mt-0.5">
                {todayNode.type === "rest" ? "Rest & Neural Recovery" : todayNode.label}
              </h2>
              <p className="text-xs text-[#A3A3B3] mt-1 leading-relaxed max-w-md">
                {isCompletedToday
                  ? `Today's ${todayNode.label} protocol is complete and logged. Rest and recover before tomorrow's ${nextNode.label} session.`
                  : todayNode.type === "rest"
                  ? "Neuromuscular regeneration day. Active recovery keeps your kinetic streak intact automatically."
                  : "Target compound movement chains ready. Tap below to launch your guided session."}
              </p>
            </div>
          </div>

          <div className="flex items-center sm:self-center">
            {isCompletedToday ? (
              <div className="flex flex-col sm:items-end gap-1.5 w-full sm:w-auto">
                <div className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono font-bold flex items-center justify-center gap-2">
                  <Check size={14} strokeWidth={3} />
                  <span>Completed for Today</span>
                </div>
                <span className="text-[10px] font-mono text-[#717182] text-center sm:text-right">
                  Next: {nextNode.label} (Tomorrow)
                </span>
              </div>
            ) : currentNodeState === "active" ? (
              <button
                onClick={handleLaunchSession}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95 cursor-pointer"
              >
                <Play size={16} className="fill-white" />
                <span>Start Workout</span>
                <ChevronRight size={16} />
              </button>
            ) : todayNode.type === "rest" ? (
              <div className="px-4 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-mono font-bold flex items-center gap-2">
                <Sparkles size={14} />
                <span>Rest Day Protected</span>
              </div>
            ) : (
              <div className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2">
                <Check size={14} strokeWidth={3} />
                <span>Completed for Today</span>
              </div>
            )}
          </div>
        </div>
      </div>

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
