import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import {
  journeyModules,
  placeholderModules,
} from "feature/journey/data/journeyModules";
import { getJourneyReward } from "feature/journey/data/journeyRewards";
import type { JourneyStep } from "feature/journey/types/journey.types";

/**
 * How a step is closed. `checklist` and `song` are confirmation steps (tick
 * the boxes, pick a song); `exam` steps only complete on a passed exam.
 */
type LearningPathStepKind = "checklist" | "song" | "exam";

export interface LearningPathStep {
  id: string;
  order: number;
  title: string;
  kind: LearningPathStepKind;
  /** Exam graded by listening (mic or interface). False for click exams. */
  listens: boolean;
}

export interface LearningPathStage {
  id: string;
  label: string;
  steps: LearningPathStep[];
}

export interface LearningPathModule {
  id: string;
  title: string;
  subtitle: string;
  stages: LearningPathStage[];
  stepCount: number;
  examCount: number;
  /** Exams that listen to the guitar; the rest are clicked on a diagram. */
  listeningExamCount: number;
  /** Stage labels whose exams listen, for the mic requirement line. */
  listeningStages: string[];
  /** The "Before You Begin" checklist: what the module expects on day one. */
  entryChecklist: string[];
  reward: {
    guitar: string | null;
    guitarRarity: string | null;
    fame: number;
    caseTokens: number;
    parts: { tier: string; qty: number }[];
  };
}

export interface LearningPathFirstLesson {
  moduleTitle: string;
  title: string;
  shortDescription: string;
  examGoal: string;
  examBpm: number | null;
  tips: { label: string; body: string }[];
}

export interface GuitarLearningPathPageProps {
  modules: LearningPathModule[];
  planned: { id: string; title: string; subtitle: string }[];
  firstLesson: LearningPathFirstLesson;
}

const stepKind = (step: JourneyStep): LearningPathStepKind => {
  if (!step.modalOnly) return "exam";
  return step.songPicker?.length ? "song" : "checklist";
};

const stepListens = (step: JourneyStep): boolean => {
  if (step.modalOnly) return false;
  const exercise = exercisesAgregat.find(
    (candidate) => candidate.id === step.suggestedExerciseId,
  );
  if (!exercise) {
    throw new Error(
      `Learning path landing: step "${step.id}" points at unknown exercise "${step.suggestedExerciseId}"`,
    );
  }
  return !exercise.disableMic;
};

/**
 * Everything the landing says about the modules is read from the data the
 * app renders, at build time: a renamed step or a new stage shows up here on
 * the next deploy, and a step pointing at a missing exercise fails the build.
 */
export const buildGuitarLearningPathProps = (): GuitarLearningPathPageProps => {
  const modules = journeyModules.map((module): LearningPathModule => {
    const stages = module.stages.map((stage) => ({
      id: stage.id,
      label: stage.label ?? `Stage ${stage.order}`,
      steps: stage.steps.map((step) => ({
        id: step.id,
        order: step.order,
        title: step.title,
        kind: stepKind(step),
        listens: stepListens(step),
      })),
    }));
    const steps = stages.flatMap((stage) => stage.steps);
    const reward = getJourneyReward(module.id);
    const partsByTier = new Map<string, number>();
    for (const part of reward?.payout.parts ?? []) {
      partsByTier.set(part.tier, (partsByTier.get(part.tier) ?? 0) + part.qty);
    }

    return {
      id: module.id,
      title: module.title,
      subtitle: module.subtitle,
      stages,
      stepCount: steps.length,
      examCount: steps.filter((step) => step.kind === "exam").length,
      listeningExamCount: steps.filter((step) => step.listens).length,
      listeningStages: stages
        .filter((stage) => stage.steps.some((step) => step.listens))
        .map((stage) => stage.label),
      entryChecklist: (
        module.stages[0]?.steps.find((step) => step.checklist)?.checklist ?? []
      ).map((item) => item.text),
      reward: {
        guitar: reward?.guitar
          ? `${reward.guitar.brand} ${reward.guitar.name}`
          : null,
        guitarRarity: reward?.guitar?.rarity ?? null,
        fame: reward?.payout.fame ?? 0,
        caseTokens: reward?.payout.caseTokens ?? 0,
        parts: [...partsByTier].map(([tier, qty]) => ({ tier, qty })),
      },
    };
  });

  // The first step that is an actual lesson (Before You Begin is a checklist).
  const fundamentals = journeyModules[0];
  const lesson = fundamentals.stages
    .flatMap((stage) => stage.steps)
    .find((step) => !step.modalOnly);
  if (!lesson) {
    throw new Error("Learning path landing: first module has no lesson step");
  }

  return {
    modules,
    planned: placeholderModules.map(({ id, title, subtitle }) => ({
      id,
      title,
      subtitle,
    })),
    firstLesson: {
      moduleTitle: fundamentals.title,
      title: lesson.title,
      shortDescription: lesson.shortDescription,
      examGoal: lesson.examGoal,
      examBpm: lesson.examBpm ?? null,
      tips: (lesson.contentBlocks ?? [])
        .filter(
          (block) => block.type === "callout" && block.label && block.body,
        )
        .map((block) => ({ label: block.label!, body: block.body! })),
    },
  };
};
