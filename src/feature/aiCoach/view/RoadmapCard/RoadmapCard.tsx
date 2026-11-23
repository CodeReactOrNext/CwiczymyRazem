import type { Roadmap } from "feature/aiCoach/types/roadmap.types";
import {
  flattenRoadmapSteps,
  getNextUnfinishedStep,
} from "feature/aiCoach/utils/roadmapSteps";
import { getStepStatus } from "feature/aiCoach/utils/stepStatus";
import { shortRoadmapTitle } from "feature/practice/utils/modeProgress";
import { useTranslation } from "hooks/useTranslation";

import { RoadmapSummaryCard, type RoadStepState } from "./RoadmapSummaryCard";

interface RoadmapCardProps {
  roadmap: Roadmap;
  onOpen: () => void;
  /** Wide, at the head of "Yours". */
  featured?: boolean;
  /** How many players are on this roadmap, once the count is in. */
  players?: number;
}

/** A curated roadmap with the player's progress on it, as a card. */
const RoadmapCard = ({
  roadmap,
  onOpen,
  featured,
  players,
}: RoadmapCardProps) => {
  const { t } = useTranslation("ai_coach");
  const steps = flattenRoadmapSteps(roadmap.phases);
  const done = steps.filter(
    ({ step }) => getStepStatus(step) === "done",
  ).length;
  const total = steps.length;
  const complete = total > 0 && done === total;
  const started = steps.some(({ step }) => step.sessionsCompleted > 0);
  const nextStepId = getNextUnfinishedStep(steps)?.step.id;
  const shortTitle = shortRoadmapTitle(roadmap.title);
  const artistRoadmap = shortTitle !== roadmap.title;

  // Steps can be finished out of order, so the road is drawn step by step.
  const road = roadmap.phases.map((phase) =>
    phase.steps.map((step): RoadStepState => {
      if (getStepStatus(step) === "done") return "done";
      return step.id === nextStepId ? "current" : "todo";
    }),
  );

  return (
    <RoadmapSummaryCard
      eyebrow={artistRoadmap ? t("card.in_style_of") : t("mastery_roadmap")}
      title={shortTitle}
      level={roadmap.level}
      levelLabel={t(`levels.${roadmap.level}`, roadmap.level)}
      image={roadmap.image}
      road={road}
      done={done}
      total={total}
      players={players}
      playersLabel={players ? t("card.players", { count: players }) : undefined}
      countLabel={t("card.steps_done", { done, total })}
      action={
        complete
          ? t("card.review")
          : started
            ? t("card.continue")
            : t("card.start")
      }
      primary={started && !complete}
      featured={featured}
      onOpen={onOpen}
    />
  );
};

export default RoadmapCard;
