import type { OnboardingGoal } from "feature/onboarding/types";

/**
 * The first-day tour: Kostek walks a new player through the shell (menu,
 * notifications, the numbers in the header), Home, and the Practice hub, and
 * leaves them in front of the thing they said they came for.
 *
 * It exists because of a player who finished the onboarding, landed in the
 * middle of the Learning Path and had no idea what the app was, where they
 * were or what to do next. So the tour starts on Home and *ends* on the goal,
 * instead of the onboarding dropping the player on the goal cold.
 */

export type TourStepId =
  | "welcome"
  | "nav"
  | "community"
  | "stats"
  | "quests"
  | "week"
  | "feed"
  | "go_practice"
  | "hub"
  | "log"
  | "start"
  | "done";

export interface TourStep {
  id: TourStepId;
  /** The page the step is shown on. */
  path: string;
  /**
   * `data-tour` value of the element to light up. Without one the step is a
   * card in the middle of the screen.
   */
  target?: string;
  /** Left out when its element is not on the page — a card hidden from Home. */
  optional?: boolean;
  /** The player moves on by pressing the lit element itself, not "Next". */
  advanceOnClick?: boolean;
  /** Only where the sidebar is (lg and up); the phone has no such element. */
  desktopOnly?: boolean;
  /** Kostek big and waving: the hello and the goodbye. */
  big?: boolean;
}

export interface TourDestination {
  goal: OnboardingGoal;
  /** Where the onboarding would have sent the player. */
  href: string;
}

export interface TourContext {
  /** `null` when the tour was started again from the account menu. */
  destination: TourDestination | null;
  /** The player said they have no guitar at hand. */
  noGuitar: boolean;
}

export const HOME_PATH = "/dashboard";
export const PRACTICE_PATH = "/timer";

/** Exercises that need no instrument: theory and ear training. */
export const NO_GUITAR_HREF = "/profile/skills?tab=browse&modes=noGuitar";

/** The row of the Practice hub each goal lives behind (PracticeModeSelector). */
export const GOAL_MODE: Record<OnboardingGoal, string> = {
  journey: "learning_path",
  plans: "routine",
  songs: "songs",
  roadmap: "roadmaps",
  log: "free_timer",
};

const STEPS: TourStep[] = [
  { id: "welcome", path: HOME_PATH, big: true },
  { id: "nav", path: HOME_PATH, target: "nav" },
  { id: "community", path: HOME_PATH, target: "community", desktopOnly: true },
  { id: "stats", path: HOME_PATH, target: "stats", optional: true },
  {
    id: "quests",
    path: HOME_PATH,
    target: "widget-daily-quests",
    optional: true,
  },
  {
    id: "week",
    path: HOME_PATH,
    target: "widget-practice-stats",
    optional: true,
  },
  { id: "feed", path: HOME_PATH, target: "feed", optional: true },
  {
    id: "go_practice",
    path: HOME_PATH,
    target: "nav-practice",
    advanceOnClick: true,
  },
  { id: "hub", path: PRACTICE_PATH, target: "practice-modes" },
  { id: "log", path: PRACTICE_PATH, target: "practice-log", optional: true },
  { id: "start", path: PRACTICE_PATH },
  { id: "done", path: PRACTICE_PATH, big: true },
];

/**
 * The steps for this player and this screen. The "your start" step needs a
 * goal to point at, so a tour replayed from the menu goes without it.
 */
export const getTourSteps = (
  context: TourContext,
  { isDesktop }: { isDesktop: boolean },
): TourStep[] =>
  STEPS.filter((step) => {
    if (step.desktopOnly && !isDesktop) return false;
    if (step.id === "start") return context.destination !== null;
    return true;
  }).map((step) =>
    step.id === "start" && context.destination
      ? { ...step, target: `mode-${GOAL_MODE[context.destination.goal]}` }
      : step,
  );

/** Where the goodbye card's main button goes, if anywhere. */
export const getTourCtaHref = (context: TourContext): string | null => {
  if (context.noGuitar) return NO_GUITAR_HREF;
  return context.destination?.href ?? null;
};

// ─── The link from the onboarding ──────────────────────────────────────────────

const GOALS: OnboardingGoal[] = ["plans", "songs", "roadmap", "journey", "log"];

/** Only paths inside the app — never `//host` or a full URL. */
const isAppPath = (value: string) =>
  value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");

/**
 * Home with the tour armed. The onboarding sends every player here, with the
 * answer they gave so the tour can end on it.
 */
export const getTourHref = (
  options: { goal: OnboardingGoal; next: string; noGuitar: boolean } | null,
): string => {
  const params = new URLSearchParams({ tour: "1" });
  if (options) {
    params.set("goal", options.goal);
    params.set("next", options.next);
    if (options.noGuitar) params.set("guitar", "0");
  }
  return `${HOME_PATH}?${params.toString()}`;
};

const first = (value: unknown): string | undefined => {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" ? raw : undefined;
};

/** `null` when the query does not ask for the tour. */
export const parseTourQuery = (
  query: Record<string, unknown>,
): TourContext | null => {
  if (first(query.tour) !== "1") return null;
  const goal = first(query.goal);
  const next = first(query.next);
  const destination =
    goal && GOALS.includes(goal as OnboardingGoal) && next && isAppPath(next)
      ? { goal: goal as OnboardingGoal, href: next }
      : null;
  return { destination, noGuitar: first(query.guitar) === "0" };
};

// ─── Placing the bubble ───────────────────────────────────────────────────────

export interface TourRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export type TourLook = "left" | "right" | "up" | "down";

export interface BubblePlacement {
  x: number;
  y: number;
  /** Where the lit element is, seen from the bubble — Kostek points there. */
  lookAt: TourLook;
}

const GAP = 16;
const EDGE = 12;

/**
 * Next to the lit element where there is room: right, then below, left,
 * above. On a phone the bubble spans the width and sits at whichever edge is
 * further from the element, above the bottom bar when it is at the bottom.
 */
export const placeBubble = (
  target: TourRect | null,
  bubble: { width: number; height: number },
  viewport: { width: number; height: number; bottomInset: number },
  { compact }: { compact: boolean },
): BubblePlacement => {
  const maxY = viewport.height - viewport.bottomInset - bubble.height - EDGE;

  if (!target) {
    return {
      x: Math.max(EDGE, (viewport.width - bubble.width) / 2),
      y: Math.max(EDGE, Math.min(maxY, (viewport.height - bubble.height) / 2)),
      lookAt: "down",
    };
  }

  if (compact) {
    const below = target.top + target.height / 2 > viewport.height / 2;
    return {
      x: EDGE,
      y: below ? EDGE : Math.max(EDGE, maxY),
      lookAt: below ? "down" : "up",
    };
  }

  const right = target.left + target.width + GAP;
  const left = target.left - bubble.width - GAP;
  const below = target.top + target.height + GAP;
  const above = target.top - bubble.height - GAP;
  const midY = target.top + target.height / 2 - bubble.height / 2;
  const midX = target.left + target.width / 2 - bubble.width / 2;

  const options: (BubblePlacement & { fits: boolean })[] = [
    {
      x: right,
      y: midY,
      lookAt: "left",
      fits: right + bubble.width <= viewport.width - EDGE,
    },
    {
      x: midX,
      y: below,
      lookAt: "up",
      fits: below + bubble.height <= viewport.height - EDGE,
    },
    { x: left, y: midY, lookAt: "right", fits: left >= EDGE },
    { x: midX, y: above, lookAt: "down", fits: above >= EDGE },
  ];
  // A target bigger than the screen leaves no side free: the bubble goes in
  // the corner over it.
  const chosen = options.find((option) => option.fits) ?? {
    x: viewport.width - bubble.width - EDGE,
    y: EDGE,
    lookAt: "left" as const,
  };

  return {
    x: Math.max(EDGE, Math.min(viewport.width - bubble.width - EDGE, chosen.x)),
    y: Math.max(
      EDGE,
      Math.min(viewport.height - bubble.height - EDGE, chosen.y),
    ),
    lookAt: chosen.lookAt,
  };
};
