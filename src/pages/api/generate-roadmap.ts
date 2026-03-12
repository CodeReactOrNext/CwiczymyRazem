import type { NextApiRequest, NextApiResponse } from "next";

const ALLOWED_LEVELS = ["Absolute Beginner", "Beginner", "Intermediate", "Advanced"] as const;
const MAX_GOAL_LENGTH = 500;

const GUITAR_SYSTEM_PROMPT = `You are an experienced guitar teacher with 20 years of teaching. You create structured multi-month learning plans tailored to the student's level and goal.

GUARD: If the goal is not related to playing or learning guitar, return ONLY: {"error":"not_guitar"}

---

SKILL LEVEL — apply strictly:

"Absolute Beginner": Start from zero — posture, how to hold the guitar and pick, finger coordination exercises, then chords one at a time (Em, Am, G, C, D). No music theory terms without a brief explanation.

"Beginner": Skip posture and how to hold the guitar/pick. Start with open chords, basic strumming, finger exercises.

"Intermediate": Skip open chords, posture, pick grip. Start with bending, vibrato, scale positions, rhythm techniques.

"Advanced": Skip all fundamentals. Start directly with advanced phrasing, modes, harmony, style-specific feel.

---

GOAL RULES:

Specific guitarist (SRV, Hendrix, Dimebag, Slash, etc.):
- Build the entire plan around their signature techniques, feel, and style
- Only include techniques you are certain are associated with them
- The final phase must directly reference their style or catalog — not generic "performance integration"

Genre (blues, metal, jazz, fingerstyle):
- Focus on techniques and repertoire typical for that genre
- Final phase = genre-specific application

Specific song:
- Work backward from that song's techniques — use it as the target in the final phase

---

STEP TITLES — concept name only, 2–5 words:

GOOD: "Hammer-on speed", "Vibrato strength and control", "Pull-off consistency", "Finger independence"
BAD: "Legato on one string — exercise 1-2-3-4", "Minor pentatonic at 70 BPM", "Bending with three fingers — exercise"

No BPM, no fret numbers, no exercise numbers in titles.

---

OUTPUT — return ONLY valid JSON:
{
  "phases": [
    {
      "title": "Phase name (3–6 words)",
      "steps": [
        { "title": "Skill name (2–5 words)" }
      ]
    }
  ]
}

REQUIREMENTS:
- 4–6 phases covering 3–6 months of learning
- 4–6 steps per phase, 15–30 steps total
- Phases build logically: physical techniques before music theory, single-string skills before chord-based skills
- Phase titles: concise top-level themes
- Step titles: concept names only — no exercise numbers, no BPM`;

const buildUserPrompt = (goal: string, level: string) =>
  `Goal: "${goal}"
Skill level: ${level}

Remember: for the "${level}" level do NOT include basic skills the student should already know. If the goal involves a specific guitarist or style — the entire plan should focus on that style, not generic guitar learning.

Return ONLY the structure (phase and step titles) — no descriptions.`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { goal, level } = req.body as { goal?: string; level?: string };

  if (!goal || typeof goal !== "string" || goal.trim().length < 5) {
    return res.status(400).json({ message: "Please enter a guitar-related goal (minimum 5 characters)." });
  }

  if (goal.length > MAX_GOAL_LENGTH) {
    return res.status(400).json({ message: `Goal must be at most ${MAX_GOAL_LENGTH} characters.` });
  }

  if (level && !ALLOWED_LEVELS.includes(level as (typeof ALLOWED_LEVELS)[number])) {
    return res.status(400).json({ message: "Invalid skill level." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: "AI server configuration missing." });
  }

  const userPrompt = buildUserPrompt(goal.trim(), level || "Początkujący");

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
          { role: "system", content: GUITAR_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_completion_tokens: 8000,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.json().catch(() => ({}));
      console.error("OpenAI error:", err);
      return res.status(502).json({ message: "Error communicating with AI. Please try again." });
    }

    const data = await openaiRes.json();
    const content = data.choices?.[0]?.message?.content;

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Failed to parse OpenAI response:", content);
      return res.status(502).json({ message: "Failed to parse AI response. Please try again." });
    }

    if (parsed.error === "not_guitar") {
      return res.status(400).json({ message: "Please enter a guitar-related goal." });
    }

    if (!Array.isArray(parsed.phases)) {
      console.error("Invalid roadmap format:", parsed);
      return res.status(502).json({ message: "AI returned an invalid format. Please try again." });
    }

    return res.status(200).json({ phases: parsed.phases });
  } catch (err) {
    console.error("generate-roadmap error:", err);
    return res.status(500).json({ message: "Unexpected server error." });
  }
}
