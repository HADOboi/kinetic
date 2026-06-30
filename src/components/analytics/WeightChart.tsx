"use client";
import React from "react";
import { motion } from "framer-motion";

interface WeightEntry { date: string; kg: number; }

export default function WeightChart({
  entries,
  onLogClick
}: {
  entries: WeightEntry[];
  onLogClick?: () => void;
}) {
  if (!entries.length) return (
    <div className="bg-[#121218] border border-[#2D2D3F] rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <p className="text-xs font-bold text-[#71717A] uppercase tracking-wider">
          Biometric Tracker
        </p>
        {onLogClick && (
          <button
            type="button"
            onClick={onLogClick}
            className="text-[10px] bg-[#1F1F2E] border border-[#2D2D3F] px-2 py-0.5 rounded-lg text-indigo-300 hover:text-white transition-all cursor-pointer"
          >
            + Log
          </button>
        )}
      </div>
      <div
        onClick={onLogClick}
        className="h-24 flex flex-col items-center justify-center gap-1 bg-[#0B0B0F]/50 border border-dashed border-[#1F1F2E] rounded-xl cursor-pointer hover:border-[#2D2D3F] transition-all"
      >
        <span className="text-xl">⚖️</span>
        <p className="text-[10px] text-[#71717A] text-center px-4">
          Log your first weight after a weekly completion
        </p>
      </div>
    </div>
  );

  const W = 320, H = 100, PAD = 12;
  const kgs  = entries.map((e) => e.kg);
  const minKg = Math.min(...kgs) - 1;
  const maxKg = Math.max(...kgs) + 1;

  const points = entries.map((e, i) => ({
    x: PAD + (i / Math.max(entries.length - 1, 1)) * (W - PAD * 2),
    y: PAD + (1 - (e.kg - minKg) / (maxKg - minKg)) * (H - PAD * 2),
    kg: e.kg,
    date: e.date,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const fillD = `${pathD} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`;

  return (
    <div className="bg-[#121218] border border-[#2D2D3F] rounded-2xl p-4">
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs font-bold text-[#71717A] uppercase tracking-wider">
          Biometric Tracker
        </p>
        {onLogClick && (
          <button
            type="button"
            onClick={onLogClick}
            className="text-[10px] bg-[#1F1F2E] border border-[#2D2D3F] px-2 py-0.5 rounded-lg text-indigo-300 hover:text-white transition-all cursor-pointer"
          >
            + Log
          </button>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 100 }}>
        <defs>
          <linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillD} fill="url(#wfill)" />
        <motion.path
          d={pathD} fill="none" stroke="#4F46E5" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3"
            fill="#4F46E5" stroke="#0B0B0F" strokeWidth="2" />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-[#71717A]">{entries[0]?.date}</span>
        <span className="text-[10px] font-bold text-indigo-300">
          {entries[entries.length - 1]?.kg} kg
        </span>
      </div>
    </div>
  );
}
