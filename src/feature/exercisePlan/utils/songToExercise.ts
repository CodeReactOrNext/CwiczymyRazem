import type { Exercise, SongPracticeMode } from "../types/exercise.types";

/** Plan-item id for a song, so the same song resolves to the same item whether
 *  it was picked in the wizard or rebuilt from a saved plan. */
export const songExerciseId = (songId: string) => `song-${songId}`;

/** Default slot length for a song dropped into a routine, in minutes. */
export const DEFAULT_SONG_EXERCISE_MINUTES = 10;

interface SongLike {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
}

/**
 * Wraps a song from the library as a plan item, so it can be ordered and timed
 * alongside regular exercises inside an ExercisePlan.
 *
 * It carries no instructions, tab or skills of its own — the session renders
 * the song's own practice view for it (the attached Guitar Pro tab or the
 * section map, per `mode`) and the report credits its time to the song rather
 * than to a skill.
 */
export const songToExercise = (
  song: SongLike,
  timeInMinutes = DEFAULT_SONG_EXERCISE_MINUTES,
  mode?: SongPracticeMode
): Exercise => ({
  id: songExerciseId(song.id),
  title: `${song.artist} — ${song.title}`,
  description: song.artist,
  difficulty: "medium",
  category: "technique",
  timeInMinutes,
  instructions: [],
  tips: [],
  metronomeSpeed: null,
  relatedSkills: [],
  // Over the section map there is no tab to hear the guitar against, so the
  // mic has nothing to do and its controls stay out of the way.
  ...(mode === "sections" ? { disableMic: true } : {}),
  songData: {
    songId: song.id,
    title: song.title,
    artist: song.artist,
    ...(song.coverUrl ? { coverUrl: song.coverUrl } : {}),
    ...(mode ? { mode } : {}),
  },
});

/** Short name of a song item's practice mode, for badges next to "Song". */
export const SONG_PRACTICE_MODE_LABELS: Record<SongPracticeMode, string> = {
  gp: "Tab",
  sections: "Sections",
};
