"use client";
import { useState } from "react";
import { doc, setDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../../core/firebase";
import { DEFAULT_PROFILE } from "../../core/firestore";
import { useAuth } from "../../context/AuthContext";

export default function ResetButton() {
  const { user, profile, setProfile } = useAuth();
  const [confirm, setConfirm]         = useState(false);
  const [doing, setDoing]             = useState(false);

  async function handleReset() {
    if (!user || !profile) return;
    setDoing(true);
    // Reset ONLY kineticProfiles — never touches thartheelProfiles
    const fresh = DEFAULT_PROFILE(user.uid, profile.displayName, profile.photoURL);
    
    if (user.uid !== "demo_athlete") {
      try {
        await setDoc(doc(db, "kineticProfiles", user.uid), fresh);
        // Delete user's workoutLogs
        const q    = query(collection(db, "workoutLogs"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
      } catch (err) {
        console.error("Firestore reset failed, doing local reset:", err);
      }
    } else {
      // Demo mode reset: clear demo logs
      localStorage.removeItem(`workout_logs_${user.uid}`);
    }

    // Always sync local cache
    localStorage.setItem(`profile_${user.uid}`, JSON.stringify(fresh));
    setProfile(fresh);
    setDoing(false);
    setConfirm(false);
  }

  return (
    <div className="mt-2">
      {!confirm ? (
        <button
          onClick={() => setConfirm(true)}
          className="text-xs text-[#71717A] underline underline-offset-2 cursor-pointer hover:text-red-400 transition-colors"
        >
          Reset Kinetic data
        </button>
      ) : (
        <div className="bg-[#121218] border border-red-500/30 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-xs text-red-400">
            This resets ONLY Kinetic. Thartheel data is untouched.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirm(false)}
              className="flex-1 py-2 rounded-lg border border-[#2D2D3F] text-[#A0A0AB] text-xs cursor-pointer hover:bg-[#1C1C24] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReset}
              disabled={doing}
              className="flex-1 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold disabled:opacity-40 cursor-pointer hover:bg-red-500/30 transition-colors"
            >
              {doing ? "Resetting…" : "Confirm Reset"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
