import type { ReportFormikInterface } from "../ReportView.types";
import {
  MAX_SONG_CATEGORY_MINUTES,
  MINUTE_STEP,
  type PickedSong,
  songTotalMinutes,
} from "./sessionSongs";

export const CATEGORY_KEYS = [
  "technique",
  "theory",
  "hearing",
  "creativity",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

/** Same ceiling a song or a skill has — eight hours on one category. */
export const MAX_CATEGORY_MINUTES = 480;

/** The session lengths worth one tap. Anything else is stepped or typed. */
export const TIME_PRESETS = [10, 15, 20, 30, 45, 60];

/** The shorter set a desktop row has room for, beside its stepper. */
export const ROW_TIME_PRESETS = [15, 30, 45, 60];

/** Snaps to the next/previous multiple of the step, so 7 → 10 → 5 → 0. */
export const stepMinutesUp = (minutes: number, max: number) =>
  Math.min(max, (Math.floor(minutes / MINUTE_STEP) + 1) * MINUTE_STEP);

export const stepMinutesDown = (minutes: number) =>
  Math.max(0, (Math.ceil(minutes / MINUTE_STEP) - 1) * MINUTE_STEP);

/** One category's time as the form holds it — an hours and a minutes field. */
export const getCategoryMinutes = (
  values: Pick<
    ReportFormikInterface,
    `${CategoryKey}Hours` | `${CategoryKey}Minutes`
  >,
  key: CategoryKey,
) =>
  (Number(values[`${key}Hours`]) || 0) * 60 +
  (Number(values[`${key}Minutes`]) || 0);

/**
 * Sets how long a song was played. The quick path knows one number per song,
 * so it all counts as technique unless part of it was already marked as played
 * by ear — that part is kept, trimmed when the total drops below it.
 */
export const withSongTotalMinutes = (
  song: PickedSong,
  total: number,
): PickedSong => {
  const safeTotal = Math.max(0, Math.min(total, MAX_SONG_CATEGORY_MINUTES));
  const hearingMinutes = Math.min(song.hearingMinutes, safeTotal);
  return {
    ...song,
    hearingMinutes,
    techniqueMinutes: safeTotal - hearingMinutes,
  };
};

/** Moves part of a song's time to hearing without changing how long it was played. */
export const withSongHearingMinutes = (
  song: PickedSong,
  hearing: number,
): PickedSong => {
  const total = songTotalMinutes(song);
  const hearingMinutes = Math.max(0, Math.min(hearing, total));
  return { ...song, hearingMinutes, techniqueMinutes: total - hearingMinutes };
};
