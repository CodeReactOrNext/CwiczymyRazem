import type { ScaleTreeNodeDef } from "../types/scaleTree.types";
import type { ScaleType } from "feature/exercisePlan/scales/scaleDefinitions";
import type { PatternType } from "feature/exercisePlan/scales/patternGenerators";

const X_STEP = 160;    // horizontal gap between fret positions (spine columns)
const Y_STEP = 90;     // vertical gap between pattern variants (branch rows)
const SPINE_RISE = 55; // each rightward spine position rises this many px above the previous

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

// ─── Cluster centres (×0.80 of original radial layout) ───────────────────────
//
//  Dorian(-3427,0)  NatMinor(-1904,-914)  MinPent(0,0)  MajPent(1904,-914)  Major(3427,0)
//  Phrygian(-2666,1523)                               Mixolydian(2666,1523)  Lydian(4570,-1142)
//                              Locrian(0,3427)
//

const minPentNodes = buildCluster(
  "min_pent", "Minor Pentatonic", "minor_pentatonic", "pentatonic", "minor_pentatonic",
  PENT_POSITIONS, 0, 0, null, 80,
);

const majPentNodes = buildCluster(
  "maj_pent", "Major Pentatonic", "major_pentatonic", "pentatonic", "major_pentatonic",
  PENT_POSITIONS, 1904, -914, spineId("min_pent", 5), 80,
);

const natMinorNodes = buildCluster(
  "nat_minor", "Natural Minor", "minor", "diatonic", "minor",
  DIAT_POSITIONS, -1904, -914, spineId("min_pent", 5), 80,
);

const majorNodes = buildCluster(
  "major", "Major Scale", "major", "diatonic", "major",
  DIAT_POSITIONS, 3427, 0, spineId("maj_pent", 5), 80,
);

const dorianNodes = buildCluster(
  "dorian", "Dorian", "dorian", "mode", "dorian",
  DIAT_POSITIONS, -3427, 0, spineId("nat_minor", 3), 75,
);

const phrygianNodes = buildCluster(
  "phrygian", "Phrygian", "phrygian", "mode", "phrygian",
  DIAT_POSITIONS, -2666, 1523, spineId("nat_minor", 5), 75,
);

const mixolydianNodes = buildCluster(
  "mixolydian", "Mixolydian", "mixolydian", "mode", "mixolydian",
  DIAT_POSITIONS, 2666, 1523, spineId("major", 3), 75,
);

const lydianNodes = buildCluster(
  "lydian", "Lydian", "lydian", "mode", "lydian",
  DIAT_POSITIONS, 4570, -1142, spineId("major", 5), 75,
);

const locrianNodes = buildCluster(
  "locrian", "Locrian", "locrian", "mode", "locrian",
  DIAT_POSITIONS, 0, 3427, spineId("phrygian", 5), 70,
);
locrianNodes[0].prerequisites = [spineId("phrygian", 5), spineId("mixolydian", 3)];

// ─── Cluster label positions (for orientation overlay) ───────────────────────
export type ClusterLabelDef = {
  id: string;
  label: string;
  family: ScaleFamily;
  x: number;
  y: number;
};

export const CLUSTER_LABELS: ClusterLabelDef[] = [
  { id: "lbl_min_pent",   label: "Minor Pentatonic", family: "pentatonic", x: 0,     y: 0      },
  { id: "lbl_maj_pent",   label: "Major Pentatonic", family: "pentatonic", x: 1904,  y: -914   },
  { id: "lbl_nat_minor",  label: "Natural Minor",    family: "diatonic",   x: -1904, y: -914   },
  { id: "lbl_major",      label: "Major Scale",      family: "diatonic",   x: 3427,  y: 0      },
  { id: "lbl_dorian",     label: "Dorian",           family: "mode",       x: -3427, y: 0      },
  { id: "lbl_phrygian",   label: "Phrygian",         family: "mode",       x: -2666, y: 1523   },
  { id: "lbl_mixolydian", label: "Mixolydian",       family: "mode",       x: 2666,  y: 1523   },
  { id: "lbl_lydian",     label: "Lydian",           family: "mode",       x: 4570,  y: -1142  },
  { id: "lbl_locrian",    label: "Locrian",          family: "mode",       x: 0,     y: 3427   },
];

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
