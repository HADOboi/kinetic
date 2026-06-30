import { LevelDefinition, ScheduleNode } from "./types";

// ─── WEEKLY SCHEDULE ────────────────────────────────────────────────
export const WEEKLY_SCHEDULE: ScheduleNode[] = [
  { index: 0, type: "push",      label: "Push" },
  { index: 1, type: "pull",      label: "Pull" },
  { index: 2, type: "rest",      label: "Rest" },
  { index: 3, type: "legs_core", label: "Legs + Core" },
  { index: 4, type: "push",      label: "Push" },
  { index: 5, type: "pull",      label: "Pull" },
  { index: 6, type: "rest",      label: "Rest" },
];

// ─── PUSH MATRIX (10 levels) ────────────────────────────────────────
export const PUSH_MATRIX: LevelDefinition[] = [
  {
    level: 1, tier: "Foundation",
    focusLabel: "Upper body base conditioning",
    exercises: [
      { id: "wall_pushup",    name: "Wall Push-ups",    trackingType: "reps", sets: 3, baseTarget: 8,  capValue: 20 },
      { id: "bench_dip",      name: "Bench Dips",       trackingType: "reps", sets: 2, baseTarget: 8,  capValue: 15 },
      { id: "std_plank",      name: "Standard Plank",   trackingType: "time", sets: 2, baseTarget: 20, capValue: 60 },
    ],
  },
  {
    level: 2, tier: "Foundation",
    focusLabel: "Pressing endurance + shoulder prep",
    exercises: [
      { id: "incline_pushup", name: "Incline Push-ups",       trackingType: "reps", sets: 3, baseTarget: 10, capValue: 20 },
      { id: "pike_pushup",    name: "Pike Push-ups",          trackingType: "reps", sets: 3, baseTarget: 6,  capValue: 12 },
      { id: "plank_dog",      name: "Plank to Downward Dog",  trackingType: "reps", sets: 3, baseTarget: 10, capValue: 20 },
    ],
  },
  {
    level: 3, tier: "Builder",
    focusLabel: "Standard push-up strength",
    unlockBadge: "Wall Handstand Hold",
    exercises: [
      { id: "std_pushup",     name: "Standard Push-ups",               trackingType: "reps", sets: 3, baseTarget: 10, capValue: 25 },
      { id: "diamond_pushup", name: "Diamond Push-ups",                trackingType: "reps", sets: 3, baseTarget: 6,  capValue: 15 },
      { id: "wall_hs_hold",   name: "Wall Handstand Hold",             trackingType: "time", sets: 2, baseTarget: 20, capValue: 60 },
    ],
  },
  {
    level: 4, tier: "Builder",
    focusLabel: "Volume build + Tempo integration",
    adaptationNote: "If leverage shifts feel too severe, enforce 3s eccentric on current tier before advancing.",
    exercises: [
      { id: "pushup_tempo",   name: "Push-ups (3s Eccentric)",  trackingType: "reps", sets: 3, baseTarget: 12, capValue: 20 },
      { id: "decline_pushup", name: "Decline Push-ups",         trackingType: "reps", sets: 3, baseTarget: 10, capValue: 20 },
      { id: "wall_hs_hold2",  name: "Wall Handstand Hold",      trackingType: "time", sets: 3, baseTarget: 30, capValue: 60 },
    ],
  },
  {
    level: 5, tier: "Athlete",
    focusLabel: "Unilateral pressing + planche lean entry",
    unlockBadge: "Archer Push-up · Planche Lean",
    adaptationNote: "Isometric holds: do not force consecutive sets. Accumulate total target time using mini-sets.",
    exercises: [
      { id: "archer_pushup",  name: "Archer Push-ups (ea.)",           trackingType: "reps", sets: 3, baseTarget: 5,  capValue: 10 },
      { id: "elev_pike_pu",   name: "Elevated Pike Push-ups",          trackingType: "reps", sets: 3, baseTarget: 8,  capValue: 15 },
      { id: "planche_lean",   name: "Planche Lean Hold",               trackingType: "time", sets: 1, baseTarget: 90, capValue: 120, isAccumulationMode: true, targetAccumulation: 90, capAccumulation: 120 },
    ],
  },
  {
    level: 6, tier: "Athlete",
    focusLabel: "Pseudo planche push-up + wall HSPU",
    unlockBadge: "Tuck Planche · Wall HSPU",
    exercises: [
      { id: "pseudo_planche_pu", name: "Pseudo Planche Push-ups", trackingType: "reps", sets: 3, baseTarget: 8,  capValue: 15 },
      { id: "wall_hspu",         name: "Wall Handstand Push-ups", trackingType: "reps", sets: 3, baseTarget: 4,  capValue: 10 },
      { id: "tuck_planche",      name: "Tuck Planche Hold",       trackingType: "time", sets: 1, baseTarget: 45, capValue: 90, isAccumulationMode: true, targetAccumulation: 45, capAccumulation: 90 },
    ],
  },
  {
    level: 7, tier: "Advanced",
    focusLabel: "Skill volume consolidation",
    exercises: [
      { id: "pseudo_planche_hips", name: "Pseudo Planche (hands at hips)", trackingType: "reps", sets: 3, baseTarget: 12, capValue: 20 },
      { id: "wall_hspu_vol",       name: "Wall Handstand Push-ups",        trackingType: "reps", sets: 3, baseTarget: 8,  capValue: 12 },
      { id: "adv_tuck_planche",    name: "Adv Tuck Planche Hold",          trackingType: "time", sets: 1, baseTarget: 40, capValue: 75, isAccumulationMode: true, targetAccumulation: 40, capAccumulation: 75 },
    ],
  },
  {
    level: 8, tier: "Advanced",
    focusLabel: "Straddle planche + deficit HSPU entry",
    unlockBadge: "Straddle Planche · Pike HSPU",
    exercises: [
      { id: "straddle_planche", name: "Straddle Planche Hold",       trackingType: "time", sets: 1, baseTarget: 30, capValue: 60, isAccumulationMode: true, targetAccumulation: 30, capAccumulation: 60 },
      { id: "pike_hspu_def",    name: "Pike HSPU (deficit)",         trackingType: "reps", sets: 3, baseTarget: 5,  capValue: 10 },
      { id: "oa_pushup_neg",    name: "One-Arm Push-up Neg (ea.)",   trackingType: "reps", sets: 3, baseTarget: 3,  capValue: 6  },
    ],
  },
  {
    level: 9, tier: "Elite",
    focusLabel: "Full planche + freestanding HSPU",
    unlockBadge: "Full Planche · Freestanding HSPU",
    exercises: [
      { id: "full_planche",    name: "Full Planche Hold",         trackingType: "time", sets: 1, baseTarget: 20, capValue: 40, isAccumulationMode: true, targetAccumulation: 20, capAccumulation: 40 },
      { id: "fs_hspu",         name: "Freestanding HSPU",         trackingType: "reps", sets: 3, baseTarget: 3,  capValue: 7  },
      { id: "planche_pu_neg",  name: "Planche Push-up Negatives", trackingType: "reps", sets: 3, baseTarget: 3,  capValue: 6  },
    ],
  },
  {
    level: 10, tier: "Master",
    focusLabel: "Peak expression of push mastery",
    unlockBadge: "Planche Push-ups · 90° Push-ups",
    adaptationNote: "INFINITE SCALING: Once Master capped, convert load into external vest micro-loading (+1.25kg/cycle).",
    exercises: [
      { id: "planche_pushup", name: "Planche Push-ups",              trackingType: "reps", sets: 3, baseTarget: 3, capValue: 8  },
      { id: "fs_hspu_full",   name: "Freestanding HSPU (Full Depth)",trackingType: "reps", sets: 3, baseTarget: 6, capValue: 10 },
      { id: "90_pushup",      name: "90° Push-ups",                  trackingType: "reps", sets: 3, baseTarget: 2, capValue: 5  },
    ],
  },
];

// ─── PULL MATRIX (10 levels) ────────────────────────────────────────
export const PULL_MATRIX: LevelDefinition[] = [
  {
    level: 1, tier: "Foundation",
    focusLabel: "Shoulder girdle activation + control",
    exercises: [
      { id: "dead_hang",        name: "Dead Hangs",                trackingType: "time", sets: 3, baseTarget: 25, capValue: 50, requiresEquipment: "pullupBar", alternativeExerciseId: "doorframe_row" },
      { id: "doorframe_row",    name: "Door-frame Rows",           trackingType: "reps", sets: 3, baseTarget: 10, capValue: 20 },
      { id: "towel_slide",      name: "Towel Body Slides",         trackingType: "reps", sets: 3, baseTarget: 6,  capValue: 12 },
      { id: "scap_retract",     name: "Lying Scapular Retractions",trackingType: "reps", sets: 2, baseTarget: 12, capValue: 20 },
    ],
  },
  {
    level: 2, tier: "Foundation",
    focusLabel: "Pulling mechanics + hollow foundation",
    exercises: [
      { id: "scap_pullup",      name: "Scapular Pull-ups",         trackingType: "reps", sets: 3, baseTarget: 6,  capValue: 12, requiresEquipment: "pullupBar", alternativeExerciseId: "db_row" },
      { id: "db_row",           name: "Dumbbell Rows",             trackingType: "reps", sets: 3, baseTarget: 6,  capValue: 15, requiresEquipment: "dumbbells", alternativeExerciseId: "inverted_row" },
      { id: "inverted_row",     name: "Under-Table Inverted Rows", trackingType: "reps", sets: 3, baseTarget: 6,  capValue: 12 },
      { id: "dead_bug",         name: "Dead Bug Series",           trackingType: "reps", sets: 2, baseTarget: 10, capValue: 20 },
      { id: "hollow_hold",      name: "Hollow Body Hold",          trackingType: "time", sets: 3, baseTarget: 20, capValue: 50 },
    ],
  },
  {
    level: 3, tier: "Builder",
    focusLabel: "Eccentric strength + front lever entry",
    exercises: [
      { id: "pullup_neg",       name: "Pull-up Negatives (5s)",    trackingType: "reps", sets: 3, baseTarget: 4,  capValue: 8  },
      { id: "aus_row_elev",     name: "Australian Rows (elevated)",trackingType: "reps", sets: 3, baseTarget: 10, capValue: 20 },
      { id: "tuck_fl",          name: "Tuck Front Lever Hold",     trackingType: "time", sets: 1, baseTarget: 30, capValue: 60, isAccumulationMode: true, targetAccumulation: 30, capAccumulation: 60 },
    ],
  },
  {
    level: 4, tier: "Builder",
    focusLabel: "Assisted concentric + lever progression",
    exercises: [
      { id: "band_pullup",      name: "Band-Assisted Pull-ups",    trackingType: "reps", sets: 3, baseTarget: 6,  capValue: 12 },
      { id: "chinup_neg",       name: "Chin-up Negatives",         trackingType: "reps", sets: 3, baseTarget: 5,  capValue: 8  },
      { id: "tuck_fl2",         name: "Tuck Front Lever Hold",     trackingType: "time", sets: 1, baseTarget: 45, capValue: 90, isAccumulationMode: true, targetAccumulation: 45, capAccumulation: 90 },
    ],
  },
  {
    level: 5, tier: "Athlete",
    focusLabel: "First unassisted pull-ups",
    unlockBadge: "Pull-ups · Chin-ups",
    exercises: [
      { id: "pullup",           name: "Pull-ups",                  trackingType: "reps", sets: 3, baseTarget: 5,  capValue: 10 },
      { id: "chinup",           name: "Chin-ups",                  trackingType: "reps", sets: 3, baseTarget: 6,  capValue: 12 },
      { id: "adv_tuck_fl",      name: "Adv Tuck Front Lever",      trackingType: "time", sets: 1, baseTarget: 30, capValue: 60, isAccumulationMode: true, targetAccumulation: 30, capAccumulation: 60 },
    ],
  },
  {
    level: 6, tier: "Athlete",
    focusLabel: "Volume + L-sit + tuck front lever",
    unlockBadge: "L-sit · Full Pull-up Volume",
    exercises: [
      { id: "pullup_exp",       name: "Pull-ups (Explosive)",      trackingType: "reps", sets: 3, baseTarget: 8,  capValue: 15 },
      { id: "lsit_floor",       name: "L-sit Hold (floor)",        trackingType: "time", sets: 3, baseTarget: 10, capValue: 30 },
      { id: "tuck_fl3",         name: "Tuck Front Lever",          trackingType: "time", sets: 1, baseTarget: 60, capValue: 120, isAccumulationMode: true, targetAccumulation: 60, capAccumulation: 120 },
    ],
  },
  {
    level: 7, tier: "Advanced",
    focusLabel: "Weighted pulling + straddle lever",
    adaptationNote: "HARDWARE LINKED: External load tracking activated via equipment chest profile.",
    exercises: [
      { id: "weighted_pullup",  name: "Weighted Pull-ups (+5kg)",  trackingType: "reps", sets: 3, baseTarget: 5,  capValue: 8  },
      { id: "lsit_to_vsit",     name: "L-sit to V-sit transitions",trackingType: "time", sets: 3, baseTarget: 20, capValue: 45 },
      { id: "straddle_fl",      name: "Straddle Front Lever",      trackingType: "time", sets: 1, baseTarget: 30, capValue: 60, isAccumulationMode: true, targetAccumulation: 30, capAccumulation: 60 },
    ],
  },
  {
    level: 8, tier: "Advanced",
    focusLabel: "Muscle-up entry + full front lever",
    unlockBadge: "Muscle-up Negatives · Full Front Lever",
    exercises: [
      { id: "ctb_pullup",       name: "Explosive Chest-to-Bar Pull-ups", trackingType: "reps", sets: 3, baseTarget: 5, capValue: 10 },
      { id: "muscleup_neg",     name: "Muscle-up Negatives",             trackingType: "reps", sets: 3, baseTarget: 3, capValue: 6  },
      { id: "full_fl",          name: "Full Front Lever Hold",           trackingType: "time", sets: 1, baseTarget: 20, capValue: 45, isAccumulationMode: true, targetAccumulation: 20, capAccumulation: 45 },
    ],
  },
  {
    level: 9, tier: "Elite",
    focusLabel: "Muscle-ups + front lever raises",
    unlockBadge: "Muscle-ups · Front Lever Raises",
    exercises: [
      { id: "muscleup",         name: "Muscle-ups",                     trackingType: "reps", sets: 3, baseTarget: 3,  capValue: 7  },
      { id: "fl_raise",         name: "Front Lever Raises",             trackingType: "reps", sets: 3, baseTarget: 4,  capValue: 8  },
      { id: "oa_hang",          name: "One-Arm Hang (ea.)",             trackingType: "time", sets: 3, baseTarget: 15, capValue: 30 },
    ],
  },
  {
    level: 10, tier: "Master",
    focusLabel: "One-arm pull-up track begins",
    unlockBadge: "One-Arm Pull-up Negatives",
    adaptationNote: "INFINITE SCALING: Master triggers weighted output scaling (+2.5% bodyweight/cycle).",
    exercises: [
      { id: "muscleup_strict",  name: "Muscle-ups (Strict)",            trackingType: "reps", sets: 3, baseTarget: 6, capValue: 10 },
      { id: "fl_pullup",        name: "Front Lever Pull-ups",           trackingType: "reps", sets: 3, baseTarget: 3, capValue: 6  },
      { id: "oa_pullup_neg",    name: "One-Arm Pull-up Neg (ea.)",      trackingType: "reps", sets: 3, baseTarget: 3, capValue: 5  },
    ],
  },
];

// ─── LEGS + CORE MATRIX (8 levels) ──────────────────────────────────
export const LEGS_MATRIX: LevelDefinition[] = [
  {
    level: 1, tier: "Foundation",
    focusLabel: "Lower body base + core activation",
    exercises: [
      { id: "air_squat",        name: "Air Squats",                     trackingType: "reps", sets: 3, baseTarget: 10, capValue: 25 },
      { id: "goblet_squat",     name: "Dumbbell Goblet Squats",         trackingType: "reps", sets: 3, baseTarget: 10, capValue: 25, requiresEquipment: "dumbbells", alternativeExerciseId: "glute_bridge" },
      { id: "glute_bridge",     name: "Bodyweight Glute Bridges",       trackingType: "reps", sets: 3, baseTarget: 10, capValue: 20 },
      { id: "hollow_prep",      name: "Hollow Body Core Prep",          trackingType: "time", sets: 2, baseTarget: 15, capValue: 45 },
    ],
  },
  {
    level: 2, tier: "Foundation",
    focusLabel: "Unilateral strength + hollow body",
    exercises: [
      { id: "bulg_split",       name: "Bulgarian Split Squats (ea.)",   trackingType: "reps", sets: 3, baseTarget: 8,  capValue: 15 },
      { id: "sl_glute_bridge",  name: "Single-leg Glute Bridge (ea.)",  trackingType: "reps", sets: 3, baseTarget: 8,  capValue: 15 },
      { id: "hollow_hold",      name: "Hollow Body Hold",               trackingType: "time", sets: 3, baseTarget: 20, capValue: 60 },
    ],
  },
  {
    level: 3, tier: "Builder",
    focusLabel: "Explosive power + anti-rotation core",
    exercises: [
      { id: "jump_squat",       name: "Jump Squats",                    trackingType: "reps", sets: 3, baseTarget: 10, capValue: 20 },
      { id: "rev_lunge",        name: "Reverse Lunges + Knee Drive (ea.)", trackingType: "reps", sets: 3, baseTarget: 8, capValue: 15 },
      { id: "dead_bug2",        name: "Dead Bug",                       trackingType: "reps", sets: 3, baseTarget: 10, capValue: 20 },
    ],
  },
  {
    level: 4, tier: "Builder",
    focusLabel: "Pistol & L-sit track entry",
    unlockBadge: "Pistol Squat · Tuck L-sit",
    exercises: [
      { id: "pistol_neg",       name: "Pistol Squat Negatives (ea.)",  trackingType: "reps", sets: 3, baseTarget: 4,  capValue: 8  },
      { id: "shrimp_squat",     name: "Shrimp Squats (ea.)",           trackingType: "reps", sets: 3, baseTarget: 5,  capValue: 10 },
      { id: "tuck_lsit",        name: "Tuck L-sit",                    trackingType: "time", sets: 3, baseTarget: 10, capValue: 25 },
    ],
  },
  {
    level: 5, tier: "Athlete",
    focusLabel: "Assisted pistol + floor L-sit",
    exercises: [
      { id: "assisted_pistol",  name: "Assisted Pistol Squats (ea.)",  trackingType: "reps", sets: 3, baseTarget: 5,  capValue: 10 },
      { id: "nordic_neg",       name: "Nordic Curl Negatives",         trackingType: "reps", sets: 3, baseTarget: 4,  capValue: 8  },
      { id: "lsit_floor2",      name: "L-sit (floor)",                 trackingType: "time", sets: 3, baseTarget: 10, capValue: 30 },
    ],
  },
  {
    level: 6, tier: "Athlete",
    focusLabel: "Full pistol squat + full L-sit",
    unlockBadge: "Full Pistol Squat · Full L-sit",
    adaptationNote: "HYPERTROPHY TRIGGER: Bodyweight leverage optimized. Engine switches upcoming tracks to structural loading.",
    exercises: [
      { id: "full_pistol",      name: "Full Pistol Squats (ea.)",      trackingType: "reps", sets: 3, baseTarget: 5,  capValue: 10 },
      { id: "nordic_curl",      name: "Nordic Curls (full ROM)",       trackingType: "reps", sets: 3, baseTarget: 5,  capValue: 10 },
      { id: "lsit_full",        name: "L-sit Hold",                    trackingType: "time", sets: 3, baseTarget: 20, capValue: 50 },
    ],
  },
  {
    level: 7, tier: "Advanced",
    focusLabel: "Dragon flag entry + weighted pistol",
    unlockBadge: "Dragon Flag Negatives · V-sit",
    adaptationNote: "EXTERNAL STIMULUS: Dumbbells/vest from equipment chest used for infinite volume growth.",
    exercises: [
      { id: "weighted_pistol",  name: "Weighted Pistol (+10% BW)",     trackingType: "reps", sets: 3, baseTarget: 5,  capValue: 8  },
      { id: "dragon_neg",       name: "Dragon Flag Negatives",         trackingType: "reps", sets: 3, baseTarget: 4,  capValue: 7  },
      { id: "vsit_hold",        name: "V-sit Hold",                    trackingType: "time", sets: 3, baseTarget: 8,  capValue: 20 },
    ],
  },
  {
    level: 8, tier: "Master",
    focusLabel: "Full advanced core & load expression",
    unlockBadge: "Dragon Flags · V-sit · Windshield Wipers",
    adaptationNote: "INFINITE SCALING: Structural volume scales via linear auto-regulated compound percentage load formulas.",
    exercises: [
      { id: "weighted_pistol2", name: "Weighted Pistol (+20% BW)",     trackingType: "reps", sets: 3, baseTarget: 5,  capValue: 8  },
      { id: "dragon_flag",      name: "Dragon Flags",                  trackingType: "reps", sets: 3, baseTarget: 5,  capValue: 8  },
      { id: "windshield_wiper", name: "Hanging Windshield Wipers (ea.)",trackingType: "reps", sets: 3, baseTarget: 6,  capValue: 12 },
    ],
  },
];

// ─── HELPERS ────────────────────────────────────────────────────────
export function getLevelDefinition(
  routineType: "push" | "pull" | "legs_core",
  level: number
): LevelDefinition | undefined {
  const matrix = routineType === "push" ? PUSH_MATRIX : routineType === "pull" ? PULL_MATRIX : LEGS_MATRIX;
  return matrix.find((l) => l.level === level);
}

export function getMaxLevel(routineType: "push" | "pull" | "legs_core"): number {
  return routineType === "legs_core" ? 8 : 10;
}

export function resolveExercises(
  def: LevelDefinition,
  hasPullupBar: boolean,
  hasDumbbells: boolean
) {
  return def.exercises.filter((ex) => {
    if (ex.requiresEquipment === "pullupBar" && !hasPullupBar) return false;
    if (ex.requiresEquipment === "dumbbells" && !hasDumbbells) return false;
    return true;
  }).map((ex) => {
    if (ex.alternativeExerciseId && !hasPullupBar && ex.requiresEquipment === "pullupBar") {
      const alt = def.exercises.find((e) => e.id === ex.alternativeExerciseId);
      return alt ?? ex;
    }
    if (ex.alternativeExerciseId && !hasDumbbells && ex.requiresEquipment === "dumbbells") {
      const alt = def.exercises.find((e) => e.id === ex.alternativeExerciseId);
      return alt ?? ex;
    }
    return ex;
  });
}
