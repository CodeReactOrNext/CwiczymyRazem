import type { RoadmapPhase } from "feature/aiCoach/types/roadmap.types";
import { describe, expect, it } from "vitest";

import {
  briefForModel,
  briefSongByRequest,
  briefSummary,
  catalogKeep,
  effectiveGoal,
  ensureRequiredSongs,
  type RoadmapBrief,
  sanitizeBrief,
} from "./brief";
import type { CatalogEntry } from "./exerciseCatalog";

const sultans = { id: "s1", title: "Sultans of Swing", artist: "Dire Straits" };
const romeo = { id: "s2", title: "Romeo and Juliet", artist: "Dire Straits" };

const phase = (
  title: string,
  steps: { title: string; song?: typeof sultans }[],
): RoadmapPhase => ({
  id: title,
  title,
  order: 0,
  steps: steps.map((step, index) => ({
    id: `${title}-${index}`,
    title: step.title,
    description: "",
    successCriteria: "",
    sessionsRequired: 4,
    sessionsCompleted: 0,
    order: index,
    ...(step.song ? { suggestedSong: step.song } : {}),
  })),
});

describe("sanitizeBrief", () => {
  it("keeps bank and custom answers, drops unknown ids and empty ones", () => {
    const brief = sanitizeBrief({
      answers: [
        {
          id: "includes",
          values: ["tone"],
          labels: ["A phase about the sound"],
        },
        { id: "custom-1", question: " Which era? ", values: ["early"] },
        { id: "custom-9", values: ["x"] },
        { id: "nope", values: ["x"] },
        { id: "ending", values: [] },
        { id: "includes", values: ["ear"] },
      ],
      songs: [sultans, sultans, { id: "", title: "x", artist: "y" }],
      otherSongs: "  Brothers in   Arms ",
      notes: 42,
    });
    expect(brief).toEqual({
      answers: [
        {
          id: "includes",
          question: "",
          values: ["tone"],
          labels: ["A phase about the sound"],
        },
        {
          id: "custom-1",
          question: "Which era?",
          values: ["early"],
          labels: ["early"],
        },
      ],
      songs: [sultans],
      otherSongs: "Brothers in Arms",
      notes: "",
    });
  });

  it("answers null when nothing is left", () => {
    expect(sanitizeBrief(null)).toBeNull();
    expect(sanitizeBrief({ answers: [], songs: [] })).toBeNull();
    expect(sanitizeBrief("brief")).toBeNull();
  });
});

describe("effectiveGoal", () => {
  it("narrows a vague goal to the focus the player chose", () => {
    const brief: RoadmapBrief = {
      answers: [
        {
          id: "focus",
          question: "",
          values: ["solo"],
          labels: ["Solo over a 12-bar blues"],
        },
      ],
      songs: [],
      otherSongs: "",
      notes: "",
    };
    expect(effectiveGoal("get better", brief)).toBe(
      "get better — specifically: Solo over a 12-bar blues",
    );
    expect(effectiveGoal("get better", null)).toBe("get better");
  });
});

describe("briefForModel", () => {
  it("is empty without a brief or with answers that change nothing", () => {
    expect(briefForModel(null)).toBe("");
    expect(
      briefForModel({
        answers: [
          {
            id: "includes",
            question: "",
            values: ["tone", "theory", "ear"],
            labels: [],
          },
        ],
        songs: [],
        otherSongs: "",
        notes: "",
      }),
    ).toBe("");
  });

  it("renders one checkable line per constraint", () => {
    const text = briefForModel({
      answers: [
        {
          id: "sides",
          question: "",
          values: ["a", "b"],
          labels: ["Thumb chords", "Blues lead"],
        },
        { id: "includes", question: "", values: ["theory"], labels: [] },
        {
          id: "replicateOrCreate",
          question: "",
          values: ["replicate"],
          labels: [],
        },
        { id: "ending", question: "", values: ["none"], labels: [] },
        { id: "entry", question: "", values: ["foundation"], labels: [] },
        { id: "repertoireDepth", question: "", values: ["deep"], labels: [] },
        {
          id: "startingPoint",
          question: "",
          values: ["s"],
          labels: ["clean 16ths to 100 BPM"],
        },
        { id: "target", question: "", values: ["t"], labels: ["160 BPM"] },
        {
          id: "weakSpot",
          question: "",
          values: ["w"],
          labels: ["Nothing in particular"],
        },
        {
          id: "practiceStyle",
          question: "",
          values: ["drill"],
          labels: ["Drills with the metronome"],
        },
        {
          id: "custom-1",
          question: "How long was the break?",
          values: ["y"],
          labels: ["About a year"],
        },
      ],
      songs: [sultans],
      otherSongs: "Romeo and Juliet",
      notes: "the intro of Song A",
    });

    expect(text).toMatch(/^STUDENT BRIEF — hard constraints/);
    expect(text).toContain(
      "Cover ONLY these sides of the style: Thumb chords; Blues lead",
    );
    expect(text).toContain(
      'REQUIRED songs, all in the app library — each gets its own repertoire step with songTitle/songArtist copied exactly: "Sultans of Swing" — Dire Straits.',
    );
    expect(text).toContain("NOT in the library");
    expect(text).toContain("2–3 songs in depth");
    expect(text).toContain('Starting point: "clean 16ths to 100 BPM"');
    expect(text).toContain('Target: "160 BPM"');
    expect(text).not.toContain("Weak spot");
    expect(text).toContain("Play it like the record");
    expect(text).toContain("Foundation first");
    expect(text).toContain("No phase and no step about tone");
    expect(text).toContain("Ear work to the minimum");
    expect(text).not.toContain("Theory to the minimum");
    expect(text).toContain("No final performance, set or recording phase");
    expect(text).toContain(
      "Exercise kinds the student practises: drills with the metronome",
    );
    expect(text).toContain("How long was the break? — About a year.");
    expect(text).toContain("Facts the student supplied about the goal");
  });
});

describe("catalogKeep", () => {
  const entry = (kind: CatalogEntry["kind"]): CatalogEntry => ({
    id: kind,
    title: kind,
    difficulty: "easy",
    category: "technique",
    kind,
    skills: [],
    description: "",
    whyItMatters: "",
  });
  const brief = (values: string[]): RoadmapBrief => ({
    answers: [{ id: "practiceStyle", question: "", values, labels: values }],
    songs: [],
    otherSongs: "",
    notes: "",
  });

  it("keeps only the kinds the player ticked", () => {
    const keep = catalogKeep(brief(["drill", "hunt"]));
    expect(keep?.(entry("drill"))).toBe(true);
    expect(keep?.(entry("hunt"))).toBe(true);
    expect(keep?.(entry("backing"))).toBe(false);
  });

  it("filters nothing when everything, nothing, or no answer is given", () => {
    expect(catalogKeep(brief(["drill", "hunt", "backing"]))).toBeUndefined();
    expect(catalogKeep(brief(["bogus"]))).toBeUndefined();
    expect(catalogKeep(null)).toBeUndefined();
  });
});

describe("ensureRequiredSongs", () => {
  it("leaves a roadmap alone when every required song has a step", () => {
    const phases = [phase("Songs", [{ title: "Sultans", song: sultans }])];
    expect(ensureRequiredSongs(phases, [sultans])).toEqual({
      phases,
      added: [],
    });
  });

  it("appends a missing song to the last phase that has any song", () => {
    const phases = [
      phase("Hands", [{ title: "Thumb" }]),
      phase("Songs", [{ title: "Sultans", song: sultans }]),
      phase("Set", [{ title: "Gig" }]),
    ];
    const { phases: next, added } = ensureRequiredSongs(phases, [
      sultans,
      romeo,
    ]);
    expect(added).toEqual(["Romeo and Juliet"]);
    const last = next[1].steps.at(-1);
    expect(last?.title).toBe("Romeo and Juliet: the full part");
    expect(last?.suggestedSong).toEqual(romeo);
    expect(last?.skillType).toBe("musical");
    expect(last?.order).toBe(1);
    expect(next[2]).toBe(phases[2]);
  });

  it("falls back to the penultimate phase when no phase has a song", () => {
    const phases = [
      phase("A", [{ title: "a" }]),
      phase("B", [{ title: "b" }]),
      phase("C", [{ title: "c" }]),
    ];
    const { phases: next } = ensureRequiredSongs(phases, [romeo]);
    expect(next[1].steps).toHaveLength(2);
    expect(next[2].steps).toHaveLength(1);
  });

  it("matches a step's song by title when the id differs", () => {
    const phases = [
      phase("Songs", [{ title: "x", song: { ...sultans, id: "other-id" } }]),
    ];
    expect(ensureRequiredSongs(phases, [sultans]).added).toEqual([]);
  });
});

describe("briefSongByRequest / briefSummary", () => {
  const brief: RoadmapBrief = {
    answers: [
      {
        id: "ending",
        question: "",
        values: ["set"],
        labels: ["A recorded set"],
      },
      {
        id: "custom-1",
        question: "Which era?",
        values: ["e"],
        labels: ["Early"],
      },
    ],
    songs: [sultans],
    otherSongs: "",
    notes: "",
  };

  it("resolves a request against the picked songs by title", () => {
    expect(
      briefSongByRequest(brief, { title: "sultans of swing", artist: "?" }),
    ).toEqual(sultans);
    expect(
      briefSongByRequest(brief, { title: "Other", artist: "?" }),
    ).toBeNull();
  });

  it("summarises with the bank's question text", () => {
    expect(briefSummary(brief)).toEqual([
      "How should it end? A recorded set",
      "Which era? Early",
      "Songs: Sultans of Swing",
    ]);
  });
});
