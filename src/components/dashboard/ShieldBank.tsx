"use client";
import React from "react";
import { motion } from "framer-motion";
import { KineticProfile } from "../../core/types";

export default function ShieldBank({ shields }: { shields: KineticProfile["shields"] }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-mono font-bold text-[#646473] uppercase tracking-wider">Shield Bank</p>

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
    </div>
  );
}
