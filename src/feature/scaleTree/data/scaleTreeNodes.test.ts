import { describe, expect, it } from "vitest";

import { SCALE_TREE_NODES, SCALE_TREE_REWARD_NODES } from "./scaleTreeNodes";

const boxNodesFor = (scaleId: string) =>
  SCALE_TREE_NODES.filter(
    (node) => node.id.startsWith(`${scaleId}_pos`) && node.id.endsWith("_asc")
  );

describe("scale tree box numbering", () => {
  it("names minor pentatonic shapes after their real boxes, in box order", () => {
    const spine = boxNodesFor("min_pent");
    const boxes = spine.map((n) => n.requiredExercises[0].boxNumber);
    const frets = spine.map((n) => n.requiredExercises[0].position);

    expect(boxes).toEqual([1, 2, 3, 4, 5]);
    expect(frets).toEqual([8, 10, 1, 3, 5]);
  });

  it("keeps the minor box names for major pentatonic, shifted by one shape", () => {
    const spine = boxNodesFor("maj_pent");
    const boxes = spine.map((n) => n.requiredExercises[0].boxNumber);
    const frets = spine.map((n) => n.requiredExercises[0].position);

    expect(boxes).toEqual([1, 2, 3, 4, 5]);
    expect(frets).toEqual([5, 8, 10, 1, 3]);
  });

  it("gives diatonic scales and modes no box number at all", () => {
    for (const scaleId of ["nat_minor", "major", "dorian", "locrian"]) {
      const spine = boxNodesFor(scaleId);
      expect(spine.map((n) => n.requiredExercises[0].boxNumber)).toEqual(
        spine.map(() => undefined)
      );
      expect(spine.map((n) => n.requiredExercises[0].position)).toEqual([
        1, 2, 3, 5, 7, 8, 10,
      ]);
    }
  });

  it("labels pentatonic nodes by box, keeping the fret only as the exercise id", () => {
    const box1 = boxNodesFor("min_pent")[0];

    expect(box1.subtitle).toBe("Box 1 – Ascending");
    expect(box1.requiredExercises[0].label).toBe("Ascending – Box 1");
    // The fret still drives the exercise behind the node.
    expect(box1.id).toBe("min_pent_pos8_asc");
    expect(box1.requiredExercises[0].exerciseId).toBe(
      "scale_c_minor_pentatonic_ascending_pos8"
    );
  });

  it("labels diatonic and modal nodes by fret", () => {
    const fret5 = boxNodesFor("major").find((n) => n.id === "major_pos5_asc");

    expect(fret5?.subtitle).toBe("Fret 5 – Ascending");
    expect(fret5?.requiredExercises[0].label).toBe("Ascending – Fret 5");
  });

  it("names reward nodes the same way as the shapes they follow", () => {
    const labelOf = (id: string) =>
      SCALE_TREE_REWARD_NODES.find((n) => n.id === id)?.label;

    expect(labelOf("min_pent_pos8_reward")).toBe("Reward – Box 1");
    expect(labelOf("maj_pent_pos5_reward")).toBe("Reward – Box 1");
    expect(labelOf("major_pos5_reward")).toBe("Reward – Fret 5");
  });
});
