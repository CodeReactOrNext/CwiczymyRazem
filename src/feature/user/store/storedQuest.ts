import type { DailyQuest } from "types/api.types";

/**
 * The daily quest as this tab last saw it on the server: from the profile
 * loaded at login, then from every sync that reached Firestore (or queued a
 * write there).
 *
 * The quest sync's offline fallback merges against it. That fallback used to
 * read the copy from Firestore's IndexedDB cache, but the client now runs on
 * a memory cache (see `db` in firebase.utils), which only holds documents
 * this tab has read through the SDK, and the user document usually is not one
 * of them. This keeps the same guarantee: a merge against the last stored
 * copy, never a blind overwrite.
 *
 * Kept per uid, so a copy that belongs to another account is never merged.
 */
let known: { uid: string; quest: DailyQuest | null } | null = null;

export const rememberStoredQuest = (uid: string, quest: DailyQuest | null) => {
  known = { uid, quest };
};

/** `null` when nothing is known for this uid; `{ quest: null }` when none is stored. */
export const recallStoredQuest = (
  uid: string,
): { quest: DailyQuest | null } | null =>
  known?.uid === uid ? { quest: known.quest } : null;

export const forgetStoredQuest = () => {
  known = null;
};
