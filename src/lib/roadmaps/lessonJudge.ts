import { completeJson } from "./generation/openaiJson";
import type { UsageLedger } from "./generation/usage";

/** A video as the judge sees it — enough to tell what it teaches, nothing more. */
export interface JudgeCandidate {
  videoId: string;
  title: string;
  channelName: string;
  level?: string;
  topics?: string[];
  /** What the analyzer said the video teaches, for videos indexed with it. */
  teaches?: string;
  /** Chapter titles, for videos found live. */
  chapters?: string[];
  /** Seconds. */
  duration?: number;
}

export interface JudgeParams {
  stepTitle: string;
  stepDescription?: string;
  roadmapGoal?: string;
  roadmapLevel?: string;
  candidates: JudgeCandidate[];
  /** Most lessons a step keeps. */
  max?: number;
  ledger?: UsageLedger;
}

interface JudgeOutput {
  picks: { videoId: string; why: string }[];
}

export const MAX_LESSONS_PER_STEP = 3;

const JUDGE_SYSTEM = `You choose YouTube guitar lessons for ONE step of a practice roadmap.

A video qualifies only when watching it directly teaches what this step practises — the same technique, concept, song or artist's approach. A lesson on a neighbouring topic does NOT qualify ("memorize the fretboard" is not ear training; "beginner chords" is not "strumming 16th notes"; a generic blues lesson is not "Knopfler's fingerstyle").

Rules:
- Fewer, correct picks beat more, loose ones. An empty list is a good answer when nothing fits.
- Best fit first. Prefer a video at the student's level.
- Judge from the title, chapters, topics and the "teaches" note; ignore view counts and hype words.
- Use only videoIds from the list.`;

const JUDGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["picks"],
  properties: {
    picks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["videoId", "why"],
        properties: {
          videoId: { type: "string" },
          why: { type: "string" },
        },
      },
    },
  },
};

const describeCandidate = (candidate: JudgeCandidate, index: number) =>
  [
    `${index + 1}. videoId=${candidate.videoId}`,
    `   title: ${candidate.title}`,
    `   channel: ${candidate.channelName}`,
    candidate.level ? `   level: ${candidate.level}` : "",
    candidate.duration
      ? `   length: ${Math.round(candidate.duration / 60)} min`
      : "",
    candidate.topics?.length ? `   topics: ${candidate.topics.join(", ")}` : "",
    candidate.teaches ? `   teaches: ${candidate.teaches}` : "",
    candidate.chapters?.length
      ? `   chapters: ${candidate.chapters.slice(0, 8).join("; ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

/**
 * The picks the judge made that are real candidates, once each, best first,
 * capped. Anything it invented or repeated is dropped.
 */
export const acceptedPicks = (
  output: JudgeOutput | null | undefined,
  candidates: JudgeCandidate[],
  max = MAX_LESSONS_PER_STEP,
): string[] => {
  const known = new Set(candidates.map((candidate) => candidate.videoId));
  const picked: string[] = [];
  (output?.picks ?? []).forEach(({ videoId }) => {
    if (known.has(videoId) && !picked.includes(videoId)) picked.push(videoId);
  });
  return picked.slice(0, max);
};

/**
 * Which of the candidates actually teach this step. Vector similarity only
 * says two texts are about guitar in roughly the same way; this is the check
 * that the lesson is about the step. It is allowed to say none.
 */
export async function judgeLessons({
  stepTitle,
  stepDescription,
  roadmapGoal,
  roadmapLevel,
  candidates,
  max = MAX_LESSONS_PER_STEP,
  ledger,
}: JudgeParams): Promise<string[]> {
  if (!candidates.length) return [];

  const output = await completeJson<JudgeOutput>({
    system: JUDGE_SYSTEM,
    user: [
      `Step: ${stepTitle}`,
      stepDescription
        ? `What the step practises: ${stepDescription.slice(0, 600)}`
        : "",
      roadmapGoal ? `Roadmap goal: ${roadmapGoal.slice(0, 200)}` : "",
      roadmapLevel ? `Student level: ${roadmapLevel}` : "",
      `Pick at most ${max}.`,
      "",
      "Candidates:",
      candidates.map(describeCandidate).join("\n"),
    ]
      .filter((line) => line !== null)
      .join("\n"),
    schemaName: "lesson_picks",
    schema: JUDGE_SCHEMA,
    maxTokens: 3000,
    reasoningEffort: "low",
    ledger,
  });

  return acceptedPicks(output, candidates, max);
}
