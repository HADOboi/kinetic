import React from "react";
import { motion } from "framer-motion";
import KineticLogo from "../../components/KineticLogo";

export default function NotFoundPage({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const handleGoHome = () => {
    if (onNavigate) {
      onNavigate("/roadmap");
    } else {
      try {
        window.history.pushState(null, "", "/roadmap");
      } catch (e) {}
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0F] flex flex-col items-center justify-center px-6 py-12 text-center font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-6 max-w-md w-full bg-[#121218] border border-[#2D2D3F] p-8 rounded-3xl shadow-2xl"
      >
        <KineticLogo size="lg" />

        <div className="flex flex-col items-center gap-2">
          <span className="text-6xl font-black font-mono text-indigo-500 tracking-widest">
            404
          </span>
          <h1 className="text-xl font-bold font-display text-white uppercase tracking-wider">
            Vector Off-Track
          </h1>
          <p className="text-xs text-[#A0A0AB] leading-relaxed max-w-xs mt-1">
            The requested trajectory does not exist within the Kinetic sequence. Return to baseline to resume your workout roadmap.
          </p>
        </div>

        <motion.button
          onClick={handleGoHome}
          whileTap={{ scale: 0.96 }}
          className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest cursor-pointer transition-colors shadow-[0_4px_16px_rgba(99,102,241,0.3)] mt-2"
        >
          Return to Roadmap
        </motion.button>
      </motion.div>
    </div>
  );
}
