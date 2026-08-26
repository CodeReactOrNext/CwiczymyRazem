/**
 * What "wired properly" means on a pedalboard, and what the game pays for it.
 *
 * Until now the board was pure decoration: a pedal contributed its Item Level
 * wherever it happened to land, so a Reverb in front of a Tuner was worth
 * exactly as much as a board any guitarist would recognise. This turns the one
 * piece of real craft knowledge the Arsenal can teach — the order effects belong
 * in — into a rule the game reads, rewards and shows.
 *
 * Three decisions worth spelling out:
 *
 *  • **The board is wired the way a pedal is built.** Every enclosure takes its
 *    input on the right face and hands its output out of the left, so a chain of
 *    them runs right to left. Chain order is `inChainOrder`: top row right to
 *    left, then bottom row right to left, from the input jack at the top right
 *    to the amp jack at the bottom left. It is the same order `tidyBoard` packs
 *    in, so straightening the board can never silently rewire it, and the same
 *    order the trait conditions compare positions in.
 *
 *  • **Stages, not a permutation.** Every effect type belongs to a stage, and
 *    the chain is right when the stages never run backwards. Two Overdrives in
 *    either order are both correct, and so is any arrangement of the modulation
 *    family — because among those, order is taste rather than craft. Only the
 *    things the craft actually has an opinion about are scored.
 *
 *  • **It pays per cable, not per board.** Each cable that runs into the pedal
 *    that belongs next pays `CHAIN_LINK_FAME`, and a board with nothing
 *    backwards pays `CHAIN_FLAWLESS_FAME` on top. Per-cable means a nine-pedal
 *    board fixed one pedal at a time pays a little more at every step, so the
 *    player is never told "wrong" without also being shown progress. It also
 *    means the reward grows with the collection: more pedals, more cables.
 *
 * Deliberately free of anything React — the report API scores the stored board
 * with the same function the board itself draws from, so what the panel promises
 * is what a session pays.
 */

import type {
  EffectInventoryItem,
  EffectType,
  PedalboardPlacement,
  RigSetup,
} from "../types/arsenal.types";
import { inChainOrder } from "../utils/pedalboardLayout";
import { EFFECT_DEFINITIONS, EFFECTS_BY_ID } from "./effectDefinitions";

/** Fame/h for every cable that runs into the pedal that belongs next. */
export const CHAIN_LINK_FAME = 2;

/** Fame/h on top when nothing on the board runs backwards. */
export const CHAIN_FLAWLESS_FAME = 6;

/**
 * Pedals needed before the flawless bonus is paid. Two pedals in the right
 * order is one cable and a coin flip; three is a decision.
 */
export const CHAIN_FLAWLESS_MIN_PEDALS = 3;

export interface SignalStage {
  id: string;
  /** Short name for the ladder — the craft's name for the slot, not the pedal's. */
  label: string;
  /** Effect types that belong to this stage. Order inside a stage is taste. */
  types: EffectType[];
  /** Why it sits here. This is the half of the feature that teaches. */
  why: string;
}

/**
 * The chain, guitar first, amp last.
 *
 * This is the order every pedal manufacturer's own diagram prints, and where it
 * is contested the more widely taught choice wins: Fuzz ahead of the rest of the
 * dirt because it wants the pickups almost first-hand, Boost behind the dirt
 * because in front of it a boost only makes the same tone louder, and the whole
 * modulation family as one stage because phaser-before-chorus is preference and
 * this table only claims things that are not.
 */
export const SIGNAL_STAGES: readonly SignalStage[] = [
  {
    id: "tuner",
    label: "Tuner",
    types: ["Tuner"],
    why: "Reads the bare string, so nothing may colour the signal ahead of it.",
  },
  {
    id: "filter",
    label: "Filter",
    types: ["Wah"],
    why: "Sweeps a clean signal. Behind the dirt it sweeps the fizz instead.",
  },
  {
    id: "compressor",
    label: "Compressor",
    types: ["Compressor"],
    why: "Evens out the pick attack before anything downstream amplifies it.",
  },
  {
    id: "fuzz",
    label: "Fuzz",
    types: ["Fuzz"],
    why: "Wants the pickups almost first-hand — buffers ahead of it choke it.",
  },
  {
    id: "overdrive",
    label: "Overdrive",
    types: ["Overdrive"],
    why: "Grit on a clean signal, and the pedal a distortion is stacked onto.",
  },
  {
    id: "distortion",
    label: "Distortion",
    types: ["Distortion"],
    why: "The hardest clipping sits at the end of the dirt section.",
  },
  {
    id: "boost",
    label: "Boost",
    types: ["Boost"],
    why: "Pushes a tone that is already dirty. In front, it only adds volume.",
  },
  {
    id: "eq",
    label: "EQ",
    types: ["EQ"],
    why: "Shapes the finished dirt before the time effects ever hear it.",
  },
  {
    id: "modulation",
    label: "Modulation",
    types: ["Phaser", "Flanger", "Chorus", "Vibrato"],
    why: "Moves a settled tone around. Order within the family is taste.",
  },
  {
    id: "delay",
    label: "Delay",
    types: ["Delay"],
    why: "Repeats the finished sound. Ahead of the dirt it repeats mush.",
  },
  {
    id: "reverb",
    label: "Reverb",
    types: ["Reverb"],
    why: "The room the whole rig is played in, so it is always last.",
  },
];

const STAGE_OF_TYPE = new Map<EffectType, number>(
  SIGNAL_STAGES.flatMap((stage, index) =>
    stage.types.map((type) => [type, index] as const),
  ),
);

/**
 * Which stage an effect type belongs to. `-1` means the table has no opinion
 * about it, and a cable touching it is never counted as wrong — a type added to
 * the game before it is added here must not cost anybody Fame.
 */
export const stageIndexOf = (type: EffectType): number =>
  STAGE_OF_TYPE.get(type) ?? -1;

/**
 * The stages a player can actually fill today, derived from the pedals that
 * exist in the game rather than hand-listed.
 *
 * Three stages have no pedal behind them yet (there is no Wah, Compressor or
 * Distortion in any case), and a ladder inviting the player to hunt for one
 * would be a promise the drop tables cannot keep. Ship those pedals and they
 * appear here on their own.
 */
export const PLAYABLE_SIGNAL_STAGES: readonly SignalStage[] =
  SIGNAL_STAGES.filter((stage) =>
    stage.types.some((type) =>
      EFFECT_DEFINITIONS.some((def) => def.type === type),
    ),
  );

export interface ChainNode {
  itemId: string;
  /** The pedal's own name — what the tip has to call it. */
  name: string;
  type: EffectType;
  /** Index into `SIGNAL_STAGES`, or `-1` for a type with no stage. */
  stage: number;
  xPct: number;
  yPct: number;
}

/** One cable: the pedal it leaves, the pedal it runs into, and the verdict. */
export interface ChainLink {
  /** Index in `nodes` of the pedal the cable leaves. */
  from: number;
  /** …and of the pedal it runs into. */
  to: number;
  ok: boolean;
}

export type ChainTier = "empty" | "single" | "book" | "one-off" | "rough" | "spaghetti";

export interface ChainVerdict {
  /** Every boarded pedal, in signal order. */
  nodes: ChainNode[];
  links: ChainLink[];
  okLinks: number;
  wrongLinks: number;
  /** Nothing backwards, and enough pedals for that to mean something. */
  flawless: boolean;
  /** Fame/h this layout is worth. */
  rate: number;
  tier: ChainTier;
  /** How to fix the first cable that runs backwards. `null` when none does. */
  tip: string | null;
  /** Stage indices the board covers — what the ladder lights up. */
  filledStages: number[];
}

/** Presentation for each verdict: what to call it, and what it means. */
export const CHAIN_TIERS: Record<
  ChainTier,
  { label: string; note: string; tone: "good" | "warn" | "bad" | "idle" }
> = {
  empty: {
    label: "Nothing Wired",
    note: "Put a pedal on the board and the order you put it in starts paying.",
    tone: "idle",
  },
  single: {
    label: "One Pedal",
    note: "A chain needs somewhere for the signal to go next. Add a second pedal.",
    tone: "idle",
  },
  book: {
    label: "By The Book",
    note: "Every cable runs into the pedal that belongs next. This is the order the craft asks for.",
    tone: "good",
  },
  "one-off": {
    label: "One Cable Off",
    note: "One pedal is standing in the wrong place. Everything else is right.",
    tone: "warn",
  },
  rough: {
    label: "Rough Wiring",
    note: "Two cables run backwards through the chain.",
    tone: "warn",
  },
  spaghetti: {
    label: "Spaghetti",
    note: "The signal crosses itself all over the board.",
    tone: "bad",
  },
};

const round1 = (value: number) => Math.round(value * 10) / 10;

const stageLabel = (stage: number) => SIGNAL_STAGES[stage]?.label ?? "";

/**
 * Every boarded pedal in signal order, with the stage it belongs to.
 *
 * Pedals whose definition has gone missing are dropped rather than scored: a
 * retired effect id must not turn a good board into a broken one.
 */
export const readChainNodes = (
  items: PedalboardPlacement[] | null | undefined,
  effectInventory: EffectInventoryItem[] | null | undefined,
): ChainNode[] =>
  inChainOrder(Array.isArray(items) ? items : []).flatMap((placement) => {
    const item = effectInventory?.find((e) => e.id === placement.itemId);
    const def = item ? EFFECTS_BY_ID.get(item.effectId) : undefined;
    if (!def) return [];

    return [
      {
        itemId: placement.itemId,
        name: def.name,
        type: def.type,
        stage: stageIndexOf(def.type),
        xPct: placement.xPct,
        yPct: placement.yPct,
      },
    ];
  });

const tierOf = (pedals: number, wrongLinks: number): ChainTier => {
  if (pedals === 0) return "empty";
  if (pedals === 1) return "single";
  if (wrongLinks === 0) return "book";
  if (wrongLinks === 1) return "one-off";
  if (wrongLinks === 2) return "rough";
  return "spaghetti";
};

/**
 * Scores a chain that has already been read into order.
 *
 * A cable is right when the stage never goes backwards across it, so equal
 * stages pass: the rule is "nothing out of order", not "one pedal per stage".
 */
export const evaluateChain = (nodes: ChainNode[]): ChainVerdict => {
  const links: ChainLink[] = [];

  for (let i = 1; i < nodes.length; i++) {
    const from = nodes[i - 1];
    const to = nodes[i];
    // An unstaged pedal is a pedal the craft has no rule about, so no cable
    // touching it can be blamed.
    const ok = from.stage < 0 || to.stage < 0 || from.stage <= to.stage;
    links.push({ from: i - 1, to: i, ok });
  }

  const wrongLinks = links.filter((link) => !link.ok).length;
  const okLinks = links.length - wrongLinks;
  const flawless = wrongLinks === 0 && nodes.length >= CHAIN_FLAWLESS_MIN_PEDALS;
  const rate = round1(
    okLinks * CHAIN_LINK_FAME + (flawless ? CHAIN_FLAWLESS_FAME : 0),
  );

  const firstWrong = links.find((link) => !link.ok);
  const tip = firstWrong
    ? `Move the ${nodes[firstWrong.to].name} in front of the ${
        nodes[firstWrong.from].name
      } — ${stageLabel(nodes[firstWrong.to].stage)} comes before ${stageLabel(
        nodes[firstWrong.from].stage,
      )}.`
    : null;

  return {
    nodes,
    links,
    okLinks,
    wrongLinks,
    flawless,
    rate,
    tier: tierOf(nodes.length, wrongLinks),
    tip,
    filledStages: [
      ...new Set(nodes.map((node) => node.stage).filter((stage) => stage >= 0)),
    ],
  };
};

type ArsenalLike = Pick<
  { rig: RigSetup; effectInventory: EffectInventoryItem[] },
  "rig" | "effectInventory"
>;

/** The whole verdict for a stored arsenal — the shape both the API and UI read. */
export const getChainVerdict = (
  arsenal: Partial<ArsenalLike> | null | undefined,
): ChainVerdict =>
  evaluateChain(
    readChainNodes(arsenal?.rig?.pedalboardItems, arsenal?.effectInventory),
  );

/** Fame/h the stored board's wiring is worth. What the report API pays on. */
export const getChainFameRate = (
  arsenal: Partial<ArsenalLike> | null | undefined,
): number => getChainVerdict(arsenal).rate;

/**
 * The same pedals, reordered into the chain the craft asks for — what the
 * "Wire It Up" button hands to `packInOrder`.
 *
 * Sorting a list that is already in chain order keeps every tie as the player
 * left it, so two Overdrives and a rack of modulation stay in the arrangement
 * they were dragged into. Only the pedals actually standing in the wrong stage
 * move.
 */
export const wiredOrder = (
  items: PedalboardPlacement[] | null | undefined,
  effectInventory: EffectInventoryItem[] | null | undefined,
): PedalboardPlacement[] => {
  const source = Array.isArray(items) ? items : [];
  const stageOf = new Map(
    readChainNodes(source, effectInventory).map((node) => [
      node.itemId,
      // Unstaged pedals go to the back rather than to the front, where they
      // would push a Tuner out of the one position it has to hold.
      node.stage < 0 ? SIGNAL_STAGES.length : node.stage,
    ]),
  );

  return inChainOrder(source).sort(
    (a, b) =>
      (stageOf.get(a.itemId) ?? SIGNAL_STAGES.length) -
      (stageOf.get(b.itemId) ?? SIGNAL_STAGES.length),
  );
};
