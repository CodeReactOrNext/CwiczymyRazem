import { describe, expect, it } from "vitest";

import type { Exercise } from "../types/exercise.types";
import { collectPlanSongPractice, pickPrimaryPlanSong } from "./planSongPractice";
import { songToExercise } from "./songToExercise";

const drill: Exercise = {
  id: "alternate_picking",
  title: "Alternate picking",
  description: "",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [],
  tips: [],
  metronomeSpeed: null,
  relatedSkills: [],
};

const one = songToExercise({ id: "s1", title: "One", artist: "Metallica" }, 10);
const fade = songToExercise({ id: "s2", title: "Fade to Black", artist: "Metallica" }, 10);

describe("collectPlanSongPractice", () => {
  it("credits each song the time the session measured on it, not its planned minutes", () => {
    const entries = collectPlanSongPractice(
      { exercises: [drill, one, fade] },
      { s1: 30_000, s2: 12 * 60_000 }
    );

    expect(entries).toEqual([
      {
        songId: "s1",
        songTitle: "One",
        songArtist: "Metallica",
        practiceMs: 30_000,
        techniqueMs: 30_000,
        hearingMs: 0,
      },
      {
        songId: "s2",
        songTitle: "Fade to Black",
        songArtist: "Metallica",
        practiceMs: 12 * 60_000,
        techniqueMs: 12 * 60_000,
        hearingMs: 0,
      },
    ]);
  });

  it("leaves out songs that never got any time and plain exercises", () => {
    expect(collectPlanSongPractice({ exercises: [drill, one, fade] }, { s2: 1000 })).toEqual([
      expect.objectContaining({ songId: "s2", practiceMs: 1000 }),
    ]);
    expect(collectPlanSongPractice({ exercises: [drill] }, { alternate_picking: 5000 })).toEqual([]);
  });

  it("reports a song that sits in the plan twice once, with its whole bucket", () => {
    const entries = collectPlanSongPractice({ exercises: [one, drill, one] }, { s1: 90_000 });

    expect(entries).toHaveLength(1);
    expect(entries[0].practiceMs).toBe(90_000);
  });

  it("files a hearing item's time under hearing", () => {
    const listening = { ...one, category: "hearing" as const };

    expect(collectPlanSongPractice({ exercises: [listening] }, { s1: 60_000 })[0]).toMatchObject({
      techniqueMs: 0,
      hearingMs: 60_000,
      practiceMs: 60_000,
    });
  });
});

describe("pickPrimaryPlanSong", () => {
  it("picks the song with the most time, the earlier one on a tie", () => {
    const entries = collectPlanSongPractice(
      { exercises: [one, fade] },
      { s1: 60_000, s2: 120_000 }
    );
    expect(pickPrimaryPlanSong(entries)?.songId).toBe("s2");

    const tied = collectPlanSongPractice({ exercises: [one, fade] }, { s1: 60_000, s2: 60_000 });
    expect(pickPrimaryPlanSong(tied)?.songId).toBe("s1");
    expect(pickPrimaryPlanSong([])).toBeUndefined();
  });
});
