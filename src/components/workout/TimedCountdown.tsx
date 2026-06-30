"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TimedCountdownProps {
  onGo: () => void; // called when "GO!" finishes
}

export default function TimedCountdown({ onGo }: TimedCountdownProps) {
  const [count, setCount] = useState<number | "GO!">(3);

  useEffect(() => {
    if (count === "GO!") {
      const t = setTimeout(onGo, 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setCount((c) => (c === 1 ? "GO!" : (c as number) - 1));
    }, 900);
    return () => clearTimeout(t);
  }, [count, onGo]);

  return (
    <div className="fixed inset-0 bg-[#0B0B0F]/90 z-50 flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.span
          key={String(count)}
          className={`text-8xl font-black ${count === "GO!" ? "text-emerald-400" : "text-indigo-400"}`}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.4, opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          {count}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
