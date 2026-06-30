"use client";
import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { db } from "../../core/firebase";
import { KineticProfile } from "../../core/types";

interface EquipmentChestProps {
  profile: KineticProfile;
  onUpdate: (updated: KineticProfile) => void;
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-11 h-6 rounded-full transition-colors duration-200 relative flex-shrink-0 cursor-pointer border border-[#2D2D3F] ${
        on ? "bg-indigo-600" : "bg-[#1F1F2E]"
      }`}
    >
      <span
        className={`absolute top-[2px] left-[2px] w-4.5 h-4.5 rounded-full bg-white shadow-md transition-transform duration-200 ${
          on ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function EquipmentChest({ profile, onUpdate }: EquipmentChestProps) {
  const [saving, setSaving] = useState(false);

  async function toggle(key: "hasPullupBar" | "hasDumbbells") {
    setSaving(true);
    const updated: KineticProfile = {
      ...profile,
      equipmentInventory: {
        ...profile.equipmentInventory,
        [key]: !profile.equipmentInventory[key],
      },
    };
    onUpdate(updated);
    try {
      if (profile.userId === "demo_athlete") {
        localStorage.setItem(`profile_${profile.userId}`, JSON.stringify(updated));
        // Dual-write standard fallback keys
        localStorage.setItem("profile_demo_athlete", JSON.stringify(updated));
      } else {
        await updateDoc(doc(db, "kineticProfiles", profile.userId), {
          equipmentInventory: updated.equipmentInventory,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const items = [
    { key: "hasPullupBar" as const, icon: "🔩", label: "Pull-up Bar",
      note: "Enables dead hangs, pull-ups, front lever" },
    { key: "hasDumbbells" as const, icon: "🏋️", label: "Dumbbells",
      note: "Enables goblet squats, DB rows, weighted pistols" },
  ];

  return (
    <div className="bg-[#121218] border border-dashed border-[#2D2D3F] rounded-2xl p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-base">📦</span>
        <p className="text-xs font-bold text-[#71717A] uppercase tracking-wider">Equipment Chest</p>
        {saving && <span className="text-[10px] text-indigo-400 ml-auto">Saving…</span>}
      </div>

      {items.map(({ key, icon, label, note }) => (
        <div key={key} className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{label}</p>
            <p className="text-[10px] text-[#71717A]">{note}</p>
          </div>
          <Toggle
            on={profile.equipmentInventory[key]}
            onToggle={() => toggle(key)}
          />
        </div>
      ))}

      <p className="text-[10px] text-[#71717A] border-t border-[#1F1F2E] pt-3">
        ⚠️ Changes take effect from your next workout session.
      </p>
    </div>
  );
}
