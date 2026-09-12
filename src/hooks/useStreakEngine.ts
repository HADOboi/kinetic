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
   * Steps through each day from lastCompletedDate + 1 up to today - 1.
   * Rest days are auto-completed (increasing streak and schedule index).
   * Workout days are absorbed by shields, or break the streak.
   * Returns updated profile.
   */
  const processMissedDays = useCallback((profile: KineticProfile): KineticProfile => {
    if (!profile.lastCompletedDate) return profile;
    const today = todayStr();
    if (profile.lastCompletedDate === today) return profile;

    const missedDays = getDaysBetweenDates(today, profile.lastCompletedDate) - 1; // subtract 1 because today itself is not missed

    if (missedDays <= 0) return profile;

    let p = {
      ...profile,
      shields: { ...profile.shields },
      manualShieldCalendar: profile.manualShieldCalendar ? { ...profile.manualShieldCalendar } : {},
    };

    const [y, m, d] = profile.lastCompletedDate.split("-").map(Number);
    let silverProtectedWorkoutDaysLeft = 0;

    for (let i = 1; i <= missedDays; i++) {
      const nextDate = new Date(y, m - 1, d + i);
      const checkDate = format(nextDate, "yyyy-MM-dd");
      
      const scheduleIndex = p.currentScheduleIndex ?? 0;
      const node = WEEKLY_SCHEDULE[scheduleIndex];
      
      if (node?.type === "rest") {
        // It's a rest day! Rest day freezes streak (does NOT increment currentStreak)
        p.lastCompletedDate = checkDate;
        p.currentScheduleIndex = (scheduleIndex + 1) % 7;
        p.lastWasRestDay = true;
      } else {
        // It's a workout day!
        let absorbed = false;
        let shieldConsumedType: "bronze" | "silver" | "golden" | null = null;
        
        // 0. Golden shield is permanent and absorbs any missed day
        if (p.shields.goldenUnlocked) {
          absorbed = true;
          shieldConsumedType = "golden";
        }

        // 1. Check if we are still protected by a previously burned silver shield
        if (!absorbed && silverProtectedWorkoutDaysLeft > 0) {
          silverProtectedWorkoutDaysLeft -= 1;
          absorbed = true;
          shieldConsumedType = "silver";
        }
        
        // 2. Check manual shield calendar
        if (!absorbed && p.manualShieldCalendar && p.manualShieldCalendar[checkDate]) {
          const type = p.manualShieldCalendar[checkDate];
          if (type === "bronze") {
            absorbed = true;
            shieldConsumedType = "bronze";
          } else if (type === "silver") {
            silverProtectedWorkoutDaysLeft = 2; // absorbs this day + 2 more workout days
            absorbed = true;
            shieldConsumedType = "silver";
          }
        }
        
        // 3. Auto-burn bronze shield
        if (!absorbed && p.shields.bronze > 0) {
          p.shields.bronze -= 1;
          absorbed = true;
          shieldConsumedType = "bronze";
        }
        
        // 4. Auto-burn silver shield
        if (!absorbed && p.shields.silver > 0) {
          p.shields.silver -= 1;
          silverProtectedWorkoutDaysLeft = 2; // absorbs this day + 2 more workout days
          absorbed = true;
          shieldConsumedType = "silver";
        }
        
        if (absorbed) {
          // Shielded workout day freezes streak (does NOT increment currentStreak)
          p.lastCompletedDate = checkDate;
          p.currentScheduleIndex = (scheduleIndex + 1) % 7;
          if (shieldConsumedType) {
            p.manualShieldCalendar[checkDate] = shieldConsumedType;
            const isDismissed = (p.dismissedShieldDate === checkDate) ||
              (typeof window !== "undefined" && window.localStorage?.getItem(`kinetic_shield_dismissed_${p.userId}`) === `${checkDate}_${shieldConsumedType}`);
            if (!isDismissed) {
              p.lastShieldConsumed = { type: shieldConsumedType, date: checkDate };
            }
          }
        } else {
          // No shields left — break streak!
          p.currentStreak = 0;
          p.lastCompletedDate = "";
          break; // Stop simulation as streak is already broken
        }
      }
    }

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
        p.shields.bronze -= 3;
        if (p.shields.silver < 5) {
          p.shields.silver += 1;
        } else {
          (p as any)._silverCapTriggered = true;
        }
      }
    }

    // Silver every 30 days (updated from 28 days)
    if (p.currentStreak % 30 === 0 && p.currentStreak > 0) {
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
   * Absence regression disabled: multi-day breaks no longer trigger regression or conditioning.
   */
  const applyAbsenceRegression = useCallback((profile: KineticProfile): KineticProfile => {
    return profile;
  }, []);

  return { processMissedDays, completeDay, getFireState, applyAbsenceRegression, reconstructProfile };
}

/**
 * Reconstructs the profile's currentStreak, lastCompletedDate, currentScheduleIndex,
 * and shields from the actual history of completed workout logs.
 * This is a highly robust self-healing mechanism that recovers from any corrupted state.
 */
export function reconstructProfile(profile: KineticProfile, logs: { date: string }[]): KineticProfile {
  const logDates = Array.from(new Set(logs.map((l) => l.date)))
    .filter(Boolean)
    .sort();

  if (logDates.length === 0) {
    return {
      ...profile,
      currentStreak: 0,
      lastCompletedDate: "",
      currentScheduleIndex: 0,
      shields: { bronze: 0, silver: 0, goldenUnlocked: false },
      manualShieldCalendar: {},
    };
  }

  let p: KineticProfile = {
    ...profile,
    currentStreak: 0,
    lastCompletedDate: "",
    currentScheduleIndex: 0,
    shields: { bronze: 0, silver: 0, goldenUnlocked: false },
    manualShieldCalendar: {},
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const firstLogDate = logDates[0];

  const [startY, startM, startD] = firstLogDate.split("-").map(Number);
  const startDate = new Date(startY, startM - 1, startD);

  const [todayY, todayM, todayD] = todayStr.split("-").map(Number);
  const endDate = new Date(todayY, todayM - 1, todayD);

  let currentDate = new Date(startDate);
  let silverProtectedWorkoutDaysLeft = 0;
  const loggedDatesSet = new Set(logDates);

  while (currentDate <= endDate) {
    const checkDate = format(currentDate, "yyyy-MM-dd");
    const isToday = checkDate === todayStr;
    const isLogged = loggedDatesSet.has(checkDate);

    if (isLogged) {
      p.currentStreak += 1;
      p.lastCompletedDate = checkDate;
      p.currentScheduleIndex = (p.currentScheduleIndex + 1) % 7;
      silverProtectedWorkoutDaysLeft = 0;

      // Reward shields on completing a day
      if (p.currentStreak % 7 === 0 && p.currentStreak > 0) {
        p.shields.bronze += 1;
        if (p.shields.bronze >= 3) {
          p.shields.bronze -= 3;
          if (p.shields.silver < 5) p.shields.silver += 1;
        }
      }
      if (p.currentStreak % 30 === 0 && p.currentStreak > 0) {
        if (p.shields.silver < 5) p.shields.silver += 1;
      }
      if (p.currentStreak >= 365 && !p.shields.goldenUnlocked) {
        p.shields.goldenUnlocked = true;
      }
    } else {
      // If today is not completed yet, do NOT count it as missed!
      if (isToday) {
        break;
      }

      const scheduleIndex = p.currentScheduleIndex ?? 0;
      const node = WEEKLY_SCHEDULE[scheduleIndex];

      if (node?.type === "rest") {
        // Auto-complete rest day - streak remains frozen
        p.lastCompletedDate = checkDate;
        p.currentScheduleIndex = (scheduleIndex + 1) % 7;
        p.lastWasRestDay = true;
      } else {
        // Workout day missed!
        let absorbed = false;
        let shieldConsumedType: "bronze" | "silver" | "golden" | null = null;

        if (p.shields.goldenUnlocked) {
          absorbed = true;
          shieldConsumedType = "golden";
        }

        if (!absorbed && silverProtectedWorkoutDaysLeft > 0) {
          silverProtectedWorkoutDaysLeft -= 1;
          absorbed = true;
          shieldConsumedType = "silver";
        }

        if (!absorbed && p.manualShieldCalendar && p.manualShieldCalendar[checkDate]) {
          const type = p.manualShieldCalendar[checkDate];
          if (type === "bronze") {
            absorbed = true;
            shieldConsumedType = "bronze";
          } else if (type === "silver") {
            silverProtectedWorkoutDaysLeft = 2; // absorbs this day + 2 more workout days
            absorbed = true;
            shieldConsumedType = "silver";
          }
        }

        if (!absorbed && p.shields.bronze > 0) {
          p.shields.bronze -= 1;
          absorbed = true;
          shieldConsumedType = "bronze";
        }

        if (!absorbed && p.shields.silver > 0) {
          p.shields.silver -= 1;
          silverProtectedWorkoutDaysLeft = 2; // absorbs this day + 2 more workout days
          absorbed = true;
          shieldConsumedType = "silver";
        }

        if (absorbed) {
          p.lastCompletedDate = checkDate;
          p.currentScheduleIndex = (scheduleIndex + 1) % 7;
          if (shieldConsumedType) {
            p.manualShieldCalendar[checkDate] = shieldConsumedType;
            const isDismissed = (p.dismissedShieldDate === checkDate) ||
              (typeof window !== "undefined" && window.localStorage?.getItem(`kinetic_shield_dismissed_${p.userId}`) === `${checkDate}_${shieldConsumedType}`);
            if (!isDismissed) {
              p.lastShieldConsumed = { type: shieldConsumedType, date: checkDate };
            }
          }
        } else {
          p.currentStreak = 0;
          p.lastCompletedDate = "";
        }
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return p;
}
