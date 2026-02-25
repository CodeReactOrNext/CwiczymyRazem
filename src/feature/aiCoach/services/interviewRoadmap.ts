import { firebaseGetUserRaprotsLogs } from "feature/logs/services/getUserRaprotsLogs.service";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { RoadmapMilestone } from "../types/roadmap.types";
import { v4 as uuidv4 } from "uuid";

export interface InterviewMessage {
  role: "assistant" | "user";
  content: string;
}

export interface InterviewQuestion {
  question: string;
  suggestions: string[];
}

export type GenerationPhase =
  | "drafting"
  | "detailing"
  | "finalizing";

const INTERVIEWER_SYSTEM = `Jesteś doświadczonym trenerem gitary prowadzącym otwarty, spersonalizowany wywiad przed stworzeniem planu nauki.

ZAWSZE odpowiadaj WYŁĄCZNIE w formacie JSON (zero tekstu poza JSON):
{
  "question": "treść pytania po polsku",
  "suggestions": ["sugestia 1", "sugestia 2", "sugestia 3"]
}

ZASADY DLA PYTAŃ:
- Pierwsze pytanie (brak historii): zawsze zapytaj o główny cel — co uczeń chce konkretnie osiągnąć. Pytanie szerokie i otwarte, nie zawężaj.
- Kolejne pytania: adaptacyjne, wynikające BEZPOŚREDNIO z poprzednich odpowiedzi. Każde odkrywa coś nowego.
- Naturalna kolejność wątków (nie sztywna): cel → konkretyzacja celu lub inspiracja → aktualny poziom i blokada → co już próbował → preferencje co do ćwiczeń.
- Nie pytaj o czas ani harmonogram — plan jest oparty na sesjach, nie na tygodniach.
- Nie pytaj osobno o "styl muzyczny" — styl wynika naturalnie z celu i inspiracji.
- Pytania krótkie, konkretne, przyjazne. Po polsku.

ZASADY DLA SUGESTII:
- 3–4 sugestie, zawsze konkretne i różnorodne — to PRZYKŁADY, nie wyczerpująca lista.
- Użytkownik może zignorować sugestie i napisać własną odpowiedź.
- Sugestie to inspiracje, nie kategorie: "Zagrać solo z Comfortably Numb" zamiast "Nauka solówek".
- Pierwsze pytanie (brak historii): sugestie różnorodne, obejmują różne style i poziomy.
- Kolejne pytania: sugestie dostosowane do tego co uczeń już powiedział.`;

const compact = (text: string, max = 3000) =>
  text.length > max ? text.slice(0, max) + "…" : text;

async function callOpenAI(
  apiKey: string,
  system: string,
  user: string,
  opts: { model?: string; temp?: number; json?: boolean; maxTokens?: number } = {}
): Promise<string> {
  const { model = "gpt-4o", temp, json = false, maxTokens = 2000 } = opts;

  const body: Record<string, any> = {
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    max_completion_tokens: maxTokens,
  };

  if (temp !== undefined) body.temperature = temp;
  if (json) body.response_format = { type: "json_object" };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Błąd API OpenAI (${response.status})`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim() ?? "";

  if (!content) {
    console.error("[callOpenAI] Empty content for model:", model, "| finish_reason:", data.choices?.[0]?.finish_reason);
  }

  return content;
}

const buildMilestones = (phases: any[]): RoadmapMilestone[] => {
  return phases.map((p: any, i: number) => {
    const children: RoadmapMilestone[] | undefined =
      Array.isArray(p.children) && p.children.length > 0
        ? p.children.map((c: any, j: number) => ({
          id: uuidv4(),
          title: c.title || "Krok",
          cardTitle: c.cardTitle || `Krok ${i + 1}.${j + 1}`,
          cardSubtitle: c.cardSubtitle || "",
          cardDetailedText: c.cardDetailedText || "",
          isCompleted: false,
          order: j,
          successCriteria: c.successCriteria || undefined,
          successTrigger: c.successTrigger || null,
          failTrigger: c.failTrigger || null,
          selfCheckMethod: c.selfCheckMethod || null,
          sessionsRequired: typeof c.sessionsRequired === "number" ? c.sessionsRequired : 7,
          sessionsCompleted: 0,
          exerciseOptions: Array.isArray(c.exerciseOptions)
            ? c.exerciseOptions.filter((o: any) => o.exerciseId && !String(o.exerciseId).includes("null")).map((o: any) => ({
              exerciseId: String(o.exerciseId),
              exerciseTitle: o.exerciseTitle || "",
              description: o.description || "",
            }))
            : [],
          exerciseId: c.exerciseId || null,
          exerciseTitle: c.exerciseTitle || null,
        }))
        : [];

    return {
      id: uuidv4(),
      title: p.title || "Faza",
      cardTitle: p.cardTitle || `Etap ${i + 1}`,
      cardSubtitle: p.cardSubtitle || "",
      cardDetailedText: p.cardDetailedText || "",
      isCompleted: false,
      order: i,
      successCriteria: p.successCriteria || null,
      successTrigger: p.successTrigger || null,
      failTrigger: p.failTrigger || null,
      children: children || [],
    };
  });
};

const cleanObject = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(cleanObject);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, cleanObject(v)])
    );
  }
  return obj;
};

export const getNextInterviewQuestion = async (
  apiKey: string,
  history: InterviewMessage[]
): Promise<InterviewQuestion> => {
  const messages = [
    { role: "system", content: INTERVIEWER_SYSTEM },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    ...(history.length === 0 ? [{ role: "user", content: "Zacznij wywiad." }] : []),
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.75,
      max_tokens: 300,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Błąd połączenia z AI");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim() ?? "{}";

  try {
    const parsed = JSON.parse(content);
    return {
      question: parsed.question || "Opowiedz mi więcej o swoich celach.",
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 4) : [],
    };
  } catch {
    return { question: content, suggestions: [] };
  }
};

export const generateRoadmapFromInterview = async (
  apiKey: string,
  history: InterviewMessage[],
  userAuth: string,
  onPhase?: (phase: GenerationPhase) => void
): Promise<RoadmapMilestone[]> => {
  const allLogs = await firebaseGetUserRaprotsLogs(userAuth);
  const logContext = allLogs
    .slice(0, 10)
    .map((l) => `- ${l.exceriseTitle || l.songTitle || "Sesja"}`)
    .join("\n");

  const conversation = history
    .map((m) => `${m.role === "assistant" ? "Trener" : "Uczeń"}: ${m.content}`)
    .join("\n");

  const exerciseList = exercisesAgregat
    .map((ex) => `[${ex.id}] ${ex.title} (${ex.category ?? "brak kategorii"})`)
    .join("\n");

  onPhase?.("drafting");

  const outlineStr = await callOpenAI(
    apiKey,
    `Jesteś ekspertem ds. nauki gitary. Na podstawie wywiadu stwórz spersonalizowany szkielet planu nauki jako listę etapów.

WYWIAD:
${conversation}

OSTATNIO ĆWICZONE:
${logContext || "brak danych"}`,
    `Stwórz 4-7 etapów planu nauki gitary, od najłatwiejszego do najtrudniejszego.
Dla każdego etapu podaj:
- title: krótki tytuł (max 6 słów)
- description: 2-3 zdania — co konkretnie jest celem tego etapu, jakie umiejętności są ćwiczone i dlaczego w tej kolejności

Zwróć TYLKO JSON:
{"phases":[{"title":"...","description":"..."}]}`,
    { json: true, maxTokens: 4000 }
  );

  let outlinePhases: Array<{ title: string; description: string }>;
  try {
    const parsed = JSON.parse(outlineStr);
    outlinePhases = parsed.phases ?? parsed;
    if (!Array.isArray(outlinePhases) || outlinePhases.length === 0) throw new Error();
  } catch {
    console.error("[outline] parse failed:", outlineStr);
    throw new Error("Nie udało się wygenerować struktury planu. Spróbuj ponownie.");
  }

  onPhase?.("detailing");

  const phaseDetails = await Promise.all(
    outlinePhases.map(async (phase, i) => {
      const phaseStr = await callOpenAI(
        apiKey,
        `Jesteś ekspertem ds. nauki gitary. Generujesz JEDEN szczegółowy etap planu nauki opartego na SESJACH ćwiczeniowych.

DOSTĘPNE ĆWICZENIA (ID — nazwa — kategoria):
${exerciseList}`,
        `Wygeneruj kompletny JSON dla etapu ${i + 1} planu nauki.

ETAP:
Tytuł: ${phase.title}
Opis: ${phase.description}

WAŻNE ZASADY DOTYCZĄCE MODELU SESJI:
- Każdy pod-krok (child) ma SESJE zamiast czasu. Użytkownik zalicza krok wykonując N sesji.
- sessionsRequired: ile sesji trzeba wykonać żeby zaliczyć krok (zazwyczaj 5–10, dostosuj do trudności)
- exerciseOptions: 3–5 ćwiczeń z listy pasujących do tego kroku — użytkownik wybierze jedno na każdą sesję
- Każde ćwiczenie w exerciseOptions musi mieć opis co konkretnie ćwiczyć podczas tej sesji (1-2 zdania)
- Główny etap (parent) NIE ma sesji — zalicza się automatycznie gdy wszystkie pod-kroki mają pełną liczbę sesji

Zwróć TYLKO poprawny JSON (bez tekstu dookoła):
{
  "title": "${phase.title}",
  "cardTitle": "Etap ${i + 1}",
  "cardDetailedText": "Minimum 4 zdania: co konkretnie ćwiczysz w tym etapie, jak przebiega typowa sesja, typowe błędy i jak ich unikać, jak ten etap przygotowuje do kolejnego.",
  "successCriteria": "Konkretny mierzalny cel całego etapu",
  "successTrigger": "Co robić po zaliczeniu wszystkich kroków etapu",
  "failTrigger": "Co robić jeśli utknąłeś",
  "children": [
    {
      "title": "Konkretna umiejętność (max 5 słów)",
      "cardTitle": "Krok ${i + 1}.1",
      "cardDetailedText": "3-5 zdań: dokładna instrukcja, na czym się skupić podczas każdej sesji, wskazówki techniczne.",
      "successCriteria": "Konkretny cel — jak poznasz że opanowałeś",
      "sessionsRequired": 7,
      "exerciseOptions": [
        {
          "exerciseId": "id_z_listy",
          "exerciseTitle": "nazwa ćwiczenia",
          "description": "Co konkretnie ćwiczysz tym ćwiczeniem w kontekście tego kroku (1-2 zdania)"
        }
      ],
      "selfCheckMethod": "Konkretna metoda samooceny. Max 2 zdania.",
      "successTrigger": "Co po zaliczeniu kroku",
      "failTrigger": "Co jeśli nie wychodzi"
    }
  ]
}

ZASADY:
- children: 3-5 elementów
- exerciseOptions: użyj DOKŁADNYCH ID z listy ćwiczeń, dobierz pasujące do umiejętności kroku
- sessionsRequired: dostosuj do trudności (proste = 5 sesji, trudne = 10 sesji)`,
        { json: true, maxTokens: 16384 }
      );

      try {
        return JSON.parse(phaseStr);
      } catch {
        console.error(`[phase ${i + 1}] parse failed:`, phaseStr);
        throw new Error(`Błąd generowania etapu ${i + 1}. Spróbuj ponownie.`);
      }
    })
  );

  onPhase?.("finalizing");

  if (!phaseDetails.length) throw new Error("Pusta roadmapa.");

  const milestones = buildMilestones(phaseDetails);
  return cleanObject(milestones);
};
