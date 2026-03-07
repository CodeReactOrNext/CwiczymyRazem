export interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  successCriteria: string;
  sessionsRequired: number;
  sessionsCompleted: number;
  order: number;
  suggestedExerciseId?: string;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  order: number;
  steps: RoadmapStep[];
}

export interface Roadmap {
  id: string;
  userId: string;
  title: string;
  goal: string;
  level: string;
  createdAt: string;
  updatedAt: string;
  phases: RoadmapPhase[];
}
