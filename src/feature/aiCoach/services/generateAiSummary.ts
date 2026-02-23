import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { firebaseGetUserRaprotsLogs } from "feature/logs/services/getUserRaprotsLogs.service";

export type AiGenerateSummaryParams = {
  apiKey: string;
  goal: string;
  userAuth: string;
};

export const generateAiSummary = async ({
  apiKey,
  goal,
  userAuth,
}: AiGenerateSummaryParams) => {
  if (!apiKey) throw new Error("API Key is missing");
  if (!userAuth) throw new Error("User auth is missing");

  // Fetch recent logs
  const allLogs = await firebaseGetUserRaprotsLogs(userAuth);

  // Sort and get the last 14 days of logs
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const recentLogs = allLogs
    .filter((log) => {
      // reportDate might be an ISO string or a Firestore Timestamp.
      // Firebase objects sometimes come with a reportDate property.
      const dateVal = log.reportDate;
      let logDate: Date;

      if (dateVal && typeof dateVal.toDate === 'function') {
        logDate = dateVal.toDate(); // Firestore Timestamp
      } else if (dateVal) {
        logDate = new Date(dateVal);
      } else {
        return false; // Skip logs without date
      }

      return logDate >= fourteenDaysAgo;
    })
    .sort((a, b) => {
      const dateA = a.reportDate?.toDate?.()?.getTime() || new Date(a.reportDate).getTime() || 0;
      const dateB = b.reportDate?.toDate?.()?.getTime() || new Date(b.reportDate).getTime() || 0;
      return dateB - dateA;
    });

  // Prepare log summary
  const logSummary = recentLogs
    .map((log) => {
      const dateVal = log.reportDate?.toDate?.() || new Date(log.reportDate);
      const dateStr = !isNaN(dateVal.getTime()) ? `${dateVal.getDate()}.${dateVal.getMonth() + 1}` : "??";
      const title = log.exceriseTitle || log.songTitle || "Sesja";
      const durationMins = Math.floor((log.timeSumary?.sumTime || 0) / 60);

      return `${dateStr}: ${title} (${durationMins}m)`;
    })
    .join("\n");

  // Prepare exercises context - strictly compacted for token savings
  const exercisesContext = exercisesAgregat
    .map((ex) => `[${ex.id}] ${ex.title} (${ex.category}/${ex.difficulty}) Skills: ${ex.relatedSkills?.join(",") || "-"}`)
    .join("\n");

  const systemPrompt = `Jesteś trenerem gitary "Cwiczymy Razem". Analizuj logi i cel użytkownika.
ZASADY:
1. Podsumuj krótko ostatnie 14 dni.
2. Odnieś się do celu: "${goal || "Ogólny rozwój"}".
3. Poleć DOKŁADNIE JEDNO ćwiczenie z listy poniżej (podaj ID i Tytuł).
4. Pisz w 100% zwięźle, po polsku, w Markdown. Oszczędzaj słowa.

LISTA ĆWICZEŃ (ID | TYTUŁ (KAT/TRUDNOŚĆ) SKILLS):
${exercisesContext}
`;

  const userPrompt = `CEL: ${goal || "Rozwój"}
LOGI (Data: Ćwiczenie (min)):
${logSummary || "Brak"}
`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // Much cheaper and smarter than 3.5 or turbo
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.error?.message || "Failed to fetch AI response");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Nie udało się wygenerować podsumowania.";
};
