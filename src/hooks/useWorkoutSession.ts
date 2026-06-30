import { useState, useCallback } from "react";
import { ExerciseDefinition } from "../core/types";

export type WizardPhase = "warmup" | "exercise" | "cooldown" | "feedback";

export interface SetLog {
  setIndex: number;
  value: number; // reps or seconds
  done: boolean;
}

export interface ExerciseSessionState {
  exercise: ExerciseDefinition;
  sets: SetLog[];
  currentSetIndex: number;
  showRestTimer: boolean;
}

export function useWorkoutSession(exercises: ExerciseDefinition[]) {
  const [wizardPhase, setWizardPhase]         = useState<WizardPhase>("warmup");
  const [exerciseIndex, setExerciseIndex]     = useState(0);
  const [exerciseStates, setExerciseStates]   = useState<ExerciseSessionState[]>(
    exercises.map((ex) => ({
      exercise: ex,
      sets: Array.from({ length: ex.sets }, (_, i) => ({
        setIndex: i, value: 0, done: false,
      })),
      currentSetIndex: 0,
      showRestTimer: false,
    }))
  );
  const [startTime] = useState<Date>(new Date());

  const currentExerciseState = exerciseStates[exerciseIndex];

  const markSetDone = useCallback((value: number) => {
    setExerciseStates((prev) => {
      const next = [...prev];
      const ex = { ...next[exerciseIndex] };
      const sets = [...ex.sets];
      sets[ex.currentSetIndex] = { ...sets[ex.currentSetIndex], value, done: true };
      ex.sets = sets;

      const isLastSet = ex.currentSetIndex >= ex.sets.length - 1;
      if (!isLastSet) {
        ex.showRestTimer = true;
        ex.currentSetIndex += 1;
      }
      next[exerciseIndex] = ex;
      return next;
    });
  }, [exerciseIndex]);

  const dismissRestTimer = useCallback(() => {
    setExerciseStates((prev) => {
      const next = [...prev];
      next[exerciseIndex] = { ...next[exerciseIndex], showRestTimer: false };
      return next;
    });
  }, [exerciseIndex]);

  const advanceExercise = useCallback(() => {
    if (exerciseIndex < exercises.length - 1) {
      setExerciseIndex((i) => i + 1);
    } else {
      setWizardPhase("cooldown");
    }
  }, [exerciseIndex, exercises.length]);

  const getDurationMinutes = useCallback((): number => {
    return Math.round((Date.now() - startTime.getTime()) / 60000);
  }, [startTime]);

  const allSetsComplete = currentExerciseState?.sets.every((s) => s.done) ?? false;

  return {
    wizardPhase, setWizardPhase,
    exerciseIndex, currentExerciseState,
    markSetDone, dismissRestTimer, advanceExercise,
    getDurationMinutes, allSetsComplete,
    totalExercises: exercises.length,
  };
}
