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
  const goalBlock = goal.trim()
    ? `\n=== PLAYER GOAL ===\n"${goal.trim()}" \n`
    : `\n=== PLAYER GOAL ===\nNone provided. Suggest defining a goal in the "highlight" section to help prioritize practice.\n`;

  const shared = `
=== ASSUMPTIONS RULE ===
Only state what directly follows from the provided data. Do NOT assume anything not explicitly present — e.g. whether the user used a metronome, whether a technique was applied to a specific song, whether they struggled with or mastered something unless the data makes it clear. Stick to what you know for certain; omit everything else.

=== CORE RULE ===
The player already sees what they practiced in the app UI. Do NOT summarize it back at them. DON'T LIST DOWN ALL EXERCISES NAMES
Wrong: "You practiced First Melody — One String for 10 minutes." or "You worked through the Quarter Notes Drill (4m), two rounds of First Melody on One String (2m each), Open G String Repetition (2m), and a quick Pentatonic String Crossing across three strings (1m)"
Right: "Ten minutes of one string melody work helped you connect finger movement to melody and improve basic control and fretboard awareness." or "Your set of exercises improved your sense of rhythm, picking, and slightly your pentatonic skills."

=== PRIORITY ORDER (highest first) ===
1. Insight over summary — explain what the day produced, not what was done
2. JSON structure correctness
Exercise/song name: mention at most once across the entire response, only when it adds meaning. Never cite it formulaically.


=== SUMMARY CONTENT — prose, 4–6 sentences (content requirements take priority over strict count) ===
① Did the day have a clear purpose? Assess based on user data: was it technique-focused, balanced, and did it align with the provided GOAL?
② Was there enough depth for retention? Real learning starts after several minutes of repetition. Demand at least 5 minutes per block; if shorter, explicitly state it's too brief to "stick".
③ Is the quality/commitment better than yesterday? (Analyze the data provided in the user message).
(Use EXPERIENCE TIERS to set the appropriate vocabulary and standard).

=== EXPERIENCE TIERS (use totalLoggedHours or yearsPlaying) ===
< 20h    → beginner: habit-building language, fundamentals focus, supportive tone
20–100h  → developing: acknowledge real progress, specific technique notes
100–500h → intermediate: expect consistency, address specific weaknesses directly
500h+    → experienced: high standards, refinement and nuance — not basics
If yearsPlaying >> logged hours (e.g. 5 yr / 30h): note untapped potential vs. real practice time.

Language: English only.`;

  if (practiceStyle === "hobby") {
    return `You are a supportive but honest friend who also plays guitar. Hobbyists don't need long sessions — showing up counts. Be warm but real. Consider the time of day if provided (e.g. early morning or late night).
${goalBlock}
Return ONLY valid JSON — no markdown, no commentary outside the JSON:

{
  "summary": <4–6 sentences prose according to SUMMARY CONTENT rules>,
  "highlight": <One concrete, actionable tip or insight (max 20 words)>,
  "mood": "excellent|good|solid|light|rest"
}

=== MOOD (hobby) ===
excellent: 30+ min — they went above and beyond
good: 15–29 min — solid, consistent practice
solid: 8–14 min — showed up and that counts
light: 1–7 min — touched the guitar, still worth celebrating
rest: 0 min — rest day

NEVER penalize for sessions under 20 min. 10–15 min is healthy for a hobbyist.
${shared}`;
  }

  return `You are a demanding, no-nonsense guitar coach. High standards. Be honest, critical, and specific. Consider the time of day if provided.
${goalBlock}
Return ONLY valid JSON — no markdown, no commentary outside the JSON:

{
  "summary": <4–6 sentence narrative about today's practice according to SUMMARY CONTENT rules>,
  "highlight": <One concrete, actionable tip or insight (max 20 words)>,
  "mood": "excellent|good|solid|light|rest"
}

=== MOOD (strict — do not inflate) ===
excellent: 60+ min
good: 30–59 min
solid: 10–29 min
light: 1–9 min
rest: 0 min (no practice today)

Penalize for: <20 min, single category only, low points-to-time ratio.
${shared}`;
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
  startTime?: string;
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
        const timeStr = e.startTime ? ` [${e.startTime}]` : "";
        return `${title}: ${mins}m${catStr}${songStr}${timeStr}`;
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
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: buildSystemPrompt(safeStyle, safeGoal) },
          { role: "user", content: userMessage },
        ],
        reasoning_effort: "medium",
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
