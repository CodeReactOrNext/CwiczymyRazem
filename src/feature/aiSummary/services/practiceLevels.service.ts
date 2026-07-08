import { doc, getDoc, increment, setDoc, updateDoc } from "firebase/firestore";
import { memoryCache } from "utils/cache/memoryCache";
import { db } from "utils/firebase/client/firebase.utils";

const FIVE_MIN_MS = 5 * 60 * 1000;
const cacheKey = (uid: string) => `practiceLevels:${uid}`;

export const invalidatePracticeLevelsCache = (uid: string) =>
  memoryCache.invalidate(cacheKey(uid));

export interface LevelClaim {
  weekKey: string;
  claimedAt: string;
}

export interface PracticeLevelsState {
  ownedLevelIds: number[];
  claims: Record<number, LevelClaim>;
}

const DEFAULT_STATE: PracticeLevelsState = {
  ownedLevelIds: [1],
  claims: {},
};

const docRef = (uid: string) => doc(db, "users", uid, "settings", "practiceLevels");

export async function firebaseGetPracticeLevels(uid: string): Promise<PracticeLevelsState> {
  const cached = memoryCache.get(cacheKey(uid));
  if (cached) return cached as PracticeLevelsState;
  try {
    const snap = await getDoc(docRef(uid));
    const state: PracticeLevelsState = !snap.exists()
      ? DEFAULT_STATE
      : (() => {
          const data = snap.data() as Partial<PracticeLevelsState>;
          return {
            ownedLevelIds: data.ownedLevelIds?.length ? Array.from(new Set([...data.ownedLevelIds, 1])) : [1],
            claims: data.claims ?? {},
          };
        })();
    memoryCache.set(cacheKey(uid), state, FIVE_MIN_MS);
    return state;
  } catch {
    return DEFAULT_STATE;
  }
}

export async function firebasePurchaseLevel(
  uid: string,
  levelId: number,
  cost: number,
  currentOwned: number[]
): Promise<void> {
  const nextOwned = Array.from(new Set([...currentOwned, levelId]));
  await setDoc(docRef(uid), { ownedLevelIds: nextOwned }, { merge: true });
  invalidatePracticeLevelsCache(uid);
  if (cost > 0) {
    await updateDoc(doc(db, "users", uid), { "statistics.fame": increment(-cost) });
  }
}

export async function firebaseClaimLevel(
  uid: string,
  levelId: number,
  weekKey: string,
  reward: number
): Promise<void> {
  const claim: LevelClaim = { weekKey, claimedAt: new Date().toISOString() };
  await setDoc(docRef(uid), { claims: { [levelId]: claim } }, { merge: true });
  invalidatePracticeLevelsCache(uid);
  if (reward > 0) {
    await updateDoc(doc(db, "users", uid), { "statistics.fame": increment(reward) });
  }
}
