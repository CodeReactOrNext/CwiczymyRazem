/**
 * The questions a roadmap brief can ask, and the rules for picking them.
 *
 * The bank is fixed; what varies is which of it a goal gets. A cheap model
 * reads the goal and picks the questions that would change the plan's shape —
 * a goal about an artist gets the songs and the sides of their style, a goal
 * about a technique gets a starting point and a target, a first-chord goal
 * gets nothing at all. Every question here has one place in the pipeline
 * where its answer lands (see `brief.ts`); the model chooses, it never writes
 * the questions, apart from the options of the few marked `model*`, and the
 * one or two `custom` questions it may add for what the bank cannot cover.
 *
 * Pure: imported by the browser for rendering and by the server for the
 * preflight prompt, so nothing here touches Firestore or OpenAI.
 */

export const BANK_QUESTION_IDS = [
  "focus",
  "useFor",
  "sides",
  "songs",
  "repertoireDepth",
  "startingPoint",
  "target",
  "weakSpot",
  "replicateOrCreate",
  "entry",
  "includes",
  "ending",
  "practiceStyle",
] as const;

export type BankQuestionId = (typeof BANK_QUESTION_IDS)[number];

export const isBankQuestionId = (value: unknown): value is BankQuestionId =>
  BANK_QUESTION_IDS.includes(value as BankQuestionId);

/**
 * How a question is answered. `library` searches the song library; `model*`
 * kinds carry options the preflight wrote for this goal; the rest have their
 * options right here.
 */
export type QuestionKind =
  | "library"
  | "checkboxes"
  | "radio"
  | "modelRadio"
  | "modelCheckboxes";

export interface QuestionOption {
  value: string;
  label: string;
  hint?: string;
}

export interface BankQuestion {
  id: BankQuestionId;
  kind: QuestionKind;
  question: string;
  /** One line under the question, for the player. */
  hint?: string;
  /** Fixed options; absent on `library` and `model*` kinds. */
  options?: QuestionOption[];
  /** When the preflight should pick it — read by the model, not the player. */
  when: string;
  /** What the model writes options for, on `model*` kinds. */
  optionsBrief?: string;
}

/** How many questions a brief may ask, custom ones included. */
export const MAX_QUESTIONS = 5;
export const MAX_CUSTOM_QUESTIONS = 2;
/** Options a `model*` question or a custom one may carry. */
export const MAX_MODEL_OPTIONS = 4;
export const MIN_MODEL_OPTIONS = 2;
/** Songs the player may pick from the library for one roadmap. */
export const MAX_BRIEF_SONGS = 5;

export const INCLUDE_OPTIONS = {
  tone: "tone",
  theory: "theory",
  ear: "ear",
} as const;

export const PRACTICE_STYLE_OPTIONS = {
  drill: "drill",
  backing: "backing",
  hunt: "hunt",
} as const;

/** In priority order: when a pick runs over the cap, the tail goes first. */
export const QUESTION_BANK: readonly BankQuestion[] = [
  {
    id: "focus",
    kind: "modelRadio",
    question: "The goal is broad — what exactly?",
    hint: "The coach will build the roadmap around the one you pick.",
    when: 'ONLY for a vague goal ("get better", "fundamentals", "play faster") that could be read several ways. Never when the goal already names an artist, style, song or technique. When you pick it, put it first.',
    optionsBrief:
      '3–4 concrete readings of the goal, each a plan of its own ("solo over a 12-bar blues", "clean chord changes at song tempo", "play in time with a metronome")',
  },
  {
    id: "useFor",
    kind: "modelRadio",
    question: "What do you want it for?",
    hint: "The same technique is a different roadmap in a different style.",
    when: "For a technique goal with no musical context (legato, alternate picking, bends, speed, sweep) — the context becomes the plan's through-line. Never for an artist, style or song goal.",
    optionsBrief:
      '3–4 musical contexts the technique serves ("rock solos", "shred", "bluesy phrasing", "jazz lines")',
  },
  {
    id: "sides",
    kind: "modelCheckboxes",
    question: "Which sides of this style do you want to cover?",
    hint: "Untick a side and its phases are left out.",
    when: "For an artist or style with clearly separate sides (Mayer: thumb-chord rhythm / acoustic slap groove / blues lead). Only when you can name at least two real sides; never for a goal about one technique.",
    optionsBrief:
      "2–4 real, distinct sides of the artist's or style's playing, named the way a fan would",
  },
  {
    id: "songs",
    kind: "library",
    question: "Which songs should be in the roadmap?",
    hint: "Songs from the library open with a tab and a backing track. Others become steps without one.",
    when: "For any goal with repertoire: an artist, a style, named songs, playing in a band. Never for a goal about one technique with no songs in sight, and never for a first-chord goal.",
  },
  {
    id: "repertoireDepth",
    kind: "radio",
    question: "Fewer songs in depth, or more songs lighter?",
    options: [
      {
        value: "deep",
        label: "2–3 songs, section by section",
        hint: "Each song gets several steps: sections, reduced tempo, album tempo, a recorded take.",
      },
      {
        value: "wide",
        label: "5–6 songs, one step each",
        hint: "Each song is one step — the whole part at a playable tempo.",
      },
    ],
    when: "Only together with `songs`, for an artist or style goal where either reading is plausible.",
  },
  {
    id: "startingPoint",
    kind: "modelRadio",
    question: "Where are you with this right now?",
    hint: "Phase 1 starts from here — nothing below it gets taught.",
    when: "For a technique or measurable goal (picking speed, a scale, chord changes, a tempo). Never for an artist goal — `weakSpot` covers that. Write thresholds the player can test themselves against.",
    optionsBrief:
      '3 thresholds from lowest to highest, concrete and testable ("clean 16ths to 100 BPM", "100–130", "130+"; or "12-bar in two keys", "in any key")',
  },
  {
    id: "target",
    kind: "modelRadio",
    question: "What would count as done?",
    hint: "The last phase's success criteria are written to this.",
    when: "Only together with `startingPoint`, for a goal that has a measurable end. The options continue the starting-point thresholds upwards.",
    optionsBrief:
      '3 end points above the starting thresholds, as testable as they are ("clean 16ths at 140", "160", "180")',
  },
  {
    id: "weakSpot",
    kind: "modelRadio",
    question: "What in this style gives you the most trouble?",
    hint: "It gets its own phase earlier, with more sessions.",
    when: 'For an artist or style goal at Intermediate or Advanced level. Never together with `startingPoint`. Always add a last option meaning "nothing in particular".',
    optionsBrief:
      '3 skills central to the style that players typically struggle with ("bends in tune", "thumb-over chords", "the 16th-note strumming hand"), plus "Nothing in particular"',
  },
  {
    id: "replicateOrCreate",
    kind: "radio",
    question: "Play it like the record, or make your own in this style?",
    options: [
      {
        value: "replicate",
        label: "Like the record",
        hint: "Songs section by section up to album tempo. No improvising steps.",
      },
      {
        value: "create",
        label: "My own playing in this style",
        hint: "A creative step in every phase: improvising, own fills, own parts.",
      },
    ],
    when: "For an artist or style goal where both readings are plausible. Never for jazz or an improvisation goal (creating is the goal), never for a strumming or rhythm-only goal (there is nothing to improvise).",
  },
  {
    id: "entry",
    kind: "radio",
    question: "Where should it start?",
    options: [
      {
        value: "song",
        label: "A piece of a song from the first phase",
        hint: "A simplified fragment of the goal right away, technique built around it.",
      },
      {
        value: "foundation",
        label: "Foundation first, songs later",
        hint: "The first phases are technique; the songs wait until it holds.",
      },
    ],
    when: "For a goal with repertoire at Beginner or Intermediate level. Not for Advanced (they start with the music anyway), not for a technique-only goal.",
  },
  {
    id: "includes",
    kind: "checkboxes",
    question: "What should be in it?",
    hint: "Everything is in by default — untick what you do not want.",
    options: [
      {
        value: INCLUDE_OPTIONS.tone,
        label: "A phase about the sound",
        hint: "Rig, tone matching by ear, the artist's gear.",
      },
      {
        value: INCLUDE_OPTIONS.theory,
        label: "Theory beyond the minimum",
        hint: "Why the notes work, not just which ones.",
      },
      {
        value: INCLUDE_OPTIONS.ear,
        label: "Ear work",
        hint: "Transcribing phrases, learning parts by ear.",
      },
    ],
    when: "For most goals with room left. The `tone` option only makes sense for an artist or style goal; for a technique goal the player will simply ignore it.",
  },
  {
    id: "ending",
    kind: "radio",
    question: "How should it end?",
    options: [
      {
        value: "set",
        label: "A recorded set",
        hint: "A final phase: the songs back to back, recorded, like a small gig.",
      },
      {
        value: "none",
        label: "No final phase",
        hint: "The roadmap ends with the last song or skill.",
      },
    ],
    when: "For a goal with repertoire. Never for a technique-only goal.",
  },
  {
    id: "practiceStyle",
    kind: "checkboxes",
    question: "How do you like to practise?",
    hint: "The coach picks exercises of these kinds. Untick what you never open.",
    options: [
      {
        value: PRACTICE_STYLE_OPTIONS.drill,
        label: "Drills with the metronome",
      },
      {
        value: PRACTICE_STYLE_OPTIONS.backing,
        label: "Playing over a backing track",
      },
      {
        value: PRACTICE_STYLE_OPTIONS.hunt,
        label: "Fretboard games",
        hint: "Click-to-answer hunts, no microphone.",
      },
    ],
    when: "Lowest priority: only when fewer than five other questions were picked.",
  },
];

const bankById = new Map(
  QUESTION_BANK.map((question) => [question.id, question]),
);

export const bankQuestion = (id: BankQuestionId): BankQuestion =>
  bankById.get(id) as BankQuestion;

const MODEL_KINDS: QuestionKind[] = ["modelRadio", "modelCheckboxes"];

export const isModelKind = (kind: QuestionKind): boolean =>
  MODEL_KINDS.includes(kind);

export interface ModelOption {
  value: string;
  label: string;
}

/** A bank question as picked for one goal, with the options the model wrote where it had to. */
export interface AskedQuestion {
  id: BankQuestionId;
  options?: ModelOption[];
}

/** A question the model wrote itself, for what the bank does not cover. */
export interface CustomQuestion {
  id: string;
  question: string;
  options: ModelOption[];
  multi: boolean;
}

/** Everything one goal gets asked, in the order the screens show it. */
export interface QuestionSet {
  asked: AskedQuestion[];
  custom: CustomQuestion[];
}

const MAX_OPTION_TEXT = 80;
const MAX_CUSTOM_QUESTION_TEXT = 160;

const cleanText = (value: unknown, max: number): string =>
  typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, max)
    : "";

/** Options as the prompt or the answer may hold them: trimmed, deduplicated, capped. */
export const cleanOptions = (value: unknown): ModelOption[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const options: ModelOption[] = [];
  for (const raw of value) {
    const label = cleanText(
      (raw as { label?: unknown })?.label,
      MAX_OPTION_TEXT,
    );
    const valueText =
      cleanText((raw as { value?: unknown })?.value, MAX_OPTION_TEXT) || label;
    const key = valueText.toLowerCase();
    if (!label || !valueText || seen.has(key)) continue;
    seen.add(key);
    options.push({ value: valueText, label });
    if (options.length >= MAX_MODEL_OPTIONS) break;
  }
  return options;
};

/**
 * The model's pick, made to obey the bank's rules whatever it answered:
 * unknown ids are dropped, a model-kind question without enough options is
 * dropped, `target` needs `startingPoint`, `repertoireDepth` needs `songs`,
 * `weakSpot` and `startingPoint` exclude each other, the order is the bank's
 * order, and the whole thing is cut to `MAX_QUESTIONS` — `practiceStyle`
 * first, then the custom questions, then the tail.
 */
export const enforcePickRules = (
  askedRaw: unknown,
  customRaw: unknown,
): QuestionSet => {
  const byId = new Map<BankQuestionId, AskedQuestion>();
  for (const raw of Array.isArray(askedRaw) ? askedRaw : []) {
    const id = (raw as { id?: unknown })?.id;
    if (!isBankQuestionId(id) || byId.has(id)) continue;
    const question = bankQuestion(id);
    if (isModelKind(question.kind)) {
      const options = cleanOptions((raw as { options?: unknown }).options);
      if (options.length < MIN_MODEL_OPTIONS) continue;
      byId.set(id, { id, options });
    } else {
      byId.set(id, { id });
    }
  }

  if (byId.has("weakSpot") && byId.has("startingPoint"))
    byId.delete("weakSpot");
  if (byId.has("target") && !byId.has("startingPoint")) byId.delete("target");
  if (byId.has("repertoireDepth") && !byId.has("songs")) {
    byId.delete("repertoireDepth");
  }

  const custom: CustomQuestion[] = [];
  for (const raw of Array.isArray(customRaw) ? customRaw : []) {
    const question = cleanText(
      (raw as { question?: unknown })?.question,
      MAX_CUSTOM_QUESTION_TEXT,
    );
    const options = cleanOptions((raw as { options?: unknown })?.options);
    if (!question || options.length < MIN_MODEL_OPTIONS) continue;
    custom.push({
      id: `custom-${custom.length + 1}`,
      question,
      options,
      multi: Boolean((raw as { multi?: unknown })?.multi),
    });
    if (custom.length >= MAX_CUSTOM_QUESTIONS) break;
  }

  let asked = QUESTION_BANK.map((question) => byId.get(question.id)).filter(
    (question): question is AskedQuestion => Boolean(question),
  );
  let kept = custom;

  if (asked.length + kept.length > MAX_QUESTIONS) {
    asked = asked.filter((question) => question.id !== "practiceStyle");
  }
  while (asked.length + kept.length > MAX_QUESTIONS && kept.length) {
    kept = kept.slice(0, -1);
  }
  if (asked.length > MAX_QUESTIONS) asked = asked.slice(0, MAX_QUESTIONS);

  return { asked, custom: kept };
};

/** The bank as the preflight prompt reads it: id, kind, when to ask, what options to write. */
export const renderQuestionBank = (): string =>
  QUESTION_BANK.map((question) => {
    const kind = isModelKind(question.kind)
      ? `you write ${MIN_MODEL_OPTIONS}–${MAX_MODEL_OPTIONS} options: ${question.optionsBrief}`
      : question.kind === "library"
        ? "the player picks songs from the library; no options"
        : `fixed options (${question.options?.map((o) => o.label).join(" / ")}); no options from you`;
    return `- ${question.id} — "${question.question}"\n  when: ${question.when}\n  options: ${kind}`;
  }).join("\n");
