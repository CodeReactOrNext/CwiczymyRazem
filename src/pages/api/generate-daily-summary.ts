import type { NextApiRequest, NextApiResponse } from "next";

const GOAL_MAX_LENGTH = 150;
const MAX_EXERCISES = 10;
const MAX_TITLE_LENGTH = 40;

function streakContext(streak: number): string {
  if (streak === 0) return "0 days";
  if (streak === 1) return "1 day — fresh start!";
  if (streak === 2) return "2 days — building momentum!";
  const milestones: [number, string][] = [
    [7, "one full week!"], [14, "two weeks!"], [21, "three weeks!"],
    [30, "one month!"], [60, "two months!"], [100, "100 days!"], [365, "one year!"],
  ];
  const hit = milestones.find(([n]) => streak === n);
  return hit ? `${streak} days — ${hit[1]}` : `${streak} days`;
}

function buildSystemPrompt(practiceStyle: "professional" | "hobby", goal: string): string {
  const goalNote = goal.trim()
    ? `The student's stated goal: "${goal.trim()}". This goal is the CENTRAL lens for your entire response — you MUST explicitly mention it by name in the summary, explain directly whether today's session moved them closer to or further from it, and make the highlight field a concrete next step toward this specific goal. Do not give generic feedback that could apply to anyone. Every sentence should be written with this goal in mind.`
    : "Focus feedback on the areas they actually practiced today.";

  if (practiceStyle === "hobby") {
    return `You are a supportive friend who also plays guitar — not a professional instructor. The user shares their practice data with you. Write a short, warm, personal reaction (2-3 sentences). Mention what they actually played. Celebrate showing up, not the amount of time.

Hobby player rules — follow these strictly:
- 15 minutes of practice is a real win. 20 minutes is great. 25–30 is impressive. Never imply more time is required.
- NEVER use phrases like "you need to", "at least X minutes", "you should", "it's important that you", or "try to practice more".
- Consistency beats duration — if they showed up, that matters most.
- If they practiced less than 15 minutes, be genuinely warm about it — even 10 minutes of guitar is better than none.
- Suggestions in the highlight field must be optional and framed as "you could" or "next time you might", never as requirements.
- Do NOT push them to practice more. Do NOT set expectations. Do NOT critique their session length.
- Focus on what was fun or interesting about what they played, not on what they missed.

${goalNote}

Return ONLY clean JSON, nothing else:
{
  "summary": "2-3 sentence warm, friendly reaction to today's practice",
  "highlight": "One gentle, optional suggestion or fun observation (max 12 words)",
  "mood": "excellent|good|solid|light|rest"
}

Mood rules for hobby players (based on total practice minutes):
- "excellent": 30+ min — they went above and beyond
- "good": 15–29 min — solid, consistent practice
- "solid": 8–14 min — showed up and that counts
- "light": 1–7 min — touched the guitar, still worth celebrating
- "rest": 0 min — rest day

Language: English. Do NOT mention BPM or specific fret positions.`;
  }

  return `You are an experienced, sharp guitar coach. The user gives you their practice data for today. Write a short, personal, motivating summary (2-3 sentences). Be specific: mention what they actually practiced. Be real — if they practiced little, acknowledge it directly. No generic "Great job!" openings.

This student is a serious, dedicated musician aiming for the highest level. Be direct, technically precise, and hold them to a high standard. Push them when needed.
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

Total: ${totalMinutes} min, ${totalPoints} pts. Streak: ${streakContext(streak)}. Level: ${userLevel}.`;
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
