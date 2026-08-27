import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { getExerciseFamily, getVariantLabel } from "feature/exercisePlan/utils/getExerciseFamily";
import { describe, expect, it } from "vitest";

const ex = (id: string, title: string) => ({ id, title });

describe("getExerciseFamily", () => {
  it("groups variants that share a title prefix", () => {
    expect(getExerciseFamily(ex("a", "Spider — One String")).title).toBe("Spider");
    expect(getExerciseFamily(ex("b", "Spider — Diagonal X, Extended")).title).toBe("Spider");
  });

  it("strips the variant number so numbered patterns land in one set", () => {
    const numbered = getExerciseFamily(ex("a", "Strumming 12 — Starts on Up"));
    const named = getExerciseFamily(ex("b", "Strumming — Funk 16ths"));
    expect(numbered.title).toBe("Strumming");
    expect(numbered.id).toBe(named.id);
  });

  it("treats a title with no separator as a set of one", () => {
    expect(getExerciseFamily(ex("a", "Sing What You Play")).title).toBe("Sing What You Play");
  });

  it("lets an override move an exercise into another set", () => {
    expect(getExerciseFamily(ex("build_the_chord", "Build the Chord")).title).toBe("Chords");
  });

  it("gives every set a slug usable as a key", () => {
    expect(getExerciseFamily(ex("a", "Riff Vault — Crazy Train")).id).toBe("riff-vault");
    expect(getExerciseFamily(ex("b", "Chord Quality — All Seven")).id).toBe("chord-quality");
  });
});

describe("getVariantLabel", () => {
  it("returns only the part that differs", () => {
    expect(getVariantLabel(ex("a", "Sweep — Neoclassical Runs"))).toBe("Neoclassical Runs");
  });

  it("keeps the pattern number, which is how players refer to it", () => {
    expect(getVariantLabel(ex("a", "Strumming 12 — Starts on Up"))).toBe("12 — Starts on Up");
  });

  it("falls back to the full title for a set of one", () => {
    expect(getVariantLabel(ex("a", "Pinky-Led Patterns"))).toBe("Pinky-Led Patterns");
  });

  it("keeps a second separator inside the variant", () => {
    expect(getVariantLabel(ex("a", "Click Hunt — D & G, Frets 0–6"))).toBe("D & G, Frets 0–6");
  });
});

describe("the real library", () => {
  const visible = exercisesAgregat.filter(e => !e.isHiddenFromLibrary && !e.isPlayalong);

  it("collapses 201 exercises into far fewer sets", () => {
    const ids = new Set(visible.map(e => getExerciseFamily(e).id));
    expect(visible.length).toBeGreaterThan(150);
    expect(ids.size).toBeLessThan(visible.length / 3);
  });

  it("keeps the big families whole", () => {
    const size = (familyId: string) =>
      visible.filter(e => getExerciseFamily(e).id === familyId).length;
    expect(size("strumming")).toBe(34);
    expect(size("finger-permutations")).toBe(24);
    expect(size("click-hunt")).toBe(17);
  });

  it("never produces an empty name or label", () => {
    visible.forEach(e => {
      expect(getExerciseFamily(e).title.length).toBeGreaterThan(0);
      expect(getExerciseFamily(e).id.length).toBeGreaterThan(0);
      expect(getVariantLabel(e).length).toBeGreaterThan(0);
    });
  });
});
