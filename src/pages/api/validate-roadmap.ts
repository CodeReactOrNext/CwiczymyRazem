import type { NextApiRequest, NextApiResponse } from "next";

interface ValidateRequest {
  goal: string;
  level: string;
  phases: { title: string; steps: { title: string }[] }[];
}

interface ValidateResponse {
  issues: string[];
  suggestions: string[];
  isValid: boolean;
}

const SYSTEM_PROMPT = `You are a senior guitar curriculum designer reviewing a student's learning roadmap.

Evaluate the roadmap for:
1. Phase order — does each phase logically build on the previous? (physical techniques before theory, basic before advanced, single-string before chord-based)
2. Level fit — are the phases and steps appropriate for the stated skill level? Too easy? Too hard too fast?
3. Goal alignment — does the roadmap actually lead to the student's stated goal?
4. Gaps — are there important skills missing that are clearly required to reach the goal?
5. Misplacements — any steps that obviously belong in a different phase?

Return ONLY valid JSON:
{
  "issues": ["..."],
  "suggestions": ["..."],
  "isValid": true
}

Rules:
- "issues" = critical problems that would make the roadmap ineffective (max 3, empty array if none)
- "suggestions" = non-critical improvements worth considering (max 3, empty array if none)
- "isValid" = true if the roadmap is usable as-is (minor issues are OK), false only if there's a fundamental structural problem
- Each item must be one concise sentence
- Be direct and specific — reference actual phase/step names from the input`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "AI configuration missing." });

  const { goal, level, phases } = req.body as ValidateRequest;
  if (!goal || !level || !Array.isArray(phases)) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const roadmapText = phases
    .map(
      (p, i) =>
        `Phase ${i + 1}: ${p.title}\n${p.steps.map((s, si) => `  ${si + 1}. ${s.title}`).join("\n")}`
    )
    .join("\n\n");

  const userPrompt = `Goal: "${goal}"
Skill level: ${level}

Roadmap to review:
${roadmapText}

Is this a well-structured roadmap for this student?`;

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_completion_tokens: 1000,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiRes.ok) {
      return res.status(200).json({ issues: [], suggestions: [], isValid: true });
    }

    const data = await openaiRes.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");

    return res.status(200).json({
      issues: Array.isArray(parsed.issues) ? parsed.issues.slice(0, 3) : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [],
      isValid: parsed.isValid !== false,
    } satisfies ValidateResponse);
  } catch {
    return res.status(200).json({ issues: [], suggestions: [], isValid: true });
  }
}
