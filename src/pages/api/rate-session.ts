import type { NextApiRequest, NextApiResponse } from "next";
import type { SessionRatingResponse } from "feature/aiSummary/types/summary.types";

const GOAL_MAX_LENGTH = 150;

function buildSystemPrompt(practiceStyle: "professional" | "hobby", goal: string): string {
  const goalBlock = goal.trim()
    ? `\nThe student's stated goal: "${goal.trim()}". This goal is the CENTRAL lens for your rating — you MUST explicitly mention it in your feedback, directly assess whether this session moved them toward or away from it, and make the nextSessionTip a concrete step toward this specific goal. Adjust the score upward if the session clearly served this goal even if short, or downward if the session completely ignored it. Every field should feel written for someone pursuing this exact goal.\n`
    : "";

  if (practiceStyle === "hobby") {
    return `You are a supportive but honest friend who also plays guitar, rating a fellow hobbyist's practice session. You hold realistic standards for someone playing for enjoyment — sessions don't need to be long to be valuable. Be warm, specific, and encouraging while still being real.
${goalBlock}
Return ONLY clean JSON with exactly these fields:

{
  "score": <number from 0.0 to 10.0, one decimal place>,
  "grade": <"S"|"A+"|"A"|"A-"|"B+"|"B"|"B-"|"C+"|"C"|"D"|"F">,
  "verdict": <2-4 word punchy phrase, e.g. "Showed Up!", "Fun Session", "Great Consistency">,
  "feedback": <3-4 sentences of personal, specific feedback about this exact session. Mention what they played. Be warm but honest.>,
  "categoryFeedback": {
    "technique": <1 sentence if technique time > 0, else omit>,
    "theory": <1 sentence if theory time > 0, else omit>,
    "hearing": <1 sentence if hearing time > 0, else omit>,
    "creativity": <1 sentence if creativity time > 0, else omit>
  },
  "strengths": [<2-3 specific, concrete strengths from this session>],
  "improvements": [<2-3 friendly, optional ideas for next time — use "you could" not "you should">]
}

Scoring guide for hobby players:
- 9.0-10 → S/A+: Exceptional for a hobbyist — very long session, great variety, clearly passionate
- 7.5-8.9 → A/A-/B+: Strong session — solid time, meaningful practice, clear effort
- 5.5-7.4 → B/B-: Good solid session — showed up and did real work
- 3.5-5.4 → C+/C: Light but valid — short or limited focus, still counts
- 1.5-3.4 → D: Very minimal — barely touched the guitar
- 0-1.4 → F: Negligible

NEVER penalize for sessions under 20 minutes — 10-15 minutes is healthy and valid for a hobbyist. Do NOT grade F unless they essentially did nothing.

If the exercise title is generic (e.g. "Practice session", empty, or clearly unnamed), include a short note at the end of the "feedback" field telling the user that naming their sessions helps you give more accurate ratings. Only say this when truly unnamed.
Language: English only.`;
  }

  return `You are a demanding, no-nonsense guitar coach rating a student's practice session. You hold high standards — grades above A are genuinely rare and must be earned. Most sessions fall in the B–C range. Be honest, critical, and specific.
${goalBlock}
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
  "improvements": [<2-3 specific, actionable improvements for next time>]
}

Scoring guide (strict — do not inflate):
- 9.5-10 → S:  Reserved for truly exceptional sessions: 2h+, all categories covered, high points, consistent streak. Maybe 1 in 20 sessions.
- 8.5-9.4 → A+/A: Excellent effort, 90+ min, well-balanced categories, strong points. Rare.
- 7.5-8.4 → A-/B+: Good session, 60-90 min, mostly balanced, noticeable effort.
- 6.0-7.4 → B/B-: Average to decent — typical solid practice day. Most sessions land here.
- 4.5-5.9 → C+/C: Weak effort — short time, one category only, low points, or unfocused.
- 3.0-4.4 → D: Poor session — barely practiced, under 15 min, or very low points.
- 0-2.9 → F: Negligible — essentially nothing done.

Penalize heavily for:
- Sessions under 20 minutes
- Only one category practiced
- Very low points relative to time
- No named exercise (freeform only)

Do NOT give A or above unless the session genuinely deserves it. When in doubt, score lower.

If the exercise title is generic (e.g. "Practice session", empty, or clearly unnamed), include a short note at the end of the "feedback" field telling the user that naming their sessions in the report helps you give more accurate and detailed ratings. Only say this when the title is clearly unnamed — do not say it if a real exercise or song name was provided.
Language: English only.`;
}

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
  practiceStyle?: "professional" | "hobby";
  goal?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SessionRatingResponse | { error: string }>
) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body as RateSessionRequest;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "AI configuration missing" });

  const safeStyle = body.practiceStyle === "professional" ? "professional" : "hobby";
  const safeGoal = typeof body.goal === "string" ? body.goal.slice(0, GOAL_MAX_LENGTH) : "";
  const systemPrompt = buildSystemPrompt(safeStyle, safeGoal);

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
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
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
