import type { NextApiRequest, NextApiResponse } from "next";

const SYSTEM_PROMPT = `You are an experienced guitar coach writing a detailed, personal weekly review for your student. You have access to their full week of practice logs. Write like a real coach who knows the student — be direct, specific, encouraging but honest.

You must return ONLY clean JSON with exactly these fields:

{
  "overview": "A rich opening paragraph (5-7 sentences) summarizing the whole week. Cover: how many days they practiced, total volume, the general vibe and energy of the week, standout moments, and how this week compares to what a dedicated guitarist should aim for. Be warm and specific.",
  "strengths": "A detailed paragraph (5-6 sentences) about what went well this week. Reference specific exercises or session types by name. Explain WHY those things are beneficial for their development. Celebrate real effort — if they practiced consistently, call it out specifically. If they worked on a particular skill multiple times, note the repetition as a strength.",
  "areasToImprove": "A candid, constructive paragraph (5-6 sentences) about what needs attention. Look at: missed days and their impact on muscle memory, category imbalances (e.g. too much technique, zero ear training), short sessions that may not be enough for real progress, or exercises repeated without variety. Be honest but never harsh — frame everything as opportunity.",
  "nextWeekPlan": "A concrete, actionable paragraph (6-8 sentences) laying out a specific plan for next week. Recommend: how many days to practice, which categories to prioritize, what kind of sessions to add or balance, and one specific habit or routine change to implement. Make it feel like a real coaching prescription, not generic advice.",
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

  const { days, streak, userLevel, weekTotalPoints } =
    req.body as WeeklySummaryRequest;

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
          return `${day.dayName}: rest`;
        }
        const exerciseNames = day.exercises.map((e) => `"${e.title}"`).join(", ");
        return `${day.dayName}: ${day.totalMinutes} min — ${exerciseNames} (${day.totalPoints} pts)`;
      })
      .join("\n");

    const totalMinutes = days.reduce((sum, d) => sum + d.totalMinutes, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    userMessage = `This week's practice log:
${dayLines}

Weekly totals: ${totalHours} hours practice, ${weekTotalPoints} points, ${activeDays.length}/7 days active.
Current streak: ${streak} days. Player level: ${userLevel}.`;
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
          { role: "system", content: SYSTEM_PROMPT },
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
