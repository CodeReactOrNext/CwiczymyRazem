import { Button } from "assets/components/ui/button";
import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaCheck, FaMicrophone, FaRedo, FaTimes } from "react-icons/fa";
import { getCentsDistance, getNoteFromFrequency } from "utils/audio/noteUtils";

import type { AudioRefs } from "hooks/useAudioAnalyzer";
import type { CalibrationData, CalibrationOffsets } from "../hooks/useCalibration";
import { ModalWrapper } from "./ModalWrapper";

interface CalibrationWizardProps {
  isOpen: boolean;
  onComplete: (data: CalibrationData) => void;
  onCancel: () => void;
  audioInit: () => Promise<void>;
  audioClose: () => void;
  audioRefs: AudioRefs;
  isListening: boolean;
  inputGain: number;
  onInputGainChange: (gain: number) => void;
}

const CALIBRATION_STRINGS = [
  { string: 6, name: "E2", expectedHz: 82.41 },
  { string: 5, name: "A2", expectedHz: 110.0 },
  { string: 4, name: "D3", expectedHz: 146.83 },
  { string: 3, name: "G3", expectedHz: 196.0 },
  { string: 2, name: "B3", expectedHz: 246.94 },
  { string: 1, name: "E4", expectedHz: 329.63 },
];

const MIN_SAMPLES = 8;
const ACCEPT_CENTS = 250; // only accept frequencies within 2.5 semitones of target
const STALE_MS = 2000; // clear samples after 2s of no matching input

type StringState = "listening" | "done";

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function centsColor(cents: number): string {
  const abs = Math.abs(cents);
  if (abs < 10) return "text-emerald-400";
  if (abs < 30) return "text-amber-400";
  return "text-red-400";
}

function centsBgColor(cents: number): string {
  const abs = Math.abs(cents);
  if (abs < 10) return "bg-emerald-500";
  if (abs < 30) return "bg-amber-500";
  return "bg-red-500";
}

interface AudioFeedbackState {
  volume: number;
  noSignal: boolean;
  noteName: string;
  centsFromTarget: number;
  hasNote: boolean;
}

const AudioFeedbackPanel = ({
  audioRefs,
  targetNote,
  targetHz,
  showNote,
}: {
  audioRefs: AudioRefs;
  targetNote: string;
  targetHz: number;
  showNote: boolean;
}) => {
  const [state, setState] = useState<AudioFeedbackState>({
    volume: 0,
    noSignal: false,
    noteName: "—",
    centsFromTarget: 0,
    hasNote: false,
  });
  const rafRef = useRef(0);
  const lastSignalRef = useRef(Date.now());
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    const tick = () => {
      // Throttle to ~15fps — enough for visual feedback, no main-thread flooding
      const now = Date.now();
      if (now - lastUpdateRef.current < 66) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      lastUpdateRef.current = now;

      const vol = audioRefs.volumeRef.current;
      const freq = audioRefs.frequencyRef.current;

      if (vol > 0.01) {
        lastSignalRef.current = now;
      }
      const noSig = now - lastSignalRef.current > 2000;

      let noteName = "—";
      let cents = 0;
      let hasNote = false;

      if (freq > 40 && vol > 0.01) {
        const data = getNoteFromFrequency(freq);
        if (data) {
          noteName = `${data.note}${data.octave}`;
          cents = getCentsDistance(freq, targetHz);
          hasNote = true;
        }
      }

      setState({ volume: vol, noSignal: noSig, noteName, centsFromTarget: cents, hasNote });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [audioRefs, targetHz]);

  const { volume, noSignal, noteName, centsFromTarget, hasNote } = state;
  const hasSignal = volume > 0.01;
  const fillPercent = Math.min(100, volume * 300);

  const isClose = hasNote && Math.abs(centsFromTarget) < 50;
  const isExact = hasNote && Math.abs(centsFromTarget) < 10;
  const clampedCents = Math.max(-50, Math.min(50, centsFromTarget));
  const needlePos = 50 + clampedCents;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Volume meter */}
      <div className="flex items-center gap-2">
        <FaMicrophone
          className={cn(
            "h-3.5 w-3.5 transition-colors",
            hasSignal ? "text-emerald-400 animate-pulse" : "text-zinc-600"
          )}
        />
        <div className="w-48 h-3 rounded-full bg-zinc-800 overflow-hidden border border-white/5">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-100",
              hasSignal ? "bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-zinc-700"
            )}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>
      {noSignal && (
        <p className="text-xs text-amber-400 animate-pulse">
          No signal — check your microphone
        </p>
      )}

      {/* Detected note indicator */}
      {showNote && (
        <>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Detected</span>
            <span
              className={cn(
                "text-lg font-black tabular-nums min-w-[3rem] text-center transition-colors",
                !hasNote && "text-zinc-700",
                hasNote && !isClose && "text-red-400",
                isClose && !isExact && "text-amber-400",
                isExact && "text-emerald-400"
              )}
            >
              {noteName}
            </span>
            <span className="text-zinc-700 text-sm">/</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Target</span>
            <span className="text-lg font-black text-zinc-400">{targetNote}</span>
          </div>

          {/* Tuner bar */}
          <div className="relative w-56 h-5">
            <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 rounded-full bg-zinc-800 border border-white/5" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-zinc-600" />
            {hasNote && (
              <div
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 transition-all duration-150",
                  isExact && "bg-emerald-500 border-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]",
                  isClose && !isExact && "bg-amber-500 border-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]",
                  !isClose && "bg-red-500 border-red-400 shadow-[0_0_6px_rgba(239,68,68,0.5)]"
                )}
                style={{ left: `${needlePos}%` }}
              />
            )}
            <div className="absolute -bottom-3.5 left-0 text-[8px] font-bold text-zinc-700 uppercase">Flat</div>
            <div className="absolute -bottom-3.5 right-0 text-[8px] font-bold text-zinc-700 uppercase">Sharp</div>
          </div>

          {hasNote && (
            <div className={cn(
              "text-xs font-mono mt-1",
              isExact && "text-emerald-400",
              isClose && !isExact && "text-amber-400",
              !isClose && "text-red-400"
            )}>
              {centsFromTarget >= 0 ? "+" : ""}{Math.round(centsFromTarget)}c from {targetNote}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const STRING_THICKNESSES = [3, 2.5, 2, 1.5, 1, 1]; // px for strings 6→1

const GuitarNeckDiagram = ({
  currentStringIndex,
  offsets,
}: {
  currentStringIndex: number;
  offsets: CalibrationOffsets;
}) => (
  <div className="w-full max-w-xs mx-auto">
    <div className="relative rounded-lg bg-zinc-900/60 border border-white/5 px-4 py-3">
      {/* Nut bar */}
      <div className="absolute left-10 top-2 bottom-2 w-1 rounded-full bg-zinc-400/40" />
      {/* Fret wires */}
      {[0.3, 0.55, 0.78].map((pos) => (
        <div
          key={pos}
          className="absolute top-2 bottom-2 w-px bg-zinc-800"
          style={{ left: `${10 + pos * 80}%` }}
        />
      ))}
      <div className="flex flex-col gap-2">
        {CALIBRATION_STRINGS.map((s, idx) => {
          const isDone = offsets[s.string] !== undefined;
          const isCurrent = idx === currentStringIndex;
          const isPending = !isDone && !isCurrent;
          return (
            <div key={s.string} className="flex items-center gap-3">
              <span
                className={cn(
                  "text-[10px] font-black w-6 text-right tabular-nums tracking-wide",
                  isCurrent && "text-cyan-400",
                  isDone && "text-emerald-400/70",
                  isPending && "text-zinc-700"
                )}
              >
                {s.name}
              </span>
              <div className="flex-1 relative flex items-center">
                <div
                  className={cn(
                    "w-full rounded-full transition-all duration-300",
                    isCurrent &&
                      "bg-cyan-400 shadow-[0_0_8px_#22d3ee]",
                    isDone && "bg-emerald-500/40",
                    isPending && "bg-zinc-800"
                  )}
                  style={{ height: `${STRING_THICKNESSES[idx]}px` }}
                />
              </div>
              <div className="w-5 flex justify-center">
                {isDone && (
                  <FaCheck className="h-2.5 w-2.5 text-emerald-400" />
                )}
                {isCurrent && (
                  <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

export const CalibrationWizard = ({
  isOpen,
  onComplete,
  onCancel,
  audioInit,
  audioClose,
  audioRefs,
  isListening,
  inputGain,
  onInputGainChange,
}: CalibrationWizardProps) => {
  const [currentStringIndex, setCurrentStringIndex] = useState(0);
  const [stringState, setStringState] = useState<StringState>("listening");
  const [offsets, setOffsets] = useState<CalibrationOffsets>({});
  const [currentOffset, setCurrentOffset] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [sampleCount, setSampleCount] = useState(0);
  const [micError, setMicError] = useState(false);

  const samplesRef = useRef<number[]>([]);
  const lastMatchTimeRef = useRef(0);
  const rafRef = useRef(0);
  const lastUIUpdateRef = useRef(0);

  const currentStr = CALIBRATION_STRINGS[currentStringIndex];

  // Auto-init mic on mount
  useEffect(() => {
    if (!isOpen) return;
    if (!isListening) {
      audioInit().catch(() => setMicError(true));
    }
  }, [isOpen, isListening, audioInit]);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStringIndex(0);
      setStringState("listening");
      setOffsets({});
      setCurrentOffset(null);
      setShowSummary(false);
      setSampleCount(0);
      setMicError(false);
      samplesRef.current = [];
    }
  }, [isOpen]);

  // Continuous listening loop — always running, collects matching samples
  useEffect(() => {
    if (stringState !== "listening" || !isOpen || !isListening) return;

    samplesRef.current = [];
    lastMatchTimeRef.current = 0;
    setSampleCount(0);

    const targetHz = currentStr.expectedHz;

    const tick = () => {
      const now = Date.now();
      const freq = audioRefs.frequencyRef.current;
      const vol = audioRefs.volumeRef.current;

      if (freq > 40 && vol > 0.02) {
        const cents = Math.abs(getCentsDistance(freq, targetHz));
        if (cents <= ACCEPT_CENTS) {
          samplesRef.current.push(freq);
          lastMatchTimeRef.current = now;
        }
      }

      // Clear stale samples if no matching input for a while
      if (samplesRef.current.length > 0 && lastMatchTimeRef.current > 0 && now - lastMatchTimeRef.current > STALE_MS) {
        samplesRef.current = [];
      }

      // Check if we have enough samples → done
      if (samplesRef.current.length >= MIN_SAMPLES) {
        const medianFreq = median(samplesRef.current);
        const offset = getCentsDistance(medianFreq, targetHz);
        setCurrentOffset(offset);
        setOffsets((prev) => ({ ...prev, [currentStr.string]: offset }));
        setStringState("done");
        return;
      }

      // Throttle UI updates for sample count (~10Hz)
      if (now - lastUIUpdateRef.current >= 100) {
        lastUIUpdateRef.current = now;
        setSampleCount(samplesRef.current.length);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [stringState, isOpen, isListening, audioRefs, currentStr]);

  const handleRetry = useCallback(() => {
    samplesRef.current = [];
    setCurrentOffset(null);
    setSampleCount(0);
    setStringState("listening");
  }, []);

  const handleNext = useCallback(() => {
    if (currentStringIndex < CALIBRATION_STRINGS.length - 1) {
      setCurrentStringIndex((i) => i + 1);
      setCurrentOffset(null);
      setSampleCount(0);
      samplesRef.current = [];
      setStringState("listening");
    } else {
      setShowSummary(true);
    }
  }, [currentStringIndex]);

  const handleConfirm = useCallback(() => {
    onComplete({ offsets, timestamp: Date.now() });
  }, [offsets, onComplete]);

  const handleCancel = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    onCancel();
  }, [onCancel]);

  const handleRetryMic = useCallback(() => {
    setMicError(false);
    audioInit().catch(() => setMicError(true));
  }, [audioInit]);

  // Auto-advance to next string after successful capture
  useEffect(() => {
    if (stringState !== "done") return;
    const timer = setTimeout(handleNext, 1500);
    return () => clearTimeout(timer);
  }, [stringState, handleNext]);

  if (!isOpen) return null;

  const doneCount = Object.keys(offsets).length;

  return (
    <ModalWrapper zIndex="z-[99999999]">
      <div className="flex h-full flex-col items-center justify-center px-6 py-8 text-white">
        {/* Header */}
        <div className="mb-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold tracking-tight">Guitar Calibration</h2>
            <button
              onClick={handleCancel}
              className="rounded-full p-2 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          </div>

          {!showSummary && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                <motion.div
                  className="h-full bg-cyan-500"
                  animate={{ width: `${(doneCount / CALIBRATION_STRINGS.length) * 100}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              </div>
              <span className="text-xs text-zinc-500 font-bold tabular-nums">{doneCount}/{CALIBRATION_STRINGS.length}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="w-full max-w-md flex-1 flex flex-col items-center justify-center gap-6">
          {micError ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
                <FaMicrophone className="h-7 w-7 text-red-400" />
              </div>
              <p className="text-zinc-400 text-sm">Could not access microphone. Please grant permission and try again.</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleRetryMic} className="bg-cyan-500 text-black hover:bg-cyan-400 font-bold">
                  Try Again
                </Button>
                <Button variant="ghost" onClick={handleCancel} className="text-zinc-500 hover:text-zinc-300">
                  Cancel
                </Button>
              </div>
            </div>
          ) : showSummary ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-6"
            >
              <div className="text-center space-y-1">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-2">
                  <FaCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold">Calibration Complete</h3>
                <p className="text-xs text-zinc-500">Your guitar&apos;s tuning offsets have been recorded</p>
              </div>
              <div className="space-y-2">
                {CALIBRATION_STRINGS.map((s) => {
                  const offset = offsets[s.string] ?? 0;
                  const sign = offset >= 0 ? "+" : "";
                  return (
                    <div
                      key={s.string}
                      className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-zinc-900/60 border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-zinc-600 w-6">S{s.string}</span>
                        <span className="font-bold text-white text-sm">{s.name}</span>
                      </div>
                      <span className={cn("font-mono font-bold text-sm", centsColor(offset))}>
                        {sign}{Math.round(offset)}c
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleConfirm}
                  className="flex-1 bg-emerald-500 text-black hover:bg-emerald-400 font-bold"
                >
                  <FaCheck className="mr-2 h-3 w-3" /> Confirm
                </Button>
                <Button variant="ghost" onClick={handleCancel} className="text-zinc-500 hover:text-zinc-300">
                  Cancel
                </Button>
              </div>
            </motion.div>
          ) : (
            /* Active calibration */
            <>
              {/* Guitar Neck */}
              <GuitarNeckDiagram currentStringIndex={currentStringIndex} offsets={offsets} />

              {/* Current string + instruction */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStringIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="text-center space-y-1"
                >
                  <div className="text-3xl font-black text-white tracking-tighter">
                    {currentStr.name}
                  </div>
                  <p className="text-zinc-500 text-xs">
                    Play open string{" "}
                    <span className="text-zinc-300 font-bold">{currentStr.name}</span>
                    {currentStr.string === 6 ? " (thickest)" : currentStr.string === 1 ? " (thinnest)" : ""}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Sample collection dots + result */}
              {stringState === "listening" && (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: MIN_SAMPLES }).map((_, i) => (
                      <motion.div
                        key={i}
                        className={cn(
                          "h-2 w-2 rounded-full transition-colors duration-200",
                          i < sampleCount
                            ? "bg-cyan-400 shadow-[0_0_6px_#22d3ee]"
                            : "bg-zinc-800 border border-zinc-700"
                        )}
                        animate={i < sampleCount ? { scale: [1, 1.4, 1] } : {}}
                        transition={{ duration: 0.2 }}
                      />
                    ))}
                  </div>
                  {sampleCount === 0 && (
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                      Waiting for signal...
                    </p>
                  )}
                  {sampleCount > 0 && sampleCount < MIN_SAMPLES && (
                    <p className="text-[10px] text-cyan-500/60 uppercase tracking-widest font-bold">
                      Keep holding...
                    </p>
                  )}
                </div>
              )}

              {stringState === "done" && currentOffset !== null && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="flex items-center gap-3">
                    <FaCheck className="h-4 w-4 text-emerald-400" />
                    <span className={cn("text-2xl font-black tabular-nums", centsColor(currentOffset))}>
                      {currentOffset >= 0 ? "+" : ""}{Math.round(currentOffset)}c
                    </span>
                    <span className="text-xs text-zinc-500">
                      {Math.abs(currentOffset) < 10 ? "In tune" : currentOffset > 0 ? "Sharp" : "Flat"}
                    </span>
                  </div>
                  <button
                    onClick={handleRetry}
                    className="text-[10px] text-zinc-600 hover:text-zinc-400 uppercase tracking-widest font-bold flex items-center gap-1"
                  >
                    <FaRedo className="h-2 w-2" /> redo
                  </button>
                </motion.div>
              )}

              {/* Audio feedback panel + sensitivity */}
              {isListening && (
                <div className="w-full space-y-4 pt-4 border-t border-white/5">
                  <AudioFeedbackPanel
                    audioRefs={audioRefs}
                    targetNote={currentStr.name}
                    targetHz={currentStr.expectedHz}
                    showNote
                  />
                  <div className="flex items-center justify-center gap-3">
                    <label className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                      Sensitivity
                    </label>
                    <Slider
                      className="w-32"
                      min={0.5}
                      max={5.0}
                      step={0.1}
                      value={[inputGain]}
                      onValueChange={([val]) => onInputGainChange(val)}
                    />
                    <span className="text-[10px] font-mono text-zinc-500 w-8">{inputGain.toFixed(1)}x</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
};
