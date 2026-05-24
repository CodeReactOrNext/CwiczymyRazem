export interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  successCriteria: string;
  sessionsRequired: number;
  sessionsCompleted: number;
  order: number;
  suggestedExerciseId?: string;
  noExercise?: boolean;
  suggestedLessonIds?: string[];
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
  image?: string;
}

// Static roadmap stored in JSON (no per-user progress data)
export type StaticRoadmapStep = Omit<RoadmapStep, "sessionsCompleted">;
export type StaticRoadmapPhase = Omit<RoadmapPhase, "steps"> & { steps: StaticRoadmapStep[] };
export type StaticRoadmap = Omit<Roadmap, "userId" | "createdAt" | "updatedAt" | "phases"> & {
  phases: StaticRoadmapPhase[];
  image?: string;
};
