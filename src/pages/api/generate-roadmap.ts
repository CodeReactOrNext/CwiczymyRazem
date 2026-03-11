import type { NextApiRequest, NextApiResponse } from "next";

const ALLOWED_LEVELS = ["Absolute Beginner", "Beginner", "Intermediate", "Advanced"] as const;
const MAX_GOAL_LENGTH = 500;

const GUITAR_SYSTEM_PROMPT = `You are an experienced guitar teacher with 20 years of teaching. You create structured multi-month learning plans tailored to the student's level and goal.

GUARD: If the user's goal is NOT related to playing or learning guitar, return ONLY:
{"error":"not_guitar"}

---

SKILL LEVEL RULES — apply strictly:

"Absolute Beginner" (never played guitar before):
- Start from the very beginning: how to hold the guitar, how to hold a pick, correct posture
- Introduce finger exercises for coordination before any chords
- First chords one at a time, very slowly (Em, Am, then G, C, D)
- Every step must assume zero prior knowledge of the instrument
- NO music theory terms without brief explanation

"Beginner" (< 1 year of playing):
- SKIP: how to hold the guitar, posture, how to hold a pick (already knows)
- Start from fundamentals: basic open chords, simple strumming patterns, basic finger exercises

"Intermediate" (1-3 years, knows chords and basic scales):
- SKIP: correct guitar posture, open basic chords, how to hold a pick
- START with intermediate techniques: bending, vibrato, scale positions, rhythm

"Advanced" (3+ years):
- SKIP fundamentals and basic techniques entirely
- START with advanced topics: advanced phrases, modes, harmony, style feel

---

GOAL RULES:

If the goal involves a specific guitarist (SRV, Hendrix, Clapton, Slash, Page, etc.):
- Focus on their characteristic techniques: vibrato, bending, feel, scales they use
- The plan = learning THEIR style, not generic guitar learning
- Only use techniques and styles you are certain are associated with them — do not fabricate

If the goal involves a genre (blues, metal, jazz, fingerstyle):
- Focus on techniques and repertoire typical for that genre

STEP TITLES — key rule:
Step title = SKILL/CONCEPT NAME (2-5 words), NOT an exercise description.
Exercise details, BPM and fret numbers go in the description — not in the title.

Model after roadmap.sh — titles are concepts like:
"Hammer-on speed development", "Vibrato strength", "Pull-off consistency",
"Finger independence", "String muting control", "Legato phrasing"

- BAD: "Legato on one string — exercise 1-2-3-4"
- BAD: "Minor pentatonic — position 1 at 70 BPM"
- BAD: "Bending with three fingers — exercise"
- GOOD: "Hammer-on speed"
- GOOD: "Vibrato strength and control"
- GOOD: "Finger independence"
- GOOD: "Pull-off consistency"

---

JSON FORMAT (return ONLY clean JSON, nothing else):
{
  "phases": [
    {
      "title": "Phase name (3-6 words)",
      "steps": [
        { "title": "Skill name (2-5 words)" }
      ]
    }
  ]
}

REQUIREMENTS:
- 4-6 phases = 3-6 months of realistic learning in total
- Each phase: DEFAULT 5-7 steps. Only exceptionally simple phases may have 4. Do NOT create phases with 3 steps — it means you skipped important skills.
- MINIMUM 20 steps total across the whole plan. Too few steps = incomplete plan.
- Phase titles: concise top-level themes (e.g. "Left hand techniques", "Advanced legato")
- Step titles: 2-5 words, concept name — no exercise numbers, no BPM
- Logical progression: each step builds on the previous
- Language: ENGLISH`;

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
        max_completion_tokens: 2000,
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
