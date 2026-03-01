import type { NextApiRequest, NextApiResponse } from "next";
import type { SessionRatingResponse } from "feature/aiSummary/types/summary.types";

const SYSTEM_PROMPT = `You are a sharp, experienced guitar coach rating a student's practice session. Analyze the session data and give a precise, honest, personal rating.

Return ONLY clean JSON with exactly these fields:

{
  "score": <number from 0.0 to 10.0, one decimal place>,
  "grade": <"S"|"A+"|"A"|"A-"|"B+"|"B"|"B-"|"C+"|"C"|"D"|"F">,
  "verdict": <2-4 word punchy phrase, e.g. "Sharp & Focused", "Inconsistent Effort", "Excellent Dedication">,
  "feedback": <3-4 sentences of personal, specific coaching feedback about this exact session. Reference the exercise name and time. Be direct and real.>,
  "categoryFeedback": {
    "technique": <1 sentence if technique time > 0, else omit>,
    "theory": <1 sentence if theory time > 0, else omit>,
    "hearing": <1 sentence if hearing time > 0, else omit>,
    "creativity": <1 sentence if creativity time > 0, else omit>
  },
  "strengths": [<2-3 specific, concrete strengths from this session>],
  "improvements": [<2-3 specific, actionable improvements for next time>],
  "nextSessionTip": <One concrete, specific tip for the very next session. Max 25 words.>
}

Scoring guide:
- 9.5-10 → S: Exceptional, rare, outstanding session
- 8.5-9.4 → A+/A: Excellent, high effort, well-rounded
- 7.5-8.4 → A-/B+: Strong session, minor gaps
- 6.5-7.4 → B/B-: Decent but could be more focused
- 5.5-6.4 → C+/C: Average, significant room to grow
- 4.5-5.4 → D: Below expectations, low effort or too short
- 0-4.4 → F: Negligible — basically nothing done

Consider: total time, category balance, points earned, whether it's a named exercise or freeform, and streak context.
Language: English only.`;

export interface RateSessionRequest {
  exerciseTitle: string;
  techniqueTime: number;
  theoryTime: number;
  hearingTime: number;
  creativityTime: number;
  totalTime: number;
  points: number;
  streak: number;
  userLevel: number;
  songTitle?: string;
  songArtist?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SessionRatingResponse | { error: string }>
) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body as RateSessionRequest;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "AI configuration missing" });

  const totalMin = Math.round(body.totalTime / 60);
  const techMin = Math.round(body.techniqueTime / 60);
  const theoryMin = Math.round(body.theoryTime / 60);
  const hearMin = Math.round(body.hearingTime / 60);
  const creatMin = Math.round(body.creativityTime / 60);

  const catLines = [
    techMin > 0 && `  - Technique: ${techMin} min`,
    theoryMin > 0 && `  - Theory: ${theoryMin} min`,
    hearMin > 0 && `  - Ear training: ${hearMin} min`,
    creatMin > 0 && `  - Creativity: ${creatMin} min`,
  ].filter(Boolean).join("\n");

  const userMessage = `Session to rate:
Exercise: "${body.exerciseTitle}"${body.songTitle ? `\nSong: "${body.songTitle}"${body.songArtist ? ` by ${body.songArtist}` : ""}` : ""}
Total time: ${totalMin} minutes
${catLines}
Points earned: ${body.points}
Current streak: ${body.streak} days
Player level: ${body.userLevel}`;

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.6,
        max_tokens: 700,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiRes.ok) return res.status(502).json({ error: "AI service error" });

    const data = await openaiRes.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content) as SessionRatingResponse;
    return res.status(200).json(parsed);
  } catch (err) {
    console.error("rate-session error:", err);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
