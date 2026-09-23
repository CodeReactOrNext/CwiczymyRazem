/**
 * What goes into the lesson index for one video — kept apart from the routes
 * so the admin scraper and the live search in the roadmap pipeline index a
 * video the same way.
 *
 * The old index text was the title plus the first 200 characters of the
 * YouTube description, which is usually links and a sponsor read. What a
 * video teaches is in its chapters and in what a model can say about it, so
 * that is what gets embedded now: the title, one or two sentences on what the
 * viewer learns, the chapter titles, the topics. Videos indexed before this
 * keep their old vectors until they are processed again.
 */

type GuitarLevel = "beginner" | "intermediate" | "advanced" | "all";

export interface LessonAnalysis {
  level: GuitarLevel;
  topics: string[];
  guitarStyle: string[];
  qualityScore: number;
  qualityReason: string;
  /** One or two sentences: the skills, songs or artists the viewer learns. */
  teaches: string;
}

export const ANALYZE_LESSON_PROMPT = `You are a guitar lesson analyzer. Given a YouTube lesson's title, channel, chapters and description, return ONLY valid JSON with no markdown:
{
  "level": "beginner" | "intermediate" | "advanced" | "all",
  "topics": ["topic1", "topic2"],
  "guitarStyle": ["acoustic" | "electric" | "fingerpicking" | "strumming" | "lead" | "classical" | "blues" | "jazz" | "rock"],
  "qualityScore": <number 1-10>,
  "qualityReason": "<brief reason>",
  "teaches": "<one or two plain sentences: the concrete skills, techniques, songs or artists a viewer learns from this video. No hype, no channel promotion.>"
}

Scoring guide:
- 8-10: Clear structure, specific topic, professional channel, good description
- 6-7: Decent content, somewhat specific
- 4-5: Vague title, poor description, or low-effort content
- 1-3: Spam, clickbait, or unrelated to guitar learning`;

const LEVELS: GuitarLevel[] = ["beginner", "intermediate", "advanced", "all"];

const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

/** The model's JSON, read defensively — a bad field falls back rather than failing the video. */
export const parseLessonAnalysis = (raw: string): LessonAnalysis => {
  let parsed: Record<string, unknown> = {};
  try {
    const value = JSON.parse(raw);
    if (value && typeof value === "object") parsed = value;
  } catch {
    parsed = {};
  }
  const score = Number(parsed.qualityScore);
  return {
    level: LEVELS.includes(parsed.level as GuitarLevel)
      ? (parsed.level as GuitarLevel)
      : "all",
    topics: strings(parsed.topics),
    guitarStyle: strings(parsed.guitarStyle),
    qualityScore: Number.isFinite(score) ? score : 5,
    qualityReason:
      typeof parsed.qualityReason === "string" ? parsed.qualityReason : "",
    teaches: typeof parsed.teaches === "string" ? parsed.teaches.trim() : "",
  };
};

const TIMESTAMP_LINE =
  /^\s*\(?(\d{1,2}:)?\d{1,2}:\d{2}\)?\s*[-–—:|.)]*\s*(.+)$/;

/**
 * Chapter titles from a YouTube description — the "0:00 Intro / 2:15 The
 * right-hand pattern" lines creators use for chapters. Intros, outros and
 * sponsor slots say nothing about the lesson and are dropped.
 */
export const parseChapters = (description: string, max = 12): string[] =>
  description
    .split(/\r?\n/)
    .map((line) => line.match(TIMESTAMP_LINE)?.[2]?.trim() ?? "")
    .filter(
      (title) =>
        title.length > 1 &&
        !/^(intro|introduction|outro|end|ending|sponsor|subscribe)\b/i.test(
          title,
        ),
    )
    .slice(0, max);

/** The text a lesson is embedded as. */
export const lessonEmbeddingText = (
  lesson: { title: string; description: string },
  analysis: LessonAnalysis,
): string => {
  const chapters = parseChapters(lesson.description);
  return [
    lesson.title,
    analysis.teaches ? `Teaches: ${analysis.teaches.replace(/\.+$/, "")}` : "",
    chapters.length ? `Chapters: ${chapters.join("; ")}` : "",
    analysis.topics.length ? `Topics: ${analysis.topics.join(", ")}` : "",
    analysis.guitarStyle.length
      ? `Style: ${analysis.guitarStyle.join(", ")}`
      : "",
    `Level: ${analysis.level}`,
  ]
    .filter(Boolean)
    .join(". ");
};

/** The analyzer's user message: chapters first, since they say the most. */
export const analyzeLessonInput = (lesson: {
  title: string;
  channelName: string;
  description: string;
}): string => {
  const chapters = parseChapters(lesson.description);
  return [
    `Title: ${lesson.title}`,
    `Channel: ${lesson.channelName}`,
    chapters.length ? `Chapters: ${chapters.join("; ")}` : "",
    `Description: ${lesson.description.slice(0, 1500)}`,
  ]
    .filter(Boolean)
    .join("\n");
};
