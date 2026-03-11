import type { NextApiRequest, NextApiResponse } from "next";

const SYSTEM_PROMPT = `You are an enthusiastic, sharp guitar coach. The user gives you their practice data for today. Write a short, personal, motivating summary (2-3 sentences). Be specific: mention what they actually practiced. Be real — if they practiced little, acknowledge it warmly. No generic "Great job!" openings.

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

  const { exercises, totalPoints, streak, userLevel } =
    req.body as DailySummaryRequest;

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
    const exerciseLines = exercises
      .map((e) => {
        const parts = [`"${e.title}"`];
        if (e.totalTime > 0)
          parts.push(`${Math.round(e.totalTime / 60000)} min`);
        if (e.techniqueTime > 0)
          parts.push(`technique: ${Math.round(e.techniqueTime / 60000)}min`);
        if (e.theoryTime > 0)
          parts.push(`theory: ${Math.round(e.theoryTime / 60000)}min`);
        if (e.hearingTime > 0)
          parts.push(`hearing: ${Math.round(e.hearingTime / 60000)}min`);
        if (e.creativityTime > 0)
          parts.push(`creativity: ${Math.round(e.creativityTime / 60000)}min`);
        if (e.songTitle) parts.push(`song: "${e.songTitle}"`);
        return parts.join(", ");
      })
      .join("\n");

    userMessage = `Today's practice:
${exerciseLines}

Total: ${totalMinutes} minutes, ${totalPoints} points earned.
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
        max_completion_tokens: 1000,
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
