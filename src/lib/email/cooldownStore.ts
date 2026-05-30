import { firestore } from "utils/firebase/api/firebase.config";

import {
  type EmailCooldownData,
  EMAIL_COOLDOWNS_COLLECTION,
  type EmailCooldownType,
} from "./cooldown";

export async function fetchCooldown(uid: string): Promise<EmailCooldownData | null> {
  const snap = await firestore.collection(EMAIL_COOLDOWNS_COLLECTION).doc(uid).get();
  if (!snap.exists) return null;
  return (snap.data() as EmailCooldownData) ?? null;
}

export async function fetchCooldownsMap(
  uids: string[]
): Promise<Map<string, EmailCooldownData>> {
  const map = new Map<string, EmailCooldownData>();
  if (uids.length === 0) return map;

  const refs = uids.map((uid) =>
    firestore.collection(EMAIL_COOLDOWNS_COLLECTION).doc(uid)
  );
  const snaps = await firestore.getAll(...refs);
  snaps.forEach((snap: any, idx: number) => {
    if (snap.exists) {
      map.set(uids[idx], (snap.data() as EmailCooldownData) ?? {});
    }
  });
  return map;
}

export async function markCooldown(
  uid: string,
  type: EmailCooldownType,
  dateKey: string
): Promise<void> {
  await firestore
    .collection(EMAIL_COOLDOWNS_COLLECTION)
    .doc(uid)
    .set({ [type]: dateKey }, { merge: true });
}

export async function batchMarkCooldown(
  entries: { uid: string; type: EmailCooldownType }[],
  dateKey: string
): Promise<void> {
  if (entries.length === 0) return;

  const CHUNK = 400;
  for (let i = 0; i < entries.length; i += CHUNK) {
    const chunk = entries.slice(i, i + CHUNK);
    const batch = firestore.batch();
    chunk.forEach(({ uid, type }) => {
      batch.set(
        firestore.collection(EMAIL_COOLDOWNS_COLLECTION).doc(uid),
        { [type]: dateKey },
        { merge: true }
      );
    });
    await batch.commit();
  }
}
