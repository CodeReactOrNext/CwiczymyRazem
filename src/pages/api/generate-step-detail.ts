import type { NextApiRequest, NextApiResponse } from "next";

const ALLOWED_LEVELS = ["Absolute Beginner", "Beginner", "Intermediate", "Advanced"] as const;
const MAX_GOAL_LENGTH = 500;
const MAX_TITLE_LENGTH = 100;

interface StepDetailRequest {
  goal: string;
  level: string;
  phaseIndex: number;
  phaseName: string;
  totalPhases: number;
  stepTitle: string;
  prevSteps: string[];
  nextSteps: string[];
  allPhases: { title: string; steps: string[] }[];
}

const SYSTEM_PROMPT = `You are an experienced guitar teacher with 20 years of teaching. You describe a guitar CONCEPT/SKILL — the step title is the name of that skill (e.g. "Vibrato strength", "Hammer-on speed development").

DESCRIPTION STYLE — this is the most important rule:
Write a LONG, CONCEPTUAL description (5-7 sentences). Explain:
1. What this skill/concept is and why it matters at this stage
2. What kind of practice develops it — described in general terms (e.g. "slow repetition", "isolating the movement", "practicing over a backing track")
3. What the student should pay attention to while practicing (e.g. tension, tone, timing, feel)
4. The most common mistake and how to avoid it
5. How to know when they are improving

DO NOT include:
- Specific BPM numbers (no "60 BPM", "120 BPM", or any tempo values)
- Specific fret numbers or string numbers
- Specific note names or scales positions
- Specific song titles (unless you are 100% certain they exist and match the artist)

USE INSTEAD:
- "start slow and gradually increase speed" instead of BPM
- "practice on any comfortable position on the neck" instead of fret numbers
- "use a minor pentatonic scale" is OK; "play A minor pentatonic at fret 5" is NOT
- "songs by this artist" or "a simple 12-bar blues" instead of fabricated titles

SKILL LEVEL NOTE:
- "Absolute Beginner": assume zero prior knowledge. Explain in plain language, avoid jargon.
- Other levels: skip basics already covered in previous steps.

OTHER RULES:
- Do NOT repeat previous steps — assume they are mastered
- Prepare the ground for upcoming steps
- successCriteria: describe what mastery looks and feels like — no specific BPM or fret numbers
- sessionsRequired: 6-12 (each session is 30-45 min)
- Language: ENGLISH

JSON FORMAT (return ONLY clean JSON):
{
  "description": "Conceptual explanation of the skill, what kind of practice to do, what to focus on, common mistakes...",
  "successCriteria": "Description of what mastery feels/sounds like, e.g. 'the movement feels natural and the tone stays consistent even at higher speeds'",
  "sessionsRequired": 8
}`;

const buildUserPrompt = (req: StepDetailRequest): string => {
  const { goal, level, phaseIndex, phaseName, totalPhases, stepTitle, prevSteps, nextSteps, allPhases } = req;

  const prevPhasesText = allPhases
    .slice(0, phaseIndex)
    .map((p, i) => `Phase ${i + 1}: ${p.title}\n  Steps: ${p.steps.join(", ")}`)
    .join("\n");

  const nextPhasesText = allPhases
    .slice(phaseIndex + 1)
    .map((p, i) => `Phase ${phaseIndex + 2 + i}: ${p.title}`)
    .join("\n");

  const currentPhaseContext = [
    prevSteps.length > 0 ? `Previous steps in this phase (already mastered): ${prevSteps.join(", ")}` : null,
    `>>> STEP BEING DESCRIBED: ${stepTitle} <<<`,
    nextSteps.length > 0 ? `Upcoming steps in this phase: ${nextSteps.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `Student's goal: "${goal}"
Skill level: ${level}

${prevPhasesText ? `PREVIOUS PHASES (completed):\n${prevPhasesText}\n\n` : ""}CURRENT PHASE ${phaseIndex + 1}/${totalPhases}: ${phaseName}
${currentPhaseContext}
${nextPhasesText ? `\nUPCOMING PHASES:\n${nextPhasesText}` : ""}

Write a detailed description for the concept/skill "${stepTitle}".
Remember: the title is a SKILL NAME — explain what it is, why it matters, and how to develop it conceptually. Do NOT include specific BPM, fret numbers, or note names.
Consider the context — what the student already knows (don't repeat it), what they will practice next (prepare the ground).`;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: "AI server configuration missing." });
  }

  const body = req.body as StepDetailRequest;

  if (!body.stepTitle || !body.goal) {
    return res.status(400).json({ message: "Missing required parameters." });
  }

  if (body.goal.length > MAX_GOAL_LENGTH) {
    return res.status(400).json({ message: `Goal must be at most ${MAX_GOAL_LENGTH} characters.` });
  }

  if (body.stepTitle.length > MAX_TITLE_LENGTH || (body.phaseName && body.phaseName.length > MAX_TITLE_LENGTH)) {
    return res.status(400).json({ message: "Step or phase title too long." });
  }

  if (body.level && !ALLOWED_LEVELS.includes(body.level as (typeof ALLOWED_LEVELS)[number])) {
    return res.status(400).json({ message: "Invalid skill level." });
  }

  const userPrompt = buildUserPrompt(body);

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.25,
        max_tokens: 800,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.json().catch(() => ({}));
      console.warn("OpenAI step-detail error:", err);
      return res.status(200).json({ description: "", successCriteria: "", sessionsRequired: 8 });
    }

    const data = await openaiRes.json();
    const content = data.choices?.[0]?.message?.content;

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.warn("Failed to parse step-detail response:", content);
      return res.status(200).json({ description: "", successCriteria: "", sessionsRequired: 8 });
    }

    return res.status(200).json({
      description: parsed.description || "",
      successCriteria: parsed.successCriteria || "",
      sessionsRequired: Number(parsed.sessionsRequired) || 8,
    });
  } catch (err) {
    console.warn("generate-step-detail error:", err);
    return res.status(200).json({ description: "", successCriteria: "", sessionsRequired: 8 });
  }
}
