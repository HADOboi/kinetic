"use client";
import { motion } from "framer-motion";

interface EternalAuraProps {
  hasOrbital?: boolean; // streak >= 730
}

export default function EternalAura({ hasOrbital = false }: EternalAuraProps) {
  return (
    <span className="relative inline-flex items-center justify-center">
      {/* Ambient nebula glow */}
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(79,70,229,0.35) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Orbital ring */}
      {hasOrbital && (
        <motion.span
          className="absolute inset-[-6px] rounded-full border border-indigo-500/40"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{ borderStyle: "dashed" }}
        />
      )}
    </span>
  );
}
