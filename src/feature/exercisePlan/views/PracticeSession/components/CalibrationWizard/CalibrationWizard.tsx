import { AnimatePresence, motion } from "framer-motion";
import type { AudioInitFailure, AudioInitResult, AudioRefs, WebAudioInput } from "hooks/useAudioAnalyzer";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { loadInputSource, saveInputSource } from "./inputSource";
import { trackSetup } from "./setupAnalytics";

interface CalibrationWizardProps {
  isOpen:            boolean;
  /** Setup finished — the mic goes on. */
  onComplete:        () => void;
  onCancel:          () => void;
  /** Opens the input. The browser path says why when it can't; the desktop one reports on its own. */
  audioInit:         () => Promise<AudioInitResult | void>;
  audioRefs:         AudioRefs;
  isListening:       boolean;
  inputGain:         number;
  onInputGainChange: (gain: number) => void;
  isNative:          boolean;
  onSelectDevice?:   (deviceId: number) => Promise<void>;
  onSelectChannel?:  (channel: number) => Promise<void>;
  /** The browser path's device and jack picker; undefined in the desktop app. */
  webInput?:         WebAudioInput;
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
  isNative, onSelectDevice, onSelectChannel, webInput, timingAudioContext, estimateLatencyMs, onBeforeTimingRun,
}: CalibrationWizardProps) => {
  // Native (Electron) capture has no "interface vs. microphone" distinction
  // (it's one device list) and no browser permission prompt — it starts at
  // device selection instead of the web-only source/permission steps.
  // With the input already open the setup is being reopened to change
  // something — the device, most often — so it starts on the device list
  // rather than asking "interface or microphone?" again. Back still leads there.
  const [step,        setStep]        = useState<Step>(isNative || isListening ? "setup" : "source");
  const [inputSource, setInputSource] = useState<InputSource>(loadInputSource);
  const [isGranting,  setIsGranting]  = useState(false);
  const [micError,    setMicError]    = useState<AudioInitFailure | null>(null);
  const [summary,     setSummary]     = useState<SetupSummary | null>(null);
  const [tunedCount,  setTunedCount]  = useState<number | null>(null);

  const { tuning } = useGuitarTuningContext();
  const strings = useMemo(() => buildStringRefs(tuning), [tuning]);
  const sustainTarget = useMemo<SustainTarget>(() => sustainTestTarget(strings), [strings]);
  const savedLatencyMs = useCalibratedLatencyMs(isNative);

  const sourceKind = isNative ? "native" : inputSource;
  useEffect(() => {
    trackSetup("mic_setup_step_viewed", { step, input_source: sourceKind, is_native: isNative });
    // The source is picked on the first step — its change alone is not a new step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // An input that would not open. In the desktop app the device picker stays
  // up instead: it is where another interface gets chosen, and the failure is
  // already reported by the native path.
  const reportInputError = useCallback((reason: AudioInitFailure) => {
    trackSetup("mic_setup_error", { reason, step, input_source: sourceKind, is_native: isNative });
    if (!isNative) setMicError(reason);
  }, [step, sourceKind, isNative]);

  const handleGrant = useCallback(async () => {
    setIsGranting(true);
    try {
      // init() resolves with the reason instead of throwing, so the old catch
      // here never ran and a refused mic led straight back to "Grant access".
      const result = await audioInit();
      if (result && !result.ok) reportInputError(result.reason);
      else setStep("setup");
    }
    catch { reportInputError("unknown"); }
    finally { setIsGranting(false); }
  }, [audioInit, reportInputError]);

  const handleCancel = useCallback(() => {
    trackSetup("mic_setup_cancelled", { step, input_source: sourceKind, is_native: isNative, error: micError });
    onCancel();
  }, [step, sourceKind, isNative, micError, onCancel]);

  const handleComplete = useCallback(() => {
    trackSetup("mic_setup_completed", {
      input_source: sourceKind,
      is_native: isNative,
      tuned_count: summary?.tunedCount ?? null,
      latency_measured: summary?.latencyMeasured ?? false,
    });
    onComplete();
  }, [sourceKind, isNative, summary, onComplete]);

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
      {/* A phone gets the whole screen, upright or sideways — a floating card
          there only lost height to its margins and pushed every step into
          scrolling. */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex h-dvh w-full flex-col overflow-y-auto overscroll-contain bg-zinc-950 sm:mx-4 sm:h-auto sm:max-h-[92dvh] sm:min-h-[min(760px,92dvh)] sm:max-w-3xl sm:rounded-lg shortwide:m-0 shortwide:h-dvh shortwide:max-h-none shortwide:min-h-0 shortwide:max-w-none shortwide:rounded-none"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
        }}>
        {micError ? (
          <MicErrorScreen reason={micError} onRetry={() => { setMicError(null); void handleGrant(); }} onCancel={handleCancel} />
        ) : (
          <AnimatePresence mode="wait">
            {step === "source" && (
              <motion.div key="source" {...SLIDE} className="flex flex-1 flex-col" initial={{ opacity: 0 }}>
                <SourceStep
                  onSelect={(source) => {
                    setInputSource(source);
                    saveInputSource(source);
                    setStep(isListening ? "setup" : "permission");
                  }}
                  onCancel={handleCancel}
                />
              </motion.div>
            )}
            {step === "permission" && (
              <motion.div key="permission" {...SLIDE} className="flex flex-1 flex-col">
                <PermissionStep
                  isLoading={isGranting}
                  onGrant={handleGrant}
                  onBack={() => setStep("source")}
                  onCancel={handleCancel}
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
                  webInput={webInput} onInputError={reportInputError}
                  onGrant={handleGrant}
                  onNext={() => setStep("sustain")}
                  onBack={() => (isNative ? handleCancel() : setStep(isListening ? "source" : "permission"))}
                  onCancel={handleCancel}
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
                  onCancel={handleCancel}
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
                  onCancel={handleCancel}
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
                  onCancel={handleCancel}
                />
              </motion.div>
            )}
            {step === "summary" && summary && (
              <motion.div key="summary" {...SLIDE} className="flex flex-1 flex-col" exit={{ opacity: 0 }}>
                <SummaryStep summary={summary} onConfirm={handleComplete} />
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
