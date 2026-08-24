"use client";
import React, { useState, useMemo } from "react";
import { getDaysInMonth, startOfMonth, getDay, format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ShieldType } from "../../core/types";

interface CompletionGridProps {
  completedDates: string[];    // YYYY-MM-DD
  shieldDates?: string[];       // YYYY-MM-DD
  shieldUsageMap?: Record<string, ShieldType>; // YYYY-MM-DD -> shield type
  restDates: string[];         // YYYY-MM-DD
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CompletionGrid({
  completedDates,
  shieldDates = [],
  shieldUsageMap = {},
  restDates,
}: CompletionGridProps) {
  const [viewDate, setViewDate] = useState(new Date());

  const year     = viewDate.getFullYear();
  const month    = viewDate.getMonth();
  const daysInM  = getDaysInMonth(viewDate);
  const firstDay = getDay(startOfMonth(viewDate)); // 0=Sun
  // Convert to Mon-first offset
  const offset   = (firstDay + 6) % 7;

  const todayStr = format(new Date(), "yyyy-MM-dd");

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

  function getCellDisplay(dateStr: string, day: number | null) {
    if (!day) return { bg: "bg-transparent", text: "", label: "" };

    const isCompleted = completedDates.includes(dateStr);
    const shieldType = shieldUsageMap[dateStr] || (shieldDates.includes(dateStr) ? "bronze" : null);
    const isRest = restDates.includes(dateStr);

    // 1. Completed Workout Day -> ORANGE
    if (isCompleted) {
      return {
        bg: "bg-[#FF5A00] text-white font-bold shadow-[0_0_8px_rgba(255,90,0,0.35)]",
        text: "text-white font-bold",
        label: "Workout",
      };
    }

    // 2. Shield Usage Day -> Shield color
    if (shieldType) {
      if (shieldType === "golden") {
        // Yellow
        return {
          bg: "bg-[#ca8a04] border border-[#eab308] text-yellow-100 font-bold shadow-[0_0_8px_rgba(234,179,8,0.35)]",
          text: "text-yellow-100 font-bold",
          label: "Gold Shield",
        };
      }
      if (shieldType === "silver") {
        // Gray
        return {
          bg: "bg-[#475569] border border-[#94a3b8] text-slate-100 font-bold",
          text: "text-slate-100 font-bold",
          label: "Silver Shield",
        };
      }
      // Bronze -> Brown
      return {
        bg: "bg-[#78350f] border border-[#92400e] text-amber-200 font-bold",
        text: "text-amber-200 font-bold",
        label: "Bronze Shield",
      };
    }

    // 3. Scheduled Rest Day -> Light Blue
    if (isRest) {
      return {
        bg: "bg-sky-500/20 border border-sky-400/40 text-sky-200 font-medium",
        text: "text-sky-200 font-semibold",
        label: "Rest Day",
      };
    }

    // 4. Default empty cell
    return {
      bg: "bg-[#13131A] text-[#646473]",
      text: "text-[#646473]",
      label: "",
    };
  }

  const isCurrentMonth = format(viewDate, "yyyy-MM") === format(new Date(), "yyyy-MM");

  return (
    <div className="bg-[#0C0C12] border border-[#1A1A26] rounded-2xl p-4 flex flex-col gap-3">
      {/* Calendar Header with Month Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono font-bold text-[#646473] uppercase tracking-wider">
            Activity Matrix
          </p>
          <p className="text-sm font-bold text-white font-mono">
            {format(viewDate, "MMMM yyyy")}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {!isCurrentMonth && (
            <button
              onClick={() => setViewDate(new Date())}
              className="text-[10px] font-mono px-2 py-1 rounded-lg bg-[#1A1A26] text-[#A3A3B3] hover:text-white transition-colors cursor-pointer mr-1"
            >
              Today
            </button>
          )}
          <button
            onClick={() => setViewDate(subMonths(viewDate, 1))}
            title="Previous Month"
            className="w-7 h-7 rounded-lg bg-[#14141E] border border-[#1A1A26] flex items-center justify-center text-[#A3A3B3] hover:text-white hover:border-[#2D2D3F] transition-all cursor-pointer select-none"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setViewDate(addMonths(viewDate, 1))}
            title="Next Month"
            className="w-7 h-7 rounded-lg bg-[#14141E] border border-[#1A1A26] flex items-center justify-center text-[#A3A3B3] hover:text-white hover:border-[#2D2D3F] transition-all cursor-pointer select-none"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((d) => (
          <span key={d} className="text-[9px] text-[#646473] text-center font-mono font-semibold">
            {d}
          </span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          const display = getCellDisplay(cell.dateStr, cell.day);
          const isToday = cell.dateStr === todayStr;

          return (
            <div
              key={i}
              title={cell.dateStr ? `${cell.dateStr}${display.label ? `: ${display.label}` : ""}` : ""}
              className={`aspect-square rounded-lg text-[10px] flex items-center justify-center relative transition-all
                ${display.bg}
                ${isToday ? "ring-2 ring-indigo-400 ring-offset-1 ring-offset-[#0C0C12]" : ""}
                ${!cell.day ? "opacity-0 pointer-events-none" : ""}
              `}
            >
              {cell.day && (
                <span className={display.text || (isToday ? "text-white font-bold" : "text-[#71717A]")}>
                  {cell.day}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="pt-2 border-t border-[#1A1A26] flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[9px] text-[#A3A3B3] font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#FF5A00]" />
          <span>Workout</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-sky-500/30 border border-sky-400/50" />
          <span>Rest Day</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#78350f] border border-[#92400e]" />
          <span>Bronze</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#475569] border border-[#94a3b8]" />
          <span>Silver</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#ca8a04] border border-[#eab308]" />
          <span>Gold</span>
        </div>
      </div>
    </div>
  );
}

