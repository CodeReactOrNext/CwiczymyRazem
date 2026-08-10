import type { PatternType } from "feature/exercisePlan/scales/patternGenerators";
import type { ScaleType } from "feature/exercisePlan/scales/scaleDefinitions";

export type NodeStatus = "locked" | "available" | "in_progress" | "completed";

export interface RequiredExercise {
  exerciseId: string;
  requiredBpm: number;
  /**
   * Target this exercise demanded before the tempo bump. Progress recorded at
   * the old, slower speed still clears the node — see `isExerciseCleared`.
   */
  legacyRequiredBpm?: number;
  scaleType: ScaleType;
  patternType: PatternType;
  /** Fret the shape is anchored on — what the exercise generator works with. */
  position: number;
  /**
   * Shape number a learner sees (Box 1–5 for pentatonic, 1–7 for diatonic).
   * The frets jump around (1, 3, 5, 8, 10…), so counting boxes reads as a
   * ladder instead of implying ten separate positions.
   */
  boxNumber?: number;
  label: string;
  stringNum?: number; // present for single-string exercises (1=high E … 6=low E)
}

export interface RewardNodeDef {
  id: string;
  label: string;
  points: number;
  famePoints: number;
  position: { x: number; y: number };
  prerequisites: string[];
  [key: string]: unknown;
}

export interface ScaleTreeNodeDef {
  id: string;
  label: string;
  subtitle: string;
  scaleType: ScaleType;
  scaleFamily: "pentatonic" | "diatonic" | "mode";
  description: string;
  position: { x: number; y: number };
  prerequisites: string[];
  requiredExercises: RequiredExercise[];
}

export interface ScaleTreeNodeData extends ScaleTreeNodeDef {
  [key: string]: unknown;
  status: NodeStatus;
  progress: { done: number; total: number };
  currentBpm: number | null;
}

export type BpmProgressMap = Map<string, number[]>;
