"use client";
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../core/firebase";
import { useAuth } from "../../context/AuthContext";
import { useStreakEngine } from "../../hooks/useStreakEngine";
import Header from "../../components/layout/Header";
import BottomNav from "../../components/layout/BottomNav";
import AppShell from "../../components/layout/AppShell";
import WeightChart from "../../components/analytics/WeightChart";
import CompletionGrid from "../../components/analytics/CompletionGrid";
import ShieldBank from "../../components/dashboard/ShieldBank";
import EquipmentChest from "../../components/dashboard/EquipmentChest";
import WeightModal from "../../components/dashboard/WeightModal";
import ResetButton from "../../components/dashboard/ResetButton";
import { WEEKLY_SCHEDULE, getAthletePhaseInfo } from "../../core/exerciseMatrix";
import { RoutineType } from "../../core/types";
import { format } from "date-fns";

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

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, setProfile, loading } = useAuth();
  const { getFireState } = useStreakEngine();
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const [showWeightModal, setShowWeightModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    async function fetchLogs() {
      if (user!.uid === "demo_athlete") {
        const offlineLogsKey = `workout_logs_${user!.uid}`;
        const existingOffline = localStorage.getItem(offlineLogsKey);
        if (existingOffline) {
          try {
            const list = JSON.parse(existingOffline);
            const dates = list.map((l: any) => l.date as string);
            setCompletedDates(dates);
          } catch (_) {}
        }
        return;
      }
      try {
        const q = query(
          collection(db, "workoutLogs"),
          where("userId", "==", user!.uid)
        );
        const snap = await getDocs(q);
        const dates = snap.docs.map((d) => d.data().date as string);
        setCompletedDates(dates);
      } catch (e) {
        console.error("Failed to fetch logs:", e);
      }
    }
    fetchLogs();
  }, [user]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center">
        <div className="kinetic-pulse w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const streakCount = profile.currentStreak ?? 0;
  const fireState = getFireState(profile);
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isCompletedToday = profile.lastCompletedDate === todayStr;
  const effectiveTodayIndex = isCompletedToday
    ? (profile.currentScheduleIndex - 1 + 7) % 7
    : (profile.currentScheduleIndex ?? 0);
  const todayNode  = WEEKLY_SCHEDULE[effectiveTodayIndex] || WEEKLY_SCHEDULE[0];
  const dailyLabel = todayNode.type === "rest" ? "Rest" : todayNode.label;
  const currentLevel = todayNode.type !== "rest"
    ? profile.progressionLevels[todayNode.type as RoutineType]?.level
    : undefined;

  const athletePhase = getAthletePhaseInfo(profile);

  // Compute shield-protected dates & rest dates
  const shieldDates: string[] = Object.keys(profile.manualShieldCalendar || {});
  
  // Calculate rest dates based on workout logs & weekly cadence
  const restDates = React.useMemo(() => {
    const dates: string[] = [];
    if (!profile.lastCompletedDate && completedDates.length === 0) {
      // If current day is rest day, include today
      if (todayNode.type === "rest") {
        dates.push(new Date().toISOString().slice(0, 10));
      }
      return dates;
    }

    // Trace past completed workout days and infer the corresponding rest days
    const completedSet = new Set(completedDates);
    const shieldSet = new Set(shieldDates);

    // If last completed day was a rest day, add today/relevant dates
    if (todayNode.type === "rest") {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (!completedSet.has(todayStr) && !shieldSet.has(todayStr)) {
        dates.push(todayStr);
      }
    }

    // Also look at all dates in the past 90 days
    const now = new Date();
    for (let i = 1; i <= 60; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      if (!completedSet.has(ds) && !shieldSet.has(ds)) {
        // If it was part of an active streak window, classify rest
        if (profile.lastCompletedDate && ds <= profile.lastCompletedDate) {
          // In an unbroken or simulated streak, every 3rd or 7th day is rest
          const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= profile.currentStreak) {
            dates.push(ds);
          }
        }
      }
    }
    return dates;
  }, [profile, completedDates, shieldDates, todayNode]);

  return (
    <AppShell>
      <Header
        dailyState={dailyLabel}
        currentLevel={currentLevel}
        streakCount={streakCount}
        fireState={fireState}
        userPhotoURL={profile.photoURL}
        hasEternalAura={profile.shields?.goldenUnlocked}
      />

      <main className="pt-16 pb-24 px-4 md:px-0 flex flex-col gap-6 min-h-screen md:pt-6">

        {/* Header Title for Desktop */}
        <div className="hidden md:flex flex-col gap-1.5 border-b border-[#1A1A26] pb-4 mb-2">
          <h1 className="font-display font-black text-3xl tracking-tight">Performance Hub</h1>
          <p className="text-xs text-[#646473] font-mono uppercase tracking-wider">
            Real-time biometric monitoring and routine scaling
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Push Lv", value: `${profile.progressionLevels?.push?.level ?? 1}`, color: "text-[#6366F1]" },
            { label: "Pull Lv", value: `${profile.progressionLevels?.pull?.level ?? 1}`, color: "text-[#A78BFA]" },
            { label: "Legs & Core Lv", value: `${profile.progressionLevels?.legs_core?.level ?? 1}`, color: "text-[#10B981]" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#0C0C12] border border-[#1A1A26] rounded-2xl p-4 text-center shadow-md transition-all hover:border-[#2A2A3C]">
              <p className={`text-3xl font-mono font-extrabold ${color}`}>{value}</p>
              <p className="text-[10px] text-[#646473] font-mono uppercase tracking-wider mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Responsive Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Analytics Block (Left Column) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Weight chart */}
            <WeightChart
              entries={profile.weightLog || []}
              onLogClick={() => setShowWeightModal(true)}
            />

            {/* Completion grid */}
            <CompletionGrid
              completedDates={completedDates}
              shieldDates={shieldDates}
              shieldUsageMap={profile.manualShieldCalendar || {}}
              restDates={restDates}
            />
          </div>

          {/* Side Context Block (Right Column) */}
          <div className="flex flex-col gap-6">
            {/* Shield bank */}
            <ShieldBank
              shields={profile.shields}
              profile={profile}
              onUpdate={(updated) => setProfile(updated)}
            />

            {/* Equipment chest */}
            <EquipmentChest
              profile={profile}
              onUpdate={(updated) => {
                setProfile(updated);
              }}
            />

            {/* Phase info */}
            <div className="bg-[#0C0C12] border border-[#1A1A26] rounded-2xl p-5 shadow-lg flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono font-bold text-[#646473] uppercase tracking-wider">Current Phase</p>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${athletePhase.colorClass}`}>
                  {athletePhase.badge}
                </span>
              </div>
              <p className="text-sm font-extrabold font-display text-white">
                {athletePhase.name}
              </p>
              <p className="text-xs text-[#A3A3B3] leading-relaxed">
                {athletePhase.description}
              </p>
            </div>

            {/* System Controls - Reset data */}
            <div className="flex flex-col items-center justify-center mt-4 border-t border-[#1A1A26] pt-5">
              <p className="text-[10px] text-[#646473] font-mono uppercase tracking-wider mb-2">System Controls</p>
              <ResetButton />
            </div>
          </div>
        </div>

      </main>

      <BottomNav currentPath="/dashboard" />

      {/* Weight Log Modal */}
      {showWeightModal && (
        <WeightModal
          profile={profile}
          onSave={(kg) => {
            const today = new Date().toISOString().slice(0, 10);
            const updated = {
              ...profile,
              weightLog: [...(profile.weightLog || []), { date: today, kg }],
            };
            setProfile(updated);
            setShowWeightModal(false);
          }}
          onSkip={() => setShowWeightModal(false)}
        />
      )}
    </AppShell>
  );
}
