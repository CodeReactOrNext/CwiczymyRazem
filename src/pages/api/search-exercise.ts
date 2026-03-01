import { Agent, fileSearchTool, Runner, withTrace } from "@openai/agents";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

const VECTOR_STORE_ID = "vs_69a3216531448191af85bd88fbe35695";

const ExerciseSchema = z.object({ exercise_id: z.string() });

const agent = new Agent({
  name: "Exercise search agent",
  instructions:
    "You are a guitar exercise search agent. Search the knowledge base and choose the single best exercise that matches the given roadmap step context. Return ONLY valid JSON: { \"exercise_id\": \"<id>\" }. No explanation. One ID only.",
  model: "gpt-4.1",
  tools: [fileSearchTool([VECTOR_STORE_ID])],
  outputType: ExerciseSchema,
  modelSettings: {
    temperature: 1,
    topP: 1,
    maxTokens: 2048,
    store: true,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "AI server configuration missing." });
  }

  process.env.OPENAI_API_KEY = apiKey;

  const { stepTitle, description, goal, level } = req.body as {
    stepTitle: string;
    description: string;
    goal: string;
    level: string;
  };

  if (!stepTitle) {
    return res.status(400).json({ error: "Missing stepTitle" });
  }

  const query = `Roadmap step: "${stepTitle}". Student goal: "${goal}". Level: ${level}. Description: ${description}. Find the best matching guitar exercise.`;

  try {
    const result = await withTrace("exercise_search", async () => {
      const runner = new Runner();
      const runResult = await runner.run(agent, [
        { role: "user", content: [{ type: "input_text", text: query }] },
      ]);

      if (!runResult.finalOutput) {
        throw new Error("No exercise found");
      }

      return runResult.finalOutput;
    });

    return res.status(200).json({ exercise_id: result.exercise_id });
  } catch (err: any) {
    console.warn("search-exercise error:", err);
    return res.status(200).json({ exercise_id: null });
  }
}
