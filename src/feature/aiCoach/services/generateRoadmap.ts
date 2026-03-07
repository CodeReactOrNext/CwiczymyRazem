import { v4 as uuidv4 } from "uuid";
import type { RoadmapPhase } from "../types/roadmap.types";

interface GenerateRoadmapParams {
  goal: string;
  level: string;
}

export const generateAiRoadmap = async ({
  goal,
  level,
}: GenerateRoadmapParams): Promise<RoadmapPhase[]> => {
  const res = await fetch("/api/generate-roadmap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal, level }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Błąd generowania planu. Spróbuj ponownie.");
  }

  const rawPhases: any[] = data.phases;

  return rawPhases.map((phase: any, phaseIdx: number) => ({
    id: uuidv4(),
    title: phase.title || `Faza ${phaseIdx + 1}`,
    order: phaseIdx,
    steps: Array.isArray(phase.steps)
      ? phase.steps.map((step: any, stepIdx: number) => ({
          id: uuidv4(),
          title: step.title || `Krok ${stepIdx + 1}`,
          description: "",
          successCriteria: "",
          sessionsRequired: 8,
          sessionsCompleted: 0,
          order: stepIdx,
        }))
      : [],
  }));
};
