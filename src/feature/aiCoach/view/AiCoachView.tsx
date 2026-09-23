import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "assets/lib/utils";
import { Breadcrumbs } from "components/Breadcrumbs/Breadcrumbs";
import { FeedbackModal } from "components/FeedbackBubble/FeedbackBubble";
import { tabNavItemClass, tabNavListClass } from "components/PageTabs/tabNav";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import roadmaps from "data/roadmaps";
import {
  firebaseGetAllUserProgress,
  firebaseUpdateUserProgress,
  type UserRoadmapProgress,
} from "feature/aiCoach/services/userProgress.service";
import { newlyCompletedSteps } from "feature/aiCoach/utils/completedSteps";
import { withPhaseChecks } from "feature/aiCoach/utils/phaseCheck";
import { extractStepProgress } from "feature/aiCoach/utils/roadmapProgress";
import { PlayerRoadmapsLocked } from "feature/aiCoach/view/PlayerRoadmapsLocked";
import { firebaseAddRoadmapStepLog } from "feature/logs/services/addRoadmapStepLog.service";
import { UserRoadmapsTab } from "feature/supporterPanel/components/UserRoadmapsTab";
import { useSupporterRoadmap } from "feature/supporterPanel/hooks/useSupporterRoadmap";
import { useSupportTeam } from "feature/supportTeam/hooks/useSupportTeam";
import { selectUserAuth } from "feature/user/store/userSlice";
import {
  ArrowLeft,
  Compass,
  Lightbulb,
  Loader2,
  Lock,
  Map,
} from "lucide-react";
import { useRouter } from "next/router";
import React, { useMemo, useRef, useState } from "react";
import { useAppSelector } from "store/hooks";

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

type CoachTab = "mastery" | "players";

const isCoachTab = (value: unknown): value is CoachTab =>
  value === "mastery" || value === "players";

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
        })),
      })),
      progress?.phaseChecks,
    ),
  };
}

const AiCoachView = () => {
  const userAuth = useAppSelector(selectUserAuth);
  const userId = typeof userAuth === "string" ? userAuth : null;
  const router = useRouter();
  const queryClient = useQueryClient();

  // `?roadmapId=` is the entry point (a deep link or a return trip); from then on the view owns it.
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const id = router.query.roadmapId;
    return typeof id === "string" && roadmaps.some((r) => r.id === id)
      ? id
      : null;
  });
  const [suggestOpen, setSuggestOpen] = useState(false);
  // A player roadmap open on its own takes the whole page, like a curated one.
  // A notification link (?roadmap=) opens straight onto one.
  const [linkedRoadmapId] = useState<string | null>(() =>
    typeof router.query.roadmap === "string" ? router.query.roadmap : null,
  );
  const [playerDetailOpen, setPlayerDetailOpen] = useState(
    () => linkedRoadmapId !== null && router.query.tab === "players",
  );

  const handlePlayerDetail = (open: boolean) => {
    setPlayerDetailOpen(open);
    // Drop the deep link on the way back, or a refresh reopens the roadmap.
    if (!open && router.query.roadmap) {
      const { roadmap: _dropped, ...query } = router.query;
      void router.replace({ pathname: router.pathname, query }, undefined, {
        shallow: true,
      });
    }
  };
  const [tab, setTab] = useState<CoachTab>(() =>
    isCoachTab(router.query.tab) ? router.query.tab : "mastery",
  );

  const { isSupport, isLoading: isRosterLoading } = useSupportTeam();
  const isSupporter = isSupport(userAuth);
  // Only for the wallet on the generator card — the route 403s without the badge.
  const { data: board } = useSupporterRoadmap(isSupporter && tab === "players");

  const openTab = (next: CoachTab) => {
    setTab(next);
    void router.replace(
      { pathname: router.pathname, query: { ...router.query, tab: next } },
      undefined,
      { shallow: true },
    );
  };

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

  const sortedRoadmaps = useMemo(() => sortByDifficulty(roadmaps), []);

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
    const { stepProgress, resourceProgress, phaseChecks } =
      extractStepProgress(phases);
    await firebaseUpdateUserProgress(
      userId,
      selectedId,
      stepProgress,
      resourceProgress,
      phaseChecks,
    );

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

  const handleBack = () => {
    setSelectedId(null);
    // Drop the deep link too, or a refresh would reopen the roadmap.
    void router.replace({ pathname: router.pathname }, undefined, {
      shallow: true,
    });
  };

  // ─── Detail view ───
  if (selectedStaticRoadmap && loadingProgress) {
    // Wait for saved progress to load before mounting RoadmapView — it only
    // reads its initial progress once, so mounting it with progressMap still
    // empty would make already-completed steps look forgotten.
    return (
      <div className='flex justify-center py-16'>
        <Loader2 className='h-7 w-7 animate-spin text-cyan-500' />
      </div>
    );
  }

  if (mergedRoadmap && selectedStaticRoadmap) {
    return (
      <div className='flex w-full flex-col'>
        <HeroBanner
          title={mergedRoadmap.title}
          subtitle={`Goal: ${mergedRoadmap.goal}`}
          eyebrow='Mastery Roadmap'
          backgroundContent={<HeroPattern variant='ai' />}
          className='min-h-[100px] w-full !rounded-none !shadow-none md:min-h-[90px] lg:min-h-[100px]'
          rightContent={
            <button
              onClick={handleBack}
              className='flex w-fit items-center gap-2 rounded-lg bg-zinc-900/60 px-4 py-2 text-sm text-zinc-400 transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800 hover:text-zinc-200'>
              <ArrowLeft className='h-4 w-4' />
              Back
            </button>
          }
        />
        <div className='mx-auto flex w-full flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-10 lg:p-12'>
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

  // ─── List view ───
  return (
    <div className='flex w-full flex-col'>
      {!playerDetailOpen && (
        <HeroBanner
          title='Mastery Roadmaps'
          subtitle='Your personalized guitar mastery roadmaps.'
          eyebrowContent={
            <Breadcrumbs
              items={[
                { label: "Practice", href: "/timer" },
                { label: "Mastery Roadmaps" },
              ]}
            />
          }
          backgroundContent={<HeroPattern variant='ai' />}
          className='min-h-[100px] w-full !rounded-none !shadow-none md:min-h-[90px] lg:min-h-[100px]'
        />
      )}
      {/* Same element either way, so the open roadmap survives the switch. */}
      <div
        className={cn(
          !playerDetailOpen &&
            "mx-auto flex w-full flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-10 lg:p-12",
        )}>
        {!playerDetailOpen && (
          <div className={tabNavListClass}>
            <button
              type='button'
              onClick={() => openTab("mastery")}
              aria-pressed={tab === "mastery"}
              className={tabNavItemClass(tab === "mastery")}>
              <Map size={16} className='shrink-0' />
              Mastery Roadmaps
            </button>
            <button
              type='button'
              onClick={() => openTab("players")}
              aria-pressed={tab === "players"}
              className={tabNavItemClass(tab === "players")}>
              <Compass size={16} className='shrink-0' />
              Player Roadmaps
              {!isRosterLoading && !isSupporter && (
                <Lock size={13} className='shrink-0 text-amber-400/80' />
              )}
            </button>
          </div>
        )}

        {tab === "players" ? (
          isRosterLoading ? (
            // The roster answers "not a supporter" until it lands.
            <div className='h-72 animate-pulse rounded-lg bg-zinc-900/40' />
          ) : isSupporter ? (
            <UserRoadmapsTab
              enabled={isSupporter}
              wallet={board?.wallet}
              variant='page'
              onDetailChange={handlePlayerDetail}
              initialRoadmapId={linkedRoadmapId}
            />
          ) : (
            <PlayerRoadmapsLocked />
          )
        ) : (
          <>
            {loadingProgress ? (
              <div className='flex justify-center py-16'>
                <Loader2 className='h-7 w-7 animate-spin text-cyan-500' />
              </div>
            ) : roadmaps.length === 0 ? (
              <div className='flex flex-col items-center justify-center gap-3 py-20 text-zinc-500'>
                <Map className='h-10 w-10 opacity-30' />
                <span className='text-sm'>
                  No mastery roadmaps available yet.
                </span>
              </div>
            ) : (
              <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                {sortedRoadmaps.map((rm) => {
                  const merged = mergeWithProgress(
                    rm,
                    progressMap[rm.id] ?? null,
                    userId ?? "",
                  );
                  return (
                    <RoadmapCard
                      key={rm.id}
                      roadmap={merged}
                      onOpen={() => setSelectedId(rm.id)}
                    />
                  );
                })}
              </div>
            )}

            {/* ─── Suggest a roadmap ─── */}
            <button
              onClick={() => setSuggestOpen(true)}
              className='mt-2 flex w-full items-center gap-4 rounded-lg bg-zinc-900/40 px-5 py-4 text-left transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-900/70'>
              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800'>
                <Lightbulb className='h-4 w-4 text-zinc-400' />
              </div>
              <div>
                <p className='text-sm font-semibold text-zinc-300'>
                  Suggest a roadmap
                </p>
                <p className='text-xs text-zinc-500'>
                  Missing a topic? Let us know what you&apos;d like to see next.
                </p>
              </div>
            </button>

            <FeedbackModal
              isOpen={suggestOpen}
              onClose={() => setSuggestOpen(false)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default AiCoachView;
