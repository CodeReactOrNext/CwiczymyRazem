import { firebaseGetUserRaprotsLogs } from "feature/logs/services/getUserRaprotsLogs.service";
import type { RoadmapMilestone } from "../types/roadmap.types";
import { v4 as uuidv4 } from "uuid";

interface GenerateRoadmapParams {
  apiKey: string;
  goal: string;
  userAuth: string;
}

const buildMilestones = (phases: any[], order = 0): RoadmapMilestone[] =>
  phases.map((phase: any, i: number) => ({
    id: uuidv4(),
    title: phase.title || "Faza",
    cardTitle: phase.cardTitle || `Etap ${order + i + 1}`,
    cardSubtitle: phase.cardSubtitle || "",
    cardDetailedText: phase.cardDetailedText || "",
    isCompleted: false,
    order: order + i,
    children: Array.isArray(phase.children) && phase.children.length > 0
      ? buildMilestones(phase.children, 0)
      : undefined,
  }));

export const generateAiRoadmap = async ({
  apiKey,
  goal,
  userAuth,
}: GenerateRoadmapParams): Promise<RoadmapMilestone[]> => {
  if (!apiKey) throw new Error("API Key is missing");

  const allLogs = await firebaseGetUserRaprotsLogs(userAuth);
  const recentLogs = allLogs.slice(0, 10);
  const logContext = recentLogs.map(log => `- ${log.exceriseTitle || log.songTitle || "Sesja"}`).join("\n");

  const systemPrompt = `Jesteś ekspertem-trenerem gitary. Stwórz hierarchiczny, wielopoziomowy plan nauki (roadmapę).

STRUKTURA JSON którą musisz zwrócić:
{
  "phases": [
    {
      "title": "Nazwa etapu/fazy",
      "cardTitle": "Tydzień 1-2",
      "cardDetailedText": "Krótki opis czego wymaga ten etap.",
      "children": [
        {
          "title": "Konkretna umiejętność do opanowania",
          "cardTitle": "Krok 1.1",
          "cardDetailedText": "Opis jak to ćwiczyć."
        }
      ]
    }
  ]
}

ZASADY:
- Zwróć 3-5 faz głównych (phases)
- Każda faza powinna mieć 2-4 pod-kroki (children) — konkretne umiejętności lub ćwiczenia
- Kroki są logiczne — każda faza WYNIKA z poprzedniej
- Pod-kroki powinny być bardziej szczegółowe niż fazy
- TYLKO czysty JSON, nic poza nim
- Język: POLSKI
- Cel użytkownika: "${goal || "Ogólny rozwój gitary"}"
- Ostatnie ćwiczenia:
${logContext || "Brak danych"}
`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.error?.message || "Failed to fetch AI Roadmap");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  try {
    const parsed = JSON.parse(content);
    const phasesArray = Array.isArray(parsed) ? parsed : (parsed.phases || parsed.steps || Object.values(parsed)[0]);

    if (!Array.isArray(phasesArray)) throw new Error("Invalid roadmap format");

    return buildMilestones(phasesArray);
  } catch (err) {
    console.error("Failed to parse AI Roadmap JSON:", content);
    throw new Error("Błąd podczas przetwarzania planu. Spróbuj ponownie.");
  }
};
