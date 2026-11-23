import type {
  Roadmap,
  RoadmapPhase,
  RoadmapSongRef,
  RoadmapStep,
} from "feature/aiCoach/types/roadmap.types";

import type { SongRequest } from "./songLookup";

/**
 * A step that named a song the library lacked keeps the request
 * (`songRequest`). The library grows — four of the songs the first roadmaps
 * asked for and did not get are in it today — so the request is looked up
 * again when its owner opens the roadmap, at most once a day.
 *
 * Pure: what to look up, and the phases once the answers are in. The reads
 * and the write live with the caller.
 */

/** How often a roadmap's unlinked songs are looked up again. */
export const SONG_RELINK_EVERY_MS = 24 * 60 * 60 * 1000;
/** Lookups per check — each is up to four small reads. */
export const MAX_RELINK_REQUESTS = 8;

const requestKey = (request: SongRequest) =>
  `${request.title.trim().toLowerCase()}::${request.artist.trim().toLowerCase()}`;

const waiting = (step: RoadmapStep): step is RoadmapStep & {
  songRequest: SongRequest;
} => !!step.songRequest?.title && !step.suggestedSong;

/** The distinct songs this roadmap still waits for, or none when it is not time to ask. */
export const dueSongRequests = (
  roadmap: Roadmap,
  now = Date.now(),
): SongRequest[] => {
  const checked = roadmap.songsCheckedAt
    ? new Date(roadmap.songsCheckedAt).getTime()
    : 0;
  if (now - checked < SONG_RELINK_EVERY_MS) return [];
  const seen = new Set<string>();
  const requests: SongRequest[] = [];
  (roadmap.phases ?? []).forEach((phase) =>
    (phase.steps ?? []).forEach((step) => {
      if (!waiting(step)) return;
      const key = requestKey(step.songRequest);
      if (seen.has(key)) return;
      seen.add(key);
      requests.push(step.songRequest);
    }),
  );
  return requests.slice(0, MAX_RELINK_REQUESTS);
};

/**
 * The phases with every found song on its steps. `linked` counts the steps
 * that got one; the phases are the same objects when it is 0.
 */
export const linkFoundSongs = (
  phases: RoadmapPhase[],
  found: Map<string, RoadmapSongRef>,
): { phases: RoadmapPhase[]; linked: number } => {
  let linked = 0;
  const next = phases.map((phase) => ({
    ...phase,
    steps: (phase.steps ?? []).map((step) => {
      if (!waiting(step)) return step;
      const song = found.get(requestKey(step.songRequest));
      if (!song) return step;
      linked += 1;
      const withSong: RoadmapStep = { ...step, suggestedSong: song };
      delete withSong.songRequest;
      return withSong;
    }),
  }));
  return linked ? { phases: next, linked } : { phases, linked: 0 };
};

export const songRequestKey = requestKey;
