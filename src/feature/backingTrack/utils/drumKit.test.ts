import { describe, expect, it } from "vitest";

import { DRUM_ROWS, drumLayout, drumRowForMidi, drumRowIndex, hasDrumHits, isPercussionKey } from "./drumKit";

/** A beat slot, in the shape the layout reads. */
const hit = (...notes: { string: number; midiNote?: number }[]) => ({ notes });

describe("drumRowForMidi", () => {
  it("puts both bass drums on the kick row", () => {
    expect(drumRowForMidi(35)).toBe("kick");
    expect(drumRowForMidi(36)).toBe("kick");
  });

  it("keeps the snare answers with the snare", () => {
    // Side stick and hand clap are played as snare answers, not as their own
    // voice — a row each would spread one part over three lines.
    for (const note of [37, 38, 39, 40]) expect(drumRowForMidi(note)).toBe("snare");
  });

  it("groups the three hi-hat states together", () => {
    for (const note of [42, 44, 46]) expect(drumRowForMidi(note)).toBe("hihat");
  });

  it("gathers every tom onto one row", () => {
    for (const note of [41, 43, 45, 47, 48, 50]) expect(drumRowForMidi(note)).toBe("toms");
  });

  it("gathers the cymbals, ride bell included", () => {
    for (const note of [49, 51, 52, 53, 55, 57, 59]) {
      expect(drumRowForMidi(note)).toBe("cymbals");
    }
  });

  it("does not mistake the hand percussion for kit pieces", () => {
    // Tambourine, cowbell and vibraslap sit between the cymbals in the GM map,
    // which is exactly how a naive range check gets them wrong.
    expect(drumRowForMidi(54)).toBe("other");
    expect(drumRowForMidi(56)).toBe("other");
    expect(drumRowForMidi(58)).toBe("other");
  });

  it("keeps anything outside the kit rather than dropping it", () => {
    expect(drumRowForMidi(70)).toBe("other");
    expect(drumRowForMidi(undefined)).toBe("other");
    expect(drumRowForMidi(Number.NaN)).toBe("other");
  });
});

describe("drumRowIndex", () => {
  it("reads high to low, the way a drum stave is written", () => {
    expect(drumRowIndex("cymbals")).toBeLessThan(drumRowIndex("snare"));
    expect(drumRowIndex("snare")).toBeLessThan(drumRowIndex("kick"));
  });

  it("covers every row exactly once", () => {
    const seen = DRUM_ROWS.map((entry) => drumRowIndex(entry.row));
    expect(new Set(seen).size).toBe(DRUM_ROWS.length);
  });
});

describe("hasDrumHits", () => {
  it("sees a track that actually plays something", () => {
    expect(hasDrumHits([{ beats: [{ notes: [{ midiNote: 36 }] }] }])).toBe(true);
  });

  it("does not offer a row for a kit track nobody wrote on", () => {
    expect(hasDrumHits([{ beats: [{ notes: [] }, { notes: [] }] }])).toBe(false);
    expect(hasDrumHits([])).toBe(false);
    expect(hasDrumHits(undefined)).toBe(false);
  });
});

describe("isPercussionKey", () => {
  it("accepts General MIDI keys", () => {
    for (const key of [27, 36, 38, 42, 81]) expect(isPercussionKey(key)).toBe(true);
  });

  it("rejects tablature line indices and missing values", () => {
    for (const line of [0, 1, 4, 6, 10]) expect(isPercussionKey(line)).toBe(false);
    expect(isPercussionKey(undefined)).toBe(false);
    expect(isPercussionKey(Number.NaN)).toBe(false);
  });
});

describe("drumLayout", () => {
  it("shows only the kit pieces the part actually plays", () => {
    const layout = drumLayout([hit({ string: 1, midiNote: 36 }), hit({ string: 2, midiNote: 38 })]);

    expect(layout.isGeneralMidi).toBe(true);
    expect(layout.rows.map((row) => row.label)).toEqual(["Sn", "Kick"]);
  });

  it("keeps kit pieces in stave order, high to low", () => {
    const layout = drumLayout([
      hit({ string: 1, midiNote: 36 }),
      hit({ string: 1, midiNote: 42 }),
      hit({ string: 1, midiNote: 49 }),
    ]);

    expect(layout.rows.map((row) => row.label)).toEqual(["Cym", "HH", "Kick"]);
  });

  it("puts a hit on its own row", () => {
    const layout = drumLayout([hit({ string: 1, midiNote: 36 }, { string: 2, midiNote: 42 })]);

    const kick = layout.rows.findIndex((row) => row.label === "Kick");
    const hihat = layout.rows.findIndex((row) => row.label === "HH");
    expect(layout.rowOf({ string: 1, midiNote: 36 })).toBe(kick);
    expect(layout.rowOf({ string: 2, midiNote: 42 })).toBe(hihat);
  });

  it("draws kick and snare solid and the rest faint", () => {
    const layout = drumLayout([
      hit({ string: 1, midiNote: 36 }),
      hit({ string: 1, midiNote: 38 }),
      hit({ string: 1, midiNote: 42 }),
    ]);

    expect(layout.rows.filter((row) => row.loud).map((row) => row.label)).toEqual(["Sn", "Kick"]);
  });

  it("falls back to the file's own tab lines when no key numbers survive", () => {
    // What a Guitar Pro file without articulation data actually gives us: the
    // hits are there, but nothing says which piece any of them is.
    const layout = drumLayout([hit({ string: 4 }), hit({ string: 1 }), hit({ string: 4 })]);

    expect(layout.isGeneralMidi).toBe(false);
    expect(layout.rows.map((row) => row.label)).toEqual(["L1", "L4"]);
    expect(layout.rowOf({ string: 1 })).toBe(0);
    expect(layout.rowOf({ string: 4 })).toBe(1);
  });

  it("does not collapse a line-numbered part onto one row", () => {
    // The bug this replaced: every hit fell through to a single "other" row,
    // so the lane showed a flat line instead of a drum pattern.
    const layout = drumLayout([hit({ string: 1 }, { string: 3 }, { string: 6 })]);

    expect(new Set(layout.rows.map((row) => row.key)).size).toBe(3);
  });

  it("has no rows for a part with no hits", () => {
    expect(drumLayout([]).rows).toEqual([]);
    expect(drumLayout([hit()]).rows).toEqual([]);
  });
});
