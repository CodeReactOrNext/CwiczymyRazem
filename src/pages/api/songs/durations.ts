import type { NextApiRequest, NextApiResponse } from "next";
import { fetchSongDurationMs } from "utils/enrichment/songDuration.util";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/** Songs one request may ask about — a rotation holds at most 60. */
const MAX_SONG_IDS = 60;
/** Spotify lookups one request may make; the rest are picked up next time. */
const MAX_LOOKUPS = 10;

/**
 * Recording lengths for a batch of library songs. A length is looked up on
 * Spotify once and kept on the song (`durationMs`); a song Spotify has no
 * match for is marked `durationLookedUp` so it isn't searched on every visit.
 * Admin SDK: the song doc fields are written by the backend only.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, songIds } = req.body as {
    idToken?: string;
    songIds?: unknown;
  };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  try {
    await auth.verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!Array.isArray(songIds)) {
    return res.status(400).json({ error: "Missing songIds" });
  }
  const ids = Array.from(
    new Set(
      songIds.filter(
        (id): id is string =>
          typeof id === "string" && id.length > 0 && !id.includes("/"),
      ),
    ),
  ).slice(0, MAX_SONG_IDS);
  if (ids.length === 0) return res.status(200).json({ durations: {} });

  try {
    const refs = ids.map((id) => firestore.collection("songs").doc(id));
    const snapshots = await firestore.getAll(...refs);
    const durations: Record<string, number> = {};
    let lookups = 0;

    for (const snapshot of snapshots) {
      if (!snapshot.exists) continue;
      const song = snapshot.data()!;
      if (typeof song.durationMs === "number" && song.durationMs > 0) {
        durations[snapshot.id] = song.durationMs;
        continue;
      }
      if (song.durationLookedUp || lookups >= MAX_LOOKUPS) continue;
      if (!song.title || !song.artist) continue;

      lookups += 1;
      try {
        const durationMs = await fetchSongDurationMs({
          artist: song.artist,
          title: song.title,
          spotifyId: song.spotifyId,
        });
        if (durationMs) {
          durations[snapshot.id] = durationMs;
          await snapshot.ref.update({ durationMs, durationLookedUp: true });
        } else {
          await snapshot.ref.update({ durationLookedUp: true });
        }
      } catch (error) {
        // Spotify down or unconfigured: no length this time, try again later.
        console.error("[songs/durations] lookup failed", snapshot.id, error);
      }
    }

    return res.status(200).json({ durations });
  } catch (error) {
    console.error("[songs/durations]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
