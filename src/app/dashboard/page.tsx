"use client";
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../core/firebase";
import { useAuth } from "../../context/AuthContext";
import WeightChart from "../../components/analytics/WeightChart";
import CompletionGrid from "../../components/analytics/CompletionGrid";
import ShieldBank from "../../components/dashboard/ShieldBank";
import EquipmentChest from "../../components/dashboard/EquipmentChest";
import WeightModal from "../../components/dashboard/WeightModal";
import ResetButton from "../../components/dashboard/ResetButton";
import { WEEKLY_SCHEDULE, getAthletePhaseInfo } from "../../core/exerciseMatrix";
import { KineticProfile, RoutineType } from "../../core/types";
import { format } from "date-fns";
import { Bell, Shield, X, CheckCircle2 } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";

interface DashboardPageProps {
  onNavigate?: (path: string) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps = {}) {
  const { user, profile, setProfile, loading } = useAuth();
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const [showWeightModal, setShowWeightModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      if (onNavigate) {
        onNavigate("/");
      } else {
        try {
          window.history.replaceState(null, "", "/");
        } catch (e) {
          console.warn("History replaceState blocked:", e);
        }
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    }
  }, [user, loading, onNavigate]);

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
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="kinetic-pulse w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isCompletedToday = profile.lastCompletedDate === todayStr;
  const effectiveTodayIndex = isCompletedToday
    ? (profile.currentScheduleIndex - 1 + 7) % 7
    : (profile.currentScheduleIndex ?? 0);
  const todayNode = WEEKLY_SCHEDULE[effectiveTodayIndex] || WEEKLY_SCHEDULE[0];

  const athletePhase = getAthletePhaseInfo(profile);

  const handleDismissNotification = async () => {
    if (!profile) return;
    const consumedDate = profile.lastShieldConsumed?.date || null;
    const updated: KineticProfile = {
      ...profile,
      lastShieldConsumed: null,
      dismissedShieldDate: consumedDate,
    };
    setProfile(updated);

    try {
      if (profile.userId === "demo_athlete") {
        localStorage.setItem(`profile_${profile.userId}`, JSON.stringify(updated));
        localStorage.setItem("profile_demo_athlete", JSON.stringify(updated));
      } else {
        await updateDoc(doc(db, "kineticProfiles", profile.userId), {
          lastShieldConsumed: null,
          dismissedShieldDate: consumedDate,
        });
      }
    } catch (e) {
      console.error("Failed to dismiss notification:", e);
    }
  };

  // Compute shield-protected dates & rest dates
  const shieldDates: string[] = Object.keys(profile.manualShieldCalendar || {});
  
  // Calculate rest dates based on workout logs & weekly cadence
  const restDates = React.useMemo(() => {
    const dates: string[] = [];
    if (!profile.lastCompletedDate && completedDates.length === 0) {
      if (todayNode.type === "rest") {
        dates.push(new Date().toISOString().slice(0, 10));
      }
      return dates;
    }

    const completedSet = new Set(completedDates);
    const shieldSet = new Set(shieldDates);

    if (todayNode.type === "rest") {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (!completedSet.has(todayStr) && !shieldSet.has(todayStr)) {
        dates.push(todayStr);
      }
    }

    const now = new Date();
    for (let i = 1; i <= 60; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      if (!completedSet.has(ds) && !shieldSet.has(ds)) {
        if (profile.lastCompletedDate && ds <= profile.lastCompletedDate) {
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
    <div className="px-4 py-4 md:px-0 md:py-6 flex flex-col gap-6 max-w-4xl mx-auto w-full select-none">
      {/* Header Title for Desktop & Mobile */}
      <div className="flex items-center justify-between border-b border-[#1A1A26] pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display font-black text-2xl md:text-3xl tracking-tight text-white">Performance Hub</h1>
          <p className="text-xs text-[#646473] font-mono uppercase tracking-wider">
            Real-time biometric monitoring and routine scaling
          </p>
        </div>
        <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${athletePhase.colorClass}`}>
          {athletePhase.badge}
        </span>
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

      {/* Notifications Section */}
      <div className="bg-[#0C0C12] border border-[#1A1A26] rounded-2xl p-5 shadow-lg flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-[#1A1A26] pb-3">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-indigo-400" />
            <h2 className="text-sm font-bold font-display text-white uppercase tracking-wider">
              Notifications & Alerts
            </h2>
          </div>
          {profile.lastShieldConsumed && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
              1 New Alert
            </span>
          )}
        </div>

        {profile.lastShieldConsumed ? (
          <div className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
            profile.lastShieldConsumed.type === "golden"
              ? "bg-yellow-950/40 border-yellow-500/30 text-yellow-100"
              : profile.lastShieldConsumed.type === "silver"
              ? "bg-slate-900/60 border-slate-400/30 text-slate-100"
              : "bg-amber-950/40 border-amber-600/30 text-amber-100"
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${
                profile.lastShieldConsumed.type === "golden"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : profile.lastShieldConsumed.type === "silver"
                  ? "bg-slate-500/20 text-slate-200"
                  : "bg-amber-600/20 text-amber-400"
              }`}>
                <Shield size={18} />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    {profile.lastShieldConsumed.type} Shield Deployed
                  </span>
                  <span className="text-[10px] opacity-70 font-mono">
                    ({profile.lastShieldConsumed.date})
                  </span>
                </div>
                <p className="text-xs text-[#D4D4D8] leading-relaxed">
                  {profile.lastShieldConsumed.type === "golden"
                    ? "Your permanent Golden Shield absorbed your missed workout date and protected your streak."
                    : `A ${profile.lastShieldConsumed.type} shield was consumed automatically to protect your unbroken streak during an unlogged workout day.`}
                </p>
              </div>
            </div>
            <button
              onClick={handleDismissNotification}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer flex-shrink-0"
              title="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 py-2 text-xs text-[#717182] font-mono">
            <CheckCircle2 size={15} className="text-emerald-500/70" />
            <span>No pending alerts. All streak protections active and operational.</span>
          </div>
        )}
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
    </div>
  );
}
