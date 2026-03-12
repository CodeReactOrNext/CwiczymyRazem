import type { NextApiRequest, NextApiResponse } from "next";

const GOAL_MAX_LENGTH = 150;
const MAX_EXERCISES = 10;
const MAX_TITLE_LENGTH = 40;

function buildSystemPrompt(practiceStyle: "professional" | "hobby", goal: string): string {
  const styleNote =
    practiceStyle === "professional"
      ? "This student is a serious, dedicated musician aiming for the highest level. Be direct, technically precise, and hold them to a high standard. Push them when needed."
      : "This student plays as a hobby and for enjoyment. Keep the tone warm, encouraging, and relaxed. Focus on fun and progress, not perfection.";

  const goalNote = goal.trim()
    ? `The student's personal goal: "${goal.trim()}". Focus feedback around this goal — do not criticize areas they haven't mentioned as priorities.`
    : "Focus feedback on the areas they actually practiced today.";

  return `You are an enthusiastic, sharp guitar coach. The user gives you their practice data for today. Write a short, personal, motivating summary (2-3 sentences). Be specific: mention what they actually practiced. Be real — if they practiced little, acknowledge it warmly. No generic "Great job!" openings.

${styleNote}
${goalNote}

Return ONLY clean JSON, nothing else:
{
  "summary": "2-3 sentence narrative about today's practice",
  "highlight": "One concrete, actionable tip or insight (max 12 words)",
  "mood": "excellent|good|solid|light|rest"
}

Mood rules (based on total practice minutes):
- "excellent": 60+ min
- "good": 30–59 min
- "solid": 10–29 min
- "light": 1–9 min
- "rest": 0 min (no practice today)

Language: English. Do NOT mention BPM or specific fret positions.`;
}

interface ExerciseEntry {
  title: string;
  techniqueTime: number;
  theoryTime: number;
  hearingTime: number;
  creativityTime: number;
  totalTime: number;
  points: number;
  songTitle?: string;
}

interface DailySummaryRequest {
  exercises: ExerciseEntry[];
  totalPoints: number;
  streak: number;
  userLevel: number;
  practiceStyle?: "professional" | "hobby";
  goal?: string;
}

interface DailySummaryResponse {
  summary: string;
  highlight: string;
  mood: "excellent" | "good" | "solid" | "light" | "rest";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DailySummaryResponse | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { exercises, totalPoints, streak, userLevel, practiceStyle, goal } =
    req.body as DailySummaryRequest;

  const safeStyle = practiceStyle === "professional" ? "professional" : "hobby";
  const safeGoal = typeof goal === "string" ? goal.slice(0, GOAL_MAX_LENGTH) : "";

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "AI configuration missing" });
  }

  const totalMinutes = Math.round(
    (exercises?.reduce((sum, e) => sum + (e.totalTime || 0), 0) || 0) / 60000
  );

  let userMessage: string;

  if (!exercises || exercises.length === 0) {
    userMessage = `The user did not practice today. Streak: ${streak} days. Level: ${userLevel}.`;
  } else {
    // Sort by time desc, take top exercises, aggregate the rest
    const sorted = [...exercises].sort((a, b) => (b.totalTime || 0) - (a.totalTime || 0));
    const top = sorted.slice(0, MAX_EXERCISES);
    const rest = sorted.slice(MAX_EXERCISES);
    const restMinutes = Math.round(rest.reduce((s, e) => s + (e.totalTime || 0), 0) / 60000);

    const exerciseLines = top
      .map((e) => {
        const title = e.title.slice(0, MAX_TITLE_LENGTH);
        const mins = Math.round(e.totalTime / 60000);
        const cats: string[] = [];
        if (e.techniqueTime > 0) cats.push(`tech:${Math.round(e.techniqueTime / 60000)}m`);
        if (e.theoryTime > 0)    cats.push(`theory:${Math.round(e.theoryTime / 60000)}m`);
        if (e.hearingTime > 0)   cats.push(`hear:${Math.round(e.hearingTime / 60000)}m`);
        if (e.creativityTime > 0) cats.push(`creat:${Math.round(e.creativityTime / 60000)}m`);
        const catStr = cats.length > 0 ? ` (${cats.join(", ")})` : "";
        const songStr = e.songTitle ? ` — "${e.songTitle.slice(0, 30)}"` : "";
        return `${title}: ${mins}m${catStr}${songStr}`;
      })
      .join("\n");

    const restLine = rest.length > 0 ? `\n+${rest.length} more exercises (${restMinutes}m total)` : "";

    userMessage = `Today's practice:
${exerciseLines}${restLine}

Total: ${totalMinutes} min, ${totalPoints} pts. Streak: ${streak}d. Level: ${userLevel}.`;
  }

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5-nano",
        messages: [
          { role: "system", content: buildSystemPrompt(safeStyle, safeGoal) },
          { role: "user", content: userMessage },
        ],
        max_completion_tokens: 8000,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiRes.ok) {
      return res.status(502).json({ error: "AI service error" });
    }

    const data = await openaiRes.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content) as DailySummaryResponse;

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("generate-daily-summary error:", err);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
