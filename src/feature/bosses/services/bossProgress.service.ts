import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

import type { BossRecord, BossRecordMap } from "../types/boss.types";
import { parseRecord } from "../utils/bossProgress";

/**
 * One doc for every boss, keyed by boss id. Owner-only like the rest of
 * `settings`: a fight pays no reward, so the client writes its own record.
 */
const recordsRef = (uid: string) => doc(db, "users", uid, "settings", "bossFights");

export const getBossRecords = async (uid: string): Promise<BossRecordMap> => {
  const snap = await getDoc(recordsRef(uid));
  const data = snap.exists() ? (snap.data() as Record<string, unknown>) : {};
  return Object.fromEntries(
    Object.entries(data).map(([bossId, raw]) => [bossId, parseRecord(raw)]),
  );
};

export const saveBossRecord = (uid: string, bossId: string, record: BossRecord) =>
  setDoc(recordsRef(uid), { [bossId]: record }, { merge: true });
