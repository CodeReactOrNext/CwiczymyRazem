import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "assets/components/ui/button";
import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { BackLink } from "components/BackLink/BackLink";
import { Breadcrumbs } from "components/Breadcrumbs/Breadcrumbs";
import { EmptyState } from "components/EmptyState/EmptyState";
import { FeedbackModal } from "components/FeedbackBubble/FeedbackBubble";
import { PAGE_CONTENT, PAGE_GUTTER } from "components/PageShell/PageShell";
import { SegmentedControl } from "components/SegmentedControl/SegmentedControl";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import roadmaps from "data/roadmaps";
import { useRoadmapPopularity } from "feature/aiCoach/hooks/useRoadmapPopularity";
import {
  firebaseGetAllUserProgress,
  firebaseUpdateUserProgress,
  type UserRoadmapProgress,
} from "feature/aiCoach/services/userProgress.service";
import {
  hasAdvancedStep,
  newlyCompletedSteps,
} from "feature/aiCoach/utils/completedSteps";
import { withPhaseChecks } from "feature/aiCoach/utils/phaseCheck";
import { extractStepProgress } from "feature/aiCoach/utils/roadmapProgress";
import { flattenRoadmapSteps } from "feature/aiCoach/utils/roadmapSteps";
import { getStepStatus } from "feature/aiCoach/utils/stepStatus";
import { PlayerRoadmapsLocked } from "feature/aiCoach/view/PlayerRoadmapsLocked";
import { firebaseAddRoadmapStepLog } from "feature/logs/services/addRoadmapStepLog.service";
import { TokenWalletBar } from "feature/supporterPanel/components/TokenWalletBar";
import {
  type OwnRoadmapEntry,
  UserRoadmapsTab,
} from "feature/supporterPanel/components/UserRoadmapsTab";
import { useSupporterRoadmap } from "feature/supporterPanel/hooks/useSupporterRoadmap";
import { useUserRoadmaps } from "feature/supporterPanel/hooks/useUserRoadmaps";
import { isViewersRoadmap } from "feature/supporterPanel/utils/roadmapBoard";
import { useSupportTeam } from "feature/supportTeam/hooks/useSupportTeam";
import { selectUserAuth } from "feature/user/store/userSlice";
import { updateQuestProgress } from "feature/user/store/userSlice.questActions";
import { useTranslation } from "hooks/useTranslation";
import { Lightbulb, Lock, Map as MapIcon } from "lucide-react";
import { useRouter } from "next/router";
import React, { useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";

import type {
  Roadmap,
  RoadmapPhase,
  StaticRoadmap,
} from "../types/roadmap.types";
import RoadmapCard from "./RoadmapCard/RoadmapCard";
import RoadmapView from "./RoadmapView/RoadmapView";

const LEVEL_ORDER: Record<string, number> = {
  "Absolute Beginner": 0,
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
};

/** The three lists the page switches between. */
const TABS = ["yours", "mastery", "players"] as const;
type RoadmapsTab = (typeof TABS)[number];

const isTab = (value: unknown): value is RoadmapsTab =>
  TABS.includes(value as RoadmapsTab);

const CARD_LIST = "flex flex-col gap-4";

const progressQueryKey = (userId: string | null) =>
  ["userRoadmapProgress", userId] as const;

const sortByDifficulty = (list: StaticRoadmap[]) =>
  [...list].sort(
    (a, b) => (LEVEL_ORDER[a.level] ?? 99) - (LEVEL_ORDER[b.level] ?? 99),
  );

function mergeWithProgress(
  roadmap: StaticRoadmap,
  progress: UserRoadmapProgress | null,
  userId: string,
): Roadmap {
  return {
    ...roadmap,
    userId,
    createdAt: progress?.startedAt ?? new Date().toISOString(),
    updatedAt: progress?.updatedAt ?? new Date().toISOString(),
    phases: withPhaseChecks(
      roadmap.phases.map((phase) => ({
        ...phase,
        steps: phase.steps.map((step) => ({
          ...step,
          sessionsCompleted: progress?.stepProgress[step.id] ?? 0,
          exerciseCompleted:
            progress?.resourceProgress?.[step.id]?.exerciseCompleted ?? false,
          completedLessonIds:
            progress?.resourceProgress?.[step.id]?.completedLessonIds ?? [],
          songCompleted:
            progress?.resourceProgress?.[step.id]?.songCompleted ?? false,
          practiceSessions:
            progress?.resourceProgress?.[step.id]?.practiceSessions ?? 0,
        })),
      })),
      progress?.phaseChecks,
    ),
  };
}

/**
 * Every roadmap in one place: the curated ones, the ones the coach built for
 * the player, and the ones other players are working through.
 *
 * "Yours" is what the player is on, whatever kind it is; "Mastery" is the
 * curated shelf; "Players" is the board (behind the supporter badge). An open
 * roadmap takes the whole page, banner edge to edge, so the page's own banner
 * and tabs step aside while one is open.
 *
 * `?roadmapId=` is a curated roadmap when it names one, and a player's
 * roadmap otherwise — the open step's URL and the way back from an exercise
 * or a song. `?roadmap=` is the link in a "roadmap ready" notification.
 */
const AiCoachView = () => {
  const { t } = useTranslation(["ai_coach", "supporter"]);
  const dispatch = useAppDispatch();
  const userAuth = useAppSelector(selectUserAuth);
  const userId = typeof userAuth === "string" ? userAuth : null;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { isSupport, isLoading: isRosterLoading } = useSupportTeam();
  const isSupporter = isSupport(userAuth);
  // Only for the wallet in the banner and the prices in the builder — the
  // route 403s without the badge.
  const { data: board } = useSupporterRoadmap(isSupporter);
  // The same list the tab below reads, for knowing whether "Yours" has
  // anything in it before deciding which tab to open on.
  const playerRoadmapsQuery = useUserRoadmaps(isSupporter);
  // How many players are on each curated roadmap, for the number on its card.
  const { data: popularity } = useRoadmapPopularity(userId !== null);

  // The deep link is the entry point; from then on the view owns it.
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const id = router.query.roadmapId;
    return typeof id === "string" && roadmaps.some((r) => r.id === id)
      ? id
      : null;
  });
  const [linkedPlayerRoadmapId] = useState<string | null>(() => {
    const { roadmap, roadmapId } = router.query;
    if (typeof roadmap === "string") return roadmap;
    return typeof roadmapId === "string" &&
      !roadmaps.some((r) => r.id === roadmapId)
      ? roadmapId
      : null;
  });
  const [playerDetailOpen, setPlayerDetailOpen] = useState(
    () => linkedPlayerRoadmapId !== null,
  );
  const [pickedTab, setPickedTab] = useState<RoadmapsTab | null>(() =>
    isTab(router.query.tab) ? router.query.tab : null,
  );
  const [builderOpen, setBuilderOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);

  // Steps already put in the activity log during this visit.
  const loggedStepsRef = useRef(new Set<string>());

  const progressQuery = useQuery({
    queryKey: progressQueryKey(userId),
    queryFn: () => firebaseGetAllUserProgress(userId as string),
    enabled: userId !== null,
  });
  const loadingProgress = progressQuery.isPending;
  const progressMap = useMemo(() => {
    const map: Record<string, UserRoadmapProgress> = {};
    (progressQuery.data ?? []).forEach((p) => {
      map[p.roadmapId] = p;
    });
    return map;
  }, [progressQuery.data]);

  const curated = useMemo(
    () =>
      sortByDifficulty(roadmaps).map((rm) =>
        mergeWithProgress(rm, progressMap[rm.id] ?? null, userId ?? ""),
      ),
    [progressMap, userId],
  );

  // The curated roadmaps the player has sessions on: they belong in "Yours",
  // next to the ones the coach built for them.
  const startedCurated = useMemo<OwnRoadmapEntry[]>(
    () =>
      curated.flatMap((rm) => {
        const steps = flattenRoadmapSteps(rm.phases);
        if (!steps.some(({ step }) => step.sessionsCompleted > 0)) return [];
        const complete = steps.every(
          ({ step }) => getStepStatus(step) === "done",
        );
        return [
          {
            key: `curated:${rm.id}`,
            lastAt: progressMap[rm.id]?.updatedAt ?? "",
            underWay: !complete,
            render: (featured: boolean) => (
              <RoadmapCard
                roadmap={rm}
                featured={featured}
                players={popularity?.[rm.id]}
                onOpen={() => setSelectedId(rm.id)}
              />
            ),
          },
        ];
      }),
    [curated, progressMap, popularity],
  );

  const selectedStaticRoadmap = useMemo(
    () => roadmaps.find((r) => r.id === selectedId) ?? null,
    [selectedId],
  );

  const mergedRoadmap = useMemo(() => {
    if (!selectedStaticRoadmap || !userId) return null;
    return mergeWithProgress(
      selectedStaticRoadmap,
      progressMap[selectedStaticRoadmap.id] ?? null,
      userId,
    );
  }, [selectedStaticRoadmap, progressMap, userId]);

  const handlePersist = async (phases: RoadmapPhase[]) => {
    if (!userId || !selectedId) return;
    // What the map showed before this save — the last saved progress — so the
    // steps that just crossed into "done" can go to the activity log.
    const finished =
      mergedRoadmap && selectedStaticRoadmap
        ? newlyCompletedSteps(mergedRoadmap.phases, phases)
        : [];
    const advanced =
      !!mergedRoadmap && hasAdvancedStep(mergedRoadmap.phases, phases);
    const { stepProgress, resourceProgress, phaseChecks } =
      extractStepProgress(phases);
    await firebaseUpdateUserProgress(
      userId,
      selectedId,
      stepProgress,
      resourceProgress,
      phaseChecks,
    );
    if (advanced) dispatch(updateQuestProgress({ type: "roadmap_step" }));

    // Once per step per visit: ticking a step off, back on and off again
    // should not fill the feed with the same step.
    finished.forEach(({ step, phase }) => {
      const key = `${selectedId}:${step.id}`;
      if (loggedStepsRef.current.has(key)) return;
      loggedStepsRef.current.add(key);
      void firebaseAddRoadmapStepLog(userId, {
        roadmapId: selectedId,
        roadmapTitle: selectedStaticRoadmap?.title ?? "",
        phaseTitle: phase.title,
        stepId: step.id,
        stepTitle: step.title,
      });
    });

    const now = new Date().toISOString();
    queryClient.setQueryData<UserRoadmapProgress[]>(
      progressQueryKey(userId),
      (prev = []) => {
        const existing = prev.find((p) => p.roadmapId === selectedId);
        const updated: UserRoadmapProgress = {
          ...(existing ?? { roadmapId: selectedId, userId, startedAt: now }),
          stepProgress,
          resourceProgress,
          phaseChecks,
          updatedAt: now,
        };
        return existing
          ? prev.map((p) => (p.roadmapId === selectedId ? updated : p))
          : [...prev, updated];
      },
    );
  };

  /** Drop the deep link, or a refresh would reopen the roadmap. */
  const dropRoadmapQuery = () => {
    const {
      roadmap: _roadmap,
      roadmapId: _roadmapId,
      step: _step,
      ...query
    } = router.query;
    void router.replace({ pathname: router.pathname, query }, undefined, {
      shallow: true,
    });
  };

  const handleBack = () => {
    setSelectedId(null);
    dropRoadmapQuery();
  };

  const handlePlayerDetail = (open: boolean) => {
    setPlayerDetailOpen(open);
    if (
      !open &&
      (router.query.roadmap || router.query.roadmapId || router.query.step)
    ) {
      dropRoadmapQuery();
    }
  };

  // ─── A curated roadmap, open ───
  if (selectedStaticRoadmap && loadingProgress) {
    // Wait for saved progress to load before mounting RoadmapView — it only
    // reads its initial progress once, so mounting it with progressMap still
    // empty would make already-completed steps look forgotten.
    return (
      <div className='flex w-full flex-col'>
        <HeroBanner
          title={selectedStaticRoadmap.title}
          subtitle={t("goal", { goal: selectedStaticRoadmap.goal })}
          eyebrow={t("mastery_roadmap")}
          backgroundContent={<HeroPattern variant='ai' />}
          rightContent={<BackLink label={t("back")} onClick={handleBack} />}
        />
        <div
          className={cn("flex w-full flex-col gap-6 md:gap-8", PAGE_CONTENT)}
          aria-busy='true'>
          <Skeleton variant='block' className='h-48 md:h-56' />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} variant='block' className='h-20' />
          ))}
        </div>
      </div>
    );
  }

  if (mergedRoadmap && selectedStaticRoadmap) {
    return (
      <div className='flex w-full flex-col'>
        <HeroBanner
          title={mergedRoadmap.title}
          subtitle={t("goal", { goal: mergedRoadmap.goal })}
          eyebrow={t("mastery_roadmap")}
          backgroundContent={<HeroPattern variant='ai' />}
          rightContent={<BackLink label={t("back")} onClick={handleBack} />}
        />
        <div
          className={cn("flex w-full flex-col gap-6 md:gap-8", PAGE_CONTENT)}>
          <RoadmapView
            key={selectedStaticRoadmap.id}
            roadmap={mergedRoadmap}
            initialStepId={
              typeof router.query.step === "string"
                ? router.query.step
                : undefined
            }
            onPersist={handlePersist}
          />
        </div>
      </div>
    );
  }

  // ─── The lists ───
  // Until the player picks a tab the page opens on what they are on, and on
  // the curated shelf when they are on nothing yet. That takes the lists, so
  // no tab is picked for them while those are still coming.
  const listsLoading =
    loadingProgress ||
    isRosterLoading ||
    (isSupporter && playerRoadmapsQuery.isLoading);
  const hasOwn =
    startedCurated.length > 0 ||
    (playerRoadmapsQuery.data ?? []).some((summary) =>
      isViewersRoadmap(summary, userId),
    );
  const tab: RoadmapsTab | null =
    pickedTab ?? (listsLoading ? null : hasOwn ? "yours" : "mastery");

  const openBuilder = () => {
    // Without the badge there is nothing to open: the Players tab says why.
    if (!isSupporter) {
      setPickedTab("players");
      return;
    }
    setBuilderOpen(true);
  };

  return (
    <div className='flex w-full flex-col'>
      {!playerDetailOpen && (
        <>
          <HeroBanner
            title={t("hub.title")}
            subtitle={t("hub.intro")}
            eyebrowContent={
              <Breadcrumbs
                items={[
                  { label: t("practice"), href: "/timer" },
                  { label: t("hub.title") },
                ]}
              />
            }
            backgroundContent={<HeroPattern variant='ai' />}
            rightContent={
              <div className='flex flex-wrap items-center gap-3'>
                {isSupporter && board && (
                  <TokenWalletBar wallet={board.wallet} />
                )}
                <Button type='button' size='lg' onClick={openBuilder}>
                  {!isSupporter && !isRosterLoading && <Lock />}
                  {t("supporter:panel.generate.create")}
                </Button>
              </div>
            }
          />

          <div className={cn(PAGE_GUTTER, "pt-6")}>
            <SegmentedControl
              label={t("hub.title")}
              options={TABS.map((value) => ({
                value,
                label: t(`hub.tabs.${value}`),
              }))}
              selected={tab ? [tab] : []}
              onSelect={setPickedTab}
            />
          </div>
        </>
      )}

      <div
        className={cn(
          "flex w-full flex-col gap-6",
          !playerDetailOpen && PAGE_CONTENT,
        )}>
        {!playerDetailOpen && tab === null && (
          <div className={CARD_LIST} aria-busy='true'>
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} variant='block' className='h-36' />
            ))}
          </div>
        )}

        {!playerDetailOpen && tab === "mastery" && (
          <>
            {loadingProgress ? (
              <div className={CARD_LIST} aria-busy='true'>
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} variant='block' className='h-36' />
                ))}
              </div>
            ) : curated.length === 0 ? (
              <EmptyState icon={<MapIcon />} title={t("empty")} />
            ) : (
              <div className={CARD_LIST}>
                {curated.map((rm) => (
                  <RoadmapCard
                    key={rm.id}
                    roadmap={rm}
                    players={popularity?.[rm.id]}
                    onOpen={() => setSelectedId(rm.id)}
                  />
                ))}
              </div>
            )}

            <button
              type='button'
              onClick={() => setSuggestOpen(true)}
              className='flex w-full items-center gap-4 rounded-lg bg-zinc-900 px-5 py-4 text-left transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800/80'>
              <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800'>
                <Lightbulb className='h-4 w-4 text-zinc-400' />
              </span>
              <span>
                <span className='block text-sm font-semibold text-zinc-300'>
                  {t("suggest.title")}
                </span>
                <span className='block text-xs text-zinc-500'>
                  {t("suggest.body")}
                </span>
              </span>
            </button>
          </>
        )}

        {!playerDetailOpen &&
          tab === "players" &&
          !isSupporter &&
          (isRosterLoading ? (
            // The roster answers "not a supporter" until it lands.
            <Skeleton variant='block' className='h-72' />
          ) : (
            <PlayerRoadmapsLocked />
          ))}

        {/* Mounted on every tab: an open player's roadmap and a generation
            under way live in it. */}
        <UserRoadmapsTab
          enabled={isSupporter}
          wallet={board?.wallet}
          variant='page'
          section={
            tab === "yours"
              ? "own"
              : tab === "players" && isSupporter
                ? "board"
                : "none"
          }
          extraOwn={startedCurated}
          extraOwnLoading={loadingProgress}
          ownEmpty={
            <EmptyState
              icon={<MapIcon />}
              title={t("hub.yours_empty_title")}
              description={t("hub.yours_empty_body")}
              action={
                <Button
                  type='button'
                  variant='ghost'
                  size='lg'
                  onClick={() => setPickedTab("mastery")}>
                  {t("hub.tabs.mastery")}
                </Button>
              }
            />
          }
          builderOpen={builderOpen}
          onBuilderOpenChange={setBuilderOpen}
          onDetailChange={handlePlayerDetail}
          initialRoadmapId={linkedPlayerRoadmapId}
        />
      </div>

      <FeedbackModal
        isOpen={suggestOpen}
        onClose={() => setSuggestOpen(false)}
      />
    </div>
  );
};

export default AiCoachView;
