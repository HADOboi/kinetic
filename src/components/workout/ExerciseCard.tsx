"use client";
import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { ExerciseDefinition } from "../../core/types";
import RestTimer from "./RestTimer";
import TimedCountdown from "./TimedCountdown";

interface ExerciseCardProps {
  key?: React.Key;
  exercise: ExerciseDefinition;
  exerciseIndex: number;
  totalExercises: number;
  phaseLabel: string;
  workingTarget: number;
  isCalibrationPhase: boolean;
  onAllSetsDone: (metricsCompleted: number[]) => void;
  onExit: () => void;
}

export default function ExerciseCard({
  exercise,
  exerciseIndex,
  totalExercises,
  phaseLabel,
  workingTarget,
  isCalibrationPhase,
  onAllSetsDone,
  onExit,
}: ExerciseCardProps) {
  const [sets, setSets] = useState<{ done: boolean; value: number }[]>(
    Array.from({ length: exercise.sets }, () => ({ done: false, value: 0 }))
  );
  const [showRest, setShowRest]       = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [calibrationInput, setCalibrationInput] = useState("");

  const firstUndoneIndex = sets.findIndex((s) => !s.done);
  const currentSet = firstUndoneIndex === -1 ? exercise.sets - 1 : firstUndoneIndex;

  const markSetDoneValue = useCallback((value: number) => {
    setSets((prev) => {
      const idx = prev.findIndex((s) => !s.done);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { done: true, value };
      const isLast = idx >= exercise.sets - 1;
      if (!isLast) {
        setShowRest(true);
      }
      return next;
    });
  }, [exercise.sets]);

  // Timed exercise active timer
  const startTimedExercise = useCallback(() => {
    setShowCountdown(true);
  }, []);

  const onCountdownGo = useCallback(() => {
    setShowCountdown(false);
    setTimerActive(true);
    setTimerElapsed(0);
  }, []);

  useEffect(() => {
    if (!timerActive) return;

    if (timerElapsed >= workingTarget) {
      setTimerActive(false);
      markSetDoneValue(workingTarget);
      return;
    }

    const t = setTimeout(() => {
      setTimerElapsed((e) => e + 1);
    }, 1000);

    return () => clearTimeout(t);
  }, [timerActive, timerElapsed, workingTarget, markSetDoneValue]);

  const handleRepsDone = useCallback(() => {
    markSetDoneValue(workingTarget);
  }, [workingTarget, markSetDoneValue]);

  const handleRestComplete = useCallback(() => setShowRest(false), []);

  const allDone = sets.every((s) => s.done);

  // SVG art path
  const svgPath = `/graphics/exercises/${exercise.id}.svg`;

  return (
    <div className="flex flex-col gap-3 px-3 py-2 select-none">
      {/* Countdown overlay */}
      <AnimatePresence>
        {showCountdown && <TimedCountdown onGo={onCountdownGo} />}
      </AnimatePresence>

      {/* Exercise header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#646473] font-mono uppercase tracking-wider">
          Exercise {exerciseIndex + 1} of {totalExercises}
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          {phaseLabel}
        </span>
      </div>

      <h2 className="text-lg font-black text-white leading-tight uppercase tracking-wide">{exercise.name}</h2>

      {/* Calibration mode */}
      {isCalibrationPhase ? (
        <div className="bg-[#0C0C12] border border-amber-500/20 rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Calibration Test</p>
          <p className="text-xs text-[#A3A3B3]">
            Perform exactly 1 set to technical failure. Enter your max clean{" "}
            {exercise.trackingType === "time" ? "seconds" : "reps"}:
          </p>
          <input
            type="number"
            min="1"
            value={calibrationInput}
            onChange={(e) => setCalibrationInput(e.target.value)}
            className="bg-[#040406] border border-[#1A1A26] rounded-xl px-4 py-2.5 text-white text-xl font-bold text-center focus:border-indigo-500 focus:outline-none w-full"
            placeholder="0"
          />
          <button
            onClick={() => {
              const v = parseInt(calibrationInput);
              if (v > 0) onAllSetsDone([v]);
            }}
            disabled={!calibrationInput || parseInt(calibrationInput) <= 0}
            className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-black text-xs uppercase tracking-wider disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
          >
            Save Calibration Max
          </button>
          
          <button
            onClick={onExit}
            className="w-full text-center py-1 text-xs text-[#646473] hover:text-red-400 transition-colors cursor-pointer"
          >
            Cancel & Exit
          </button>
        </div>
      ) : (
        <>
          {/* Dual Column Header Section (SVG on Left, Target Volume on Right) */}
          <div className="grid grid-cols-12 gap-3 items-stretch">
            {/* SVG Illustration Frame (Bigger focus on Art) */}
            <div className="col-span-7 h-24 bg-[#0C0C12] border border-[#1A1A26] rounded-2xl flex items-center justify-center overflow-hidden relative">
              <img
                src={svgPath}
                alt={exercise.name}
                className="h-full w-full object-contain p-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  const nextSib = (e.target as HTMLImageElement).nextElementSibling;
                  if (nextSib) nextSib.classList.remove("hidden");
                }}
              />
              <div className="hidden flex-col items-center justify-center w-full h-full p-2 text-center">
                <div className="w-full h-full absolute inset-0 opacity-5"
                  style={{ backgroundImage: "radial-gradient(#4F46E5 1px, transparent 1px)", backgroundSize: "12px 12px" }}
                />
                <span className="text-[#4B5563] text-[8px] font-mono leading-none">LINE ART</span>
              </div>
            </div>

            {/* Target Volume Card (Slimmer and cleaner) */}
            <div className="col-span-5 bg-[#0C0C12] border border-[#1A1A26] rounded-2xl px-3 py-2 flex flex-col justify-center text-left">
              <p className="text-[9px] text-[#646473] font-mono uppercase tracking-wider mb-0.5">TARGET</p>
              <p className="text-sm font-black text-indigo-400 leading-tight">
                {exercise.sets} × {exercise.trackingType === "time" ? `${workingTarget}s` : `${workingTarget}`}
              </p>
              <p className="text-[9px] text-text-secondary mt-0.5 font-medium leading-none">
                {exercise.trackingType === "time" ? "seconds" : "reps"}
              </p>
              {exercise.isAccumulationMode && (
                <p className="text-[8px] text-amber-400 mt-1 font-mono leading-none">
                  ACCUMULATE
                </p>
              )}
            </div>
          </div>

          {/* Sets Checklist in 2-Column Grid */}
          <div className="grid grid-cols-2 gap-2 my-1">
            {sets.map((set, i) => {
              const isSetDone = set.done;
              const isCurrent = i === currentSet;
              const isFuture = i > currentSet;

              return (
                <motion.div
                  key={i}
                  className={`flex flex-col justify-between p-3 rounded-2xl border transition-all h-20 ${
                    isSetDone
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                      : isCurrent
                      ? "bg-indigo-500/5 border-indigo-500/40 text-white shadow-[0_0_12px_rgba(99,102,241,0.06)]"
                      : "bg-[#040406]/30 border-[#1A1A26] text-[#646473] opacity-30"
                  }`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: isFuture ? 0.35 : 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[9px] font-mono tracking-wider text-text-tertiary">SET #{i + 1}</span>
                    {isSetDone && (
                      <span className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                        <Check size={8} strokeWidth={3} className="text-emerald-400" />
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-end justify-between">
                    {isSetDone ? (
                      <span className="text-xs font-black text-emerald-400 font-mono">
                        {set.value} {exercise.trackingType === "time" ? "sec" : "reps"}
                      </span>
                    ) : isCurrent ? (
                      exercise.trackingType === "time" ? (
                        timerActive ? (
                          <span className="text-sm font-mono font-black text-indigo-400 animate-pulse">
                            {timerElapsed}s / {workingTarget}s
                          </span>
                        ) : (
                          <button
                            onClick={startTimedExercise}
                            className="w-full py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            START
                          </button>
                        )
                      ) : (
                        <button
                          onClick={handleRepsDone}
                          className="w-full py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          DONE
                        </button>
                      )
                    ) : (
                      <span className="text-xs font-mono text-text-tertiary">
                        {workingTarget} {exercise.trackingType === "time" ? "sec" : "reps"}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Rest timer */}
          <AnimatePresence>
            {showRest && (
              <RestTimer
                durationSeconds={90}
                onComplete={handleRestComplete}
                onSkip={handleRestComplete}
              />
            )}
          </AnimatePresence>

          {/* Log & Advance Button */}
          {allDone && !showRest && (
            <motion.button
              onClick={() => onAllSetsDone(sets.map((s) => s.value))}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest cursor-pointer mt-1 shadow-[0_4px_16px_rgba(99,102,241,0.25)]"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Log & Advance Workout →
            </motion.button>
          )}

          <button
            onClick={onExit}
            className="w-full text-center py-2 text-[10px] text-[#646473] hover:text-red-400 transition-colors cursor-pointer mt-1 uppercase tracking-wider font-semibold"
          >
            Abort Session
          </button>
        </>
      )}
    </div>
  );
}
