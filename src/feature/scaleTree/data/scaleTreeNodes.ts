import type { ScaleTreeNodeDef } from "../types/scaleTree.types";
import type { ScaleType } from "feature/exercisePlan/scales/scaleDefinitions";
import type { PatternType } from "feature/exercisePlan/scales/patternGenerators";

const STEP = 80;
const GAP  = 250;

type ScaleFamily = "pentatonic" | "diatonic" | "mode";

const PATTERNS: Array<{ type: PatternType; suffix: string; label: string }> = [
  { type: "ascending",            suffix: "asc",      label: "Wstępujący"     },
  { type: "descending",           suffix: "desc",     label: "Zstępujący"     },
  { type: "ascending_descending", suffix: "asc_desc", label: "Wstęp. + Zstęp." },
  { type: "intervals_thirds",     suffix: "thirds",   label: "Tercje"          },
  { type: "intervals_fourths",    suffix: "fourths",  label: "Kwarty"          },
  { type: "sequence_3_notes",     suffix: "seq3",     label: "Sekwencja 3"     },
  { type: "sequence_4_notes",     suffix: "seq4",     label: "Sekwencja 4"     },
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
        label: `${PATTERNS.find((p) => p.type === patternType)?.label ?? patternType} – Poz. ${fretPos}`,
      },
    ],
  };
}

// Builds a flat sequential chain: pos0_pat0 → pos0_pat1 → … → pos0_patN → pos1_pat0 → …
function buildChain(
  scaleId: string,
  label: string,
  scaleType: ScaleType,
  scaleFamily: ScaleFamily,
  scaleKey: string,
  positions: number[],
  x: number,
  startY: number,
  firstPrereq: string | null,
  bpm: number,
): ScaleTreeNodeDef[] {
  const nodes: ScaleTreeNodeDef[] = [];
  let prevId: string | null = firstPrereq;

  for (const pos of positions) {
    for (const pat of PATTERNS) {
      const id = `${scaleId}_pos${pos}_${pat.suffix}`;
      nodes.push(makeNode(
        id,
        label,
        `Poz. ${pos} – ${pat.label}`,
        scaleType,
        scaleFamily,
        x,
        startY + nodes.length * STEP,
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

function lastNodeId(scaleId: string, positions: number[]): string {
  return `${scaleId}_pos${positions.at(-1)}_${PATTERNS.at(-1)!.suffix}`;
}

const CHAIN_LEN = (positions: number[]) => positions.length * PATTERNS.length * STEP;

// ─── Minor Pentatonic  (x=350, y=0) ──────────────────────────────────────────
const MIN_PENT_X = 350;
const MIN_PENT_Y = 0;

const minPentNodes = buildChain(
  "min_pent", "Minor Pentatonic", "minor_pentatonic", "pentatonic", "minor_pentatonic",
  PENT_POSITIONS, MIN_PENT_X, MIN_PENT_Y, null, 80,
);
const minPentLast = lastNodeId("min_pent", PENT_POSITIONS);

// ─── Major Pentatonic  (x=800) ────────────────────────────────────────────────
const MAJ_PENT_X = 800;
const MAJ_PENT_Y = MIN_PENT_Y + CHAIN_LEN(PENT_POSITIONS) + GAP;

const majPentNodes = buildChain(
  "maj_pent", "Major Pentatonic", "major_pentatonic", "pentatonic", "major_pentatonic",
  PENT_POSITIONS, MAJ_PENT_X, MAJ_PENT_Y, minPentLast, 80,
);
const majPentLast = lastNodeId("maj_pent", PENT_POSITIONS);

// ─── Natural Minor  (x=50, same start Y as Maj Pent) ─────────────────────────
const NAT_MINOR_X = 50;
const NAT_MINOR_Y = MAJ_PENT_Y;

const natMinorNodes = buildChain(
  "nat_minor", "Natural Minor", "minor", "diatonic", "minor",
  DIAT_POSITIONS, NAT_MINOR_X, NAT_MINOR_Y, minPentLast, 80,
);
const natMinorLast = lastNodeId("nat_minor", DIAT_POSITIONS);

// ─── Major Scale  (x=800, below Maj Pent) ────────────────────────────────────
const MAJOR_X = 800;
const MAJOR_Y = MAJ_PENT_Y + CHAIN_LEN(PENT_POSITIONS) + GAP;

const majorNodes = buildChain(
  "major", "Major Scale", "major", "diatonic", "major",
  DIAT_POSITIONS, MAJOR_X, MAJOR_Y, majPentLast, 80,
);
const majorLast = lastNodeId("major", DIAT_POSITIONS);

// ─── Dorian  (x=-200, from nat_minor) ────────────────────────────────────────
const DORIAN_X = -200;
const MODE_Y_FROM_NAT_MINOR = NAT_MINOR_Y + CHAIN_LEN(DIAT_POSITIONS) + GAP;

const dorianNodes = buildChain(
  "dorian", "Dorian", "dorian", "mode", "dorian",
  DIAT_POSITIONS, DORIAN_X, MODE_Y_FROM_NAT_MINOR, natMinorLast, 75,
);

// ─── Phrygian  (x=300, from nat_minor) ───────────────────────────────────────
const PHRYGIAN_X = 300;

const phrygianNodes = buildChain(
  "phrygian", "Phrygian", "phrygian", "mode", "phrygian",
  DIAT_POSITIONS, PHRYGIAN_X, MODE_Y_FROM_NAT_MINOR, natMinorLast, 75,
);
const phrygianLast = lastNodeId("phrygian", DIAT_POSITIONS);

// ─── Mixolydian  (x=600, from major) ─────────────────────────────────────────
const MIXOLYDIAN_X = 600;
const MODE_Y_FROM_MAJOR = MAJOR_Y + CHAIN_LEN(DIAT_POSITIONS) + GAP;

const mixolydianNodes = buildChain(
  "mixolydian", "Mixolydian", "mixolydian", "mode", "mixolydian",
  DIAT_POSITIONS, MIXOLYDIAN_X, MODE_Y_FROM_MAJOR, majorLast, 75,
);
const mixolydianLast = lastNodeId("mixolydian", DIAT_POSITIONS);

// ─── Lydian  (x=1000, from major) ────────────────────────────────────────────
const LYDIAN_X = 1000;

const lydianNodes = buildChain(
  "lydian", "Lydian", "lydian", "mode", "lydian",
  DIAT_POSITIONS, LYDIAN_X, MODE_Y_FROM_MAJOR, majorLast, 75,
);

// ─── Locrian  (requires phrygian + mixolydian both complete) ──────────────────
const PHRYGIAN_END_Y  = MODE_Y_FROM_NAT_MINOR + CHAIN_LEN(DIAT_POSITIONS);
const MIXOLYDIAN_END_Y = MODE_Y_FROM_MAJOR    + CHAIN_LEN(DIAT_POSITIONS);
const LOCRIAN_START_Y = Math.max(PHRYGIAN_END_Y, MIXOLYDIAN_END_Y) + GAP;
const LOCRIAN_X = 400;

const locrianNodes = buildChain(
  "locrian", "Locrian", "locrian", "mode", "locrian",
  DIAT_POSITIONS, LOCRIAN_X, LOCRIAN_START_Y, phrygianLast, 70,
);
// First Locrian node requires BOTH phrygian and mixolydian chains
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
