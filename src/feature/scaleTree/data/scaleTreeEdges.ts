import type { Edge } from "@xyflow/react";

const PENT_POSITIONS = [1, 3, 5, 8, 10];
const DIAT_POSITIONS = [1, 2, 3, 5, 7, 8, 10];

function chainEdges(scaleId: string, positions: number[]): Edge[] {
  return positions.slice(1).map((pos, i) => ({
    id: `e-${scaleId}_pos${positions[i]}-${scaleId}_pos${pos}`,
    source: `${scaleId}_pos${positions[i]}`,
    target: `${scaleId}_pos${pos}`,
  }));
}

function crossEdge(sourceId: string, targetId: string): Edge {
  return { id: `e-${sourceId}-${targetId}`, source: sourceId, target: targetId };
}

export const SCALE_TREE_EDGES: Edge[] = [
  // ── Minor Pentatonic internal chain ──────────────────────────────────────
  ...chainEdges("min_pent", PENT_POSITIONS),

  // ── Minor Pentatonic → branches ──────────────────────────────────────────
  crossEdge("min_pent_pos10", "maj_pent_pos1"),
  crossEdge("min_pent_pos10", "nat_minor_pos1"),

  // ── Major Pentatonic internal chain ──────────────────────────────────────
  ...chainEdges("maj_pent", PENT_POSITIONS),

  // ── Major Pentatonic → Major Scale ───────────────────────────────────────
  crossEdge("maj_pent_pos10", "major_pos1"),

  // ── Natural Minor internal chain ──────────────────────────────────────────
  ...chainEdges("nat_minor", DIAT_POSITIONS),

  // ── Natural Minor → modes ─────────────────────────────────────────────────
  crossEdge("nat_minor_pos10", "dorian_pos1"),
  crossEdge("nat_minor_pos10", "phrygian_pos1"),

  // ── Major Scale internal chain ────────────────────────────────────────────
  ...chainEdges("major", DIAT_POSITIONS),

  // ── Major Scale → modes ───────────────────────────────────────────────────
  crossEdge("major_pos10", "mixolydian_pos1"),
  crossEdge("major_pos10", "lydian_pos1"),

  // ── Dorian internal chain ─────────────────────────────────────────────────
  ...chainEdges("dorian", DIAT_POSITIONS),

  // ── Phrygian internal chain ───────────────────────────────────────────────
  ...chainEdges("phrygian", DIAT_POSITIONS),

  // ── Phrygian → Locrian ────────────────────────────────────────────────────
  crossEdge("phrygian_pos10", "locrian_pos1"),

  // ── Mixolydian internal chain ─────────────────────────────────────────────
  ...chainEdges("mixolydian", DIAT_POSITIONS),

  // ── Mixolydian → Locrian ──────────────────────────────────────────────────
  crossEdge("mixolydian_pos10", "locrian_pos1"),

  // ── Lydian internal chain ─────────────────────────────────────────────────
  ...chainEdges("lydian", DIAT_POSITIONS),

  // ── Locrian internal chain ────────────────────────────────────────────────
  ...chainEdges("locrian", DIAT_POSITIONS),
];
