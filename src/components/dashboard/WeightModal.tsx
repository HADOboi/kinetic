"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../core/firebase";
import { KineticProfile } from "../../core/types";

interface WeightModalProps {
  profile: KineticProfile;
  onSave: (kg: number) => void;
  onSkip: () => void;
}

export default function WeightModal({ profile, onSave, onSkip }: WeightModalProps) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const kg = parseFloat(value);
    if (!kg || kg < 20 || kg > 300) return;
    setSaving(true);
    const entry = { date: format(new Date(), "yyyy-MM-dd"), kg };
    try {
      if (profile.userId === "demo_athlete") {
        const updated = {
          ...profile,
          weightLog: [...profile.weightLog, entry],
        };
        localStorage.setItem(`profile_${profile.userId}`, JSON.stringify(updated));
        localStorage.setItem("profile_demo_athlete", JSON.stringify(updated));
      } else {
        await updateDoc(doc(db, "kineticProfiles", profile.userId), {
          weightLog: arrayUnion(entry),
        });
      }
      onSave(kg);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-md bg-[#121218] border border-[#2D2D3F] rounded-3xl p-6 flex flex-col gap-5"
        initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="text-center">
          <p className="text-lg font-bold text-white">Weekly Complete! 🎉</p>
          <p className="text-sm text-[#A0A0AB] mt-1">How much do you weigh today? (optional)</p>
        </div>

        <div className="flex items-center gap-3 bg-[#0B0B0F] border border-[#2D2D3F] rounded-2xl px-4 py-3">
          <input
            type="number"
            step="0.1"
            min="20"
            max="300"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="75.0"
            className="flex-1 bg-transparent text-3xl font-bold text-white text-center focus:outline-none"
          />
          <span className="text-[#71717A] font-semibold">kg</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 py-3 rounded-xl border border-[#2D2D3F] text-[#A0A0AB] text-sm font-semibold"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={!value || saving}
            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-40 active:scale-95 transition-all"
          >
            {saving ? "Saving…" : "Log Weight"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
