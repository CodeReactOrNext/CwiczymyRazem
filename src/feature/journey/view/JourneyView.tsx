import { Drawer, DrawerContent } from "assets/components/ui/drawer";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

import { fundamentalsModule, placeholderModules } from "../data/fundamentalsJourney";
import {
  firebaseCompleteJourneyStep,
  firebaseGetJourneyProgress,
  firebaseInitJourneyProgress,
  firebaseStartJourneyStep,
} from "../services/journey.service";
import type {
  JourneyModuleWithStatus,
  JourneyProgressDocument,
  JourneyStep,
  JourneyStepProgress,
  JourneyStepWithStatus,
} from "../types/journey.types";
import { JourneyPath } from "./components/JourneyPath";
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
  progressDoc: JourneyProgressDocument | null
): JourneyModuleWithStatus {
  const savedModule = progressDoc?.moduleProgress?.[fundamentalsModule.id];
  const allSteps = fundamentalsModule.stages.flatMap((s) => s.steps);
  const stepsWithStatus = mergeStepsWithProgress(allSteps, savedModule?.steps);

  const stages = fundamentalsModule.stages.map((stage) => ({
    ...stage,
    steps: stepsWithStatus.filter((s) => s.stageId === stage.id),
  }));

  const completedCount = stepsWithStatus.filter((s) => s.status === "completed").length;

  return {
    ...fundamentalsModule,
    stages,
    completedCount,
    totalCount: allSteps.length,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

const JourneyView: React.FC = () => {
  const userAuth = useAppSelector(selectUserAuth);
  const router = useRouter();

  const [progressDoc, setProgressDoc] = useState<JourneyProgressDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModuleSelection, setShowModuleSelection] = useState(true);
  const [selectedModuleId, setSelectedModuleId] = useState(fundamentalsModule.id);
  const [selectedStep, setSelectedStep] = useState<JourneyStepWithStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const examResultHandled = useRef(false);
  const queryApplied = useRef(false);

  const activeModule = useMemo(() => buildModuleWithStatus(progressDoc), [progressDoc]);

  useEffect(() => {
    if (!userAuth) return;
    setLoading(true);
    firebaseGetJourneyProgress(userAuth as string)
      .then(async (doc) => {
        if (!doc) {
          const initial = await firebaseInitJourneyProgress(userAuth as string);
          setProgressDoc(initial);
        } else {
          setProgressDoc(doc);
        }
      })
      .catch(() => {
        toast.error("Failed to load progress. Please refresh the page.");
      })
      .finally(() => setLoading(false));
  }, [userAuth]);

  // Restore module + step from URL query params (runs once after progress loads)
  useEffect(() => {
    if (loading || queryApplied.current) return;
    const { module: qModule, step: qStep } = router.query;
    if (!qModule) return;
    queryApplied.current = true;
    setSelectedModuleId(qModule as string);
    setShowModuleSelection(false);
    if (qStep) {
      const allSteps = activeModule.stages.flatMap((s) => s.steps);
      const found = allSteps.find((s) => s.id === qStep);
      if (found) {
        setSelectedStep(found);
        setIsModalOpen(true);
      }
    }
  }, [loading, router.query, activeModule]);

  // Handle returning from exam
  useEffect(() => {
    const { examResult, accuracy, module: qModule } = router.query;
    if (!examResult || examResultHandled.current || loading) return;
    examResultHandled.current = true;

    if (examResult === "fail") {
      toast.error(`Exam failed — score: ${accuracy}%. Practice more and try again!`);
    } else {
      const stars = Number(examResult);
      const starStr = "⭐".repeat(stars);
      toast.success(`Exam passed! ${starStr} — ${accuracy}% accuracy`);
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
        toast.success("Step completed! 🎸");
        handleCloseModal();
      } catch {
        setProgressDoc(prev);
        toast.error("Failed to save. Please try again.");
      } finally {
        setIsSaving(false);
      }
    },
    [userAuth, progressDoc, selectedModuleId, handleCloseModal]
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
    [userAuth, selectedModuleId]
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-cyan-500" />
          <p className="text-sm text-zinc-500">Loading progress...</p>
        </div>
      </div>
    );
  }

  if (showModuleSelection) {
    return (
      <ModuleSelectionScreen
        activeModule={activeModule}
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
        <DrawerContent className="fixed inset-y-0 right-0 left-auto mt-0 h-full w-full max-w-xl rounded-none border-l border-white/10 bg-zinc-950 shadow-2xl">
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
