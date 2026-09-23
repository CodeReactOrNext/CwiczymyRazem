import { firebaseSaveRoadmap } from "feature/aiCoach/services/roadmap.service";
import type {
  Roadmap,
  RoadmapPhase,
  RoadmapVisibility,
} from "feature/aiCoach/types/roadmap.types";
import type { SupporterWallet } from "feature/supporterPanel/types/supporterPanel.types";
import type { RoadmapLevel } from "lib/roadmaps/generation/levels";
import type {
  GeneratedStructure,
  StructurePhase,
} from "lib/roadmaps/generation/structure";
import type { TokenUsage } from "lib/roadmaps/generation/usage";
import { addUsage, emptyUsage } from "lib/roadmaps/generation/usage";
import { auth } from "utils/firebase/client/firebase.utils";
import { mapWithConcurrency } from "utils/mapWithConcurrency";
import { v4 as uuidv4 } from "uuid";

/**
 * How many phase descriptions are written at once.
 *
 * The calls are independent — each one is handed the same skeleton and only
 * reads the other phases' titles for context — so the only reason they ever
 * ran one after another was the shape of the loop. Three at a time keeps a
 * seven-phase roadmap to three rounds instead of seven without asking the
 * model for seven things at once.
 */
const PHASE_CONCURRENCY = 3;

/** How often the review stage asks the server what it is doing. */
const STATUS_POLL_MS = 3000;

const getUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  return user;
};

const post = async <T>(
  path: string,
  idToken: string,
  body: Record<string, unknown>,
): Promise<T> => {
  const res = await fetch(`/api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, ...body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `${path} failed`);
  }
  return data as T;
};

import type {
  GenerationStage,
  StructureStep,
} from "feature/supporterPanel/types/roadmapJob.types";

export type { GenerationStage, StructureStep };

type WithUsage = { usage?: Partial<TokenUsage> };

/** What /api/generate-roadmap adds for a supporter: the paid ticket's roadmap id and the wallet after the charge. */
type TicketFields = {
  roadmapId?: string;
  charged?: boolean;
  tokensCharged?: number;
  wallet?: SupporterWallet;
};

type DraftResponse = WithUsage &
  TicketFields & {
    draft: StructurePhase[];
    /** Identifies the paid generation to /api/roadmap-generation-status. */
    ticketId?: string;
  };

export interface GenerateRoadmapResult {
  roadmap: Roadmap;
  review: GeneratedStructure["review"];
  /** Every token the pipeline spent, summed across its calls. */
  usage: TokenUsage;
  /** Tokens this generation took from the wallet — 0 when a fresh ticket was reused. */
  tokensCharged: number;
  /** The wallet after the charge, so the panel can redraw it without a refetch. */
  wallet: SupporterWallet | null;
}

/**
 * Asks the server what the review is doing, every few seconds, for as long as
 * the review call is out.
 *
 * The browser sets every other label itself, because it makes the call that
 * each one stands for. The one thing it cannot know is whether the reviewer
 * rejected the draft: that turns into a second full rewrite, as slow again as
 * the draft was, behind a request that has not answered yet.
 */
const watchGenerationStage = (
  ticketId: string | undefined,
  idToken: string,
  onStage: (stage: string) => void,
): (() => void) => {
  if (!ticketId) return () => {};

  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let last: string | null = null;

  const tick = async () => {
    try {
      const { stage } = await post<{ stage?: string | null }>(
        "roadmap-generation-status",
        idToken,
        { ticketId },
      );
      if (!stopped && stage && stage !== last) {
        last = stage;
        onStage(stage);
      }
    } catch {
      // A missed poll only means the label stays where it is.
    }
    if (!stopped) timer = setTimeout(tick, STATUS_POLL_MS);
  };

  timer = setTimeout(tick, STATUS_POLL_MS);

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
};

/**
 * The generation pipeline, driven from the browser: the skeleton in two
 * requests, then one description request per phase, then a lesson search per
 * step — so nothing here needs to survive minutes on a single serverless
 * function — and saved under the signed-in player's own uid.
 *
 * The browser tab has to stay open for the few minutes this takes: there is
 * no background job behind it, only this sequence of awaited calls.
 */
export const generateAndSaveRoadmap = async (
  {
    goal,
    level,
    visibility = "public",
  }: { goal: string; level: RoadmapLevel; visibility?: RoadmapVisibility },
  onStage?: (stage: GenerationStage) => void,
): Promise<GenerateRoadmapResult> => {
  const user = getUser();
  const idToken = await user.getIdToken();

  // ── 1. The skeleton, in two halves, so the wait is not one flat minute ──
  onStage?.({ name: "structure", step: "draft" });
  const drafted = await post<DraftResponse>("generate-roadmap", idToken, {
    goal,
    level,
    visibility,
    stage: "draft",
  });
  let usage = addUsage(emptyUsage(), drafted.usage ?? {});

  onStage?.({ name: "structure", step: "review" });
  const stopWatching = watchGenerationStage(
    drafted.ticketId,
    idToken,
    (stage) => {
      if (stage === "revise") onStage?.({ name: "structure", step: "revise" });
    },
  );

  let structure: GeneratedStructure & WithUsage & TicketFields;
  try {
    structure = await post<GeneratedStructure & WithUsage & TicketFields>(
      "generate-roadmap",
      idToken,
      { goal, level, visibility, stage: "review" },
    );
  } finally {
    stopWatching();
  }
  usage = addUsage(usage, structure.usage ?? {});

  let roadmap: Roadmap = {
    // The ticket minted the id, so a retry of the same goal overwrites rather than duplicates.
    id: structure.roadmapId ?? drafted.roadmapId ?? uuidv4(),
    userId: user.uid,
    title: goal.slice(0, 80),
    goal,
    level,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    phases: structure.phases,
    visibility,
  };

  // ── 2. Descriptions, several phases at a time ──
  // Every call is handed the same untouched skeleton: the prompt reads the
  // other phases' titles and nothing else, so what a sibling call is writing
  // at the same moment cannot change what this one is told.
  const skeleton = roadmap.phases;
  let phasesDone = 0;
  onStage?.({ name: "phase", done: 0, total: skeleton.length });

  const described = await mapWithConcurrency(
    skeleton,
    PHASE_CONCURRENCY,
    async (_phase, phaseIndex) => {
      const { phase, usage: phaseUsage } = await post<
        { phase: RoadmapPhase } & WithUsage
      >("generate-phase-details", idToken, {
        goal,
        level,
        phases: skeleton,
        phaseIndex,
      });
      usage = addUsage(usage, phaseUsage ?? {});
      phasesDone += 1;
      onStage?.({ name: "phase", done: phasesDone, total: skeleton.length });
      return phase;
    },
  );

  roadmap = { ...roadmap, phases: described };

  // ── 3. A lesson search per step ──
  const steps = roadmap.phases.flatMap((phase) =>
    phase.steps.map((step) => ({ step, phaseId: phase.id })),
  );

  for (let i = 0; i < steps.length; i++) {
    onStage?.({ name: "lessons", done: i, total: steps.length });
    const { step, phaseId } = steps[i];
    try {
      const data = await post<{ lessons?: { videoId: string }[] } & WithUsage>(
        "search-youtube-lessons",
        idToken,
        {
          stepTitle: step.title,
          stepDescription: step.description,
          roadmapGoal: goal,
          roadmapLevel: level,
        },
      );
      usage = addUsage(usage, data.usage ?? {});
      const lessonIds = (data.lessons ?? []).map((lesson) => lesson.videoId);
      if (lessonIds.length) {
        roadmap = {
          ...roadmap,
          phases: roadmap.phases.map((phase) =>
            phase.id !== phaseId
              ? phase
              : {
                  ...phase,
                  steps: phase.steps.map((s) =>
                    s.id === step.id
                      ? { ...s, suggestedLessonIds: lessonIds }
                      : s,
                  ),
                },
          ),
        };
      }
    } catch {
      // A missed lesson search does not sink the roadmap — the step just has none.
    }
  }
  onStage?.({ name: "lessons", done: steps.length, total: steps.length });

  await firebaseSaveRoadmap(roadmap);

  return {
    roadmap,
    review: structure.review,
    usage,
    // Only the draft call charges; the review runs on the ticket it opened.
    tokensCharged: drafted.tokensCharged ?? 0,
    wallet: drafted.wallet ?? null,
  };
};
