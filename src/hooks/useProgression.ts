import { useCallback } from "react";
import { KineticProfile, FeedbackType, RoutineType } from "../core/types";
import { getMaxLevel } from "../core/exerciseMatrix";

export function useProgression() {

  /**
   * Apply feedback after workout.
   * Returns updated profile (caller saves to Firestore).
   */
  const applyFeedback = useCallback((
    profile: KineticProfile,
    routineType: RoutineType,
    feedback: FeedbackType
  ): KineticProfile => {
    const key = routineType;
    const current = { ...profile.progressionLevels[key] };
    const maxLevel = getMaxLevel(routineType);

    if (feedback === "too_easy") {
      const isIncrementing = current.level < maxLevel;
      if (!isIncrementing) {
        const currentMult = current.overloadMultiplier ?? 1.0;
        current.overloadMultiplier = parseFloat((currentMult + 0.05).toFixed(2));
      } else {
        current.level += 1;
      }
      current.currentCycle = 1;
      current.lastFeedback = "too_easy";
    } else if (feedback === "comfortable") {
      current.currentCycle += 1;
      current.lastFeedback = "comfortable";
      if (current.currentCycle > 3) {
        const isIncrementing = current.level < maxLevel;
        if (!isIncrementing) {
          const currentMult = current.overloadMultiplier ?? 1.0;
          current.overloadMultiplier = parseFloat((currentMult + 0.05).toFixed(2));
        } else {
          current.level += 1;
        }
        current.currentCycle = 1;
      }
    } else if (feedback === "struggling") {
      current.currentCycle = 1;
      current.lastFeedback = "struggling";
    }

    return {
      ...profile,
      progressionLevels: {
        ...profile.progressionLevels,
        [key]: current,
      },
    };
  }, []);

  /**
   * Calculate working target for an exercise.
   * In infinite_overload phase, applies 0.8× multiplier if lastFeedback === "struggling" (return from absence).
   * Also applies the overloadMultiplier for infinite scaling.
   */
  const getWorkingTarget = useCallback((
    baseTarget: number,
    maxTestVolume: number,
    phase: KineticProfile["currentPhase"],
    progState: { lastFeedback: FeedbackType; overloadMultiplier?: number } | undefined,
    trackingType: "reps" | "time"
  ): number => {
    const lastFeedback = progState?.lastFeedback ?? "";
    const overloadMult = progState?.overloadMultiplier ?? 1.0;

    let baseCalculated = baseTarget;
    if (phase === "conditioning") {
      baseCalculated = baseTarget;
    } else if (phase === "calibration") {
      baseCalculated = baseTarget; // calibration shows test input
    } else if (maxTestVolume > 0) { // infinite_overload
      const factor = trackingType === "reps" ? 0.65 : 0.60;
      baseCalculated = Math.round(maxTestVolume * factor);
    }

    if (lastFeedback === "struggling") {
      baseCalculated = Math.round(baseCalculated * 0.8);
    }

    return Math.round(baseCalculated * overloadMult);
  }, []);

  /**
   * Save calibration max test volume for an exercise routine.
   */
  const saveCalibration = useCallback((
    profile: KineticProfile,
    routineType: RoutineType,
    maxVolume: number
  ): KineticProfile => {
    return {
      ...profile,
      currentPhase: "infinite_overload",
      progressionLevels: {
        ...profile.progressionLevels,
        [routineType]: {
          ...profile.progressionLevels[routineType],
          maxTestVolume: maxVolume,
        },
      },
    };
  }, []);

  return { applyFeedback, getWorkingTarget, saveCalibration };
}
