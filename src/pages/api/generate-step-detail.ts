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

const SYSTEM_PROMPT = `You are an experienced guitar teacher. Describe the guitar SKILL named in the step title.

SKILL TYPE — adjust length accordingly:
- Physical skill (technique, movement, coordination): 2–4 sentences total. Words can't fully replace practice; keep it brief and point the student toward the motion.
- Conceptual/musical skill (theory, harmony, ear training, structure): 2–3 sections with [square bracket titles], 2–4 sentences each.
SECTION TITLES (conceptual only):
Choose 2–3 titles that fit the specific skill, e.g. [Why it matters], [How to practice], [Common trap]. One title per line in square brackets.
AVOID — never include:
- Specific BPM or tempo numbers → use "start slow, increase gradually"
- Specific fret or string numbers → use "any comfortable position on the neck"
- Specific song titles → use "songs by this artist" or "a simple 12-bar blues"
  Exception: if the student's goal is to learn a specific song, artist, or band's style, real song titles by that artist are allowed
- Specific note names tied to positions → "minor pentatonic scale" is OK; "A minor pentatonic at fret 5" is NOT

SKILL LEVEL:
- "Absolute Beginner": plain language, no jargon
- Other levels: skip basics from prior steps; assume they are mastered
- successCriteria: what mastery feels/sounds like — no BPM or fret numbers
- sessionsRequired: a single integer between 6 and 12

Return ONLY valid JSON:
{
  "description": "...",
  "successCriteria": "...",
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
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],

        max_completion_tokens: 9000,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.json().catch(() => ({}));
      console.warn("OpenAI step-detail error:", err);
      return res.status(200).json({ description: "", successCriteria: "", sessionsRequired: 8 });
    }

    const data = await openaiRes.json();
    const choice = data.choices?.[0];
    const content = choice?.message?.content;
    const finishReason = choice?.finish_reason;

    if (finishReason === "length") {
      console.warn("step-detail truncated (finish_reason=length), content:", content);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.warn("Failed to parse step-detail response (finish_reason:", finishReason, "):", content);
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
