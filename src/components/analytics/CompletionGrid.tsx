"use client";
import React from "react";
import { useMemo } from "react";
import { getDaysInMonth, startOfMonth, getDay, format } from "date-fns";

interface CompletionGridProps {
  completedDates: string[];    // YYYY-MM-DD
  shieldDates: string[];       // YYYY-MM-DD (shield-protected)
  restDates: string[];         // YYYY-MM-DD
}

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export default function CompletionGrid({ completedDates, shieldDates, restDates }: CompletionGridProps) {
  const today    = new Date();
  const year     = today.getFullYear();
  const month    = today.getMonth();
  const daysInM  = getDaysInMonth(today);
  const firstDay = getDay(startOfMonth(today)); // 0=Sun
  // Convert to Mon-first offset
  const offset   = (firstDay + 6) % 7;

  const cells = useMemo(() => {
    const arr: { day: number | null; dateStr: string }[] = [];
    for (let i = 0; i < offset; i++) arr.push({ day: null, dateStr: "" });
    for (let d = 1; d <= daysInM; d++) {
      arr.push({
        day: d,
        dateStr: format(new Date(year, month, d), "yyyy-MM-dd"),
      });
    }
    return arr;
  }, [year, month, daysInM, offset]);

  function cellColor(dateStr: string, day: number | null) {
    if (!day) return "bg-transparent";
    if (completedDates.includes(dateStr)) return "bg-indigo-600";
    if (shieldDates.includes(dateStr))    return "bg-sky-400/30 border border-sky-400/50";
    if (restDates.includes(dateStr))      return "bg-[#1a1a2e]";
    return "bg-[#1F1F2E]";
  }

  return (
    <div className="bg-[#121218] border border-[#2D2D3F] rounded-2xl p-4">
      <p className="text-xs font-bold text-[#71717A] uppercase tracking-wider mb-3">
        Activity — {format(today, "MMMM yyyy")}
      </p>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map((d) => (
          <span key={d} className="text-[9px] text-[#71717A] text-center font-medium">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          const todayCell = cell.dateStr === format(today, "yyyy-MM-dd");
          return (
            <div
              key={i}
              className={`aspect-square rounded-md text-[9px] flex items-center justify-center font-medium relative
                ${cellColor(cell.dateStr, cell.day)}
                ${todayCell ? "ring-2 ring-indigo-400 ring-offset-1 ring-offset-[#121218]" : ""}
                ${!cell.day ? "opacity-0 pointer-events-none" : ""}
              `}
            >
              {cell.day && (
                <span className={todayCell ? "text-white font-bold" : "text-[#71717A]"}>
                  {cell.day}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
