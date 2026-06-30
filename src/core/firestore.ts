import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebase";
import { KineticProfile } from "./types";
import { format } from "date-fns";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const DEFAULT_PROFILE = (userId: string, displayName: string, photoURL: string): KineticProfile => ({
  userId,
  displayName,
  photoURL,
  currentStreak: 0,
  lastCompletedDate: "",
  currentPhase: "conditioning",
  shields: { bronze: 0, silver: 0, goldenUnlocked: false },
  manualShieldCalendar: {},
  currentScheduleIndex: 0,
  progressionLevels: {
    push:      { level: 1, currentCycle: 1, lastFeedback: "", maxTestVolume: 0 },
    pull:      { level: 1, currentCycle: 1, lastFeedback: "", maxTestVolume: 0 },
    legs_core: { level: 1, currentCycle: 1, lastFeedback: "", maxTestVolume: 0 },
  },
  equipmentInventory: { hasPullupBar: false, hasDumbbells: false },
  weightLog: [],
  createdAt: format(new Date(), "yyyy-MM-dd"),
});

export async function getOrCreateProfile(
  userId: string,
  displayName: string,
  photoURL: string
): Promise<KineticProfile> {
  const path = `kineticProfiles/${userId}`;
  
  // Dual-write: Always prepare local fallback
  const localKey = `profile_${userId}`;
  const localData = localStorage.getItem(localKey);
  let localProfile: KineticProfile | null = null;
  if (localData) {
    try {
      localProfile = JSON.parse(localData);
    } catch (_) {}
  }

  try {
    const ref = doc(db, "kineticProfiles", userId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as KineticProfile;
      // Sync to local storage
      localStorage.setItem(localKey, JSON.stringify(data));
      return data;
    }
    const newProfile = DEFAULT_PROFILE(userId, displayName, photoURL);
    await setDoc(ref, { ...newProfile, _serverCreatedAt: serverTimestamp() });
    localStorage.setItem(localKey, JSON.stringify(newProfile));
    return newProfile;
  } catch (error) {
    console.warn("Firestore connection blocked/failed. Using LocalStorage fallback:", error);
    if (localProfile) {
      return localProfile;
    }
    const fallbackProfile = DEFAULT_PROFILE(userId, displayName, photoURL);
    localStorage.setItem(localKey, JSON.stringify(fallbackProfile));
    return fallbackProfile;
  }
}

export async function saveProfile(profile: KineticProfile): Promise<void> {
  const path = `kineticProfiles/${profile.userId}`;
  const localKey = `profile_${profile.userId}`;
  
  // Always commit to LocalStorage immediately
  localStorage.setItem(localKey, JSON.stringify(profile));
  
  // If demo user is logged in, do not call Firestore
  if (profile.userId === "demo_athlete") {
    return;
  }

  try {
    const ref = doc(db, "kineticProfiles", profile.userId);
    await setDoc(ref, profile, { merge: true });
  } catch (error) {
    console.warn("Firestore save failed, state is safely preserved in local cache:", error);
  }
}
