import { isAutoBackingEligible } from "feature/autoBacking/eligibility";
import { generateAutoBacking } from "feature/autoBacking/generateAutoBacking";
import { BAND_STYLES, STUDIO_STYLES } from "feature/autoBacking/styles";
import {
  RECORDING_CONTRACTS,
  RECORDING_SCALES,
  sessionBpm,
  sessionParts,
} from "feature/guilds/data/guildRecording";
import type { RiffBar } from "feature/guilds/utils/recordingRiff";
import {
  buildRecordingExercise,
  buildRecordingTablature,
  dealRecordingPart,
  hashSeed,
  RECORDING_BARS,
  recordingBackingSeed,
  recordingPartNotes,
  recordingSeed,
  sessionChords,
  sessionProgression,
} from "feature/guilds/utils/recordingRiff";
import { describe, expect, it } from "vitest";

const PITCH: Record<string, number> = { C: 0, D: 2, E: 4, G: 7, A: 9 };

/** Session seeds as the server draws them: anywhere in 32 bits. */
const SEEDS = [1, 77_031, 2_904_118_553];
/** Many sessions of one client, for what has to hold across all of them. */
const MANY = Array.from({ length: 300 }, (_, i) => hashSeed(`session-${i}`));

/** Every part of every contract, in a few sessions. */
const sessions = RECORDING_CONTRACTS.flatMap((contract) =>
  contract.parts.flatMap((part) =>
    SEEDS.map((seed) => ({ contract, part, seed })),
  ),
);

const signature = (bars: RiffBar[]): string =>
  bars
    .map((bar) =>
      bar
        .map((slot) =>
          slot.note
            ? `${slot.note.string}:${slot.note.fret}/${slot.duration.toFixed(2)}`
            : `r/${slot.duration.toFixed(2)}`,
        )
        .join(" "),
    )
    .join(" | ");

describe("recording seeds", () => {
  it("names a part the same way every time", () => {
    expect(recordingSeed("rust-buckets", "riff", 5)).toBe(
      recordingSeed("rust-buckets", "riff", 5),
    );
    expect(hashSeed("a")).not.toBe(hashSeed("b"));
  });

  it("gives every contract, part and session its own seed", () => {
    const seeds = sessions.map(({ contract, part, seed }) =>
      recordingSeed(contract.id, part.id, seed),
    );
    expect(new Set(seeds).size).toBe(seeds.length);
  });

  it("gives a session one band, and the next session another", () => {
    expect(recordingBackingSeed("rust-buckets", 5)).toBe(
      recordingBackingSeed("rust-buckets", 5),
    );
    expect(recordingBackingSeed("rust-buckets", 5)).not.toBe(
      recordingBackingSeed("rust-buckets", 6),
    );
  });
});

describe("the session's progression", () => {
  const dealt = RECORDING_CONTRACTS.map((contract) => ({
    contract,
    progressions: MANY.map((seed) => sessionProgression(contract, seed)),
    chords: MANY.map((seed) => sessionChords(contract, seed)),
  }));

  it("is the same for the same session", () => {
    for (const { contract } of dealt)
      expect(sessionProgression(contract, 99)).toEqual(
        sessionProgression(contract, 99),
      );
  });

  it("is eight bars that start at home and come back to it", () => {
    for (const { progressions } of dealt)
      for (const progression of progressions) {
        expect(progression).toHaveLength(8);
        expect(progression[0]).toBe(0);
        expect(progression[7]).toBe(0);
        for (const degree of progression) {
          expect(degree).toBeGreaterThanOrEqual(0);
          expect(degree).toBeLessThan(7);
        }
      }
  });

  it("stops away from home at the half, and goes home from somewhere else", () => {
    for (const { progressions } of dealt)
      for (const progression of progressions) {
        // The question: the first half does not end on the tonic.
        expect(progression[3]).not.toBe(0);
        // The answer: the bar before the last one is not the tonic either,
        // so the last bar is an arrival.
        expect(progression[6]).not.toBe(0);
      }
  });

  it("never plays a diminished chord", () => {
    for (const { chords } of dealt)
      for (const names of chords)
        for (const name of names) expect(name).not.toMatch(/dim/);
  });

  it("keeps moving: no chord sits for more than two bars", () => {
    for (const { progressions } of dealt)
      for (const progression of progressions)
        for (let bar = 2; bar < progression.length; bar++)
          expect(
            progression[bar] === progression[bar - 1] &&
              progression[bar] === progression[bar - 2],
          ).toBe(false);
  });

  it("gives a client many progressions, not a handful", () => {
    for (const { contract, progressions } of dealt) {
      const distinct = new Set(progressions.map((p) => p.join("-")));
      expect(
        distinct.size,
        `${contract.id}: ${distinct.size}`,
      ).toBeGreaterThanOrEqual(40);
    }
  });

  it("keeps each key's own colour in reach", () => {
    const seen = (id: string, degree: number) =>
      dealt
        .find((entry) => entry.contract.id === id)!
        .progressions.some((progression) => progression.includes(degree));
    // Dorian's major IV, phrygian's bII.
    expect(seen("late-shift", 3)).toBe(true);
    expect(seen("iron-harvest", 1)).toBe(true);
  });
});

describe("dealt parts", () => {
  it.each(sessions)(
    "$contract.id / $part.id / seed $seed is fit to record",
    ({ contract, part, seed }) => {
      const dealt = dealRecordingPart(contract, part, seed);
      expect(dealt.flaws).toEqual([]);
      expect(dealt.bars).toHaveLength(RECORDING_BARS);
    },
  );

  it.each(sessions)(
    "$contract.id / $part.id / seed $seed deals the same part twice",
    ({ contract, part, seed }) => {
      expect(signature(dealRecordingPart(contract, part, seed).bars)).toBe(
        signature(dealRecordingPart(contract, part, seed).bars),
      );
    },
  );

  it("is fit to record in every one of many sessions", () => {
    for (const contract of RECORDING_CONTRACTS)
      for (const part of contract.parts)
        for (const seed of MANY)
          expect(
            dealRecordingPart(contract, part, seed).flaws,
            `${contract.id}/${part.id}/${seed}`,
          ).toEqual([]);
  });

  it("stays inside the scale it is written in", () => {
    for (const { contract, part, seed } of sessions) {
      const melodic = part.role === "hook" || part.role === "run";
      const scale =
        RECORDING_SCALES[
          melodic ? (contract.leadScale ?? contract.scale) : contract.scale
        ];
      const allowed = new Set(
        scale.map((interval) => (PITCH[contract.root] + interval) % 12),
      );
      for (const slot of dealRecordingPart(contract, part, seed).bars.flat())
        if (slot.note) expect(allowed.has(slot.note.midi % 12)).toBe(true);
    }
  });

  it("puts the bass on the chord's root on every downbeat", () => {
    for (const { contract, part, seed } of sessions) {
      if (part.role !== "bass") continue;
      const scale = RECORDING_SCALES[contract.scale];
      const progression = sessionProgression(contract, seed);
      dealRecordingPart(contract, part, seed).bars.forEach((bar, index) => {
        const root = (PITCH[contract.root] + scale[progression[index]]) % 12;
        expect(bar[0].note!.midi % 12).toBe(root);
      });
    }
  });

  // Part by part, not track by track: one lively hook must not hide a run
  // that comes out the same every time.
  it("deals every part a line of its own in every session", () => {
    for (const contract of RECORDING_CONTRACTS) {
      for (const part of contract.parts) {
        const lines = new Set(
          MANY.map((seed) =>
            signature(dealRecordingPart(contract, part, seed).bars),
          ),
        );
        expect(
          lines.size,
          `${contract.id}/${part.id}: ${lines.size} of ${MANY.length}`,
        ).toBeGreaterThanOrEqual(MANY.length - 3);
      }
    }
  });

  it("does not play the second half as the first one again", () => {
    let same = 0;
    let total = 0;
    for (const contract of RECORDING_CONTRACTS) {
      for (const part of contract.parts) {
        for (const seed of MANY.slice(0, 60)) {
          const { bars } = dealRecordingPart(contract, part, seed);
          total++;
          if (signature(bars.slice(0, 4)) === signature(bars.slice(4))) same++;
        }
      }
    }
    // A riff may sit on its pattern; the rest have a second idea to bring in.
    expect(same / total).toBeLessThan(0.15);
  });

  it("gives two parts of one track different lines", () => {
    for (const contract of RECORDING_CONTRACTS) {
      const lines = contract.parts.map((part) =>
        signature(dealRecordingPart(contract, part, SEEDS[0]).bars),
      );
      expect(new Set(lines).size).toBe(lines.length);
    }
  });
});

describe("the session exercise", () => {
  const contract = RECORDING_CONTRACTS[0];
  const part = contract.parts[0];

  it("is a one-minute take at the track's tempo, with room either side", () => {
    const take = buildRecordingExercise(contract, part, 5, {
      title: "Take",
      rehearsal: false,
      tier: 3,
    });
    expect(take.timeInMinutes).toBe(1);
    expect(take.metronomeSpeed).toEqual({ min: 46, max: 120, recommended: 92 });
    expect(take._generatorConfig).toMatchObject({
      rootNote: "E",
      scaleType: "minor",
      backingSeed: recordingBackingSeed(contract.id, 5),
    });
    expect(take.tablature).toEqual(buildRecordingTablature(contract, part, 5));
  });

  it("is cut slower on a low tier and faster on a high one", () => {
    const at = (tier: number) =>
      buildRecordingExercise(contract, part, 5, {
        title: "Take",
        rehearsal: false,
        tier,
      });
    expect(at(1).metronomeSpeed!.recommended).toBe(sessionBpm(contract, 1));
    expect(at(1).metronomeSpeed!.recommended).toBeLessThan(contract.bpm);
    expect(at(6).metronomeSpeed!.recommended).toBeGreaterThan(contract.bpm);
    expect(at(1).difficulty).toBe("easy");
    expect(at(6).difficulty).toBe("hard");
  });

  it("deals a part fit to record at every tier's density", () => {
    for (const entry of RECORDING_CONTRACTS)
      for (const tier of [1, 3, 6])
        for (const role of sessionParts(entry, tier))
          for (const seed of MANY.slice(0, 80))
            expect(
              dealRecordingPart(entry, role, seed).flaws,
              `${entry.id}/${role.id}/tier ${tier}/${seed}`,
            ).toEqual([]);
  });

  it("gives a rehearsal the same tab and more time", () => {
    const rehearsal = buildRecordingExercise(contract, part, 5, {
      title: "Rehearsal",
      rehearsal: true,
      tier: 3,
    });
    expect(rehearsal.timeInMinutes).toBeGreaterThan(1);
    expect(rehearsal.tablature).toEqual(
      buildRecordingTablature(contract, part, 5),
    );
  });

  it("gets a band behind every part of every track", () => {
    for (const entry of RECORDING_CONTRACTS) {
      for (const role of entry.parts) {
        const exercise = buildRecordingExercise(entry, role, 5, {
          title: "Take",
          rehearsal: false,
          tier: 3,
        });
        expect(isAutoBackingEligible(exercise)).toBe(true);
        expect(
          generateAutoBacking({
            measures: exercise.tablature!,
            bpm: entry.bpm,
            keyHint: exercise._generatorConfig,
            seed: exercise._generatorConfig.backingSeed,
          }),
        ).not.toBeNull();
      }
    }
  });

  it("gives every client a session band of its own, and none an exercise could get", () => {
    const bands = RECORDING_CONTRACTS.map((entry) => entry.band);
    expect(new Set(bands).size).toBe(RECORDING_CONTRACTS.length);
    expect([...bands].sort()).toEqual([...STUDIO_STYLES].sort());
    for (const band of bands)
      expect(BAND_STYLES as readonly string[]).not.toContain(band);
  });

  it("is backed by the client's band, playing the session's own chords", () => {
    for (const entry of RECORDING_CONTRACTS) {
      for (const seed of SEEDS) {
        const chords = sessionChords(entry, seed);
        for (const role of entry.parts) {
          const exercise = buildRecordingExercise(entry, role, seed, {
            title: "Take",
            rehearsal: false,
            tier: 3,
          });
          expect(exercise._generatorConfig.bandStyle).toBe(entry.band);
          // Every bar of the tab names its chord on its first beat.
          expect(
            exercise.tablature!.map((measure) => measure.beats[0].chordName),
          ).toEqual(chords);

          const backing = generateAutoBacking({
            measures: exercise.tablature!,
            bpm: entry.bpm,
            keyHint: exercise._generatorConfig,
            seed: exercise._generatorConfig.backingSeed,
            style: exercise._generatorConfig.bandStyle,
          })!;
          expect(backing.summary.style).toBe(entry.band);
          expect(backing.summary.source).toBe("tab");
          // The same band over the same chords, whichever part is being played.
          const played = backing.summary.chords;
          const named = chords.filter(
            (chord, i) => i === 0 || chord !== chords[i - 1],
          );
          expect(played.slice(0, named.length)).toEqual(named);
        }
      }
    }
  });

  it("gets a different band in another session", () => {
    const bands = new Set(
      MANY.slice(0, 40).map((seed) => {
        const exercise = buildRecordingExercise(contract, part, seed, {
          title: "Take",
          rehearsal: false,
          tier: 3,
        });
        return JSON.stringify(
          generateAutoBacking({
            measures: exercise.tablature!,
            bpm: contract.bpm,
            keyHint: exercise._generatorConfig,
            seed: exercise._generatorConfig.backingSeed,
          }),
        );
      }),
    );
    expect(bands.size).toBeGreaterThanOrEqual(38);
  });

  it("counts the notes of one pass", () => {
    expect(recordingPartNotes(contract, part, 5)).toBeGreaterThan(20);
  });
});
