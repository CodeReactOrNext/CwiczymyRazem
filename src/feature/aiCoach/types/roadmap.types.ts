export interface ExerciseOption {
  exerciseId: string;
  exerciseTitle: string;
  description?: string;
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  cardTitle?: string;
  cardSubtitle?: string;
  cardDetailedText?: string;
  isCompleted: boolean;
  order: number;
  children?: RoadmapMilestone[];

  successCriteria?: string;
  successTrigger?: string | null;
  failTrigger?: string | null;
  selfCheckMethod?: string | null;

  sessionsRequired?: number;
  sessionsCompleted?: number;
  exerciseOptions?: ExerciseOption[];

  exerciseId?: string;
  exerciseTitle?: string;
}

export interface Roadmap {
  id: string;
  userId: string;
  title: string;
  goal: string;
  createdAt: string;
  updatedAt: string;
  milestones: RoadmapMilestone[];
}
