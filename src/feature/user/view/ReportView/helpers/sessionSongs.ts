import type { ReportSongEntry } from "../ReportView.types";

/** The subset of a song the report form needs to identify it in the picker. */
export interface SessionSong {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
}

/**
 * A song picked for the session, with the time it got. Songs are logged the way
 * the song timer splits them — technique and hearing — so a session made of
 * songs needs no separate category boxes.
 */
export interface PickedSong extends SessionSong {
  techniqueMinutes: number;
  hearingMinutes: number;
}

export const MINUTE_MS = 60_000;

/** Keeps one report document (and its Discord log) at a sane size. */
export const MAX_SESSION_SONGS = 20;

/** The steppers' grain — a repeat run is counted in 5-minute blocks. */
export const MINUTE_STEP = 5;

/** Nothing sane needs more than 8 hours on one song in one session. */
export const MAX_SONG_CATEGORY_MINUTES = 480;

/**
 * A freshly picked song already carries one repeat block, so logging a run of
 * short repeats costs exactly one tap per song.
 */
export const DEFAULT_TECHNIQUE_MINUTES = 5;

/** Formik's `reportTitle` is capped at 120 chars by `RaportSchema`. */
const TITLE_MAX_LENGTH = 120;

export const createPickedSong = (song: SessionSong): PickedSong => ({
  ...song,
  techniqueMinutes: DEFAULT_TECHNIQUE_MINUTES,
  hearingMinutes: 0,
});

export const songTotalMinutes = (song: PickedSong) =>
  song.techniqueMinutes + song.hearingMinutes;

/** The category totals a song session contributes to the report's time boxes. */
export const sumSongMinutes = (songs: PickedSong[]) =>
  songs.reduce(
    (totals, song) => ({
      technique: totals.technique + song.techniqueMinutes,
      hearing: totals.hearing + song.hearingMinutes,
    }),
    { technique: 0, hearing: 0 }
  );

/** Songs left at 0 minutes were picked but not practised, so they never land in the report. */
export const toReportSongEntries = (songs: PickedSong[]): ReportSongEntry[] =>
  songs
    .filter((song) => songTotalMinutes(song) > 0)
    .map((song) => ({
      songId: song.id,
      songTitle: song.title,
      songArtist: song.artist,
      techniqueMs: song.techniqueMinutes * MINUTE_MS,
      hearingMs: song.hearingMinutes * MINUTE_MS,
      practiceMs: songTotalMinutes(song) * MINUTE_MS,
    }));

/**
 * The song the report is filed under for everything that still reads a single
 * `songId` (activity feed, practice log, rating popup): the one that got the
 * most time, falling back to the first picked when the times are equal.
 */
export const pickPrimarySong = (
  songs: ReportSongEntry[]
): ReportSongEntry | undefined =>
  songs.reduce<ReportSongEntry | undefined>(
    (best, song) => (best && best.practiceMs >= song.practiceMs ? best : song),
    undefined
  );

/** "Metallica - One" for one song, "4 songs: One, Fade to Black +2 more" for a run. */
export const buildSongsSessionTitle = (
  songs: { title: string; artist: string }[]
): string => {
  if (songs.length === 0) return "";
  if (songs.length === 1) {
    const { title, artist } = songs[0];
    return (artist ? `${artist} - ${title}` : title).slice(0, TITLE_MAX_LENGTH);
  }

  const compose = (named: string[]) => {
    const hidden = songs.length - named.length;
    return `${songs.length} songs: ${named.join(", ")}${
      hidden > 0 ? ` +${hidden} more` : ""
    }`;
  };

  const named: string[] = [];
  songs.forEach(({ title }) => {
    if (named.length > 0 && compose([...named, title]).length > TITLE_MAX_LENGTH) return;
    named.push(title);
  });

  return compose(named).slice(0, TITLE_MAX_LENGTH);
};

/** "1h 20m" / "45m" — friendlier than the HH:MM the timer boxes use. */
export const formatPracticed = (ms: number) => {
  const totalMinutes = Math.round(ms / MINUTE_MS);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};
