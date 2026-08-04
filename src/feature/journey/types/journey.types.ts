type JourneyStepStatus = "locked" | "available" | "in-progress" | "completed";
type JourneyStageId = "stage_1" | "stage_2" | "stage_3" | "stage_4" | "stage_5";

export interface FretDiagramString {
  /** 1-6, 1 = high e. */
  string: number;
  /** False = string is out of scope for this exercise — rendered dimmed, no labels. */
  active: boolean;
  /** Note name at each fret from `startFret` to `endFret` inclusive. Required when `active`. */
  notes?: string[];
}

export interface FretDiagramData {
  startFret: number;
  endFret: number;
  /** Exactly 6 entries (string 1..6) — inactive strings are still listed so the whole neck renders for context. */
  strings: FretDiagramString[];
}

export interface StepContentBlock {
  type: "text" | "callout" | "image" | "fretDiagram";
  variant?: "warning" | "info" | "success";
  label?: string;
  icon?: string;  // Lucide icon name
  body?: string;
  url?: string;
  caption?: string;
  /** Present when type === "fretDiagram" — a real SVG fretboard visualization. */
  diagram?: FretDiagramData;
}

interface ChecklistItem {
  text: string;
  icon?: string; // Lucide icon name
}

export interface JourneyStepProgress {
  completed: boolean;
  completedAt?: string;
  startedAt?: string;
  stars?: 1 | 2 | 3;
}

interface JourneyModuleProgress {
  steps: Record<string, JourneyStepProgress>;
}

export interface JourneyProgressDocument {
  userId: string;
  moduleProgress: Record<string, JourneyModuleProgress>;
  updatedAt: string;
}

export interface JourneyStep {
  id: string;
  order: number;
  stageId: JourneyStageId;
  title: string;
  shortDescription: string;
  fullDescription: string;
  tips: string[];
  commonMistakes: string[];
  examGoal: string;
  suggestedExerciseId: string;
  stepIcon: string;     // Lucide icon name
  modalOnly?: boolean;  // if true: no Practice/Exam buttons — only a confirmation action
  examBpm?: number;             // locked BPM for exam mode
  contentBlocks?: StepContentBlock[];  // rich content blocks replacing fullDescription
  checklist?: ChecklistItem[]; // prerequisite checkboxes — all must be checked before continuing
  songPicker?: string[];       // song IDs to offer as a pick-one recommendation
}

interface JourneyStage {
  id: JourneyStageId;
  label?: string;
  order: number;
  steps: JourneyStep[];
}

export interface JourneyModule {
  id: string;
  title: string;
  subtitle: string;
  locked: boolean;
  icon: string;
  stages: JourneyStage[];
}

export interface JourneyStepWithStatus extends JourneyStep {
  status: JourneyStepStatus;
  stars?: 1 | 2 | 3;
}

interface JourneyStageWithStatus extends Omit<JourneyStage, "steps"> {
  steps: JourneyStepWithStatus[];
}

export interface JourneyModuleWithStatus extends Omit<JourneyModule, "stages"> {
  stages: JourneyStageWithStatus[];
  completedCount: number;
  totalCount: number;
}

export interface LockedModulePlaceholder {
  id: string;
  title: string;
  subtitle: string;
  locked: true;
  icon: string;
}
