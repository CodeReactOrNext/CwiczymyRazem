export type SessionGrade = "S" | "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "D" | "F";

type PracticeStyle = "professional" | "hobby";

export interface PromptConfig {
  practiceStyle: PracticeStyle;
  goal: string; // max 150 chars
}

export interface SessionRatingResponse {
  score: number;
  grade: SessionGrade;
  verdict: string;
  feedback: string;
  strengths: string[];
  improvements: string[];
  nextSessionTip?: string;
}

export interface DailySummaryResponse {
  summary: string;
  highlight: string;
  mood: "excellent" | "good" | "solid" | "light" | "rest";
}

export interface WeeklySummaryResponse {
  overview: string;
  strengths: string;
  areasToImprove: string;
  nextWeekPlan: string;
  highlight: string;
  weekScore: "excellent" | "strong" | "good" | "inconsistent" | "minimal";
  score: number;
  grade: SessionGrade;
  verdict: string;
  bestDay: string | null;
}
