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
  targetBpm?: number;
  exerciseId?: string;
  exerciseTitle?: string;
  startDate?: string;
  endDate?: string;
  successTrigger?: string | null;
  failTrigger?: string | null;
  youtubeUrl?: string | null;
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
