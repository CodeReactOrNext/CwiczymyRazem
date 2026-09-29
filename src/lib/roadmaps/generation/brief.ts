import type {
  RoadmapPhase,
  RoadmapSongRef,
  RoadmapStep,
} from "feature/aiCoach/types/roadmap.types";
import { v4 as uuidv4 } from "uuid";

import type { CatalogEntry } from "./exerciseCatalog";
import {
  bankQuestion,
  type BankQuestionId,
  INCLUDE_OPTIONS,
  isBankQuestionId,
  MAX_BRIEF_SONGS,
  MAX_CUSTOM_QUESTIONS,
  PRACTICE_STYLE_OPTIONS,
} from "./questionBank";

/**
 * What the player answered before paying: the brief the prompts are held to.
 *
 * Every answer lands somewhere specific — a required song, a phase that is
 * not written, a filter on the exercise library, a line the reviewer checks.
 * `briefForModel` renders the lines; the mechanical effects are the
 * functions next to it. Pure, shared by the browser and the server.
 */
export interface BriefAnswer {
  /** A bank id, or `custom-n` for a question the model wrote. */
  id: string;
  /** The question as it was asked, so a custom answer reads on its own. */
  question: string;
  values: string[];
  labels: string[];
}

export interface RoadmapBrief {
  answers: BriefAnswer[];
  /** Picked from the library — each one is guaranteed a step with a tab. */
  songs: RoadmapSongRef[];
  /** Songs the player named that the library lacks, as they typed them. */
  otherSongs: string;
  /** For a goal the model knows little about: the facts the player supplied. */
  notes: string;
}

const MAX_TEXT = 300;
const MAX_LABEL = 80;
const MAX_VALUES = 6;

const text = (value: unknown, max = MAX_TEXT): string =>
  typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, max)
    : "";

const texts = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((item) => text(item, MAX_LABEL))
        .filter(Boolean)
        .slice(0, MAX_VALUES)
    : [];

const isCustomId = (id: string) =>
  /^custom-\d$/.test(id) && Number(id.slice(7)) <= MAX_CUSTOM_QUESTIONS;

const song = (value: unknown): RoadmapSongRef | null => {
  const raw = value as Record<string, unknown> | null;
  const id = text(raw?.id, 120);
  const title = text(raw?.title, 160);
  const artist = text(raw?.artist, 120);
  if (!id || !title || !artist) return null;
  const coverUrl = text(raw?.coverUrl, 500);
  return { id, title, artist, ...(coverUrl ? { coverUrl } : {}) };
};

/**
 * The brief a request carried, cut to what the ticket may hold. Null when
 * nothing usable is in it, so a ticket without a brief stays a plain ticket.
 */
export const sanitizeBrief = (value: unknown): RoadmapBrief | null => {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;

  const seen = new Set<string>();
  const answers: BriefAnswer[] = [];
  for (const item of Array.isArray(raw.answers) ? raw.answers : []) {
    const entry = item as Record<string, unknown>;
    const id = text(entry?.id, 40);
    if (!(isBankQuestionId(id) || isCustomId(id)) || seen.has(id)) continue;
    const values = texts(entry.values);
    if (!values.length) continue;
    const labels = texts(entry.labels);
    seen.add(id);
    answers.push({
      id,
      question: text(entry.question, 160),
      values,
      labels: labels.length === values.length ? labels : values,
    });
  }

  const songs: RoadmapSongRef[] = [];
  const songIds = new Set<string>();
  for (const item of Array.isArray(raw.songs) ? raw.songs : []) {
    const picked = song(item);
    if (!picked || songIds.has(picked.id)) continue;
    songIds.add(picked.id);
    songs.push(picked);
    if (songs.length >= MAX_BRIEF_SONGS) break;
  }

  const brief: RoadmapBrief = {
    answers,
    songs,
    otherSongs: text(raw.otherSongs),
    notes: text(raw.notes),
  };
  return answers.length || songs.length || brief.otherSongs || brief.notes
    ? brief
    : null;
};

export const briefAnswer = (
  brief: RoadmapBrief | null | undefined,
  id: BankQuestionId,
): BriefAnswer | undefined => brief?.answers.find((answer) => answer.id === id);

const has = (answer: BriefAnswer | undefined, value: string) =>
  Boolean(answer?.values.includes(value));

/**
 * The goal the prompts are written for. A `focus` answer replaces the vague
 * goal with the reading the player chose — otherwise the model would guess.
 */
export const effectiveGoal = (
  goal: string,
  brief: RoadmapBrief | null | undefined,
): string => {
  const focus = briefAnswer(brief, "focus");
  return focus?.labels[0] ? `${goal} — specifically: ${focus.labels[0]}` : goal;
};

const songLine = (ref: RoadmapSongRef) => `"${ref.title}" — ${ref.artist}`;

/**
 * The brief as the draft, the review and the descriptions read it: one
 * constraint per line, each phrased as a rule the reviewer can check. Empty
 * when there is no brief, so the prompts read as they always did.
 */
export const briefForModel = (
  brief: RoadmapBrief | null | undefined,
): string => {
  if (!brief) return "";
  const lines: string[] = [];
  const answer = (id: BankQuestionId) => briefAnswer(brief, id);

  const useFor = answer("useFor");
  if (useFor?.labels[0]) {
    lines.push(
      `The technique is for: ${useFor.labels[0]}. That context is the through-line — the phases, songs and exercises serve it.`,
    );
  }

  const sides = answer("sides");
  if (sides?.labels.length) {
    lines.push(
      `Cover ONLY these sides of the style: ${sides.labels.join("; ")}. Any other side of it gets no phase and no step.`,
    );
  }

  if (brief.songs.length) {
    lines.push(
      `REQUIRED songs, all in the app library — each gets its own repertoire step with songTitle/songArtist copied exactly: ${brief.songs
        .map(songLine)
        .join("; ")}.`,
    );
  }
  if (brief.otherSongs) {
    lines.push(
      `Other songs the student named (NOT in the library, so a step about one gets no tab; use them as steps or references as the plan needs): ${brief.otherSongs}.`,
    );
  }

  const depth = answer("repertoireDepth");
  if (has(depth, "deep")) {
    lines.push(
      "Repertoire depth: 2–3 songs in depth — a song is several steps (sections, reduced tempo, album tempo, a recorded take), not one.",
    );
  } else if (has(depth, "wide")) {
    lines.push(
      "Repertoire depth: more songs, lighter — one step per song, the whole part at a playable tempo.",
    );
  }

  const start = answer("startingPoint");
  if (start?.labels[0]) {
    lines.push(
      `Starting point: "${start.labels[0]}". Phase 1 starts there; nothing below it is taught.`,
    );
  }
  const target = answer("target");
  if (target?.labels[0]) {
    lines.push(
      `Target: "${target.labels[0]}". The last phase's success criteria are written to it, and the phases climb from the starting point to it.`,
    );
  }

  const weak = answer("weakSpot");
  if (weak?.labels[0] && !/^nothing/i.test(weak.labels[0])) {
    lines.push(
      `Weak spot: ${weak.labels[0]}. It gets its own phase, earlier than usual, with more steps and sessions than the rest.`,
    );
  }

  const mode = answer("replicateOrCreate");
  if (has(mode, "replicate")) {
    lines.push(
      "Play it like the record: songs go section by section up to album tempo. No improvising, composing or 'your own fills' steps anywhere.",
    );
  } else if (has(mode, "create")) {
    lines.push(
      "Own playing in this style: every phase has one creative step (improvising, own fills, own parts, call and response); songs are vehicles for it, not targets to reproduce.",
    );
  }

  const entry = answer("entry");
  if (has(entry, "song")) {
    lines.push(
      "Start with the music: phase 1 contains a simplified fragment of a goal song, and technique is built around it.",
    );
  } else if (has(entry, "foundation")) {
    lines.push(
      "Foundation first: the first phases are technique and no song step appears before the plan's midpoint. (This overrides the rule that the goal is tasted in phase 1.)",
    );
  }

  const includes = answer("includes");
  if (includes) {
    if (!has(includes, INCLUDE_OPTIONS.tone)) {
      lines.push(
        "No phase and no step about tone, gear, amps, pedals or the rig.",
      );
    }
    if (!has(includes, INCLUDE_OPTIONS.theory)) {
      lines.push(
        "Theory to the minimum: at most one conceptual step per phase, and only where a physical or musical step needs it.",
      );
    }
    if (!has(includes, INCLUDE_OPTIONS.ear)) {
      lines.push(
        "Ear work to the minimum: no standalone transcription or ear-training steps; learning by ear only inside a song step, if at all.",
      );
    }
  }

  const ending = answer("ending");
  if (has(ending, "none")) {
    lines.push(
      "No final performance, set or recording phase: the roadmap ends with the last song or skill.",
    );
  } else if (has(ending, "set")) {
    lines.push(
      "The last phase is a recorded set: the songs back to back, recorded, like a small gig.",
    );
  }

  const style = answer("practiceStyle");
  if (style && style.values.length < 3) {
    const kinds = style.labels.join(", ").toLowerCase();
    lines.push(
      `Exercise kinds the student practises: ${kinds}. The library below is already cut to them.`,
    );
  }

  for (const custom of brief.answers.filter((a) => isCustomId(a.id))) {
    lines.push(`${custom.question} — ${custom.labels.join("; ")}.`);
  }

  if (brief.notes) {
    lines.push(
      `Facts the student supplied about the goal (use them; do not invent beyond them): ${brief.notes}`,
    );
  }

  if (!lines.length) return "";
  return `STUDENT BRIEF — hard constraints from the student's own answers. Each one is checked by the reviewer:\n${lines
    .map((line) => `- ${line}`)
    .join("\n")}`;
};

/**
 * Which library exercises the prompt may list, from the practice-style
 * answer. Undefined when the answer keeps everything, so the catalogue
 * renders as it always did.
 */
export const catalogKeep = (
  brief: RoadmapBrief | null | undefined,
): ((entry: CatalogEntry) => boolean) | undefined => {
  const style = briefAnswer(brief, "practiceStyle");
  if (!style) return undefined;
  const kinds = new Set(style.values);
  const allowed = Object.values(PRACTICE_STYLE_OPTIONS).filter((kind) =>
    kinds.has(kind),
  );
  if (!allowed.length || allowed.length === 3) return undefined;
  return (entry) => allowed.includes(entry.kind);
};

const normalise = (value: string) => value.trim().toLowerCase();

const stepHasSong = (step: RoadmapStep, ref: RoadmapSongRef) =>
  step.suggestedSong?.id === ref.id ||
  (step.suggestedSong &&
    normalise(step.suggestedSong.title) === normalise(ref.title));

const REQUIRED_SONG_SESSIONS = 8;

/**
 * The mechanical guarantee behind the songs question: a song the player
 * picked ends up in the roadmap whatever the model did with the prompt. A
 * missing one is appended as a repertoire step to the last phase that has
 * any song, or to the penultimate phase when none has. The reviewer already
 * asks for it; this is the floor under the reviewer.
 */
export const ensureRequiredSongs = (
  phases: RoadmapPhase[],
  songs: RoadmapSongRef[],
): { phases: RoadmapPhase[]; added: string[] } => {
  if (!songs.length || !phases.length) return { phases, added: [] };
  const missing = songs.filter(
    (ref) =>
      !phases.some((phase) =>
        phase.steps.some((step) => stepHasSong(step, ref)),
      ),
  );
  if (!missing.length) return { phases, added: [] };

  let target = -1;
  for (let i = phases.length - 1; i >= 0; i -= 1) {
    if (phases[i].steps.some((step) => step.suggestedSong)) {
      target = i;
      break;
    }
  }
  if (target < 0) target = Math.max(0, phases.length - 2);

  const next = phases.map((phase, index) => {
    if (index !== target) return phase;
    const extra: RoadmapStep[] = missing.map((ref, i) => ({
      id: uuidv4(),
      title: `${ref.title}: the full part`,
      description: "",
      successCriteria: "",
      sessionsRequired: REQUIRED_SONG_SESSIONS,
      sessionsCompleted: 0,
      order: phase.steps.length + i,
      skillType: "musical",
      suggestedSong: ref,
    }));
    return { ...phase, steps: [...phase.steps, ...extra] };
  });
  return { phases: next, added: missing.map((ref) => ref.title) };
};

/** Which library song a step names, when the brief already holds it — no read needed. */
export const briefSongByRequest = (
  brief: RoadmapBrief | null | undefined,
  request: { title: string; artist: string },
): RoadmapSongRef | null =>
  brief?.songs.find(
    (ref) => normalise(ref.title) === normalise(request.title),
  ) ?? null;

/** The brief as the summary screen lists it: one line per answered question. */
export const briefSummary = (brief: RoadmapBrief): string[] => {
  const lines = brief.answers.map((answer) => {
    const question = isBankQuestionId(answer.id)
      ? bankQuestion(answer.id).question
      : answer.question;
    return `${question} ${answer.labels.join(", ")}`;
  });
  if (brief.songs.length) {
    lines.push(`Songs: ${brief.songs.map((s) => s.title).join(", ")}`);
  }
  return lines;
};
