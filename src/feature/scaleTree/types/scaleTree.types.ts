import type { ScaleType } from "feature/exercisePlan/scales/scaleDefinitions";
import type { PatternType } from "feature/exercisePlan/scales/patternGenerators";

export type NodeStatus = "locked" | "available" | "in_progress" | "completed";

export interface RequiredExercise {
  exerciseId: string;
  requiredBpm: number;
  scaleType: ScaleType;
  patternType: PatternType;
  position: number;
  label: string;
  stringNum?: number; // present for single-string exercises (1=high E … 6=low E)
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
