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

function singleStringConnector(scaleId: string, lastPos: number): Edge[] {
  return [
    { id: `e-${scaleId}_pos${lastPos}-${scaleId}_single_string`, source: `${scaleId}_pos${lastPos}`, target: `${scaleId}_single_string` },
    { id: `e-${scaleId}_single_string-${scaleId}_pos1`, source: `${scaleId}_single_string`, target: `${scaleId}_pos1` },
  ];
}

function crossScaleEdge(sourceScale: string, targetScale: string): Edge {
  return { id: `e-${sourceScale}_single_string-${targetScale}_single_string`, source: `${sourceScale}_single_string`, target: `${targetScale}_single_string` };
}

export const SCALE_TREE_EDGES: Edge[] = [
  // ── Minor Pentatonic internal chain ──────────────────────────────────────
  ...chainEdges("min_pent", PENT_POSITIONS),
  ...singleStringConnector("min_pent", 10),

  // ── Minor Pentatonic → branches (via single_string) ──────────────────────
  crossScaleEdge("min_pent", "maj_pent"),
  crossScaleEdge("min_pent", "nat_minor"),

  // ── Major Pentatonic internal chain ──────────────────────────────────────
  ...chainEdges("maj_pent", PENT_POSITIONS),
  ...singleStringConnector("maj_pent", 10),

  // ── Major Pentatonic → Major Scale (via single_string) ────────────────────
  crossScaleEdge("maj_pent", "major"),

  // ── Natural Minor internal chain ──────────────────────────────────────────
  ...chainEdges("nat_minor", DIAT_POSITIONS),
  ...singleStringConnector("nat_minor", 10),

  // ── Natural Minor → modes (via single_string) ────────────────────────────
  crossScaleEdge("nat_minor", "dorian"),
  crossScaleEdge("nat_minor", "phrygian"),

  // ── Major Scale internal chain ────────────────────────────────────────────
  ...chainEdges("major", DIAT_POSITIONS),
  ...singleStringConnector("major", 10),

  // ── Major Scale → modes (via single_string) ───────────────────────────────
  crossScaleEdge("major", "mixolydian"),
  crossScaleEdge("major", "lydian"),

  // ── Dorian internal chain ─────────────────────────────────────────────────
  ...chainEdges("dorian", DIAT_POSITIONS),
  ...singleStringConnector("dorian", 10),

  // ── Phrygian internal chain ───────────────────────────────────────────────
  ...chainEdges("phrygian", DIAT_POSITIONS),
  ...singleStringConnector("phrygian", 10),

  // ── Phrygian → Locrian (via single_string) ────────────────────────────────
  crossScaleEdge("phrygian", "locrian"),

  // ── Mixolydian internal chain ─────────────────────────────────────────────
  ...chainEdges("mixolydian", DIAT_POSITIONS),
  ...singleStringConnector("mixolydian", 10),

  // ── Mixolydian → Locrian (via single_string) ──────────────────────────────
  crossScaleEdge("mixolydian", "locrian"),

  // ── Lydian internal chain ─────────────────────────────────────────────────
  ...chainEdges("lydian", DIAT_POSITIONS),
  ...singleStringConnector("lydian", 10),

  // ── Locrian internal chain ────────────────────────────────────────────────
  ...chainEdges("locrian", DIAT_POSITIONS),
  ...singleStringConnector("locrian", 10),
];
