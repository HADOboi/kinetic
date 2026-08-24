"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Shield } from "lucide-react";
import { KineticProfile } from "../../core/types";
import ScheduleShieldModal from "./ScheduleShieldModal";

interface ShieldBankProps {
  shields?: KineticProfile["shields"];
  profile?: KineticProfile;
  onUpdate?: (updated: KineticProfile) => void;
}

export default function ShieldBank({ shields: propShields, profile, onUpdate }: ShieldBankProps) {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const shields = profile?.shields || propShields || { bronze: 0, silver: 0, goldenUnlocked: false };

  const scheduledCount = profile?.manualShieldCalendar 
    ? Object.keys(profile.manualShieldCalendar).length 
    : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono font-bold text-[#646473] uppercase tracking-wider">Shield Bank</p>
        {profile && onUpdate && (
          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-1 text-[10px] font-mono font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
          >
            <Calendar size={11} />
            <span>Schedule{scheduledCount > 0 ? ` (${scheduledCount})` : ""}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Bronze */}
        <div className="bg-[#0C0C12] border border-[#1A1A26] rounded-2xl p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥉</span>
            <span className="text-xs font-bold text-amber-500">Bronze</span>
          </div>
          <p className="text-[10px] text-[#646473] font-mono">1-day buffer</p>
          <p className="text-2xl font-mono font-extrabold text-amber-500 mt-1">
            {shields.bronze}
            <span className="text-xs text-[#646473] font-normal font-sans ml-0.5">/2</span>
          </p>
          <div className="flex gap-1 mt-1.5">
            {[0,1].map((i) => (
              <div key={i} className={`flex-1 h-1 rounded-full ${i < shields.bronze ? "bg-amber-500" : "bg-[#1A1A26]"}`} />
            ))}
          </div>
        </div>

        {/* Silver */}
        <div className="bg-[#0C0C12] border border-[#1A1A26] rounded-2xl p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥈</span>
            <span className="text-xs font-bold text-slate-300">Silver</span>
          </div>
          <p className="text-[10px] text-[#646473] font-mono">3-day window</p>
          <p className="text-2xl font-mono font-extrabold text-slate-300 mt-1">
            {shields.silver}
            <span className="text-xs text-[#646473] font-normal font-sans ml-0.5">/5</span>
          </p>
          <div className="flex gap-1 mt-1.5">
            {[0,1,2,3,4].map((i) => (
              <div key={i} className={`flex-1 h-1 rounded-full ${i < shields.silver ? "bg-slate-400" : "bg-[#1A1A26]"}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Golden */}
      {shields.goldenUnlocked && (
        <motion.div
          className="bg-gradient-to-r from-yellow-900/30 to-amber-900/20 border border-yellow-500/40 rounded-2xl p-4 flex items-center gap-3"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <span className="text-3xl">🏅</span>
          <div>
            <p className="text-sm font-bold text-yellow-400">Golden Shield</p>
            <p className="text-xs text-[#A0A0AB]">365-day legacy — permanent</p>
          </div>
        </motion.div>
      )}

      {/* Schedule Modal */}
      <AnimatePresence>
        {showScheduleModal && profile && onUpdate && (
          <ScheduleShieldModal
            profile={profile}
            onUpdate={onUpdate}
            onClose={() => setShowScheduleModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
