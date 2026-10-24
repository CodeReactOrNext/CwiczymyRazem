import type { SongSection } from "feature/songs/types/songSection.type";

/** How long the last section is taken to run when the video's length isn't known yet. */
const FALLBACK_LAST_SECTION_LENGTH = 30;

export const sortSections = (sections: SongSection[]): SongSection[] =>
  [...sections].sort((a, b) => a.startTime - b.startTime);

export const formatSectionTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

/** Index (into `sorted`) of the section playing at `time`, or -1 before the first one. */
export const findSectionIndexAt = (
  sorted: SongSection[],
  time: number,
): number => {
  let index = -1;
  sorted.forEach((section, i) => {
    if (section.startTime <= time) index = i;
  });
  return index;
};

/**
 * Where a new section starts. Normally at the playhead — but before the video
 * has played the playhead sits at 0:00, where a section usually already is,
 * and stacking a second one there leaves a zero-length section that never
 * shows on the timeline. Then the new one splits the section it landed on in
 * half instead, so it is always visible and can be moved from there.
 */
export const newSectionStart = (
  sections: SongSection[],
  playhead: number,
  duration: number,
): number => {
  const at = Math.floor(playhead);
  if (!sections.some((s) => Math.floor(s.startTime) === at)) return at;

  const nextStart = sortSections(sections).find(
    (s) => s.startTime > at,
  )?.startTime;
  const end =
    nextStart ?? (duration > at ? duration : at + FALLBACK_LAST_SECTION_LENGTH);
  return Math.floor(at + (end - at) / 2);
};

/**
 * `base`, numbered when the song already has a section by that name — a song
 * comes back to its verse and chorus, and two rows both called "Verse" can't
 * be told apart.
 */
export const nextSectionName = (
  sections: SongSection[],
  base: string,
): string => {
  const taken = new Set(sections.map((s) => s.name));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base} ${n}`)) n++;
  return `${base} ${n}`;
};
