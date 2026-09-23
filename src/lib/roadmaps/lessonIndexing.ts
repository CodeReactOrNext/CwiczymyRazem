import { Index } from "@upstash/vector";
import OpenAI from "openai";

import { completeJson, GenerationError } from "./generation/openaiJson";
import type { UsageLedger } from "./generation/usage";
import {
  ANALYZE_LESSON_PROMPT,
  analyzeLessonInput,
  type LessonAnalysis,
  lessonEmbeddingText,
  parseLessonAnalysis,
} from "./lessonText";

/** Cheap and good enough to say what a video teaches from its title and chapters. */
export const LESSON_ANALYSIS_MODEL = "gpt-5-nano";

const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "level",
    "topics",
    "guitarStyle",
    "qualityScore",
    "qualityReason",
    "teaches",
  ],
  properties: {
    level: {
      type: "string",
      enum: ["beginner", "intermediate", "advanced", "all"],
    },
    topics: { type: "array", items: { type: "string" } },
    guitarStyle: { type: "array", items: { type: "string" } },
    qualityScore: { type: "number" },
    qualityReason: { type: "string" },
    teaches: { type: "string" },
  },
};

export interface IndexableLesson {
  videoId: string;
  title: string;
  channelName: string;
  description: string;
}

/** Level, topics, quality and what the video teaches, from its title, chapters and description. */
export async function analyzeLesson(
  lesson: IndexableLesson,
  ledger?: UsageLedger,
): Promise<LessonAnalysis> {
  const output = await completeJson<LessonAnalysis>({
    system: ANALYZE_LESSON_PROMPT,
    user: analyzeLessonInput(lesson),
    schemaName: "lesson_analysis",
    schema: ANALYSIS_SCHEMA,
    maxTokens: 2000,
    reasoningEffort: "minimal",
    ledger,
    model: LESSON_ANALYSIS_MODEL,
  });
  // Through the same reader as any stored answer, so a stray field is normalised.
  return parseLessonAnalysis(JSON.stringify(output));
}

const clients = () => {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const url = process.env.UPSTASH_VECTOR_REST_URL;
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN;
  if (!openaiApiKey || !url || !token) {
    throw new GenerationError("Server configuration missing", 500);
  }
  return {
    openai: new OpenAI({ apiKey: openaiApiKey }),
    vectorIndex: new Index({ url, token }),
  };
};

/**
 * Embeds a lesson as what it teaches and puts it in the vector index — the
 * same shape for the admin scraper and for a video found live for a step.
 */
export async function upsertLessonVector(
  lesson: IndexableLesson,
  analysis: LessonAnalysis,
  ledger?: UsageLedger,
): Promise<void> {
  const { openai, vectorIndex } = clients();
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: lessonEmbeddingText(lesson, analysis),
  });
  ledger?.add({
    embeddingTokens: embedding.usage?.total_tokens ?? 0,
    calls: 1,
  });
  await vectorIndex.upsert({
    id: lesson.videoId,
    vector: embedding.data[0].embedding,
    metadata: {
      level: analysis.level,
      topics: analysis.topics.join(","),
      guitarStyle: analysis.guitarStyle.join(","),
      qualityScore: analysis.qualityScore,
    },
  });
}
