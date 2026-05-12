type JourneyStepStatus = "locked" | "available" | "in-progress" | "completed";
type JourneyStageId = "stage_1" | "stage_2" | "stage_3";

export interface StepContentBlock {
  type: "text" | "callout" | "image";
  variant?: "warning" | "info" | "success";
  label?: string;
  icon?: string;  // Lucide icon name
  body?: string;
  url?: string;
  caption?: string;
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
  image: string;        // URL — replace with your own later
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
  colorClass: string;
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
