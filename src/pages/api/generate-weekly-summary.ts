import type { NextApiRequest, NextApiResponse } from "next";

const GOAL_MAX_LENGTH = 150;
const MAX_EXERCISES_PER_DAY = 5;
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
    ? `The student's stated goal: "${goal.trim()}". This goal is the CENTRAL lens for your entire review — you MUST explicitly reference it by name in the overview, directly assess whether this week's practice advanced or neglected it, and make the nextWeekPlan field a concrete path toward this specific goal. Score the week partly through the lens of goal alignment: a technically short week that strongly served their goal is better than a long week that ignored it. Every field should feel written for someone pursuing this exact goal.`
    : "Focus feedback on the areas they actually worked on this week.";

  if (practiceStyle === "hobby") {
    return `You are a supportive friend who also plays guitar, writing a warm weekly recap for another hobbyist. You have their full week of practice logs. Write like a friend, not an instructor — celebrate consistency, mention specific songs or exercises they played, and keep the energy positive.

Hobby player rules — follow these strictly:
- 3 or more days of practice is a strong, successful week. Even 2 days is good. 1 day still means they showed up.
- NEVER use phrases like "you need to", "you should practice more", "at least X minutes per day", "you must", or "it's important that you".
- Do NOT criticize session length. 15 minutes a day is healthy and sustainable for a hobbyist.
- In the "areasToImprove" field: frame everything as what might make playing even MORE enjoyable — not as failures or shortcomings. Keep it light.
- In the "nextWeekPlan" field: offer 1-2 friendly ideas, not a schedule or prescription. Use "you could" or "might be fun to", never "you should" or "make sure to".
- Celebrate any streak or returning after a break. Consistency is the real win.
- NEVER imply they are underperforming compared to a standard.

${goalNote}

You must return ONLY clean JSON with exactly these fields:

{
  "overview": "2-3 sentences: how many days they played, a specific highlight (name an exercise or song), and an overall warm impression of the week.",
  "strengths": "2-3 sentences celebrating what went well — name specific exercises. Focus on what made this week enjoyable or meaningful.",
  "areasToImprove": "2-3 sentences framed positively — what might make next week even more fun or rewarding. No criticism, no 'you failed at X'.",
  "nextWeekPlan": "1-2 friendly suggestions using 'you could' or 'might be fun'. No schedules, no minimums, no demands.",
  "highlight": "One warm, encouraging sentence — a personal takeaway or something to look forward to. Max 20 words.",
  "weekScore": "excellent|strong|good|inconsistent|minimal",
  "bestDay": "The day name with the most practice minutes, or null if no practice this week"
}

weekScore rules for hobby players:
- "excellent": 4-7 active days OR 2+ hours total — they really showed up this week
- "strong": 3 active days OR 60-120 min total — solid, consistent week
- "good": 2 active days OR 30-59 min total — they made time for guitar
- "inconsistent": 1 active day or a week with big gaps — still better than nothing
- "minimal": no practice at all

Language: English only. Do NOT invent specific BPM numbers or fret positions. Keep each field as a single flowing paragraph — no bullet points inside the fields.`;
  }

  return `You are an experienced guitar coach writing a detailed, personal weekly review for your student. You have access to their full week of practice logs. Write like a real coach who knows the student — be direct, specific, encouraging but honest.

This student is a serious, dedicated musician aiming for the highest level. Be direct, technically precise, and hold them to a high standard. Push them when needed.
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
    userMessage = `The user did not practice at all this week. Current streak: ${streakContext(streak)}. Level: ${userLevel}.`;
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

Totals: ${totalHours}h, ${weekTotalPoints}pts, ${activeDays.length}/7 days active. Streak: ${streakContext(streak)}. Level: ${userLevel}.`;
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
    const parsed = JSON.parse(content) as WeeklySummaryResponse;

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("generate-weekly-summary error:", err);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
