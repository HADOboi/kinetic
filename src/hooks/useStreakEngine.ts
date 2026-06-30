import { useCallback } from "react";
import { format } from "date-fns";
import { KineticProfile } from "../core/types";
import { WEEKLY_SCHEDULE } from "../core/exerciseMatrix";

// Bulletproof helper to find calendar days difference between two "YYYY-MM-DD" date strings
export function getDaysBetweenDates(dateStr1: string, dateStr2: string): number {
  if (!dateStr1 || !dateStr2) return 0;
  
  const [y1, m1, d1] = dateStr1.split("-").map(Number);
  const [y2, m2, d2] = dateStr2.split("-").map(Number);
  
  if (isNaN(y1) || isNaN(m1) || isNaN(d1) || isNaN(y2) || isNaN(m2) || isNaN(d2)) {
    return 0;
  }
  
  // Construct Date objects in the local timezone at exactly 00:00:00
  const date1 = new Date(y1, m1 - 1, d1);
  const date2 = new Date(y2, m2 - 1, d2);
  
  const diffTime = date1.getTime() - date2.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  return isNaN(diffDays) ? 0 : diffDays;
}

export function useStreakEngine() {

  const todayStr = () => format(new Date(), "yyyy-MM-dd");

  /**
   * Called on login / app open.
   * Checks missed days since lastCompletedDate.
   * Burns shields or breaks streak accordingly.
   * Returns updated profile (caller must setState + saveProfile).
   */
  const processMissedDays = useCallback((profile: KineticProfile): KineticProfile => {
    if (!profile.lastCompletedDate) return profile;
    const today = todayStr();
    if (profile.lastCompletedDate === today) return profile;

    const missedDays = getDaysBetweenDates(today, profile.lastCompletedDate) - 1; // subtract 1 because today itself is not missed

    if (missedDays <= 0) return profile;

    let p = { ...profile, shields: { ...profile.shields } };

    // Check manual shield calendar first
    let daysToAbsorb = missedDays;
    let manualCal = p.manualShieldCalendar ? { ...p.manualShieldCalendar } : {};
    for (let i = 1; i <= missedDays; i++) {
      const [y, m, d] = profile.lastCompletedDate.split("-").map(Number);
      const nextDate = new Date(y, m - 1, d + i);
      const checkDate = format(nextDate, "yyyy-MM-dd");
      
      if (manualCal[checkDate]) {
        const type = manualCal[checkDate];
        if (type === "bronze" && p.shields.bronze > 0) {
          p.shields.bronze -= 1;
          daysToAbsorb -= 1;
          delete manualCal[checkDate];
        } else if (type === "silver" && p.shields.silver > 0) {
          p.shields.silver -= 1;
          daysToAbsorb = Math.max(0, daysToAbsorb - 3);
          delete manualCal[checkDate];
        }
      }
    }
    p.manualShieldCalendar = manualCal;

    if (daysToAbsorb <= 0) return p;

    // Auto-burn Bronze (1 per missed day)
    while (daysToAbsorb > 0 && p.shields.bronze > 0) {
      p.shields.bronze -= 1;
      daysToAbsorb -= 1;
    }

    if (daysToAbsorb <= 0) return p;

    // Auto-burn Silver (1 silver = up to 3 days)
    while (daysToAbsorb > 0 && p.shields.silver > 0) {
      p.shields.silver -= 1;
      daysToAbsorb = Math.max(0, daysToAbsorb - 3);
    }

    if (daysToAbsorb <= 0) return p;

    // No shields left — break streak
    p.currentStreak = 0;
    p.lastCompletedDate = "";
    return p;
  }, []);

  /**
   * Called after a workout or rest day completes.
   * Increments streak, awards shields.
   */
  const completeDay = useCallback((profile: KineticProfile): KineticProfile => {
    const today = todayStr();
    if (profile.lastCompletedDate === today) return profile; // already done

    let p = {
      ...profile,
      currentStreak: profile.currentStreak + 1,
      lastCompletedDate: today,
      shields: { ...profile.shields },
    };

    // Bronze every 7 days
    if (p.currentStreak % 7 === 0 && p.currentStreak > 0) {
      p.shields.bronze += 1;
      if (p.shields.bronze >= 3) {
        p.shields.bronze = 1;
        if (p.shields.silver < 5) {
          p.shields.silver += 1;
        } else {
          (p as any)._silverCapTriggered = true;
        }
      }
    }

    // Silver every 28 days
    if (p.currentStreak % 28 === 0 && p.currentStreak > 0) {
      if (p.shields.silver < 5) {
        p.shields.silver += 1;
      } else {
        (p as any)._silverCapTriggered = true;
      }
    }

    // Golden at 365
    if (p.currentStreak >= 365 && !p.shields.goldenUnlocked) {
      p.shields.goldenUnlocked = true;
    }

    return p;
  }, []);

  /**
   * Returns fire visual state based on profile.
   */
  const getFireState = useCallback((profile: KineticProfile): "greyed" | "freeze" | "lit" | "none" => {
    const today = todayStr();
    if (profile.currentStreak === 0 && !profile.lastCompletedDate) return "none";

    // Determine if today is a rest day (whether completed today or active)
    const isTodayRest = (() => {
      if (!profile) return false;
      const index = profile.currentScheduleIndex ?? 0;
      if (profile.lastCompletedDate === today) {
        // Just completed today, so the completed node was index - 1
        const completedIndex = (index - 1 + 7) % 7;
        return WEEKLY_SCHEDULE[completedIndex]?.type === "rest";
      } else {
        // Today's active node is the current index
        return WEEKLY_SCHEDULE[index]?.type === "rest";
      }
    })();

    if (isTodayRest) {
      return "freeze";
    }

    if (profile.lastCompletedDate === today) return "lit";
    
    const daysSince = getDaysBetweenDates(today, profile.lastCompletedDate || today);
    if (daysSince === 0) return "lit";
    if (daysSince === 1) return "greyed"; // today not done yet
    return "none"; // streak broken
  }, []);

  /**
   * Absence regression: called on return after long absence.
   * Mutates progressionLevels.
   */
  const applyAbsenceRegression = useCallback((profile: KineticProfile): KineticProfile => {
    if (!profile.lastCompletedDate) return profile;
    const today = todayStr();
    const missedDays = getDaysBetweenDates(today, profile.lastCompletedDate);

    if (missedDays < 6) return profile;

    let p = {
      ...profile,
      progressionLevels: {
        push:      { ...profile.progressionLevels.push },
        pull:      { ...profile.progressionLevels.pull },
        legs_core: { ...profile.progressionLevels.legs_core },
      },
    };

    if (missedDays >= 21) {
      // Demote all tracks by 1 level (min 1)
      const demote = (s: typeof p.progressionLevels.push) => ({
        ...s,
        level: Math.max(1, s.level - 1),
        currentCycle: 1,
        lastFeedback: "struggling" as const,
      });
      p.progressionLevels.push      = demote(p.progressionLevels.push);
      p.progressionLevels.pull      = demote(p.progressionLevels.pull);
      p.progressionLevels.legs_core = demote(p.progressionLevels.legs_core);
    } else {
      // 6–21 days: set lastFeedback to struggling (triggers 0.8× multiplier in workout)
      p.progressionLevels.push.lastFeedback      = "struggling";
      p.progressionLevels.pull.lastFeedback      = "struggling";
      p.progressionLevels.legs_core.lastFeedback = "struggling";
    }
    return p;
  }, []);

  return { processMissedDays, completeDay, getFireState, applyAbsenceRegression };
}
