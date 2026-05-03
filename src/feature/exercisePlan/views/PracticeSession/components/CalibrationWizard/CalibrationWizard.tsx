import { AnimatePresence, motion } from "framer-motion";
import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { CalibrationData } from "../../hooks/useCalibration";
import { MicErrorScreen } from "./components/MicErrorScreen";
import { PermissionStep } from "./components/PermissionStep";
import { SetupStep } from "./components/SetupStep";
import { type InputSource, SourceStep } from "./components/SourceStep";
import { SummaryStep } from "./components/SummaryStep";
import { TuningStep } from "./components/TuningStep";
import { useCalibrationCapture } from "./hooks/useCalibrationCapture";

interface CalibrationWizardProps {
  isOpen:            boolean;
  onComplete:        (data: CalibrationData) => void;
  onCancel:          () => void;
  audioInit:         () => Promise<void>;
  audioClose:        () => void;
  audioRefs:         AudioRefs;
  isListening:       boolean;
  inputGain:         number;
  onInputGainChange: (gain: number) => void;
}

export const CalibrationWizard = ({
  isOpen, onComplete, onCancel, audioInit, audioRefs,
  isListening, inputGain, onInputGainChange,
}: CalibrationWizardProps) => {
  const [step,        setStep]        = useState<"source" | "permission" | "setup" | "tuning" | "summary">("source");
  const [inputSource, setInputSource] = useState<InputSource>("interface");
  const [isGranting,  setIsGranting]  = useState(false);
  const [micError,    setMicError]    = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStep("source");
    setIsGranting(false);
    setMicError(false);
  }, [isOpen]);

  const { currentStringIndex, stringState, offsets, currentOffset, sampleCount, handleRetry, advanceString } =
    useCalibrationCapture({ step: step === "permission" || step === "source" ? "setup" : step, isOpen, isListening, audioRefs, onAllStringsDone: () => setStep("summary") });

  const handleGrant = useCallback(async () => {
    setIsGranting(true);
    try { 
      await audioInit(); 
      setStep("setup");
    }
    catch { setMicError(true); }
    finally { setIsGranting(false); }
  }, [audioInit]);

  const handleCancel  = useCallback(() => onCancel(), [onCancel]);
  const handleConfirm = useCallback(() => onComplete({ offsets, timestamp: Date.now() }), [offsets, onComplete]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999999] flex items-center justify-center bg-black/70 backdrop-blur-sm font-openSans">
      <div className="relative w-full max-w-lg mx-4 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-y-auto max-h-[90dvh]">
        {micError ? (
          <MicErrorScreen onRetry={() => { setMicError(false); handleGrant(); }} onCancel={handleCancel} />
        ) : (
          <AnimatePresence mode="wait">
            {step === "source" && (
              <motion.div key="source"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
              >
                <SourceStep
                  onSelect={(source) => {
                    setInputSource(source);
                    setStep(isListening ? "setup" : "permission");
                  }}
                  onCancel={handleCancel}
                />
              </motion.div>
            )}
            {step === "permission" && (
              <motion.div key="permission"
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
              >
                <PermissionStep
                  isLoading={isGranting}
                  onGrant={handleGrant}
                  onBack={() => setStep("source")}
                  onCancel={handleCancel}
                />
              </motion.div>
            )}
            {step === "setup" && (
              <motion.div key="setup"
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
              >
                <SetupStep
                  isListening={isListening} isLoading={isGranting}
                  inputSource={inputSource}
                  audioRefs={audioRefs} inputGain={inputGain}
                  onInputGainChange={onInputGainChange}
                  onGrant={handleGrant}
                  onNext={() => setStep("tuning")}
                  onBack={() => setStep(isListening ? "source" : "permission")}
                  onCancel={handleCancel}
                />
              </motion.div>
            )}
            {step === "tuning" && (
              <motion.div key="tuning"
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.22 }}
              >
                <TuningStep
                  currentIndex={currentStringIndex} offsets={offsets}
                  sampleCount={sampleCount} stringState={stringState}
                  currentOffset={currentOffset} audioRefs={audioRefs}
                  onRetry={handleRetry} onAdvance={advanceString} onCancel={handleCancel}
                />
              </motion.div>
            )}
            {step === "summary" && (
              <motion.div key="summary"
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
              >
                <SummaryStep offsets={offsets} onConfirm={handleConfirm} onCancel={handleCancel} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>,
    document.body
  );
};
