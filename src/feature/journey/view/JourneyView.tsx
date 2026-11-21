import { useQuery, useQueryClient } from "@tanstack/react-query";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

import { journeyModules, placeholderModules } from "../data/journeyModules";
import {
  firebaseCompleteJourneyStep,
  firebaseGetJourneyProgress,
  firebaseInitJourneyProgress,
  firebaseStartJourneyStep,
} from "../services/journey.service";
import type {
  JourneyModuleWithStatus,
  JourneyProgressDocument,
  JourneyStepWithStatus,
} from "../types/journey.types";
import { buildModuleWithStatus } from "../utils/journeyStatus";
import { JourneyPath } from "./components/JourneyPath";
import { JourneyPathSkeleton, ModuleSelectionSkeleton } from "./components/JourneySkeletons";
import { JourneyStepBubble } from "./components/JourneyStepBubble";
import { ModuleSelectionScreen } from "./components/ModuleSelectionScreen";
import { StepLesson } from "./components/StepLesson";

// ─── Component ────────────────────────────────────────────────────────────────

const JourneyView: React.FC = () => {
  const { t } = useTranslation("journey");
  const userAuth = useAppSelector(selectUserAuth);
  const router = useRouter();

  const queryClient = useQueryClient();
  const progressQueryKey = useMemo(() => ["journeyProgress", userAuth], [userAuth]);
  // Cached, so coming back to Journey shows the path at once. Still re-read on
  // every visit: steps get finished elsewhere too (an exam in the session player).
  const {
    data: progressDoc = null,
    isPending: loading,
    isError,
  } = useQuery({
    queryKey: progressQueryKey,
    queryFn: async () =>
      (await firebaseGetJourneyProgress(userAuth as string)) ??
      (await firebaseInitJourneyProgress(userAuth as string)),
    enabled: !!userAuth,
    refetchOnMount: "always",
  });
  // Optimistic edits go straight into the cached document.
  const setProgressDoc = useCallback(
    (
      next:
        | JourneyProgressDocument
        | null
        | ((current: JourneyProgressDocument | null) => JourneyProgressDocument | null)
    ) =>
      queryClient.setQueryData<JourneyProgressDocument | null>(progressQueryKey, (current) =>
        typeof next === "function" ? next(current ?? null) : next
      ),
    [queryClient, progressQueryKey]
  );
  // Seeded from the URL, not only by the effect below: with the progress cached,
  // the first render is already the real one and must not flash the module list.
  const [showModuleSelection, setShowModuleSelection] = useState(() => !router.query.module);
  const [selectedModuleId, setSelectedModuleId] = useState(() =>
    typeof router.query.module === "string" ? router.query.module : journeyModules[0].id
  );
  // The step whose bubble is open on the road, and the one read full screen.
  const [openStepId, setOpenStepId] = useState<string | null>(null);
  const [lessonStepId, setLessonStepId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const examResultHandled = useRef(false);
  const queryApplied = useRef(false);

  const modulesWithStatus = useMemo<JourneyModuleWithStatus[]>(
    () => journeyModules.map((m) => buildModuleWithStatus(m, progressDoc)),
    [progressDoc]
  );
  const activeModule = useMemo(
    () => modulesWithStatus.find((m) => m.id === selectedModuleId) ?? modulesWithStatus[0],
    [modulesWithStatus, selectedModuleId]
  );
  // Looked up every render, so a step finished in the meantime shows as finished.
  const lessonStep = useMemo(
    () => activeModule.stages.flatMap((s) => s.steps).find((s) => s.id === lessonStepId) ?? null,
    [activeModule, lessonStepId]
  );

  useEffect(() => {
    if (isError) toast.error(t("toast.load_failed"));
  }, [isError, t]);

  // Restore module + step from URL query params (runs once after progress loads)
  useEffect(() => {
    if (loading || queryApplied.current) return;
    const { module: qModule, step: qStep } = router.query;
    if (!qModule) return;
    queryApplied.current = true;
    setSelectedModuleId(qModule as string);
    setShowModuleSelection(false);
    if (qStep) {
      // Look up the raw module directly (not the status-decorated `activeModule`,
      // which still reflects the PREVIOUS selectedModuleId in this same render —
      // setSelectedModuleId above hasn't flushed yet).
      const targetModule = journeyModules.find((m) => m.id === qModule) ?? journeyModules[0];
      const found = targetModule.stages.flatMap((s) => s.steps).some((s) => s.id === qStep);
      if (found) {
        setOpenStepId(qStep as string);
        // Back from an exam the bubble is enough (Retake is in it); the lesson
        // opens straight away only for a link to the step itself.
        if (!router.query.examResult) setLessonStepId(qStep as string);
      }
    }
  }, [loading, router.query]);

  // Handle returning from exam
  useEffect(() => {
    const { examResult, accuracy, module: qModule } = router.query;
    if (!examResult || examResultHandled.current || loading) return;
    examResultHandled.current = true;

    if (examResult === "fail") {
      toast.error(t("toast.exam_failed", { accuracy }));
    } else {
      const stars = Number(examResult);
      const starStr = "⭐".repeat(stars);
      toast.success(t("toast.exam_passed", { stars: starStr, accuracy }));
      if (userAuth) {
        firebaseGetJourneyProgress(userAuth as string).then((doc) => {
          if (doc) setProgressDoc(doc);
        });
      }
      if (qModule) {
        setSelectedModuleId(qModule as string);
        setShowModuleSelection(false);
      }
    }
    router.replace({ pathname: "/journey", query: qModule ? { module: qModule } : {} }, undefined, { shallow: true });
  }, [router.query, loading, userAuth]);

  // A tap on the road opens the step's bubble; a second tap folds it away.
  const handleStepClick = useCallback((step: JourneyStepWithStatus) => {
    setOpenStepId((current) => (current === step.id ? null : step.id));
  }, []);

  const handleOpenLesson = useCallback((step: JourneyStepWithStatus) => {
    setLessonStepId(step.id);
    router.push({ pathname: "/journey", query: { module: selectedModuleId, step: step.id } }, undefined, { shallow: true });
  }, [selectedModuleId, router]);

  // Back on the road with the bubble still open, so the exercise is one tap away.
  const handleCloseLesson = useCallback(() => {
    setLessonStepId(null);
    router.push({ pathname: "/journey", query: { module: selectedModuleId } }, undefined, { shallow: true });
  }, [selectedModuleId, router]);

  const handleCompleteStep = useCallback(
    async (stepId: string) => {
      if (!userAuth || !progressDoc) return;
      setIsSaving(true);

      const prev = progressDoc;
      setProgressDoc((current) => {
        if (!current) return current;
        return {
          ...current,
          moduleProgress: {
            ...current.moduleProgress,
            [selectedModuleId]: {
              steps: {
                ...current.moduleProgress?.[selectedModuleId]?.steps,
                [stepId]: { completed: true, completedAt: new Date().toISOString() },
              },
            },
          },
        };
      });

      try {
        await firebaseCompleteJourneyStep(userAuth as string, selectedModuleId, stepId);
        toast.success(t("toast.step_completed"));
        handleCloseLesson();
        setOpenStepId(null);
      } catch {
        setProgressDoc(prev);
        toast.error(t("toast.save_failed"));
      } finally {
        setIsSaving(false);
      }
    },
    [userAuth, progressDoc, selectedModuleId, handleCloseLesson, setProgressDoc]
  );

  const handleStartStep = useCallback(
    async (stepId: string) => {
      if (!userAuth) return;

      setProgressDoc((current) => {
        if (!current) return current;
        const existing = current.moduleProgress?.[selectedModuleId]?.steps?.[stepId];
        if (existing) return current;
        return {
          ...current,
          moduleProgress: {
            ...current.moduleProgress,
            [selectedModuleId]: {
              steps: {
                ...current.moduleProgress?.[selectedModuleId]?.steps,
                [stepId]: { completed: false, startedAt: new Date().toISOString() },
              },
            },
          },
        };
      });

      try {
        await firebaseStartJourneyStep(userAuth as string, selectedModuleId, stepId);
      } catch {
        // Silent fail — not critical
      }
    },
    [userAuth, selectedModuleId, setProgressDoc]
  );

  const handlePractice = useCallback(
    async (step: JourneyStepWithStatus) => {
      if (step.status === "available") await handleStartStep(step.id);
      router.push({
        pathname: `/practice/exercise/${step.suggestedExerciseId}`,
        query: { stepId: step.id, moduleId: selectedModuleId },
      });
    },
    [handleStartStep, router, selectedModuleId]
  );

  const handleExam = useCallback(
    async (step: JourneyStepWithStatus) => {
      if (step.status === "available") await handleStartStep(step.id);
      router.push({
        pathname: `/practice/exercise/${step.suggestedExerciseId}`,
        query: { mode: "exam", bpm: step.examBpm ?? 60, stepId: step.id, moduleId: selectedModuleId },
      });
    },
    [handleStartStep, router, selectedModuleId]
  );

  if (loading) {
    // A link straight into a module (back from an exam, a shared step) opens on
    // the path; everything else on the module list.
    return router.query.module ? <JourneyPathSkeleton /> : <ModuleSelectionSkeleton />;
  }

  if (showModuleSelection) {
    return (
      <ModuleSelectionScreen
        modules={modulesWithStatus}
        placeholders={placeholderModules}
        onSelectModule={(id) => {
          setSelectedModuleId(id);
          setShowModuleSelection(false);
          router.push({ pathname: "/journey", query: { module: id } }, undefined, { shallow: true });
        }}
      />
    );
  }

  return (
    <div className="relative h-full min-h-screen bg-zinc-950 overflow-x-hidden">
      <JourneyPath
        module={activeModule}
        openStepId={openStepId}
        onStepClick={handleStepClick}
        renderBubble={(step, pointerOffset) => (
          <JourneyStepBubble
            step={step}
            pointerOffset={pointerOffset}
            onOpenLesson={() => handleOpenLesson(step)}
            onPractice={() => handlePractice(step)}
            onExam={() => handleExam(step)}
          />
        )}
        onBack={() => {
          setOpenStepId(null);
          setShowModuleSelection(true);
          router.push({ pathname: "/journey" }, undefined, { shallow: true });
        }}
      />

      <StepLesson
        step={lessonStep}
        onClose={handleCloseLesson}
        onComplete={handleCompleteStep}
        onPractice={handlePractice}
        onExam={handleExam}
        isSaving={isSaving}
      />
    </div>
  );
};

export default JourneyView;
