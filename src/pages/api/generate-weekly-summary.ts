import type { NextApiRequest, NextApiResponse } from "next";

const GOAL_MAX_LENGTH = 150;
const MAX_EXERCISES_PER_DAY = 5;
const MAX_TITLE_LENGTH = 40;

function buildSystemPrompt(practiceStyle: "professional" | "hobby", goal: string): string {
  const styleNote =
    practiceStyle === "professional"
      ? "This student is a serious, dedicated musician aiming for the highest level. Be direct, technically precise, and hold them to a high standard. Push them when needed."
      : "This student plays as a hobby and for enjoyment. Keep the tone warm, encouraging, and relaxed. Focus on fun and consistency, not perfection.";

  const goalNote = goal.trim()
    ? `The student's personal goal: "${goal.trim()}". Focus your review around this goal — do not criticize areas they haven't mentioned as priorities.`
    : "Focus feedback on the areas they actually worked on this week.";

  return `You are an experienced guitar coach writing a detailed, personal weekly review for your student. You have access to their full week of practice logs. Write like a real coach who knows the student — be direct, specific, encouraging but honest.

${styleNote}
${goalNote}

You must return ONLY clean JSON with exactly these fields:

{
  "overview": "2-3 sentences summarizing the week: how many days practiced, total volume, and one standout moment. Be warm and specific.",
  "strengths": "2-3 sentences about what went well. Reference specific exercises by name and explain briefly why it matters for their growth.",
  "areasToImprove": "2-3 sentences about what needs attention — missed days, category imbalances, or lack of variety. Be honest but constructive.",
  "nextWeekPlan": "2-3 sentences with a concrete plan: days to practice, categories to prioritize, one habit to change. Make it feel like a real prescription.",
  "highlight": "One single punchy sentence — the most important takeaway or challenge for this student right now. Max 20 words.",
  "weekScore": "excellent|strong|good|inconsistent|minimal",
  "bestDay": "The day name with the most practice minutes, or null if no practice this week"
}

weekScore rules:
- "excellent": 5-7 active days OR 5+ hours total
- "strong": 4+ active days OR 3+ hours total
- "good": 3 active days OR 2+ hours total
- "inconsistent": 1-2 active days with gaps
- "minimal": very little or no practice at all

Language: English only. Do NOT invent specific BPM numbers or fret positions. Keep each field as a single flowing paragraph — no bullet points inside the fields.`;
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
  streak: number;
  userLevel: number;
  weekTotalPoints: number;
  practiceStyle?: "professional" | "hobby";
  goal?: string;
}

interface WeeklySummaryResponse {
  overview: string;
  strengths: string;
  areasToImprove: string;
  nextWeekPlan: string;
  highlight: string;
  weekScore: "excellent" | "strong" | "good" | "inconsistent" | "minimal";
  bestDay: string | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WeeklySummaryResponse | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { days, streak, userLevel, weekTotalPoints, practiceStyle, goal } =
    req.body as WeeklySummaryRequest;

  const safeStyle = practiceStyle === "professional" ? "professional" : "hobby";
  const safeGoal = typeof goal === "string" ? goal.slice(0, GOAL_MAX_LENGTH) : "";

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "AI configuration missing" });
  }

  const activeDays = days.filter((d) => d.totalMinutes > 0);

  let userMessage: string;

  if (activeDays.length === 0) {
    userMessage = `The user did not practice at all this week. Current streak: ${streak} days. Level: ${userLevel}.`;
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

        const names = top.map((e) => e.title.slice(0, MAX_TITLE_LENGTH)).join(", ");
        const moreStr = restCount > 0 ? `, +${restCount} more` : "";

        // Day-level category totals
        const tech  = Math.round(day.exercises.reduce((s, e) => s + (e.techniqueTime || 0), 0) / 60000);
        const theory= Math.round(day.exercises.reduce((s, e) => s + (e.theoryTime || 0), 0) / 60000);
        const hear  = Math.round(day.exercises.reduce((s, e) => s + (e.hearingTime || 0), 0) / 60000);
        const creat = Math.round(day.exercises.reduce((s, e) => s + (e.creativityTime || 0), 0) / 60000);
        const cats = [tech && `tech:${tech}m`, theory && `theory:${theory}m`, hear && `hear:${hear}m`, creat && `creat:${creat}m`].filter(Boolean).join(" ");

        return `${day.dayName.slice(0, 3)}: ${day.totalMinutes}m [${names}${moreStr}] ${cats} (${day.totalPoints}pts)`;
      })
      .join("\n");

    const totalMinutes = days.reduce((sum, d) => sum + d.totalMinutes, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    userMessage = `This week's practice log:
${dayLines}

Totals: ${totalHours}h, ${weekTotalPoints}pts, ${activeDays.length}/7 days active. Streak: ${streak}d. Level: ${userLevel}.`;
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
        max_completion_tokens: 2000,
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
