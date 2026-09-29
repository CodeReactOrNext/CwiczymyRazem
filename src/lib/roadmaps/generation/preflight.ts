import type { RoadmapSongRef } from "feature/aiCoach/types/roadmap.types";
import type { RoadmapGoalContext } from "feature/supporterPanel/types/roadmapJob.types";

import { findLibrarySong, type SongRequest } from "../songLookup";
import { goalForModel } from "./goalContext";
import type { RoadmapLevel } from "./levels";
import { completeJson, GENERATION_MODEL } from "./openaiJson";
import {
  BANK_QUESTION_IDS,
  enforcePickRules,
  MAX_CUSTOM_QUESTIONS,
  MAX_QUESTIONS,
  type QuestionSet,
  renderQuestionBank,
} from "./questionBank";
import type { TokenUsage } from "./usage";
import { UsageLedger } from "./usage";

// ⚠️ Server-only: the song lookup reads Firestore with the Admin SDK.

/**
 * The look at the goal before anybody pays: is it about guitar at all, does
 * the model know enough about it to write a real plan, and which questions
 * from the bank would change the plan's shape. One call on the workhorse
 * model at low reasoning — a few tenths of a cent — and no tokens charged.
 */
export const PREFLIGHT_MODEL = GENERATION_MODEL;
const PREFLIGHT_TOKENS = 4000;
/** Songs a goal may name that get looked up in the library. */
const MAX_NAMED_SONGS = 8;

export type PreflightVerdict =
  | "ok"
  | "not_guitar"
  | "too_obscure"
  | "too_vague";

interface PreflightOutput {
  verdict: PreflightVerdict;
  reason: string;
  understood: string;
  songsNamed: SongRequest[];
  ask: { id: string; options: { value: string; label: string }[] }[];
  custom: {
    question: string;
    options: { value: string; label: string }[];
    multi: boolean;
  }[];
}

export interface PreflightResult {
  verdict: PreflightVerdict;
  /** Why, for a verdict other than ok — shown to the player. */
  reason: string;
  /** "This is how the coach read your goal" — one or two sentences. */
  understood: string;
  questions: QuestionSet;
  /** Songs the goal named that the library has, ready to pre-select. */
  songsFound: RoadmapSongRef[];
  /** Songs the goal named that the library lacks. */
  songsMissing: SongRequest[];
  /** What the check cost; absent when the browser had to do without one. */
  usage?: Partial<TokenUsage>;
}

const OPTION_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      value: {
        type: "string",
        description: "Short stable key, a–z and dashes",
      },
      label: {
        type: "string",
        description: "What the player reads, ≤ 60 chars",
      },
    },
    required: ["value", "label"],
    additionalProperties: false,
  },
};

const PREFLIGHT_SCHEMA = {
  type: "object",
  properties: {
    verdict: {
      type: "string",
      enum: ["ok", "not_guitar", "too_obscure", "too_vague"],
    },
    reason: {
      type: "string",
      description:
        "For any verdict but ok: one plain sentence to the player. Empty for ok",
    },
    understood: {
      type: "string",
      description:
        "One or two sentences: how you read the goal, in the second person",
    },
    songsNamed: {
      type: "array",
      description:
        "Every real song the goal names, exact original title and artist. Empty when none",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          artist: { type: "string" },
        },
        required: ["title", "artist"],
        additionalProperties: false,
      },
    },
    ask: {
      type: "array",
      description:
        "Bank questions to ask, in any order; empty when none applies",
      items: {
        type: "object",
        properties: {
          id: { type: "string", enum: [...BANK_QUESTION_IDS] },
          options: {
            ...OPTION_SCHEMA,
            description:
              "Only for questions whose options you write; empty otherwise",
          },
        },
        required: ["id", "options"],
        additionalProperties: false,
      },
    },
    custom: {
      type: "array",
      description: `Up to ${MAX_CUSTOM_QUESTIONS} questions of your own; empty when the bank covers it`,
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: OPTION_SCHEMA,
          multi: {
            type: "boolean",
            description: "true when several answers may be picked",
          },
        },
        required: ["question", "options", "multi"],
        additionalProperties: false,
      },
    },
  },
  required: ["verdict", "reason", "understood", "songsNamed", "ask", "custom"],
  additionalProperties: false,
};

const PREFLIGHT_SYSTEM = `You are the intake coach for riff.quest, a guitar practice app. A player has typed a goal for an AI-written practice roadmap. Before they pay, you do three things: judge the goal, say how you read it, and pick the questions worth asking.

VERDICT:
- "not_guitar": the goal is not about playing or learning guitar (or bass). A joke, a different instrument, a non-music task.
- "too_vague": the goal could be read several different ways ("get better", "fundamentals", "play faster", a single word). Still ask questions — "focus" first.
- "too_obscure": the goal is about an artist, band or piece you cannot name at least three specific things about (real songs, signature techniques, tunings, the gear). Say so in "reason" — the app then asks the player for those facts itself, so do NOT write a custom question for it. Do not bluff — a plan built on invented facts is worse than none.
- "ok": everything else.

UNDERSTOOD: one or two sentences, second person, concrete: "You want to play Knopfler's fingerstyle — thumb and two fingers, no pick — and get to Sultans of Swing." Never restate the goal word for word.

SONGS NAMED: list every real song the goal names (exact original title, original artist). Not the artist's other songs — only the ones in the text.

QUESTIONS — the bank, with when to ask each:
${renderQuestionBank()}

RULES:
- Ask only what would change the plan's shape. Zero is a correct answer, and the usual one for a small goal. How many a goal deserves: an artist or style with repertoire — up to ${MAX_QUESTIONS}; a technique goal — 2–4; a goal about ONE named song — at most 2 (the song is already known; "entry" or "includes" at most); a first-chord or first-week goal — 0 (nothing to choose yet; no "startingPoint", the start is zero).
- At most ${MAX_QUESTIONS} questions in total, "custom" included. Custom questions: at most ${MAX_CUSTOM_QUESTIONS}, only for something the bank cannot ask that the plan would otherwise guess (how long a break was, what the player used to play, which of an artist's eras). Never "for context".
- "target" only with "startingPoint". "repertoireDepth" only with "songs". "weakSpot" never with "startingPoint". "focus" only for a vague goal. "practiceStyle" only when fewer than five others apply.
- Never "replicateOrCreate" when creating IS the goal: improvising, jamming, soloing over changes, writing, jazz. Never for a rhythm-only or strumming goal either.
- Options you write: concrete, in the player's language, ≤ 60 characters, each a real alternative. No "other" option — the app adds it.
- Respect the skill level: an Advanced player is not asked about basics; an Absolute Beginner is asked nothing about sides, weak spots or starting points.`;

const levelLine = (level: RoadmapLevel) => `Skill level: ${level}`;

/**
 * Runs the intake on a goal. The pick comes back already made to obey the
 * bank's rules, and the songs the goal named already checked against the
 * library, so the screen can pre-select what exists and warn about what does
 * not — the two things the player cannot know before paying.
 */
export async function runPreflight({
  goal,
  title,
  level,
  context,
}: {
  goal: string;
  title: string | null;
  level: RoadmapLevel;
  context: RoadmapGoalContext | null;
}): Promise<PreflightResult> {
  const ledger = new UsageLedger();
  const output = await completeJson<PreflightOutput>({
    system: PREFLIGHT_SYSTEM,
    user: `Goal: "${goalForModel(goal, context, title)}"\n${levelLine(level)}`,
    schemaName: "roadmap_preflight",
    schema: PREFLIGHT_SCHEMA,
    maxTokens: PREFLIGHT_TOKENS,
    model: PREFLIGHT_MODEL,
    reasoningEffort: "low",
    ledger,
  });

  const verdict = output.verdict;
  const questions =
    verdict === "not_guitar"
      ? { asked: [], custom: [] }
      : enforcePickRules(output.ask, output.custom);

  const named = (Array.isArray(output.songsNamed) ? output.songsNamed : [])
    .filter((song) => song?.title?.trim() && song?.artist?.trim())
    .slice(0, MAX_NAMED_SONGS);
  const songsFound: RoadmapSongRef[] = [];
  const songsMissing: SongRequest[] = [];
  if (verdict !== "not_guitar") {
    const seen = new Set<string>();
    await Promise.all(
      named.map(async (request) => {
        const found = await findLibrarySong(request).catch(() => null);
        if (found) {
          if (!seen.has(found.id)) {
            seen.add(found.id);
            songsFound.push(found);
          }
        } else {
          songsMissing.push(request);
        }
      }),
    );
  }

  return {
    verdict,
    reason: output.reason?.trim() ?? "",
    understood: output.understood?.trim() ?? "",
    questions,
    songsFound,
    songsMissing,
    usage: ledger.totals(),
  };
}
