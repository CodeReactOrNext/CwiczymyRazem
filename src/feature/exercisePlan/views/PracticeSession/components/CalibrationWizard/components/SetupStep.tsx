import { Button } from "assets/components/ui/button";
import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import type { AudioRefs } from "hooks/useAudioAnalyzer";
import React, { useEffect, useRef, useState } from "react";
import { FaChevronRight, FaMagic, FaMicrophone, FaTimes } from "react-icons/fa";

import { useAutoGain } from "../hooks/useAutoGain";

interface SetupStepProps {
  isListening:       boolean;
  isLoading:         boolean;
  audioRefs:         AudioRefs;
  inputGain:         number;
  onInputGainChange: (v: number) => void;
  onGrant:           () => void;
  onNext:            () => void;
  onCancel:          () => void;
}

export const SetupStep = React.memo(function SetupStep({
  isListening, isLoading, audioRefs, inputGain, onInputGainChange,
  onGrant, onNext, onCancel,
}: SetupStepProps) {
  const [volume, setVolume] = useState(0);
  const rafRef = useRef(0);

  const { autoState, countdown, startAutoGain } = useAutoGain(audioRefs, inputGain, onInputGainChange);

  useEffect(() => {
    if (!isListening) { setVolume(0); return; }
    const tick = () => { setVolume(audioRefs.volumeRef.current); rafRef.current = requestAnimationFrame(tick); };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isListening, audioRefs]);

  const fillPct   = Math.min(100, volume * 300);
  const tooQuiet  = fillPct < 8;
  const tooLoud   = fillPct >= 75;
  const signalGood = isListening && !tooQuiet && !tooLoud;

  return (
    <div className="flex h-full flex-col px-5 py-5 text-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold tracking-tight">Guitar Calibration</h2>
        <button onClick={onCancel} className="rounded-full p-2 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors">
          <FaTimes className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-3 max-w-sm mx-auto w-full overflow-y-auto">
        <div className="rounded-xl bg-zinc-900/70 border border-white/5 p-4">
          <p className="text-sm text-zinc-300 leading-relaxed">
            We'll listen to each open string and record how your guitar is tuned.
            This makes note detection significantly more accurate.
          </p>
        </div>

        <div className="rounded-xl bg-zinc-900/70 border border-white/5 p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">For best results</p>
          {[
            "Play somewhere quiet — background noise causes false detections",
            "Use wired headphones so the mic doesn't pick up the backing track",
            "If you use an audio interface, select it as your browser's mic input",
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-[8px] font-black text-zinc-500">
                {i + 1}
              </span>
              <p className="text-xs text-zinc-400 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>

        {!isListening ? (
          <Button onClick={onGrant} disabled={isLoading} className="w-full bg-cyan-500 text-black hover:bg-cyan-400 font-bold h-11">
            <FaMicrophone className="mr-2 h-4 w-4" />
            {isLoading ? "Requesting access…" : "Grant Microphone Access"}
          </Button>
        ) : (
          <div className="rounded-xl bg-zinc-900/70 border border-white/5 p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaMicrophone className={cn("h-3 w-3 transition-colors", signalGood ? "text-emerald-400 animate-pulse" : "text-zinc-500")} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Signal Level</span>
                </div>
                <span className={cn("text-[10px] font-bold transition-colors", tooQuiet && "text-amber-400", signalGood && "text-emerald-400", tooLoud && "text-red-400")}>
                  {tooQuiet ? "Too quiet — strum a string" : signalGood ? "Good level ✓" : "Too loud"}
                </span>
              </div>
              <div className="relative h-3 rounded-full bg-zinc-800 overflow-hidden border border-white/5">
                <div className="absolute inset-y-0 left-[8%] w-px bg-white/5" />
                <div className="absolute inset-y-0 left-[75%] w-px bg-white/5" />
                <div className={cn("h-full rounded-full transition-all duration-75", tooQuiet ? "bg-amber-500" : signalGood ? "bg-emerald-500 shadow-[0_0_6px_#10b981]" : "bg-red-500 shadow-[0_0_6px_#ef4444]")} style={{ width: `${fillPct}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Sensitivity</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-400">{inputGain.toFixed(1)}×</span>
                  <button
                    onClick={startAutoGain} disabled={autoState === "measuring"}
                    className={cn(
                      "flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest transition-all disabled:cursor-wait",
                      autoState === "done"      ? "bg-emerald-500/20 text-emerald-400" :
                      autoState === "measuring" ? "bg-cyan-500/10 text-cyan-300" :
                                                  "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                    )}
                  >
                    <FaMagic className="h-2.5 w-2.5" />
                    {autoState === "measuring" ? `${countdown}s…` : autoState === "done" ? "Done ✓" : "Auto"}
                  </button>
                </div>
              </div>
              {autoState === "measuring" && <p className="text-[10px] text-cyan-400 animate-pulse">Strum a few chords now…</p>}
              <Slider min={0.5} max={10} step={0.1} value={[inputGain]} onValueChange={([v]) => onInputGainChange(v)} />
            </div>
          </div>
        )}

        {isListening && (
          <Button onClick={onNext} className="w-full bg-cyan-500 text-black hover:bg-cyan-400 font-bold h-11">
            Start Calibrating <FaChevronRight className="ml-1.5 h-3 w-3" />
          </Button>
        )}
        <button onClick={onCancel} className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors text-center py-1">
          Skip calibration
        </button>
      </div>
    </div>
  );
});
