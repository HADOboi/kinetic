"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";
import { FireState } from "../core/types";

interface FireIconProps {
  state: FireState;
  hasEternalAura?: boolean;
  size?: number;
}

export default function FireIcon({ state, hasEternalAura = false, size = 22 }: FireIconProps) {
  if (state === "none") return <span style={{ width: size, height: size, display: "inline-block" }} />;

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={state}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.3, opacity: 0 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size }}
        className={`relative
          ${state === "lit"    ? "drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" : ""}
          ${state === "freeze" ? "drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]" : ""}
          ${hasEternalAura    ? "drop-shadow-[0_0_14px_rgba(79,70,229,0.7)]"  : ""}
        `}
      >
        {state === "lit" && (
          <Flame size={size} className="text-[#FF5A00] fill-[#FF5A00]" />
        )}
        {state === "freeze" && (
          <Flame size={size} className="text-[#38BDF8] fill-[#38BDF8]" />
        )}
        {state === "greyed" && (
          <Flame size={size} className="text-[#646473] opacity-25" />
        )}
      </motion.span>
    </AnimatePresence>
  );
}
