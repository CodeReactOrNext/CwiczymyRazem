import type { SkillType } from "./structure";

/**
 * Word-count targets per skill type, shared by the description prompt (as the
 * instruction) and the quality gate (as the check). A physical step averaged
 * 201 words against a 90–160 target before this was tightened — LLMs miss a
 * stated word count more often than a stated sentence budget, so the prompt
 * also caps sentences per section; this range is the backstop that catches it
 * when it still runs long.
 */
export const DESCRIPTION_LENGTH: Record<
  SkillType,
  { min: number; max: number }
> = {
  physical: { min: 70, max: 130 },
  conceptual: { min: 120, max: 190 },
  musical: { min: 120, max: 190 },
};

export const wordCount = (text: string): number =>
  text.split(/\s+/).filter(Boolean).length;
