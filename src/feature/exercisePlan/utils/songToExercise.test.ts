import { describe, expect, it } from "vitest";

import { isOpenExercise } from "./isOpenExercise";
import { isSongExercise } from "./isSongExercise";
import { DEFAULT_SONG_EXERCISE_MINUTES, songExerciseId, songToExercise } from "./songToExercise";

const song = { id: "abc", title: "Enter Sandman", artist: "Metallica", coverUrl: "https://x/y.jpg" };

describe("songToExercise", () => {
  it("wraps a song as a timed plan item that keeps the song's identity", () => {
    const exercise = songToExercise(song, 15);

    expect(exercise.id).toBe(songExerciseId("abc"));
    expect(exercise.timeInMinutes).toBe(15);
    expect(exercise.songData).toEqual({
      songId: "abc",
      title: "Enter Sandman",
      artist: "Metallica",
      coverUrl: "https://x/y.jpg",
    });
    expect(isSongExercise(exercise)).toBe(true);
  });

  it("defaults the slot length and omits a missing cover", () => {
    const exercise = songToExercise({ id: "abc", title: "One", artist: "Metallica" });

    expect(exercise.timeInMinutes).toBe(DEFAULT_SONG_EXERCISE_MINUTES);
    expect(exercise.songData).not.toHaveProperty("coverUrl");
  });

  it("earns no skill points of its own — the time goes to the song", () => {
    expect(songToExercise(song).relatedSkills).toEqual([]);
  });

  it("is not an open exercise: the session renders the song panel for it", () => {
    expect(isOpenExercise(songToExercise(song))).toBe(false);
    expect(isSongExercise({ songData: undefined })).toBe(false);
  });
});

describe("songToExercise practice mode", () => {
  it("keeps the chosen mode on the item and mutes the mic over the section map", () => {
    const overSections = songToExercise(song, 10, "sections");
    expect(overSections.songData?.mode).toBe("sections");
    expect(overSections.disableMic).toBe(true);

    const overTab = songToExercise(song, 10, "gp");
    expect(overTab.songData?.mode).toBe("gp");
    expect(overTab.disableMic).toBeUndefined();
  });

  it("leaves older items without a mode", () => {
    expect(songToExercise(song).songData).not.toHaveProperty("mode");
  });
});
