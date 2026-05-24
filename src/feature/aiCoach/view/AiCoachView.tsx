import { HeroBanner } from "components/UI/HeroBanner";
import { FeedbackModal } from "components/FeedbackBubble/FeedbackBubble";
import roadmaps from "data/roadmaps";
import {
  firebaseGetAllUserProgress,
  firebaseUpdateUserProgress,
  type UserRoadmapProgress,
} from "feature/aiCoach/services/userProgress.service";
import { selectUserAuth } from "feature/user/store/userSlice";
import { ArrowLeft, Lightbulb, Loader2, Map } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";

import type { Roadmap, RoadmapPhase, StaticRoadmap } from "../types/roadmap.types";
import RoadmapCard from "./RoadmapCard/RoadmapCard";
import RoadmapView from "./RoadmapView/RoadmapView";

function mergeWithProgress(
  roadmap: StaticRoadmap,
  progress: UserRoadmapProgress | null,
  userId: string
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
      })),
    })),
  };
}

const AiCoachView = () => {
  const userAuth = useAppSelector(selectUserAuth);

  const [progressMap, setProgressMap] = useState<Record<string, UserRoadmapProgress>>({});
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);

  useEffect(() => {
    if (!userAuth) return;
    setLoadingProgress(true);
    firebaseGetAllUserProgress(userAuth as string)
      .then((all) => {
        const map: Record<string, UserRoadmapProgress> = {};
        all.forEach((p) => { map[p.roadmapId] = p; });
        setProgressMap(map);
      })
      .catch(console.error)
      .finally(() => setLoadingProgress(false));
  }, [userAuth]);

  const selectedStaticRoadmap = useMemo(
    () => roadmaps.find((r) => r.id === selectedId) ?? null,
    [selectedId]
  );

  const mergedRoadmap = useMemo(() => {
    if (!selectedStaticRoadmap || !userAuth) return null;
    return mergeWithProgress(
      selectedStaticRoadmap,
      progressMap[selectedStaticRoadmap.id] ?? null,
      userAuth as string
    );
  }, [selectedStaticRoadmap, progressMap, userAuth]);

  const handlePersist = async (phases: RoadmapPhase[]) => {
    if (!userAuth || !selectedId) return;
    const stepProgress: Record<string, number> = {};
    phases.forEach((p) => p.steps.forEach((s) => { stepProgress[s.id] = s.sessionsCompleted; }));
    await firebaseUpdateUserProgress(userAuth as string, selectedId, stepProgress);
    setProgressMap((prev) => ({
      ...prev,
      [selectedId]: {
        ...(prev[selectedId] ?? { roadmapId: selectedId, userId: userAuth as string, startedAt: new Date().toISOString() }),
        stepProgress,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  // ─── Detail view ───
  if (mergedRoadmap && selectedStaticRoadmap) {
    return (
      <div className="flex w-full flex-col">
        <HeroBanner
          title={mergedRoadmap.title}
          subtitle={`Goal: ${mergedRoadmap.goal}`}
          eyebrow="Roadmap"
          className="w-full !rounded-none !shadow-none min-h-[100px] md:min-h-[90px] lg:min-h-[100px]"
          rightContent={
            <button
              onClick={() => setSelectedId(null)}
              className="flex w-fit items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          }
        />
        <div className="mx-auto flex w-full flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-10 lg:p-12">
          <RoadmapView
            roadmap={mergedRoadmap}
            onDelete={() => {}}
            onPersist={handlePersist}
          />
        </div>
      </div>
    );
  }

  // ─── List view ───
  return (
    <div className="flex w-full flex-col">
      <HeroBanner
        title="Roadmap"
        subtitle="Your personalized guitar learning plans."
        eyebrow="AI Coach"
        className="w-full !rounded-none !shadow-none min-h-[100px] md:min-h-[90px] lg:min-h-[100px]"
      />
      <div className="mx-auto flex w-full flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-10 lg:p-12">
        {loadingProgress ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-500" />
          </div>
        ) : roadmaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-zinc-700">
            <Map className="h-10 w-10 opacity-30" />
            <span className="text-sm">No roadmaps available yet.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {roadmaps.map((rm) => {
              const merged = mergeWithProgress(rm, progressMap[rm.id] ?? null, userAuth as string);
              return (
                <RoadmapCard
                  key={rm.id}
                  roadmap={merged}
                  onOpen={() => setSelectedId(rm.id)}
                  onDelete={() => {}}
                />
              );
            })}
          </div>
        )}

        {/* ─── Suggest a roadmap ─── */}
        <button
          onClick={() => setSuggestOpen(true)}
          className="mt-2 flex w-full items-center gap-4 rounded-lg bg-zinc-900/40 px-5 py-4 text-left transition hover:bg-zinc-900/70"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
            <Lightbulb className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-300">Suggest a roadmap</p>
            <p className="text-xs text-zinc-600">Missing a topic? Let us know what you'd like to see next.</p>
          </div>
        </button>

        <FeedbackModal isOpen={suggestOpen} onClose={() => setSuggestOpen(false)} />
      </div>
    </div>
  );
};

export default AiCoachView;
