import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { signInWithPopup } from "firebase/auth";
import { motion } from "framer-motion";
import { auth, googleProvider } from "./core/firebase";
import AppShell from "./components/layout/AppShell";
import Header from "./components/layout/Header";
import BottomNav from "./components/layout/BottomNav";
import KineticLogo from "./components/KineticLogo";

// Screens
import RoadmapPage from "./app/roadmap/page.tsx";
import DashboardPage from "./app/dashboard/page.tsx";
import WorkoutPage from "./app/workout/page.tsx";
import { WEEKLY_SCHEDULE } from "./core/exerciseMatrix";
import { RoutineType } from "./core/types";

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (path: string) => {
    try {
      window.history.pushState(null, "", path);
    } catch (e) {
      console.warn("History pushState blocked by iframe sandbox:", e);
    }
    setCurrentPath(path);
  };

  useEffect(() => {
    if (!loading && user && (currentPath === "/" || currentPath === "")) {
      navigate("/roadmap");
    }
  }, [user, loading, currentPath]);

  async function handleGoogleSignIn() {
    try {
      setSignInError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.warn("Sign-in popup issue:", err);
      setSignInError(err?.message || "Google Sign-In failed or was blocked. Please verify popups are allowed.");
    }
  }

  function GoogleIcon() {
    return (
      <svg className="w-5 h-5 select-none" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.08H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.92l2.85-2.22-.19-.6z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.08l3.66 2.84c.87-2.6 3.3-4.54 6.16-4.54z" fill="#EA4335"/>
      </svg>
    );
  }

  // LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex flex-col items-center justify-center gap-6 font-sans p-4">
        <motion.div
          className="kinetic-pulse flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <KineticLogo size="lg" />
        </motion.div>
        <p className="text-[#71717A] text-xs tracking-[0.2em] uppercase font-mono animate-pulse">
          Synchronizing Kinetic
        </p>
      </div>
    );
  }

  // LOGIN STATE (not logged in)
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex flex-col items-center justify-center gap-8 px-6 font-sans">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <KineticLogo size="lg" />
        </motion.div>

        <div className="flex flex-col gap-4 w-full max-w-xs items-center">
          <motion.button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-[#121218] border border-[#2D2D3F] text-white px-6 py-3.5 rounded-2xl text-sm font-semibold hover:border-accent-indigo hover:bg-[#1a1a2e] transition-all duration-200 cursor-pointer shadow-lg outline-none"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileTap={{ scale: 0.97 }}
          >
            <GoogleIcon />
            Continue with Google
          </motion.button>

          {signInError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-xs text-center mt-2 px-4"
            >
              {signInError}
            </motion.p>
          )}
        </div>
      </div>
    );
  }

  // LOGGED IN STATE - Determine schedule state from profile
  const todayNode = profile ? (WEEKLY_SCHEDULE[profile.currentScheduleIndex ?? 0] || WEEKLY_SCHEDULE[0]) : WEEKLY_SCHEDULE[0];
  const dailyState = todayNode.type === "rest" ? "Rest" : todayNode.label;

  const currentLevel = todayNode.type !== "rest" && profile
    ? profile.progressionLevels[todayNode.type as RoutineType]?.level
    : undefined;

  const streakCount = profile?.currentStreak ?? 0;
  const fireState = streakCount > 0 ? "lit" : "greyed";

  const cleanPath = currentPath.split("?")[0].split("#")[0];

  if (cleanPath === "/dashboard") {
    return <DashboardPage />;
  }

  if (cleanPath === "/workout") {
    return <WorkoutPage />;
  }

  return (
    <AppShell currentPath={currentPath} onNavigate={navigate}>
      <Header
        dailyState={dailyState}
        currentLevel={currentLevel}
        streakCount={streakCount}
        fireState={fireState}
        userPhotoURL={profile?.photoURL}
        hasEternalAura={profile?.shields?.goldenUnlocked}
      />
      
      <main className="flex-1 overflow-y-auto pt-14 pb-16 md:pt-6 md:pb-6">
        {cleanPath === "/roadmap" && <RoadmapPage />}
        {cleanPath !== "/roadmap" && cleanPath !== "/dashboard" && cleanPath !== "/workout" && (
          <div className="p-8 text-center text-text-secondary font-sans text-sm mt-10">
            Route Not Found
          </div>
        )}
      </main>

      <BottomNav currentPath={currentPath} onNavigate={navigate} />
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
