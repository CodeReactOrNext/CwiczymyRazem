import type { ScaleTreeNodeDef } from "../types/scaleTree.types";
import type { ScaleType } from "feature/exercisePlan/scales/scaleDefinitions";
import type { PatternType } from "feature/exercisePlan/scales/patternGenerators";

// Spacing within each cluster (column = position, row = pattern)
const H = 220; // horizontal between position columns
const V = 160; // vertical between pattern rows

type ScaleFamily = "pentatonic" | "diatonic" | "mode";

const PATTERNS: Array<{ type: PatternType; suffix: string; label: string }> = [
  { type: "ascending",            suffix: "asc",      label: "Wstępujący"      },
  { type: "descending",           suffix: "desc",     label: "Zstępujący"      },
  { type: "ascending_descending", suffix: "asc_desc", label: "Wstęp. + Zstęp." },
  { type: "intervals_thirds",     suffix: "thirds",   label: "Tercje"           },
  { type: "intervals_fourths",    suffix: "fourths",  label: "Kwarty"           },
  { type: "sequence_3_notes",     suffix: "seq3",     label: "Sekwencja 3"      },
  { type: "sequence_4_notes",     suffix: "seq4",     label: "Sekwencja 4"      },
];

const PENT_POSITIONS = [1, 3, 5, 8, 10];
const DIAT_POSITIONS = [1, 2, 3, 5, 7, 8, 10];

function makeNode(
  id: string,
  label: string,
  subtitle: string,
  scaleType: ScaleType,
  scaleFamily: ScaleFamily,
  x: number,
  y: number,
  prerequisite: string | null,
  exerciseId: string,
  bpm: number,
  fretPos: number,
  patternType: PatternType,
): ScaleTreeNodeDef {
  return {
    id,
    label,
    subtitle,
    scaleType,
    scaleFamily,
    description: "",
    position: { x, y },
    prerequisites: prerequisite ? [prerequisite] : [],
    requiredExercises: [
      {
        exerciseId,
        requiredBpm: bpm,
        scaleType,
        patternType,
        position: fretPos,
        label:
          `${PATTERNS.find((p) => p.type === patternType)?.label ?? patternType} – Poz. ${fretPos}`,
      },
    ],
  };
}

/**
 * Builds a 2D cluster of nodes (columns = positions, rows = patterns).
 * The prerequisite chain snakes: col0row0 → col0row1 → … → col0rowN → col1row0 → …
 * The cluster is centred on (clusterX, clusterY).
 */
function buildChain(
  scaleId: string,
  label: string,
  scaleType: ScaleType,
  scaleFamily: ScaleFamily,
  scaleKey: string,
  positions: number[],
  clusterX: number,
  clusterY: number,
  firstPrereq: string | null,
  bpm: number,
): ScaleTreeNodeDef[] {
  const nodes: ScaleTreeNodeDef[] = [];
  let prevId: string | null = firstPrereq;

  for (let posIdx = 0; posIdx < positions.length; posIdx++) {
    for (let patIdx = 0; patIdx < PATTERNS.length; patIdx++) {
      const pos = positions[posIdx];
      const pat = PATTERNS[patIdx];
      const id = `${scaleId}_pos${pos}_${pat.suffix}`;

      const x = clusterX + (posIdx - (positions.length - 1) / 2) * H;
      const y = clusterY + (patIdx - (PATTERNS.length - 1) / 2) * V;

      nodes.push(makeNode(
        id,
        label,
        `Poz. ${pos} – ${pat.label}`,
        scaleType,
        scaleFamily,
        x,
        y,
        prevId,
        `scale_c_${scaleKey}_${pat.type}_pos${pos}`,
        bpm,
        pos,
        pat.type,
      ));
      prevId = id;
    }
  }
  return nodes;
}

function lastId(scaleId: string, positions: number[]): string {
  return `${scaleId}_pos${positions.at(-1)}_${PATTERNS.at(-1)!.suffix}`;
}

// ─── Cluster centres (radial / PoE-style layout) ──────────────────────────────
//
//   Dorian (-4500, 0)         NatMinor (-2500,-1200)       MinPent (0,0)       MajPent (2500,-1200)       Major (4500,0)
//
//   Phrygian (-3500, 2000)                                                        Mixolydian (3500,2000)    Lydian (6000,-1500)
//
//                                              Locrian (0, 4500)
//

// ─── Minor Pentatonic — centre / root ────────────────────────────────────────
const minPentNodes = buildChain(
  "min_pent", "Minor Pentatonic", "minor_pentatonic", "pentatonic", "minor_pentatonic",
  PENT_POSITIONS, 0, 0, null, 80,
);
const minPentLast = lastId("min_pent", PENT_POSITIONS);

// ─── Major Pentatonic — upper right ──────────────────────────────────────────
const majPentNodes = buildChain(
  "maj_pent", "Major Pentatonic", "major_pentatonic", "pentatonic", "major_pentatonic",
  PENT_POSITIONS, 2500, -1200, minPentLast, 80,
);
const majPentLast = lastId("maj_pent", PENT_POSITIONS);

// ─── Natural Minor — upper left ───────────────────────────────────────────────
const natMinorNodes = buildChain(
  "nat_minor", "Natural Minor", "minor", "diatonic", "minor",
  DIAT_POSITIONS, -2500, -1200, minPentLast, 80,
);
const natMinorLast = lastId("nat_minor", DIAT_POSITIONS);

// ─── Major Scale — right ──────────────────────────────────────────────────────
const majorNodes = buildChain(
  "major", "Major Scale", "major", "diatonic", "major",
  DIAT_POSITIONS, 4500, 0, majPentLast, 80,
);
const majorLast = lastId("major", DIAT_POSITIONS);

// ─── Dorian — far left ────────────────────────────────────────────────────────
const dorianNodes = buildChain(
  "dorian", "Dorian", "dorian", "mode", "dorian",
  DIAT_POSITIONS, -4500, 0, natMinorLast, 75,
);

// ─── Phrygian — lower left ────────────────────────────────────────────────────
const phrygianNodes = buildChain(
  "phrygian", "Phrygian", "phrygian", "mode", "phrygian",
  DIAT_POSITIONS, -3500, 2000, natMinorLast, 75,
);
const phrygianLast = lastId("phrygian", DIAT_POSITIONS);

// ─── Mixolydian — lower right ────────────────────────────────────────────────
const mixolydianNodes = buildChain(
  "mixolydian", "Mixolydian", "mixolydian", "mode", "mixolydian",
  DIAT_POSITIONS, 3500, 2000, majorLast, 75,
);
const mixolydianLast = lastId("mixolydian", DIAT_POSITIONS);

// ─── Lydian — far upper right ────────────────────────────────────────────────
const lydianNodes = buildChain(
  "lydian", "Lydian", "lydian", "mode", "lydian",
  DIAT_POSITIONS, 6000, -1500, majorLast, 75,
);

// ─── Locrian — bottom centre (requires phrygian + mixolydian) ────────────────
const locrianNodes = buildChain(
  "locrian", "Locrian", "locrian", "mode", "locrian",
  DIAT_POSITIONS, 0, 4500, phrygianLast, 70,
);
locrianNodes[0].prerequisites = [phrygianLast, mixolydianLast];

// ─── Export ──────────────────────────────────────────────────────────────────
export const SCALE_TREE_NODES: ScaleTreeNodeDef[] = [
  ...minPentNodes,
  ...majPentNodes,
  ...natMinorNodes,
  ...majorNodes,
  ...dorianNodes,
  ...phrygianNodes,
  ...mixolydianNodes,
  ...lydianNodes,
  ...locrianNodes,
];
