import { useRouter } from "next/router";
import { useState } from "react";
import { useAppSelector } from "store/hooks";
import { selectUserAuth } from "feature/user/store/userSlice";
import { toggleBpmStage } from "feature/exercisePlan/services/bpmProgressService";

interface ExamModeBannerProps {
  examMode: { requiredBpm: number; nodeId?: string };
  exerciseId: string;
  exerciseTitle: string;
}

export function ExamModeBanner({ examMode, exerciseId, exerciseTitle }: ExamModeBannerProps) {
  const { requiredBpm, nodeId } = examMode;
  const router = useRouter();
  const userId = useAppSelector(selectUserAuth);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitExam = async () => {
    if (!userId || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await toggleBpmStage(
        userId,
        exerciseId,
        requiredBpm,
        `${exerciseTitle} - ${requiredBpm} BPM Exam`,
        "theory"
      );

      // Małe opóźnienie aby pokazaćSuccess state
      await new Promise(resolve => setTimeout(resolve, 500));

      // Powrót do scale tree
      router.back();
    } catch (error) {
      console.error("Exam submission failed:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-r from-amber-900/80 to-amber-950/80 backdrop-blur border-b border-amber-700/30 px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-200 mb-1">
            🎯 Exam Mode
          </p>
          <h3 className="text-lg font-bold text-amber-50">
            Play at <span className="text-amber-300">{requiredBpm} BPM</span> to Unlock
          </h3>
          <p className="text-xs text-amber-200/70 mt-1">
            When ready, click Submit Exam to confirm completion
          </p>
        </div>

        <button
          onClick={handleSubmitExam}
          disabled={isSubmitting}
          className="ml-6 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
        >
          {isSubmitting ? "Submitting..." : "Submit Exam"}
        </button>
      </div>
    </div>
  );
}
