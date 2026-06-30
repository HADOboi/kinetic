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
import { WEEKLY_SCHEDULE } from "../../core/exerciseMatrix";
import { RoutineType } from "../../core/types";

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
  const todayNode  = WEEKLY_SCHEDULE[profile.currentScheduleIndex ?? 0] || WEEKLY_SCHEDULE[0];
  const dailyLabel = todayNode.type === "rest" ? "Rest" : todayNode.label;
  const currentLevel = todayNode.type !== "rest"
    ? profile.progressionLevels[todayNode.type as RoutineType]?.level
    : undefined;

  // Track shield-protected dates & rest dates
  const shieldDates: string[] = Object.keys(profile.manualShieldCalendar || {});
  const restDates: string[] = []; // In future pages we can define specific manual rest dates if tracked

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
              restDates={restDates}
            />
          </div>

          {/* Side Context Block (Right Column) */}
          <div className="flex flex-col gap-6">
            {/* Shield bank */}
            <ShieldBank shields={profile.shields} />

            {/* Equipment chest */}
            <EquipmentChest
              profile={profile}
              onUpdate={(updated) => {
                setProfile(updated);
              }}
            />

            {/* Phase info */}
            <div className="bg-[#0C0C12] border border-[#1A1A26] rounded-2xl p-5 shadow-lg">
              <p className="text-[10px] font-mono font-bold text-[#646473] uppercase tracking-wider mb-2.5">Current Phase</p>
              <p className={`text-sm font-extrabold font-display ${
                profile.currentPhase === "conditioning"    ? "text-sky-400" :
                profile.currentPhase === "calibration"    ? "text-amber-500" :
                "text-emerald-400"
              }`}>
                {{
                  conditioning:    "🌱 Conditioning — weeks 1-2 baseline",
                  calibration:     "🧪 Calibration — week 3 max testing",
                  infinite_overload: "⚡ Infinite Overload — feedback driven",
                }[profile.currentPhase || "conditioning"]}
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
