"use client";
import React from "react";
import { motion } from "framer-motion";

type WizardPhase = "warmup" | "exercise" | "cooldown" | "feedback";

const SEGMENTS: { key: WizardPhase; label: string }[] = [
  { key: "warmup",   label: "Warmup"    },
  { key: "exercise", label: "Exercises" },
  { key: "cooldown", label: "Cooldown"  },
  { key: "feedback", label: "Feedback"  },
];

export default function ProgressTracker({ phase }: { phase: WizardPhase }) {
  const activeIndex = SEGMENTS.findIndex((s) => s.key === phase);
  return (
    <div className="flex gap-1.5 px-4 py-2 bg-[#0B0B0F] border-b border-[#1F1F2E]">
      {SEGMENTS.map((seg, i) => (
        <div key={seg.key} className="flex-1 flex flex-col gap-1">
          <motion.div
            className="h-1 rounded-full"
            style={{ background: i <= activeIndex ? "#4F46E5" : "#1F1F2E" }}
            initial={false}
            animate={{ opacity: i <= activeIndex ? 1 : 0.4 }}
            transition={{ duration: 0.3 }}
          />
          <span className={`text-[9px] font-medium text-center ${i === activeIndex ? "text-indigo-400" : "text-[#71717A]"}`}>
            {seg.label}
          </span>
        </div>
      ))}
    </div>
  );
}
