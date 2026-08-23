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
  /**
   * Ids this exercise used to be filed under. Progress recorded against one of
   * them still clears the node — see `isExerciseCleared`. Diatonic shapes were
   * renamed when they were re-anchored on scale degrees, and a player who passed
   * the old node passed this one.
   */
  legacyExerciseIds?: string[];
  scaleType: ScaleType;
  patternType: PatternType;
  /** Fret the shape is anchored on — what the exercise generator works with. */
  position: number;
  /**
   * Pentatonic box the shape belongs to (1–5), matching the names players get
   * from teachers and books. Absent for diatonic scales and modes, which have
   * no box convention and are named by the fret they start on.
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

/** Fastest clean run above the exam tempo — the node's personal best. */
export interface ScaleRecord {
  bpm: number;
  /** Key it was set in. The shape is identical in every key, so records are shared. */
  rootNote?: string;
  accuracy?: number;
}

export interface ScaleTreeNodeData extends ScaleTreeNodeDef {
  [key: string]: unknown;
  status: NodeStatus;
  progress: { done: number; total: number };
  currentBpm: number | null;
  record: ScaleRecord | null;
}

export type BpmProgressMap = Map<string, number[]>;
export type ScaleRecordMap = Map<string, ScaleRecord>;

/** Everything the tree reads out of `exerciseBpmProgress` in one pass. */
export interface ScaleTreeProgress {
  bpms: BpmProgressMap;
  records: ScaleRecordMap;
}
