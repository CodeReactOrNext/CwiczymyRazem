import { describe, expect, it } from "vitest";

import { SCALE_TREE_NODES } from "./scaleTreeNodes";

const boxNodesFor = (scaleId: string) =>
  SCALE_TREE_NODES.filter(
    (node) => node.id.startsWith(`${scaleId}_pos`) && node.id.endsWith("_asc")
  );

describe("scale tree box numbering", () => {
  it("numbers pentatonic shapes Box 1–5 along the neck", () => {
    const spine = boxNodesFor("min_pent");
    const boxes = spine.map((n) => n.requiredExercises[0].boxNumber);
    const frets = spine.map((n) => n.requiredExercises[0].position);

    expect(boxes).toEqual([1, 2, 3, 4, 5]);
    expect(frets).toEqual([1, 3, 5, 8, 10]);
  });

  it("numbers diatonic shapes Box 1–7", () => {
    const boxes = boxNodesFor("major").map((n) => n.requiredExercises[0].boxNumber);
    expect(boxes).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("labels nodes by box, keeping the fret only as the exercise id", () => {
    const box4 = boxNodesFor("min_pent")[3];

    expect(box4.subtitle).toBe("Box 4 – Ascending");
    expect(box4.requiredExercises[0].label).toBe("Ascending – Box 4");
    // The fret still drives the exercise behind the node.
    expect(box4.id).toBe("min_pent_pos8_asc");
    expect(box4.requiredExercises[0].exerciseId).toBe(
      "scale_c_minor_pentatonic_ascending_pos8"
    );
  });
});
