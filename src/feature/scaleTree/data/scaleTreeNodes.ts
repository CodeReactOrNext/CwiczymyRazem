import type { ScaleTreeNodeDef, RewardNodeDef } from "../types/scaleTree.types";
import type { ScaleType } from "feature/exercisePlan/scales/scaleDefinitions";
import type { PatternType } from "feature/exercisePlan/scales/patternGenerators";

const X_STEP = 100;    // horizontal gap between fret positions (spine columns)
const Y_STEP = 62;     // vertical gap between pattern variants (branch rows)
const SPINE_RISE = 36; // each rightward spine position rises this many px above the previous

type ScaleFamily = "pentatonic" | "diatonic" | "mode";

const PATTERNS: Array<{ type: PatternType; suffix: string; label: string }> = [
  { type: "ascending",            suffix: "asc",      label: "Ascending"       },
  { type: "descending",           suffix: "desc",     label: "Descending"      },
  { type: "ascending_descending", suffix: "asc_desc", label: "Asc. + Desc."    },
  { type: "intervals_thirds",     suffix: "thirds",   label: "Thirds"          },
  { type: "intervals_fourths",    suffix: "fourths",  label: "Fourths"         },
  { type: "sequence_3_notes",     suffix: "seq3",     label: "Sequence 3"      },
  { type: "sequence_4_notes",     suffix: "seq4",     label: "Sequence 4"      },
];

const PENT_POSITIONS = [1, 3, 5, 8, 10];
const DIAT_POSITIONS = [1, 2, 3, 5, 7, 8, 10];

/** Returns the ascending (spine) node ID for a given scale + fret position. */
function spineId(scaleId: string, pos: number): string {
  return `${scaleId}_pos${pos}_asc`;
}

/** Creates the "single string" gateway node that unlocks before any box position. */
function makeSingleStringNode(
  scaleId: string,
  label: string,
  scaleType: ScaleType,
  scaleFamily: ScaleFamily,
  x: number,
  y: number,
  prerequisites: string[],
  scaleKey: string,
): ScaleTreeNodeDef {
  return {
    id: `${scaleId}_single_string`,
    label,
    subtitle: "Jedna struna",
    scaleType,
    scaleFamily,
    description: "",
    position: { x, y },
    prerequisites,
    requiredExercises: [{
      exerciseId: `scale_c_${scaleKey}_string_3`,
      requiredBpm: 60,
      scaleType,
      patternType: "ascending",
      position: 0,
      stringNum: 3,
      label: "Struna G – liniowo",
    }],
  };
}

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
          `${PATTERNS.find((p) => p.type === patternType)?.label ?? patternType} – Pos. ${fretPos}`,
      },
    ],
  };
}

/**
 * Builds a cluster as a rectangular grid.
 *
 * Spine nodes (patIdx=0) form a horizontal row at y=clusterY, one per fret position.
 * Branch nodes (patIdx>0) extend vertically downward from each spine node.
 *
 * Prerequisite logic:
 *   Spine (patIdx 0): chains left→right  pos[i-1]_asc → pos[i]_asc
 *   Branch (patIdx>0): chains top→bottom within the same column
 */
function buildCluster(
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
  const halfSpan = (positions.length - 1) / 2;

  for (let posIdx = 0; posIdx < positions.length; posIdx++) {
    const pos = positions[posIdx];

    for (let patIdx = 0; patIdx < PATTERNS.length; patIdx++) {
      const pat = PATTERNS[patIdx];
      const id  = `${scaleId}_pos${pos}_${pat.suffix}`;

      // Prerequisite logic (unchanged)
      let prereq: string | null;
      if (patIdx === 0) {
        prereq = posIdx === 0 ? firstPrereq : spineId(scaleId, positions[posIdx - 1]);
      } else {
        prereq = `${scaleId}_pos${pos}_${PATTERNS[patIdx - 1].suffix}`;
      }

      // Diagonal cascade: spine rises left→right, branches hang straight down
      const x = clusterX + (posIdx - halfSpan) * X_STEP;
      const y = clusterY - (posIdx - halfSpan) * SPINE_RISE + patIdx * Y_STEP;

      nodes.push(makeNode(
        id,
        label,
        `Pos. ${pos} – ${pat.label}`,
        scaleType,
        scaleFamily,
        x,
        y,
        prereq,
        `scale_c_${scaleKey}_${pat.type}_pos${pos}`,
        bpm,
        pos,
        pat.type,
      ));
    }
  }
  return nodes;
}

// ─── Cluster centres — tree layout: MinPent is root, all others branch out ───
//
//  Dorian(-2300,-300)  NatMinor(-1100,-100)  MinPent(0,0)  MajPent(1100,-100)  Major(2300,-300)  Lydian(3100,-700)
//  Phrygian(-1800,600)                                                          Mixolydian(2000,500)
//                              Locrian(100,1300)
//

// ── Single-string gateway nodes ───────────────────────────────────────────────
// Position formula: x = clusterX - halfSpan*X_STEP - 140, y = clusterY + halfSpan*SPINE_RISE
// Pent halfSpan=2 → offset (-200-140, +72), Diat halfSpan=3 → offset (-300-140, +108)

const minPentSS = makeSingleStringNode(
  "min_pent", "Minor Pentatonic", "minor_pentatonic", "pentatonic",
  -340, 72, [], "minor_pentatonic",
);
const majPentSS = makeSingleStringNode(
  "maj_pent", "Major Pentatonic", "major_pentatonic", "pentatonic",
  760, -28, ["min_pent_single_string"], "major_pentatonic",
);
const natMinorSS = makeSingleStringNode(
  "nat_minor", "Natural Minor", "minor", "diatonic",
  -1540, 8, ["min_pent_single_string"], "minor",
);
const majorSS = makeSingleStringNode(
  "major", "Major Scale", "major", "diatonic",
  1860, -192, ["maj_pent_single_string"], "major",
);
const dorianSS = makeSingleStringNode(
  "dorian", "Dorian", "dorian", "mode",
  -2740, -192, ["nat_minor_single_string"], "dorian",
);
const phrygianSS = makeSingleStringNode(
  "phrygian", "Phrygian", "phrygian", "mode",
  -2240, 708, ["nat_minor_single_string"], "phrygian",
);
const mixolydianSS = makeSingleStringNode(
  "mixolydian", "Mixolydian", "mixolydian", "mode",
  1560, 608, ["major_single_string"], "mixolydian",
);
const lydianSS = makeSingleStringNode(
  "lydian", "Lydian", "lydian", "mode",
  2660, -592, ["major_single_string"], "lydian",
);
const locrianSS = makeSingleStringNode(
  "locrian", "Locrian", "locrian", "mode",
  -340, 1408, ["phrygian_single_string", "mixolydian_single_string"], "locrian",
);

// ── Box-position clusters (firstPrereq is now the single-string node) ─────────

const minPentNodes = buildCluster(
  "min_pent", "Minor Pentatonic", "minor_pentatonic", "pentatonic", "minor_pentatonic",
  PENT_POSITIONS, 0, 0, "min_pent_single_string", 80,
);

const majPentNodes = buildCluster(
  "maj_pent", "Major Pentatonic", "major_pentatonic", "pentatonic", "major_pentatonic",
  PENT_POSITIONS, 1100, -100, "maj_pent_single_string", 80,
);

const natMinorNodes = buildCluster(
  "nat_minor", "Natural Minor", "minor", "diatonic", "minor",
  DIAT_POSITIONS, -1100, -100, "nat_minor_single_string", 80,
);

const majorNodes = buildCluster(
  "major", "Major Scale", "major", "diatonic", "major",
  DIAT_POSITIONS, 2300, -300, "major_single_string", 80,
);

const dorianNodes = buildCluster(
  "dorian", "Dorian", "dorian", "mode", "dorian",
  DIAT_POSITIONS, -2300, -300, "dorian_single_string", 75,
);

const phrygianNodes = buildCluster(
  "phrygian", "Phrygian", "phrygian", "mode", "phrygian",
  DIAT_POSITIONS, -1800, 600, "phrygian_single_string", 75,
);

const mixolydianNodes = buildCluster(
  "mixolydian", "Mixolydian", "mixolydian", "mode", "mixolydian",
  DIAT_POSITIONS, 2000, 500, "mixolydian_single_string", 75,
);

const lydianNodes = buildCluster(
  "lydian", "Lydian", "lydian", "mode", "lydian",
  DIAT_POSITIONS, 3100, -700, "lydian_single_string", 75,
);

const locrianNodes = buildCluster(
  "locrian", "Locrian", "locrian", "mode", "locrian",
  DIAT_POSITIONS, 100, 1300, "locrian_single_string", 70,
);

// ─── Reward node generator ────────────────────────────────────────────────────
function buildRewardNodesForCluster(
  scaleId: string,
  positions: number[],
  clusterX: number,
  clusterY: number,
): RewardNodeDef[] {
  const rewards: RewardNodeDef[] = [];
  const halfSpan = (positions.length - 1) / 2;

  for (let posIdx = 0; posIdx < positions.length; posIdx++) {
    const pos = positions[posIdx];
    const seq4NodeId = `${scaleId}_pos${pos}_seq4`;

    // Position below the seq4 node (seq4 is at patIdx=6, so reward is at patIdx=7)
    const x = clusterX + (posIdx - halfSpan) * X_STEP;
    const y = clusterY - (posIdx - halfSpan) * SPINE_RISE + 7 * Y_STEP;

    rewards.push({
      id: `${scaleId}_pos${pos}_reward`,
      label: `Reward - Pos. ${pos}`,
      points: 100,
      famePoints: 50,
      position: { x, y },
      prerequisites: [seq4NodeId],
    });
  }

  return rewards;
}

// ─── Generate reward nodes for all clusters ───────────────────────────────────
const minPentRewards = buildRewardNodesForCluster("min_pent", PENT_POSITIONS, 0, 0);
const majPentRewards = buildRewardNodesForCluster("maj_pent", PENT_POSITIONS, 1100, -100);
const natMinorRewards = buildRewardNodesForCluster("nat_minor", DIAT_POSITIONS, -1100, -100);
const majorRewards = buildRewardNodesForCluster("major", DIAT_POSITIONS, 2300, -300);
const dorianRewards = buildRewardNodesForCluster("dorian", DIAT_POSITIONS, -2300, -300);
const phrygianRewards = buildRewardNodesForCluster("phrygian", DIAT_POSITIONS, -1800, 600);
const mixolydianRewards = buildRewardNodesForCluster("mixolydian", DIAT_POSITIONS, 2000, 500);
const lydianRewards = buildRewardNodesForCluster("lydian", DIAT_POSITIONS, 3100, -700);
const locrianRewards = buildRewardNodesForCluster("locrian", DIAT_POSITIONS, 100, 1300);

// ─── Cluster label positions (for orientation overlay) ───────────────────────
export type ClusterLabelDef = {
  id: string;
  label: string;
  family: ScaleFamily;
  x: number;
  y: number;
};

export const CLUSTER_LABELS: ClusterLabelDef[] = [
  { id: "lbl_min_pent",   label: "Minor Pentatonic", family: "pentatonic", x: 0,     y: 0     },
  { id: "lbl_maj_pent",   label: "Major Pentatonic", family: "pentatonic", x: 1100,  y: -100  },
  { id: "lbl_nat_minor",  label: "Natural Minor",    family: "diatonic",   x: -1100, y: -100  },
  { id: "lbl_major",      label: "Major Scale",      family: "diatonic",   x: 2300,  y: -300  },
  { id: "lbl_dorian",     label: "Dorian",           family: "mode",       x: -2300, y: -300  },
  { id: "lbl_phrygian",   label: "Phrygian",         family: "mode",       x: -1800, y: 600   },
  { id: "lbl_mixolydian", label: "Mixolydian",       family: "mode",       x: 2000,  y: 500   },
  { id: "lbl_lydian",     label: "Lydian",           family: "mode",       x: 3100,  y: -700  },
  { id: "lbl_locrian",    label: "Locrian",          family: "mode",       x: 100,   y: 1300  },
];

// ─── Export ──────────────────────────────────────────────────────────────────
export const SCALE_TREE_NODES: ScaleTreeNodeDef[] = [
  // Single-string gateway nodes (must come before their box clusters for topological sort)
  minPentSS, majPentSS, natMinorSS, majorSS,
  dorianSS, phrygianSS, mixolydianSS, lydianSS, locrianSS,
  // Box-position clusters
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

export const SCALE_TREE_REWARD_NODES: RewardNodeDef[] = [
  ...minPentRewards,
  ...majPentRewards,
  ...natMinorRewards,
  ...majorRewards,
  ...dorianRewards,
  ...phrygianRewards,
  ...mixolydianRewards,
  ...lydianRewards,
  ...locrianRewards,
];
