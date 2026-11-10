import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { useTranslation } from "hooks/useTranslation";
import { Timer } from "lucide-react";

import { TimingCalibrationPanel } from "../../TimingCalibrationDialog";
import { CloseButton } from "./CloseButton";

interface TimingStepProps {
  audioRefs:         AudioRefs;
  audioContext:      AudioContext | null;
  isListening:       boolean;
  isNative:          boolean;
  estimateLatencyMs: () => number;
  onBeforeStart:     () => void;
  onEnableMic:       () => void;
  /** Measured and kept. */
  onDone:            (latencyMs: number) => void;
  /** Left on the estimate. */
  onSkip:            () => void;
  onCancel:          () => void;
}

/**
 * The timing measurement as a setup step: on a first run nothing has been
 * measured yet, and without it timing grades lean on a formula estimate of
 * this machine's latency.
 */
export const TimingStep = ({
  audioRefs, audioContext, isListening, isNative, estimateLatencyMs, onBeforeStart, onEnableMic,
  onDone, onSkip, onCancel,
}: TimingStepProps) => {
  const { t } = useTranslation(["calibration", "session"]);
  return (
    <div className="flex flex-1 flex-col px-5 py-5 text-white sm:px-12 sm:py-10 shortwide:px-8 shortwide:py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Timer className="h-4 w-4 text-zinc-400" />
          <h2 className="text-lg font-bold tracking-tight">{t("session:timing.title")}</h2>
        </div>
        <CloseButton onClick={onCancel} label={t("calibration:close")} />
      </div>

      <TimingCalibrationPanel
        audioRefs={audioRefs}
        audioContext={audioContext}
        isListening={isListening}
        isNative={isNative}
        estimateLatencyMs={estimateLatencyMs}
        onEnableMic={onEnableMic}
        onBeforeStart={onBeforeStart}
        onSaved={onDone}
      />

      <button
        type="button"
        onClick={onSkip}
        className="mt-6 py-2 text-center text-xs text-zinc-500 transition-colors hover:text-zinc-300 shortwide:mt-2"
      >
        {t("calibration:timing_step.skip")}
      </button>
    </div>
  );
};
