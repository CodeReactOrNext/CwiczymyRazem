import type { ScaleTreeNodeDef } from "../types/scaleTree.types";
import type { ScaleType } from "feature/exercisePlan/scales/scaleDefinitions";
import type { PatternType } from "feature/exercisePlan/scales/patternGenerators";

const INNER_RADIUS = 110;  // distance from cluster centre to spine node (patIdx 0)
const ARM_STEP     = 75;   // distance between successive pattern nodes along each arm
// max cluster radius = INNER_RADIUS + 6 × ARM_STEP = 560 px

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
          `${PATTERNS.find((p) => p.type === patternType)?.label ?? patternType} – Poz. ${fretPos}`,
      },
    ],
  };
}

/**
 * Builds a cluster with radial arms instead of a rectangular grid.
 *
 * Each fret position gets one arm radiating from (clusterX, clusterY).
 * Along the arm: ascending (spine) at INNER_RADIUS, then desc, asc_desc, …, seq4 further out.
 *
 * method "circle" — arms evenly distributed 360°, starting at startOrFacingAngle.
 *   Used for MinPent (root) to form a pentagon.
 * method "fan"    — arms spread symmetrically ±fanAngle/2 around startOrFacingAngle.
 *   Used for all other clusters, facing away from the tree centre.
 *
 * Prerequisite logic is UNCHANGED:
 *   Spine (patIdx 0): chains horizontally pos[i-1]_asc → pos[i]_asc
 *   Branch (patIdx>0): chains vertically within the same arm
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
  method: "circle" | "fan",
  startOrFacingAngle: number,
  fanAngle: number,
): ScaleTreeNodeDef[] {
  const nodes: ScaleTreeNodeDef[] = [];

  for (let posIdx = 0; posIdx < positions.length; posIdx++) {
    const pos = positions[posIdx];

    // ── Arm angle for this position ──────────────────────────────────────────
    let armAngleDeg: number;
    if (method === "circle") {
      armAngleDeg = startOrFacingAngle + posIdx * (360 / positions.length);
    } else {
      const t = positions.length > 1 ? posIdx / (positions.length - 1) : 0.5;
      armAngleDeg = startOrFacingAngle + (t - 0.5) * fanAngle;
    }
    const armAngleRad = (armAngleDeg * Math.PI) / 180;

    for (let patIdx = 0; patIdx < PATTERNS.length; patIdx++) {
      const pat = PATTERNS[patIdx];
      const id  = `${scaleId}_pos${pos}_${pat.suffix}`;

      // ── Prerequisite (unchanged logic) ───────────────────────────────────
      let prereq: string | null;
      if (patIdx === 0) {
        prereq = posIdx === 0 ? firstPrereq : spineId(scaleId, positions[posIdx - 1]);
      } else {
        prereq = `${scaleId}_pos${pos}_${PATTERNS[patIdx - 1].suffix}`;
      }

      // ── Radial position ───────────────────────────────────────────────────
      const r = INNER_RADIUS + patIdx * ARM_STEP;
      const x = clusterX + r * Math.cos(armAngleRad);
      const y = clusterY + r * Math.sin(armAngleRad);

      nodes.push(makeNode(
        id,
        label,
        `Poz. ${pos} – ${pat.label}`,
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

// ─── Cluster centres (1.7× scaled) + radial parameters ───────────────────────
//
//  Dorian(-3060,0)  NatMinor(-1700,-816)  MinPent(0,0)  MajPent(1700,-816)  Major(3060,0)
//  Phrygian(-2380,1360)                                  Mixolydian(2380,1360)  Lydian(4080,-1020)
//                               Locrian(0,3060)
//

// ─── Minor Pentatonic — root cluster, pentagon ───────────────────────────────
// startAngle=126° → pos5 (posIdx=2) lands at 270° = straight up in canvas,
// pointing toward MajPent and NatMinor simultaneously.
const minPentNodes = buildCluster(
  "min_pent", "Minor Pentatonic", "minor_pentatonic", "pentatonic", "minor_pentatonic",
  PENT_POSITIONS, 0, 0, null, 80,
  "circle", 126, 360,
);

// ─── Major Pentatonic — upper right, fan facing -26° (away from origin) ──────
const majPentNodes = buildCluster(
  "maj_pent", "Major Pentatonic", "major_pentatonic", "pentatonic", "major_pentatonic",
  PENT_POSITIONS, 1700, -816, spineId("min_pent", 5), 80,
  "fan", -26, 220,
);

// ─── Natural Minor — upper left, fan facing -154° ─────────────────────────────
const natMinorNodes = buildCluster(
  "nat_minor", "Natural Minor", "minor", "diatonic", "minor",
  DIAT_POSITIONS, -1700, -816, spineId("min_pent", 5), 80,
  "fan", -154, 220,
);

// ─── Major Scale — right, fan facing 0° ──────────────────────────────────────
const majorNodes = buildCluster(
  "major", "Major Scale", "major", "diatonic", "major",
  DIAT_POSITIONS, 3060, 0, spineId("maj_pent", 5), 80,
  "fan", 0, 180,
);

// ─── Dorian — far left, fan facing 180° ──────────────────────────────────────
const dorianNodes = buildCluster(
  "dorian", "Dorian", "dorian", "mode", "dorian",
  DIAT_POSITIONS, -3060, 0, spineId("nat_minor", 3), 75,
  "fan", 180, 180,
);

// ─── Phrygian — lower left, fan facing 150° ──────────────────────────────────
const phrygianNodes = buildCluster(
  "phrygian", "Phrygian", "phrygian", "mode", "phrygian",
  DIAT_POSITIONS, -2380, 1360, spineId("nat_minor", 5), 75,
  "fan", 150, 200,
);

// ─── Mixolydian — lower right, fan facing 30° ────────────────────────────────
const mixolydianNodes = buildCluster(
  "mixolydian", "Mixolydian", "mixolydian", "mode", "mixolydian",
  DIAT_POSITIONS, 2380, 1360, spineId("major", 3), 75,
  "fan", 30, 200,
);

// ─── Lydian — far upper right, fan facing -14° ───────────────────────────────
const lydianNodes = buildCluster(
  "lydian", "Lydian", "lydian", "mode", "lydian",
  DIAT_POSITIONS, 4080, -1020, spineId("major", 5), 75,
  "fan", -14, 160,
);

// ─── Locrian — bottom centre, fan facing 90° (downward) ──────────────────────
const locrianNodes = buildCluster(
  "locrian", "Locrian", "locrian", "mode", "locrian",
  DIAT_POSITIONS, 0, 3060, spineId("phrygian", 5), 70,
  "fan", 90, 200,
);
locrianNodes[0].prerequisites = [spineId("phrygian", 5), spineId("mixolydian", 3)];

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
