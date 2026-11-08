import { AnimatePresence, motion } from "framer-motion";
import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { useGuitarTuningContext } from "../../contexts/GuitarTuningContext";
import { useCalibratedLatencyMs } from "../../hooks/useTimingCalibration";
import { buildStringRefs, sustainTestTarget } from "./calibration.constants";
import { MicErrorScreen } from "./components/MicErrorScreen";
import { PermissionStep } from "./components/PermissionStep";
import { SetupStep } from "./components/SetupStep";
import { type InputSource, SourceStep } from "./components/SourceStep";
import { type SetupSummary, SummaryStep } from "./components/SummaryStep";
import { SustainStep, type SustainTarget } from "./components/SustainStep";
import { TimingStep } from "./components/TimingStep";
import { TuningStep } from "./components/TuningStep";

interface CalibrationWizardProps {
  isOpen:            boolean;
  /** Setup finished — the mic goes on. */
  onComplete:        () => void;
  onCancel:          () => void;
  audioInit:         () => Promise<void>;
  audioRefs:         AudioRefs;
  isListening:       boolean;
  inputGain:         number;
  onInputGainChange: (gain: number) => void;
  isNative:          boolean;
  onSelectDevice?:   (deviceId: number) => Promise<void>;
  onSelectChannel?:  (channel: number) => Promise<void>;
  /** The session metronome's context, so the timing clicks take the session's output path. */
  timingAudioContext: AudioContext | null;
  /** Formula latency, used until the player measures theirs. */
  estimateLatencyMs: () => number;
  /** Stops the session's own playback before the timing run's clicks. */
  onBeforeTimingRun: () => void;
}

type Step = "source" | "permission" | "setup" | "sustain" | "tuning" | "timing" | "summary";

const SLIDE = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.18 },
};

const WizardBody = ({
  onComplete, onCancel, audioInit, audioRefs, isListening, inputGain, onInputGainChange,
  isNative, onSelectDevice, onSelectChannel, timingAudioContext, estimateLatencyMs, onBeforeTimingRun,
}: CalibrationWizardProps) => {
  // Native (Electron) capture has no "interface vs. microphone" distinction
  // (it's one device list) and no browser permission prompt — it starts at
  // device selection instead of the web-only source/permission steps.
  const [step,        setStep]        = useState<Step>(isNative ? "setup" : "source");
  const [inputSource, setInputSource] = useState<InputSource>("interface");
  const [isGranting,  setIsGranting]  = useState(false);
  const [micError,    setMicError]    = useState(false);
  const [summary,     setSummary]     = useState<SetupSummary | null>(null);
  const [tunedCount,  setTunedCount]  = useState<number | null>(null);

  const { tuning } = useGuitarTuningContext();
  const strings = useMemo(() => buildStringRefs(tuning), [tuning]);
  const sustainTarget = useMemo<SustainTarget>(() => sustainTestTarget(strings), [strings]);
  const savedLatencyMs = useCalibratedLatencyMs(isNative);

  const handleGrant = useCallback(async () => {
    setIsGranting(true);
    try {
      await audioInit();
      setStep("setup");
    }
    catch { setMicError(true); }
    finally { setIsGranting(false); }
  }, [audioInit]);

  const showSummary = useCallback((count: number | null, measuredMs: number | null) => {
    const latencyMs = measuredMs ?? savedLatencyMs;
    setSummary({
      tunedCount: count,
      stringCount: strings.length,
      latencyMs: latencyMs ?? Math.round(estimateLatencyMs()),
      latencyMeasured: latencyMs !== null,
    });
    setStep("summary");
  }, [savedLatencyMs, strings.length, estimateLatencyMs]);

  // Timing is only asked for while this input path has never been measured.
  const afterTuning = useCallback((count: number | null) => {
    setTunedCount(count);
    if (savedLatencyMs === null) setStep("timing");
    else showSummary(count, null);
  }, [savedLatencyMs, showSummary]);

  return (
    <div className="fixed inset-0 z-[99999999] flex items-center justify-center bg-black/80 font-openSans">
      <div role="dialog" aria-modal="true" className="relative mx-4 flex max-h-[92dvh] min-h-[min(760px,92dvh)] w-full max-w-3xl flex-col overflow-y-auto rounded-lg bg-zinc-950">
        {micError ? (
          <MicErrorScreen onRetry={() => { setMicError(false); void handleGrant(); }} onCancel={onCancel} />
        ) : (
          <AnimatePresence mode="wait">
            {step === "source" && (
              <motion.div key="source" {...SLIDE} className="flex flex-1 flex-col" initial={{ opacity: 0 }}>
                <SourceStep
                  onSelect={(source) => {
                    setInputSource(source);
                    setStep(isListening ? "setup" : "permission");
                  }}
                  onCancel={onCancel}
                />
              </motion.div>
            )}
            {step === "permission" && (
              <motion.div key="permission" {...SLIDE} className="flex flex-1 flex-col">
                <PermissionStep
                  isLoading={isGranting}
                  onGrant={handleGrant}
                  onBack={() => setStep("source")}
                  onCancel={onCancel}
                />
              </motion.div>
            )}
            {step === "setup" && (
              <motion.div key="setup" {...SLIDE} className="flex flex-1 flex-col">
                <SetupStep
                  isListening={isListening} isLoading={isGranting}
                  inputSource={inputSource}
                  audioRefs={audioRefs} inputGain={inputGain}
                  isNative={isNative} onSelectDevice={onSelectDevice} onSelectChannel={onSelectChannel}
                  onGrant={handleGrant}
                  onNext={() => setStep("sustain")}
                  onBack={() => (isNative ? onCancel() : setStep(isListening ? "source" : "permission"))}
                  onCancel={onCancel}
                />
              </motion.div>
            )}
            {step === "sustain" && (
              <motion.div key="sustain" {...SLIDE} className="flex flex-1 flex-col">
                <SustainStep
                  audioRefs={audioRefs}
                  isListening={isListening}
                  strings={strings}
                  target={sustainTarget}
                  inputGain={inputGain}
                  onInputGainChange={onInputGainChange}
                  onNext={() => setStep("tuning")}
                  onBack={() => setStep("setup")}
                  onCancel={onCancel}
                />
              </motion.div>
            )}
            {step === "tuning" && (
              <motion.div key="tuning" {...SLIDE} className="flex flex-1 flex-col">
                <TuningStep
                  audioRefs={audioRefs}
                  isListening={isListening}
                  strings={strings}
                  onFinish={afterTuning}
                  onAlreadyTuned={() => afterTuning(null)}
                  onCancel={onCancel}
                />
              </motion.div>
            )}
            {step === "timing" && (
              <motion.div key="timing" {...SLIDE} className="flex flex-1 flex-col">
                <TimingStep
                  audioRefs={audioRefs}
                  audioContext={timingAudioContext}
                  isListening={isListening}
                  isNative={isNative}
                  estimateLatencyMs={estimateLatencyMs}
                  onBeforeStart={onBeforeTimingRun}
                  onEnableMic={() => void handleGrant()}
                  onDone={(ms) => showSummary(tunedCount, ms)}
                  onSkip={() => showSummary(tunedCount, null)}
                  onCancel={onCancel}
                />
              </motion.div>
            )}
            {step === "summary" && summary && (
              <motion.div key="summary" {...SLIDE} className="flex flex-1 flex-col" exit={{ opacity: 0 }}>
                <SummaryStep summary={summary} onConfirm={onComplete} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

/**
 * First-run setup when the mic is turned on: input → level → tuning → timing.
 * Each open starts from scratch — the body remounts, so nothing carries over
 * from a wizard closed halfway.
 */
export const CalibrationWizard = (props: CalibrationWizardProps) => {
  if (!props.isOpen) return null;
  return createPortal(<WizardBody {...props} />, document.body);
};
