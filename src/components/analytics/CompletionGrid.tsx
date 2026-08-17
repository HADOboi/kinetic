"use client";
import React, { useState, useMemo } from "react";
import { getDaysInMonth, startOfMonth, getDay, format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ShieldType } from "../../core/types";

interface CompletionGridProps {
  completedDates: string[];                       // YYYY-MM-DD
  shieldDates?: string[];                          // YYYY-MM-DD (shield-protected fallback)
  manualShieldCalendar?: Record<string, ShieldType>; // YYYY-MM-DD -> ShieldType
  restDates: string[];                            // YYYY-MM-DD
}

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export default function CompletionGrid({
  completedDates,
  shieldDates = [],
  manualShieldCalendar = {},
  restDates
}: CompletionGridProps) {
  const [currentViewDate, setCurrentViewDate] = useState(new Date());

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const year     = currentViewDate.getFullYear();
  const month    = currentViewDate.getMonth();
  const daysInM  = getDaysInMonth(currentViewDate);
  const firstDay = getDay(startOfMonth(currentViewDate)); // 0=Sun
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

    // 1. Correct Workout Day -> Orange
    if (completedDates.includes(dateStr)) return "bg-orange-500 text-white font-bold";

    // 2. Shield Usage Day -> Specific Shield Color (Brown for Bronze, Gray for Silver, Yellow for Gold)
    const shieldType = manualShieldCalendar[dateStr];
    if (shieldType === "bronze") return "bg-[#8B4513] text-amber-100 border border-amber-800 font-bold";
    if (shieldType === "silver") return "bg-[#71717A] text-white border border-gray-400 font-bold";
    if (shieldType === "golden") return "bg-[#EAB308] text-black border border-yellow-300 font-bold";

    if (shieldDates.includes(dateStr)) return "bg-[#8B4513] text-amber-100 border border-amber-800 font-bold";

    // 3. Rest Day -> Light Blue
    if (restDates.includes(dateStr)) return "bg-sky-400/80 text-black font-bold";

    // Default uncompleted day
    return "bg-[#1F1F2E]";
  }

  return (
    <div className="bg-[#121218] border border-[#2D2D3F] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-[#71717A] uppercase tracking-wider">
          Activity — {format(currentViewDate, "MMMM yyyy")}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentViewDate((prev) => subMonths(prev, 1))}
            className="p-1 rounded-lg bg-[#1A1A26] border border-[#2D2D3F] text-[#A0A0AB] hover:text-white hover:bg-[#252538] transition-colors cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentViewDate((prev) => addMonths(prev, 1))}
            className="p-1 rounded-lg bg-[#1A1A26] border border-[#2D2D3F] text-[#A0A0AB] hover:text-white hover:bg-[#252538] transition-colors cursor-pointer"
            title="Next Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map((d) => (
          <span key={d} className="text-[9px] text-[#71717A] text-center font-medium">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          const isTodayCell = cell.dateStr === todayStr;
          return (
            <div
              key={i}
              className={`aspect-square rounded-md text-[9px] flex items-center justify-center font-medium relative
                ${cellColor(cell.dateStr, cell.day)}
                ${isTodayCell ? "ring-2 ring-indigo-400 ring-offset-1 ring-offset-[#121218]" : ""}
                ${!cell.day ? "opacity-0 pointer-events-none" : ""}
              `}
            >
              {cell.day && (
                <span className={isTodayCell ? "font-black underline" : ""}>
                  {cell.day}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-[#1A1A26] text-[10px] text-[#71717A]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-orange-500 inline-block" />
          <span>Workout</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-sky-400/80 inline-block" />
          <span>Rest</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#8B4513] inline-block" />
          <span>Bronze</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#71717A] inline-block" />
          <span>Silver</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#EAB308] inline-block" />
          <span>Gold</span>
        </div>
      </div>
    </div>
  );
}
