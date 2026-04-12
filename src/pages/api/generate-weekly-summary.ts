import type { NextApiRequest, NextApiResponse } from "next";

const GOAL_MAX_LENGTH = 150;
const MAX_EXERCISES_PER_DAY = 5;
const MAX_TITLE_LENGTH = 40;


function buildSystemPrompt(practiceStyle: "professional" | "hobby", goal: string): string {
  const goalBlock = goal.trim()
    ? `\n=== PLAYER GOAL ===\n"${goal.trim()}" \n`
    : `\n=== PLAYER GOAL ===\nNone provided. Suggest defining a goal in the "highlight" section to help prioritize practice.\n`;

  const shared = `
=== CORE RULE ===
The player already sees what they practiced in the app UI. Do NOT summarize it back at them. DON'T LIST DOWN ALL EXERCISES NAMES
Every sentence must answer: what did this week BUILD or MEAN — not what happened.
Wrong: "You practiced First Melody — One String for 10 minutes." or "You worked through the Quarter Notes Drill (4m), two rounds of First Melody on One String (2m each), Open G String Repetition (2m), and a quick Pentatonic String Crossing across three strings (1m)"
Right: "Ten minutes of one string melody work helped you connect finger movement to melody and improve basic control and fretboard awareness." or "Your set of exercises improved your sense of rhythm, picking, and slightly your pentatonic skills."
COMPRESSION MODE:
Prefer short, dense sentences. Avoid multi-clause sentences. One idea per sentence.

=== PRIORITY ORDER (highest first) ===
1. Insight over summary — explain what the week produced, not what was done
2. JSON structure correctness
Exercise/song name: mention at most once across the entire response, only when it adds meaning. Never cite it formulaically.

=== BANNED PHRASES — never output these ===
"solid effort", "good session", "great job", "awesome to see you", "wonderful", "nice work showing up",
"keep it up", "well done", "great work", "fantastic session", "shows dedication"

=== EXPERIENCE TIERS (use totalLoggedHours) ===
< 20h    → beginner: habit-building language, fundamentals focus, supportive tone
20–100h  → developing: acknowledge real progress, specific technique notes
100–500h → intermediate: focus on consistency and specific weaknesses
500h+    → experienced: high standards, refinement and nuance — not basics

Language: English only.`;

  if (practiceStyle === "hobby") {
    return `You are a supportive but honest friend who also plays guitar. Hobbyists don't need long sessions — showing up counts. Be warm but real. 
${goalBlock}
Return ONLY valid JSON — no markdown, no commentary outside the JSON:

{
  "overview": <3–4 sentences. Did the week have a clear trajectory? Compare start of week to end. Did they stay consistent or fade? Assess alignment with PLAYER GOAL.>,
  "strengths": <2-3 sentences. Identify the most meaningful growth area this week. Explain WHY it matters to their playing, not just what they did.>,
  "areasToImprove": <2-3 sentences. Identify one pattern slowing them down (e.g. erratic sessions, avoiding theory, etc). Frame as what might make next week more rewarding.>,
  "nextWeekPlan": <1-2 friendly suggestions using 'you could'. One concrete micro-step toward PLAYER GOAL.>,
  "highlight": <One warm, memorable sentence (max 20 words). A punchy takeaway from the week's data.>,
  "weekScore": "excellent|strong|good|inconsistent|minimal",
  "score": <0.0–10.0, one decimal>,
  "grade": <"S"|"A"|"B"|"C"|"D"|"F">,
  "verdict": <2–4 word punchy phrase>,
  "bestDay": "Day Name"
}

=== SCORING (hobby) ===
9.0–10  → S/A (Excellent)
7.0–8.9 → B (Good)
4.0–6.9 → C (Solid)
2.0–3.9 → D (Light)
0.0–1.9 → F (Minimal)
(DO NOT use + or - modifiers. Use only S, A, B, C, D, F).

=== WEEK SCORE (hobby) ===
excellent: 4-7 active days OR 2h+ total
strong: 3 active days OR 60-120 min total
good: 2 active days OR 30-59 min total
inconsistent: 1 active day or big gaps
minimal: no practice

NEVER penalize for sessions under 20 min.
${shared}`;
  }

  return `You are a demanding, no-nonsense guitar coach. High standards. Be honest, critical, and specific.
${goalBlock}
Return ONLY valid JSON — no markdown, no commentary outside the JSON:

{
  "overview": <3–4 sentences. Hard assessment of the week's discipline and purpose. Did they grow or just "put in time"? Mention alignment with PLAYER GOAL.>,
  "strengths": <2-3 sentences. Identify where they showed real focus or technical progress. No "good job" filler. Describe the specific musical/technical advantage gained.>,
  "areasToImprove": <2-3 sentences. Pinpoint technical gaps or discipline failures (e.g. imbalance between technique/theory, short sessions, erratic timing).>,
  "nextWeekPlan": <1-2 sentences. One concrete direction for next week. A mandatory micro-step toward PLAYER GOAL.>,
  "highlight": <One punchy takeaway sentence (max 20 words). The "harsh truth" or the biggest "win" of the week.>,
  "weekScore": "excellent|strong|good|inconsistent|minimal",
  "score": <0.0–10.0, one decimal>,
  "grade": <"S"|"A"|"B"|"C"|"D"|"F">,
  "verdict": <2–4 word punchy phrase>,
  "bestDay": "Day Name"
}

=== SCORING (strict coaching) ===
9.3–10  → S (Exceptional)
8.5–9.2 → A (Very Strong)
7.0–8.4 → B (Good)
5.0–6.9 → C (Average)
3.0–4.9 → D (Weak)
0.0–2.9 → F (Failing)
(DO NOT use + or - modifiers. Use only S, A, B, C, D, F).

=== WEEK SCORE (strict — do not inflate) ===
excellent: 5-7 active days OR 5h+ total
strong: 4+ active days OR 3h+ total
good: 3 active days OR 2h+ total
inconsistent: 1-2 active days
minimal: very little/none

Penalize for: <20 min sessions, single category focus, low points-to-time ratio.
${shared}`;
}


interface DayData {
  dayName: string;
  date: string;
  exercises: Array<{
    title: string;
    totalTime: number;
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
    points: number;
    songTitle?: string;
  }>;
  totalMinutes: number;
  totalPoints: number;
}

interface WeeklySummaryRequest {
  days: DayData[];
  userLevel: number;
  weekTotalPoints: number;
  practiceStyle?: "professional" | "hobby";
  goal?: string;
  totalLoggedHours?: number;
  yearsPlaying?: number;
}

interface WeeklySummaryResponse {
  overview: string;
  strengths: string;
  areasToImprove: string;
  nextWeekPlan: string;
  highlight: string;
  weekScore: "excellent" | "strong" | "good" | "inconsistent" | "minimal";
  score: number;
  grade: "S" | "A" | "B" | "C" | "D" | "F";
  verdict: string;
  bestDay: string | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WeeklySummaryResponse | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { days, userLevel, weekTotalPoints, practiceStyle, goal, totalLoggedHours, yearsPlaying } =
    req.body as WeeklySummaryRequest;

  const experienceLines = [
    totalLoggedHours != null && `Total logged hours: ~${totalLoggedHours}h`,
    yearsPlaying != null && `Playing guitar for: ~${yearsPlaying} year${yearsPlaying !== 1 ? "s" : ""}`,
  ].filter(Boolean).join("\n");

  const safeStyle = practiceStyle === "professional" ? "professional" : "hobby";
  const safeGoal = typeof goal === "string" ? goal.slice(0, GOAL_MAX_LENGTH) : "";

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "AI configuration missing" });
  }

  const activeDays = days.filter((d) => d.totalMinutes > 0);

  let userMessage: string;

  if (activeDays.length === 0) {
    userMessage = `The user did not practice at all this week. Level: ${userLevel}.${experienceLines ? `\n${experienceLines}` : ""}`;
  } else {
    const dayLines = days
      .map((day) => {
        if (day.totalMinutes === 0) {
          return `${day.dayName.slice(0, 3)}: rest`;
        }

        // Sort by time desc, take top exercises
        const sorted = [...day.exercises].sort((a, b) => (b.totalTime || 0) - (a.totalTime || 0));
        const top = sorted.slice(0, MAX_EXERCISES_PER_DAY);
        const restCount = sorted.length - top.length;

        const exerciseLines = top
          .map((e) => {
            const title = e.title.slice(0, MAX_TITLE_LENGTH);
            const mins = Math.round((e.totalTime || 0) / 60000);
            const cats: string[] = [];
            if (e.techniqueTime > 0) cats.push(`tech:${Math.round(e.techniqueTime / 60000)}m`);
            if (e.theoryTime > 0)    cats.push(`theory:${Math.round(e.theoryTime / 60000)}m`);
            if (e.hearingTime > 0)   cats.push(`hear:${Math.round(e.hearingTime / 60000)}m`);
            if (e.creativityTime > 0) cats.push(`creat:${Math.round(e.creativityTime / 60000)}m`);
            const catStr = cats.length > 0 ? ` (${cats.join(", ")})` : "";
            const songStr = e.songTitle ? ` — "${e.songTitle.slice(0, 30)}"` : "";
            return `  - ${title}: ${mins}m${catStr}${songStr}`;
          })
          .join("\n");
        const moreStr = restCount > 0 ? `\n  +${restCount} more` : "";

        return `${day.dayName.slice(0, 3)}: ${day.totalMinutes}m (${day.totalPoints}pts)\n${exerciseLines}${moreStr}`;
      })
      .join("\n");

    const totalMinutes = days.reduce((sum, d) => sum + d.totalMinutes, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    userMessage = `This week's practice log:
${dayLines}

Totals: ${totalHours}h, ${weekTotalPoints}pts, ${activeDays.length}/7 days active. Level: ${userLevel}.${experienceLines ? `\n${experienceLines}` : ""}`;
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
    const parsed = JSON.parse(content) as WeeklySummaryResponse;

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("generate-weekly-summary error:", err);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
