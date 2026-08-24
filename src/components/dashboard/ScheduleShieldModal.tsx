"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Calendar, X, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { KineticProfile, ShieldType } from "../../core/types";
import { saveProfile } from "../../core/firestore";
import { format, addDays } from "date-fns";

interface ScheduleShieldModalProps {
  profile: KineticProfile;
  onUpdate: (updated: KineticProfile) => void;
  onClose: () => void;
}

export default function ScheduleShieldModal({ profile, onUpdate, onClose }: ScheduleShieldModalProps) {
  const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const [selectedType, setSelectedType] = useState<"bronze" | "silver">("bronze");
  const [selectedDate, setSelectedDate] = useState(tomorrowStr);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const bronzeCount = profile.shields?.bronze ?? 0;
  const silverCount = profile.shields?.silver ?? 0;
  const availableCount = selectedType === "bronze" ? bronzeCount : silverCount;

  const existingCalendar = profile.manualShieldCalendar || {};
  const scheduledDates = Object.entries(existingCalendar).filter(([_, type]) => type === "bronze" || type === "silver");

  // Calculate coverage preview
  const getCoveragePreview = () => {
    if (!selectedDate) return "";
    try {
      const start = new Date(selectedDate + "T00:00:00");
      if (isNaN(start.getTime())) return "";
      if (selectedType === "bronze") {
        return `Protects ${selectedDate} (1 day)`;
      } else {
        const end = addDays(start, 2);
        return `Protects ${selectedDate} to ${format(end, "yyyy-MM-dd")} (3 days)`;
      }
    } catch {
      return "";
    }
  };

  const handleApply = async () => {
    setErrorMsg(null);
    if (!selectedDate) {
      setErrorMsg("Select a valid date");
      return;
    }
    if (availableCount <= 0) {
      setErrorMsg(`No ${selectedType} shields in inventory`);
      return;
    }
    if (existingCalendar[selectedDate]) {
      setErrorMsg(`Date ${selectedDate} is already scheduled`);
      return;
    }

    const updatedCalendar = { ...existingCalendar, [selectedDate]: selectedType as ShieldType };
    const updatedShields = {
      ...profile.shields,
      bronze: selectedType === "bronze" ? Math.max(0, bronzeCount - 1) : bronzeCount,
      silver: selectedType === "silver" ? Math.max(0, silverCount - 1) : silverCount,
    };

    const updatedProfile: KineticProfile = {
      ...profile,
      shields: updatedShields,
      manualShieldCalendar: updatedCalendar,
    };

    onUpdate(updatedProfile);
    try {
      await saveProfile(updatedProfile);
    } catch (e) {
      console.error("Failed to save scheduled shield:", e);
    }
  };

  const handleRemoveScheduled = async (dateKey: string, type: ShieldType) => {
    const updatedCalendar = { ...existingCalendar };
    delete updatedCalendar[dateKey];

    const updatedShields = {
      ...profile.shields,
      bronze: type === "bronze" ? Math.min(2, (profile.shields?.bronze ?? 0) + 1) : (profile.shields?.bronze ?? 0),
      silver: type === "silver" ? Math.min(5, (profile.shields?.silver ?? 0) + 1) : (profile.shields?.silver ?? 0),
    };

    const updatedProfile: KineticProfile = {
      ...profile,
      shields: updatedShields,
      manualShieldCalendar: updatedCalendar,
    };

    onUpdate(updatedProfile);
    try {
      await saveProfile(updatedProfile);
    } catch (e) {
      console.error("Failed to remove scheduled shield:", e);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-md bg-[#0C0C14] border border-[#1E1E2E] rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 relative max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.92, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1A1A26] pb-3">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-indigo-400" />
            <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">
              Schedule Shield
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#717182] hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Shield Type Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono font-bold text-[#A3A3B3] uppercase">
            Select Shield Type
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Bronze option */}
            <button
              type="button"
              onClick={() => setSelectedType("bronze")}
              className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                selectedType === "bronze"
                  ? "bg-amber-950/30 border-amber-500/60 ring-1 ring-amber-500/40"
                  : "bg-[#12121A] border-[#1E1E2C] hover:border-[#2E2E40]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400">Bronze Shield</span>
                <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  {bronzeCount} left
                </span>
              </div>
              <span className="text-[10px] text-[#717182] font-mono">1-day protection</span>
            </button>

            {/* Silver option */}
            <button
              type="button"
              onClick={() => setSelectedType("silver")}
              className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                selectedType === "silver"
                  ? "bg-slate-900/40 border-slate-400/60 ring-1 ring-slate-400/40"
                  : "bg-[#12121A] border-[#1E1E2C] hover:border-[#2E2E40]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Silver Shield</span>
                <span className="text-[11px] font-mono font-bold text-slate-300 bg-slate-500/10 px-2 py-0.5 rounded-md border border-slate-500/20">
                  {silverCount} left
                </span>
              </div>
              <span className="text-[10px] text-[#717182] font-mono">3-day protection window</span>
            </button>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono font-bold text-[#A3A3B3] uppercase">
            Select Start Date
          </label>
          <div className="relative">
            <input
              type="date"
              min={format(new Date(), "yyyy-MM-dd")}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-[#12121A] border border-[#222234] rounded-xl px-3.5 py-2.5 text-white text-sm font-mono focus:border-indigo-500 focus:outline-none"
            />
          </div>
          {selectedDate && (
            <p className="text-[11px] text-indigo-300 font-mono">
              {getCoveragePreview()}
            </p>
          )}
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Apply Action */}
        <button
          type="button"
          onClick={handleApply}
          disabled={availableCount <= 0 || !selectedDate}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-md"
        >
          {availableCount <= 0 ? "No Shields Available" : "Apply Shield to Date"}
        </button>

        {/* Scheduled List */}
        {scheduledDates.length > 0 && (
          <div className="border-t border-[#1A1A26] pt-3 flex flex-col gap-2">
            <span className="text-[10px] font-mono font-bold text-[#717182] uppercase tracking-wider">
              Scheduled Protections
            </span>
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
              {scheduledDates.map(([dateKey, type]) => (
                <div
                  key={dateKey}
                  className="flex items-center justify-between bg-[#12121A] border border-[#1E1E2C] rounded-xl px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${type === "silver" ? "bg-slate-300" : "bg-amber-500"}`} />
                    <span className="font-mono text-white font-bold">{dateKey}</span>
                    <span className="text-[10px] text-[#A3A3B3] uppercase font-mono">
                      ({type === "silver" ? "3-day" : "1-day"})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveScheduled(dateKey, type)}
                    className="p-1 rounded-lg text-[#717182] hover:text-red-400 transition-colors cursor-pointer"
                    title="Cancel and refund shield"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
