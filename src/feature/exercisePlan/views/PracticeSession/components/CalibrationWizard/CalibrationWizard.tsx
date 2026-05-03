import { AnimatePresence, motion } from "framer-motion";
import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { useCallback, useEffect, useState } from "react";

import type { CalibrationData } from "../../hooks/useCalibration";
import { ModalWrapper } from "../ModalWrapper";
import { MicErrorScreen } from "./components/MicErrorScreen";
import { SetupStep } from "./components/SetupStep";
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
  const [step,       setStep]       = useState<"setup" | "tuning" | "summary">("setup");
  const [isGranting, setIsGranting] = useState(false);
  const [micError,   setMicError]   = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStep("setup");
    setIsGranting(false);
    setMicError(false);
  }, [isOpen]);

  const { currentStringIndex, currentStr, stringState, offsets, currentOffset, sampleCount, handleRetry, advanceString } =
    useCalibrationCapture({ step, isOpen, isListening, audioRefs, onAllStringsDone: () => setStep("summary") });

  const handleGrant = useCallback(async () => {
    setIsGranting(true);
    try { await audioInit(); }
    catch { setMicError(true); }
    finally { setIsGranting(false); }
  }, [audioInit]);

  const handleCancel  = useCallback(() => onCancel(), [onCancel]);
  const handleConfirm = useCallback(() => onComplete({ offsets, timestamp: Date.now() }), [offsets, onComplete]);

  if (!isOpen) return null;

  if (micError) {
    return <MicErrorScreen onRetry={() => { setMicError(false); handleGrant(); }} onCancel={handleCancel} />;
  }

  return (
    <ModalWrapper zIndex="z-[99999999]">
      <AnimatePresence mode="wait">
        {step === "setup" && (
          <motion.div key="setup" className="h-full"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <SetupStep
              isListening={isListening} isLoading={isGranting}
              audioRefs={audioRefs} inputGain={inputGain}
              onInputGainChange={onInputGainChange}
              onGrant={handleGrant}
              onNext={() => setStep("tuning")}
              onCancel={handleCancel}
            />
          </motion.div>
        )}
        {step === "tuning" && (
          <motion.div key="tuning" className="h-full"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.22 }}
          >
            <TuningStep
              currentIndex={currentStringIndex} offsets={offsets}
              sampleCount={sampleCount} stringState={stringState}
              currentOffset={currentOffset} audioRefs={audioRefs}
              onRetry={handleRetry} onSkip={advanceString} onCancel={handleCancel}
            />
          </motion.div>
        )}
        {step === "summary" && (
          <motion.div key="summary" className="h-full"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <SummaryStep offsets={offsets} onConfirm={handleConfirm} onCancel={handleCancel} />
          </motion.div>
        )}
      </AnimatePresence>
    </ModalWrapper>
  );
};
