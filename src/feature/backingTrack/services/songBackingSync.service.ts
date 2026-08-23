import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

import type { YouTubeBackingConfig } from "../types/backingTrack.types";
import { DEFAULT_ALIGNMENT } from "../types/backingTrack.types";
import type { TempoAnchor } from "../utils/tempoMap";

/**
 * YouTube backing-track config for one song. Unlike a local file this works on
 * every device (and in the browser), so it rides along in the same per-user song
 * document that already holds `youtubeUrl` and the section list.
 */
const metaRef = (userId: string, songId: string) => doc(db, "users", userId, "userSongs", songId);

const clamp = (value: unknown, min: number, max: number, fallback: number): number => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

/** A cap so a corrupt document can never stall the app parsing anchors. */
const MAX_ANCHORS = 512;

/**
 * Anchors come back from Firestore as plain data that may be anything at all,
 * and a single NaN in here would divide by zero in every consumer of the tempo
 * map. Only well-formed, forward-moving entries survive the trip.
 */
const readAnchors = (raw: unknown): TempoAnchor[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => ({ beat: Number((entry as TempoAnchor)?.beat), sec: Number((entry as TempoAnchor)?.sec) }))
    .filter((a) => Number.isFinite(a.beat) && Number.isFinite(a.sec) && a.beat > 0)
    .sort((a, b) => a.beat - b.beat)
    .slice(0, MAX_ANCHORS);
};

const normalize = (raw: Record<string, unknown> | undefined): YouTubeBackingConfig => ({
  videoId: typeof raw?.videoId === "string" ? raw.videoId : null,
  offsetMs: clamp(raw?.offsetMs, -60_000, 60_000, DEFAULT_ALIGNMENT.offsetMs),
  sourceBpm: clamp(raw?.sourceBpm, 20, 400, DEFAULT_ALIGNMENT.sourceBpm),
  tempoAnchors: readAnchors(raw?.tempoAnchors),
  volume: clamp(raw?.volume, 0, 1, DEFAULT_ALIGNMENT.volume),
  muted: !!raw?.muted,
});

export const getYouTubeBackingConfig = async (
  userId: string,
  songId: string,
): Promise<YouTubeBackingConfig | null> => {
  const snap = await getDoc(metaRef(userId, songId));
  if (!snap.exists()) return null;
  const raw = snap.data()?.backingSync;
  if (!raw || typeof raw !== "object") return null;
  return normalize(raw as Record<string, unknown>);
};

/**
 * Merge-writes a partial config. Firestore deep-merges map fields under
 * `{ merge: true }`, so a single changed key never clears the rest.
 */
export const saveYouTubeBackingConfig = async (
  userId: string,
  songId: string,
  patch: Partial<YouTubeBackingConfig>,
): Promise<void> => {
  await setDoc(metaRef(userId, songId), { backingSync: patch }, { merge: true });
};
