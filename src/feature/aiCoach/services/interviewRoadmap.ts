import { firebaseGetUserRaprotsLogs } from "feature/logs/services/getUserRaprotsLogs.service";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { RoadmapMilestone } from "../types/roadmap.types";
import { v4 as uuidv4 } from "uuid";
import { addDays, format } from "date-fns";

export interface InterviewMessage {
  role: "assistant" | "user";
  content: string;
}

export type GenerationPhase =
  | "analyzing"
  | "drafting"
  | "enriching"
  | "finalizing";

const INTERVIEWER_SYSTEM = `Jesteś doświadczonym trenerem gitary, który prowadzi krótki wywiad (maks. 5 pytań) z uczniem przed stworzeniem spersonalizowanego planu nauki.

ZASADY:
- Zadaj JEDNO konkretne pytanie na raz.
- Każde pytanie powinno wynikać z poprzednich odpowiedzi i pogłębiać Twoją wiedzę o uczniu.
- Skup się na: poziomie zaawansowania, celach, dostępnym czasie (ile godzin/minut dziennie lub tygodniowo), problemach, stylu muzycznym.
- Pytania krótkie, przyjazne, po POLSKU.
- Zwróć TYLKO treść pytania — żadnych wstępów, po prostu samo pytanie.`;

const compact = (text: string, max = 3000) =>
  text.length > max ? text.slice(0, max) + "…" : text;

async function callOpenAI(
  apiKey: string,
  system: string,
  user: string,
  opts: { model?: string; temp?: number; json?: boolean; maxTokens?: number } = {}
): Promise<string> {
  const { model = "gpt-4o", temp = 0.7, json = false, maxTokens = 2000 } = opts;

  const body: Record<string, any> = {
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: temp,
    max_tokens: maxTokens,
  };

  if (json) body.response_format = { type: "json_object" };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Błąd API OpenAI");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

const buildMilestones = (phases: any[], startDate: Date): RoadmapMilestone[] => {
  let current = startDate;

  return phases.map((p: any, i: number) => {
    const weeksEstimate = parseInt(p.weeksEstimate) || 2;
    const phaseStart = format(current, "yyyy-MM-dd");
    const phaseEnd = format(addDays(current, weeksEstimate * 7 - 1), "yyyy-MM-dd");
    current = addDays(current, weeksEstimate * 7);

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
          targetBpm: c.targetBpm ? Number(c.targetBpm) : null,
          exerciseId: c.exerciseId || null,
          exerciseTitle: c.exerciseTitle || null,
          successTrigger: c.successTrigger || null,
          failTrigger: c.failTrigger || null,
          youtubeUrl: c.youtubeUrl || null,
        }))
        : null;

    return {
      id: uuidv4(),
      title: p.title || "Faza",
      cardTitle: p.cardTitle || `Etap ${i + 1}`,
      cardSubtitle: p.cardSubtitle || "",
      cardDetailedText: p.cardDetailedText || "",
      isCompleted: false,
      order: i,
      startDate: phaseStart,
      endDate: phaseEnd,
      successCriteria: p.successCriteria || null,
      successTrigger: p.successTrigger || null,
      failTrigger: p.failTrigger || null,
      youtubeUrl: p.youtubeUrl || null,
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
): Promise<string> => {
  const messages = [
    { role: "system", content: INTERVIEWER_SYSTEM },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-4o-mini", messages, temperature: 0.6, max_tokens: 120 }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Błąd połączenia z AI");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "Opowiedz mi coś więcej o sobie.";
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

  onPhase?.("analyzing");

  const studentProfile = await callOpenAI(
    apiKey,
    `Jesteś psychologiem sportu i ekspertem ds. nauki gitary. Na podstawie wywiadu napisz KRÓTKI (max 200 słów), precyzyjny profil ucznia:
1. Mocne strony i co już umie
2. Słabe strony i luki w wiedzy
3. Przeszkody (techniczne, czasowe, mentalne)
4. Oszacowanie czasu dostępnego tygodniowo (w minutach)
5. Styl muzyczny i motywacja
Odpowiedz po polsku. Bez kodu, tylko tekst.`,
    `WYWIAD:\n${conversation}`,
    { temp: 0.5, maxTokens: 500 }
  );

  onPhase?.("drafting");

  const draft = await callOpenAI(
    apiKey,
    `Jesteś ekspertem ds. nauki gitary. Masz profil ucznia. Stwórz BARDZO SZCZEGÓŁOWY, długi narracyjny plan nauki (min. 1200 słów) w języku polskim.

Plan musi zawierać:
- 5-8 GŁÓWNYCH ETAPÓW (od najłatwiejszego do najtrudniejszego). Zbuduj długofalową i głęboką strukturę.
- Dla każdego etapu: szacowany czas (ile tygodni), dogłębnie opisane techniki, BPM targets, jak obiektywnie mierzyć postęp.
- TRIGGERY: co zrobić jeśli etap przejdzie ("jeśli osiągniesz X → ...") i co jeśli utkniesz ("jeśli po Y tygodniach nie umiesz Z → wróć do...")
- Każdy etap ma 3-5 pod-kroków z konkretnymi ćwiczeniami.
- Powiązania z ćwiczeniami z aplikacji (użyj ich nazw z listy, aby potem łatwo je zmapować na ID).

PROFIL UCZNIA:
${studentProfile}

OSTATNIO ĆWICZONE:
${logContext || "brak danych"}`,
    `Napisz pełny, bardzo rozbudowany plan.`,
    { temp: 0.8, maxTokens: 4000 }
  );

  onPhase?.("enriching");

  const enriched = await callOpenAI(
    apiKey,
    `Jesteś recenzentem planu nauki gitary. Przejrzyj plan i DOPRACUJ go:
1. Dodaj konkretne BPM (np. zacznij od 60 BPM, cel: 100 BPM) gdzie pasuje
2. Upewnij się, że każdy etap ma jasne KRYTERIUM SUKCESU (kiedy wiem, że mogę przejść dalej?)
3. Każdy etap: dodaj SUCCESS TRIGGER (co dalej po sukcesie) i FAIL TRIGGER (co jeśli utknę)
4. Powiąż konkretne kroki z ćwiczeniami z listy — podaj DOKŁADNE ID ćwiczenia z nawiasów kwadratowych.

DOSTĘPNE ĆWICZENIA (ID — nazwa):
${exerciseList}

Zwróć ulepszony, kompletny plan narracyjny po polsku.`,
    `PLAN DO ULEPSZENIA:\n${draft}`,
    { temp: 0.5, maxTokens: 4000 }
  );

  onPhase?.("finalizing");

  const today = format(new Date(), "yyyy-MM-dd");

  const jsonStr = await callOpenAI(
    apiKey,
    `Przekształć plan nauki gitary w strukturalny JSON. Data startu planu: ${today}.

WYMAGANA STRUKTURA:
{
  "phases": [
    {
      "title": "Krótki tytuł etapu (max 6 słów)",
      "cardTitle": "Etap 1 · Tydzień 1-3",
      "cardDetailedText": "Bogaty opis. Co ćwiczyć, jak, na co uważać. Min. 3 zdania.",
      "weeksEstimate": 3,
      "successCriteria": "Konkretny, mierzalny cel np. zagraj X w 80 BPM",
      "successTrigger": "Po osiągnięciu celu: przejdź do etapu 2",
      "failTrigger": "Jeśli po 3 tygodniach nie ma postępu: wróć do ćwiczenia ID",
      "youtubeUrl": "Tylko jeśli znasz konkretny, BARDZO DOBRY film na YT na ten temat (link), inaczej null",
      "children": [
        {
          "title": "Konkretna umiejętność (max 5 słów)",
          "cardTitle": "Krok 1.1",
          "cardDetailedText": "Szczegółowy opis: ile minut/dzień, BPM start i cel, wskazówki. Min. 2 zdania.",
          "successCriteria": "Mierzalny cel np. 60 BPM bez pomyłek przez 30 sek",
          "targetBpm": 80,
          "exerciseId": "exercise_id_z_listy_lub_null",
          "exerciseTitle": "Nazwa ćwiczenia lub null",
          "successTrigger": "Przejdź do kroku 1.2",
          "failTrigger": "Ćwicz wolniej, cofnij BPM o 10",
          "youtubeUrl": "Prawdziwy link youtube ułatwiający naukę tego kroku lub null"
        }
      ]
    }
  ]
}

ZASADY:
- 5-8 faz, każda mająca 3-5 pod-kroków.
- weeksEstimate: liczba tygodni na ten etap (integer)
- exerciseId: Użyj IDEALNEGO DOPASOWANIA z przekazanej w wywiadzie listy ID (np. "spider_basic"). Jeśli nie ma odpowiedniego ćwiczenia w aplikacji, zostaw null.
- WYŁĄCZNIE JSON bez żadnego tekstu dookoła`,
    `PLAN:\n${enriched}`,
    { temp: 0.2, json: true, maxTokens: 7000 }
  );

  try {
    const parsed = JSON.parse(jsonStr);
    const arr = Array.isArray(parsed)
      ? parsed
      : parsed.phases || parsed.steps || (Object.values(parsed)[0] as any[]);

    if (!Array.isArray(arr) || arr.length === 0) throw new Error("Pusta roadmapa");

    const milestones = buildMilestones(arr, new Date());
    return cleanObject(milestones);
  } catch {
    console.error("JSON parse failed:", jsonStr);
    throw new Error("Nie udało się sparsować planu. Spróbuj ponownie.");
  }
};
