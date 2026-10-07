import type { UserRoadmapProgress } from "feature/aiCoach/services/userProgress.service";
import type { StaticRoadmap } from "feature/aiCoach/types/roadmap.types";
import type {
  JourneyModule,
  JourneyProgressDocument,
} from "feature/journey/types/journey.types";

/**
 * What a Practice card says about progress. A bar only comes with `total`,
 * and `total` is always the size of one path the player is on — never the
 * whole catalogue, which reads as a backlog to a new player.
 */
export interface ModeProgressSummary {
  label: string;
  /** Translation key (practice_hub namespace) for `label`, when it is UI copy rather than a title. */
  labelKey?: string;
  labelVars?: Record<string, unknown>;
  done?: number;
  total?: number;
}

const ROADMAP_TITLE_PREFIX =
  /^(?:I want to play in the style of |Play in the style of |I want to play like )/i;

export const shortRoadmapTitle = (title: string) =>
  title.replace(ROADMAP_TITLE_PREFIX, "");

/** The first unfinished module the player has started, else the first unfinished one. */
export function summarizeJourney(
  modules: JourneyModule[],
  doc: Pick<JourneyProgressDocument, "moduleProgress"> | null | undefined,
): ModeProgressSummary {
  const counted = modules.map((module) => {
    const steps = module.stages.flatMap((stage) => stage.steps);
    const saved = doc?.moduleProgress?.[module.id]?.steps;
    const done = steps.filter((step) => saved?.[step.id]?.completed).length;
    return { module, done, total: steps.length };
  });

  const unfinished = counted.filter(({ done, total }) => done < total);
  if (unfinished.length === 0)
    return { label: "All modules completed", labelKey: "progress.all_modules" };

  const active = unfinished.find(({ done }) => done > 0);
  if (!active)
    return { label: "Start with the first lesson", labelKey: "progress.first_lesson" };

  return { label: active.module.title, done: active.done, total: active.total };
}

/** The most recently touched roadmap that isn't finished yet. */
export function summarizeRoadmaps(
  roadmaps: StaticRoadmap[],
  progress: UserRoadmapProgress[],
): ModeProgressSummary {
  const byId = new Map(roadmaps.map((roadmap) => [roadmap.id, roadmap]));
  const recentFirst = [...progress].sort((a, b) =>
    (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""),
  );

  let startedAny = false;
  for (const entry of recentFirst) {
    const roadmap = byId.get(entry.roadmapId);
    if (!roadmap) continue;
    const steps = roadmap.phases.flatMap((phase) => phase.steps);
    const sessions = (id: string) => entry.stepProgress?.[id] ?? 0;
    if (!steps.some((step) => sessions(step.id) > 0)) continue;
    startedAny = true;
    const done = steps.filter(
      (step) => sessions(step.id) >= step.sessionsRequired,
    ).length;
    if (done < steps.length) {
      return {
        label: shortRoadmapTitle(roadmap.title),
        done,
        total: steps.length,
      };
    }
  }

  return {
    label: startedAny ? "Choose your next roadmap" : "Choose your first roadmap",
    labelKey: startedAny ? "progress.next_roadmap" : "progress.first_roadmap",
  };
}

/** For open-ended libraries: a count of what's done, no catalogue-sized total. */
export function summarizeCount(
  done: number,
  [one, many]: [string, string],
  emptyLabel: string,
  keys?: { one: string; many: string; empty: string },
): ModeProgressSummary {
  if (done <= 0) return { label: emptyLabel, labelKey: keys?.empty };
  return {
    label: `${done} ${done === 1 ? one : many} completed`,
    labelKey: keys ? (done === 1 ? keys.one : keys.many) : undefined,
    labelVars: { count: done },
  };
}
