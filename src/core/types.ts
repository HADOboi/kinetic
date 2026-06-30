export type AppPhase = "conditioning" | "calibration" | "infinite_overload";

export type FeedbackType = "struggling" | "comfortable" | "too_easy" | "";

export type FireState = "greyed" | "freeze" | "lit" | "none";

export type RoutineType = "push" | "pull" | "legs_core";

export type ShieldType = "bronze" | "silver" | "golden";

export interface ProgressionState {
  level: number;
  currentCycle: number;
  lastFeedback: FeedbackType;
  maxTestVolume: number;
  overloadMultiplier?: number;
}

export interface KineticProfile {
  userId: string;
  displayName: string;
  photoURL: string;
  currentStreak: number;
  lastCompletedDate: string;         // ISO YYYY-MM-DD
  currentPhase: AppPhase;
  shields: {
    bronze: number;                  // 0–2 displayable. 3rd triggers auto-convert
    silver: number;                  // 0–5 cap. Excess voids
    goldenUnlocked: boolean;         // Permanent flag, never decrements
  };
  manualShieldCalendar: Record<string, ShieldType>;
  currentScheduleIndex: number;      // 0–6 looping
  progressionLevels: {
    push:      ProgressionState;
    pull:      ProgressionState;
    legs_core: ProgressionState;
  };
  equipmentInventory: {
    hasPullupBar: boolean;
    hasDumbbells: boolean;
  };
  weightLog: { date: string; kg: number }[];
  createdAt: string;
  deferredAnimation?: string | null;
  lastWasRestDay?: boolean;
}

export interface WorkoutLog {
  logId: string;
  userId: string;
  habitId: "workout";               // CRITICAL — HADO Nexus aggregation key
  date: string;                     // ISO YYYY-MM-DD
  routineType: RoutineType;
  durationMinutes: number;
  isDeloadSession: boolean;
  performanceFeedback: FeedbackType;
  exercisesLogged: {
    exerciseId: string;
    setsPerformed: number;
    metricsCompleted: number[];     // rep counts or hold durations per set
  }[];
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  trackingType: "reps" | "time";
  sets: number;
  baseTarget: number;              // reps count OR seconds
  capValue: number;
  isAccumulationMode?: boolean;    // true = don't force consecutive sets, accumulate total time
  targetAccumulation?: number;     // total seconds to accumulate (for planche holds etc)
  capAccumulation?: number;
  requiresEquipment?: "pullupBar" | "dumbbells";
  alternativeExerciseId?: string;  // fallback if equipment missing
}

export interface LevelDefinition {
  level: number;
  tier: "Foundation" | "Builder" | "Athlete" | "Advanced" | "Elite" | "Master";
  focusLabel: string;
  unlockBadge?: string;
  adaptationNote?: string;
  exercises: ExerciseDefinition[];
}

export type ScheduleNodeType = "push" | "pull" | "legs_core" | "rest";

export interface ScheduleNode {
  index: number;        // 0–6
  type: ScheduleNodeType;
  label: string;
}

export type NodeState = "completed" | "active" | "rest_auto" | "locked";

export interface HeaderProps {
  dailyState: string;
  streakCount: number;
  fireState: FireState;
  hasEternalAura?: boolean;
  userPhotoURL?: string;
  routineType?: RoutineType;
  currentLevel?: number;
}
