"use client";
import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, Flame, Dumbbell } from "lucide-react";
import { ExerciseDefinition } from "../../core/types";
import RestTimer from "./RestTimer";
import TimedCountdown from "./TimedCountdown";
import ActiveHoldTimer from "./ActiveHoldTimer";

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
  const [showRest, setShowRest] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
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
  }, []);

  const handleHoldComplete = useCallback((loggedValue: number) => {
    setTimerActive(false);
    markSetDoneValue(loggedValue);
  }, [markSetDoneValue]);

  const handleHoldCancel = useCallback(() => {
    setTimerActive(false);
  }, []);

  const handleRepsDone = useCallback(() => {
    markSetDoneValue(workingTarget);
  }, [workingTarget, markSetDoneValue]);

  const handleRestComplete = useCallback(() => setShowRest(false), []);

  const allDone = sets.every((s) => s.done);

  // SVG art path
  const svgPath = `/graphics/exercises/${exercise.id}.svg`;

  return (
    <div className="flex flex-col gap-4 px-3 py-2 select-none">
      {/* Countdown overlay */}
      <AnimatePresence>
        {showCountdown && <TimedCountdown onGo={onCountdownGo} />}
      </AnimatePresence>

      {/* Large Active Hold Timer Overlay */}
      <AnimatePresence>
        {timerActive && (
          <ActiveHoldTimer
            exerciseName={exercise.name}
            setIndex={currentSet}
            totalSets={exercise.sets}
            workingTarget={workingTarget}
            onComplete={handleHoldComplete}
            onCancel={handleHoldCancel}
          />
        )}
      </AnimatePresence>

      {/* Exercise header info */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#A3A3B3] font-mono font-bold uppercase tracking-wider">
          Exercise {exerciseIndex + 1} of {totalExercises}
        </span>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
          {phaseLabel}
        </span>
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-white leading-tight uppercase tracking-wide">
        {exercise.name}
      </h2>

      {/* Calibration mode */}
      {isCalibrationPhase ? (
        <div className="bg-[#0C0C14] border border-amber-500/30 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">🧪</span>
            <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
              Calibration Protocol
            </p>
          </div>
          <p className="text-sm text-[#D4D4D8] leading-relaxed">
            Perform exactly 1 set to technical failure. Enter your max clean{" "}
            {exercise.trackingType === "time" ? "seconds" : "reps"}:
          </p>
          <input
            type="number"
            min="1"
            value={calibrationInput}
            onChange={(e) => setCalibrationInput(e.target.value)}
            className="bg-[#040406] border border-[#2A2A3C] rounded-xl px-4 py-3 text-white text-2xl font-bold text-center focus:border-indigo-500 focus:outline-none w-full"
            placeholder="0"
          />
          <button
            onClick={() => {
              const v = parseInt(calibrationInput);
              if (v > 0) onAllSetsDone([v]);
            }}
            disabled={!calibrationInput || parseInt(calibrationInput) <= 0}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
          >
            Save Calibration Max
          </button>

          <button
            onClick={onExit}
            className="w-full text-center py-1 text-xs text-[#A3A3B3] hover:text-red-400 transition-colors cursor-pointer"
          >
            Cancel & Exit
          </button>
        </div>
      ) : (
        <>
          {/* Header section (Graphic & Target Volume) */}
          <div className="grid grid-cols-12 gap-3 items-stretch">
            {/* SVG Illustration Frame */}
            <div className="col-span-7 h-28 bg-[#0C0C14] border border-[#1A1A26] rounded-2xl flex items-center justify-center overflow-hidden relative">
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
                <Dumbbell size={28} className="text-indigo-400/60" />
                <span className="text-[#A3A3B3] text-[10px] font-mono mt-1">EXERCISE</span>
              </div>
            </div>

            {/* Target Volume Card */}
            <div className="col-span-5 bg-[#0C0C14] border border-[#1A1A26] rounded-2xl px-3.5 py-3 flex flex-col justify-center text-left">
              <p className="text-[10px] text-[#A3A3B3] font-mono uppercase tracking-wider mb-0.5 font-bold">
                TARGET VOLUME
              </p>
              <p className="text-base sm:text-lg font-black text-indigo-400 leading-tight">
                {exercise.sets} × {exercise.trackingType === "time" ? `${workingTarget}s` : `${workingTarget}`}
              </p>
              <p className="text-[11px] text-[#D4D4D8] mt-0.5 font-medium">
                {exercise.trackingType === "time" ? "seconds hold" : "reps / set"}
              </p>
              {exercise.isAccumulationMode && (
                <span className="text-[9px] text-amber-400 mt-1 font-mono font-bold">
                  ACCUMULATION
                </span>
              )}
            </div>
          </div>

          {/* Sets Checklist in 2-Column Grid */}
          <div className="grid grid-cols-2 gap-2.5 my-1">
            {sets.map((set, i) => {
              const isSetDone = set.done;
              const isCurrent = i === currentSet;
              const isFuture = i > currentSet;

              return (
                <motion.div
                  key={i}
                  className={`flex flex-col justify-between p-3.5 rounded-2xl border transition-all h-24 ${
                    isSetDone
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : isCurrent
                      ? "bg-indigo-600/10 border-indigo-500/50 text-white shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                      : "bg-[#0C0C14] border-[#1A1A26] text-[#717182] opacity-50"
                  }`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: isFuture ? 0.45 : 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[10px] font-mono font-bold tracking-wider text-[#A3A3B3]">
                      SET {i + 1}
                    </span>
                    {isSetDone && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                        <Check size={10} strokeWidth={3} className="text-emerald-400" />
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-end justify-between">
                    {isSetDone ? (
                      <span className="text-sm font-black text-emerald-400 font-mono">
                        {set.value} {exercise.trackingType === "time" ? "sec" : "reps"}
                      </span>
                    ) : isCurrent ? (
                      exercise.trackingType === "time" ? (
                        <button
                          onClick={startTimedExercise}
                          className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                        >
                          <Clock size={12} />
                          <span>START</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleRepsDone}
                          className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md"
                        >
                          COMPLETE SET
                        </button>
                      )
                    ) : (
                      <span className="text-xs font-mono font-semibold text-[#717182]">
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
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-widest cursor-pointer mt-1 shadow-[0_4px_20px_rgba(99,102,241,0.3)] active:scale-95 transition-all"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Log & Advance Routine →
            </motion.button>
          )}

          <button
            onClick={onExit}
            className="w-full text-center py-2.5 text-xs text-[#A3A3B3] hover:text-red-400 transition-colors cursor-pointer mt-1 uppercase tracking-wider font-bold"
          >
            Abort Session
          </button>
        </>
      )}
    </div>
  );
}
