import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Drawer, DrawerContent } from "assets/components/ui/drawer";
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
  JourneyModule,
  JourneyModuleWithStatus,
  JourneyProgressDocument,
  JourneyStep,
  JourneyStepProgress,
  JourneyStepWithStatus,
} from "../types/journey.types";
import { JourneyPath } from "./components/JourneyPath";
import { JourneyPathSkeleton, ModuleSelectionSkeleton } from "./components/JourneySkeletons";
import { ModuleSelectionScreen } from "./components/ModuleSelectionScreen";
import { StepSidebar } from "./components/StepSidebar";

// ─── Progress merging ─────────────────────────────────────────────────────────

function mergeStepsWithProgress(
  steps: JourneyStep[],
  savedSteps: Record<string, JourneyStepProgress> | undefined
): JourneyStepWithStatus[] {
  return steps.map((step) => {
    const saved = savedSteps?.[step.id];

    if (saved?.completed) return { ...step, status: "completed", stars: saved.stars };
    if (saved?.startedAt && !saved.completed) return { ...step, status: "in-progress" };
    if (step.order === 1) return { ...step, status: "available" };

    const prev = steps.find((s) => s.order === step.order - 1);
    if (prev && savedSteps?.[prev.id]?.completed) return { ...step, status: "available" };

    return { ...step, status: "locked" };
  });
}

function buildModuleWithStatus(
  module: JourneyModule,
  progressDoc: JourneyProgressDocument | null
): JourneyModuleWithStatus {
  const savedModule = progressDoc?.moduleProgress?.[module.id];
  const allSteps = module.stages.flatMap((s) => s.steps);
  const stepsWithStatus = mergeStepsWithProgress(allSteps, savedModule?.steps);

  const stages = module.stages.map((stage) => ({
    ...stage,
    steps: stepsWithStatus.filter((s) => s.stageId === stage.id),
  }));

  const completedCount = stepsWithStatus.filter((s) => s.status === "completed").length;

  return {
    ...module,
    stages,
    completedCount,
    totalCount: allSteps.length,
  };
}

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
  const [selectedStep, setSelectedStep] = useState<JourneyStepWithStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      const targetModule = journeyModules.find((m) => m.id === qModule) ?? modulesWithStatus[0];
      const targetWithStatus = modulesWithStatus.find((m) => m.id === targetModule.id);
      const allSteps = (targetWithStatus ?? buildModuleWithStatus(targetModule, progressDoc)).stages.flatMap((s) => s.steps);
      const found = allSteps.find((s) => s.id === qStep);
      if (found) {
        setSelectedStep(found);
        setIsModalOpen(true);
      }
    }
  }, [loading, router.query, modulesWithStatus, progressDoc]);

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

  const handleStepClick = useCallback((step: JourneyStepWithStatus) => {
    setSelectedStep(step);
    setIsModalOpen(true);
    router.push({ pathname: "/journey", query: { module: selectedModuleId, step: step.id } }, undefined, { shallow: true });
  }, [selectedModuleId, router]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedStep(null), 300);
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
        handleCloseModal();
      } catch {
        setProgressDoc(prev);
        toast.error(t("toast.save_failed"));
      } finally {
        setIsSaving(false);
      }
    },
    [userAuth, progressDoc, selectedModuleId, handleCloseModal, setProgressDoc]
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
        onStepClick={handleStepClick}
        onBack={() => {
          setShowModuleSelection(true);
          router.push({ pathname: "/journey" }, undefined, { shallow: true });
        }}
      />

      <Drawer 
        open={!!selectedStep} 
        onOpenChange={(open) => {
          if (!open) handleCloseModal();
        }}
        direction="right"
      >
        <DrawerContent className="fixed top-0 bottom-[100px] sm:bottom-0 right-0 left-auto mt-0 w-full max-w-xl rounded-none bg-zinc-950">
          {selectedStep && (
            <StepSidebar
              step={selectedStep}
              moduleId={selectedModuleId}
              onClose={handleCloseModal}
              onComplete={handleCompleteStep}
              onStart={handleStartStep}
              isSaving={isSaving}
            />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default JourneyView;
