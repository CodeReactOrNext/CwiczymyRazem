import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Breadcrumbs } from "components/Breadcrumbs/Breadcrumbs";
import { FeedbackModal } from "components/FeedbackBubble/FeedbackBubble";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import roadmaps from "data/roadmaps";
import {
  firebaseGetAllUserProgress,
  firebaseUpdateUserProgress,
  type UserRoadmapProgress,
  type UserRoadmapStepResourceProgress,
} from "feature/aiCoach/services/userProgress.service";
import { selectUserAuth } from "feature/user/store/userSlice";
import { ArrowLeft, Lightbulb, Loader2, Map } from "lucide-react";
import { useRouter } from "next/router";
import React, { useMemo, useState } from "react";
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
    phases: roadmap.phases.map((phase) => ({
      ...phase,
      steps: phase.steps.map((step) => ({
        ...step,
        sessionsCompleted: progress?.stepProgress[step.id] ?? 0,
        exerciseCompleted:
          progress?.resourceProgress?.[step.id]?.exerciseCompleted ?? false,
        completedLessonIds:
          progress?.resourceProgress?.[step.id]?.completedLessonIds ?? [],
      })),
    })),
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
    const stepProgress: Record<string, number> = {};
    const resourceProgress: Record<string, UserRoadmapStepResourceProgress> =
      {};
    phases.forEach((p) =>
      p.steps.forEach((s) => {
        stepProgress[s.id] = s.sessionsCompleted;
        resourceProgress[s.id] = {
          exerciseCompleted: s.exerciseCompleted,
          completedLessonIds: s.completedLessonIds,
        };
      }),
    );
    await firebaseUpdateUserProgress(
      userId,
      selectedId,
      stepProgress,
      resourceProgress,
    );

    const now = new Date().toISOString();
    queryClient.setQueryData<UserRoadmapProgress[]>(
      progressQueryKey(userId),
      (prev = []) => {
        const existing = prev.find((p) => p.roadmapId === selectedId);
        const updated: UserRoadmapProgress = {
          ...(existing ?? { roadmapId: selectedId, userId, startedAt: now }),
          stepProgress,
          resourceProgress,
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
      <div className='mx-auto flex w-full flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-10 lg:p-12'>
        {loadingProgress ? (
          <div className='flex justify-center py-16'>
            <Loader2 className='h-7 w-7 animate-spin text-cyan-500' />
          </div>
        ) : roadmaps.length === 0 ? (
          <div className='flex flex-col items-center justify-center gap-3 py-20 text-zinc-500'>
            <Map className='h-10 w-10 opacity-30' />
            <span className='text-sm'>No mastery roadmaps available yet.</span>
          </div>
        ) : (
          <div className='flex flex-col gap-4'>
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
      </div>
    </div>
  );
};

export default AiCoachView;
