import { Button } from "assets/components/ui/button";
import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { ChevronLeft } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { FaChevronRight, FaHeadphones, FaMicrophone, FaPlug, FaTimes, FaVolumeOff } from "react-icons/fa";

import type { InputSource } from "./SourceStep";

interface SetupStepProps {
  isListening:       boolean;
  isLoading:         boolean;
  inputSource:       InputSource;
  audioRefs:         AudioRefs;
  inputGain:         number;
  onInputGainChange: (v: number) => void;
  onGrant:           () => void;
  onNext:            () => void;
  onBack:            () => void;
  onCancel:          () => void;
}

export const SetupStep = React.memo(function SetupStep({
  isListening, isLoading, inputSource, audioRefs, inputGain, onInputGainChange,
  onGrant, onNext, onBack, onCancel,
}: SetupStepProps) {
  const [volume, setVolume] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!isListening) {
      setVolume(0);
      return;
    }

    const tick = () => {
      const currentVol = audioRefs.volumeRef.current;
      setVolume(currentVol);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isListening, audioRefs]);

  const fillPct    = Math.min(100, volume * 300);
  const tooQuiet   = fillPct < 8;
  const signalGood = isListening && !tooQuiet;



  return (
    <div className="flex h-full flex-col px-5 py-5 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="rounded-full p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="text-lg font-bold tracking-tight">
            {inputSource === "interface" ? "Audio Interface Setup" : "Microphone Setup"}
          </h2>
        </div>
        <button onClick={onCancel} className="rounded-full p-2 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors">
          <FaTimes className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-3 w-full overflow-y-auto">
      


        {/* Source-specific tips — always visible */}
        {inputSource === "microphone" ? <MicrophoneTips /> : <InterfaceTips />}

        {/* Grant access — only when mic not yet active */}
        {!isListening && (
          <Button
            onClick={onGrant}
            disabled={isLoading}
            className="w-full bg-cyan-500 text-black hover:bg-cyan-400 font-bold h-11"
          >
            <FaMicrophone className="mr-2 h-4 w-4" />
            {isLoading ? "Requesting access…" : "Grant Microphone Access"}
          </Button>
        )}

        {/* Signal + gain — shown after mic grant */}
        {isListening && (
          <>
            <div className="rounded-lg bg-zinc-900/70 p-4 space-y-4">
              {/* Signal meter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaMicrophone className={cn("h-3 w-3 transition-colors", signalGood ? "text-emerald-400 animate-pulse" : "text-zinc-500")} />
                    <span className="text-[10px] font-bold tracking-widest text-zinc-500">Signal Level</span>
                  </div>
                  <span className={cn("text-[10px] font-bold transition-colors",
                    tooQuiet ? "text-amber-400" : "text-emerald-400"
                  )}>
                    {tooQuiet ? "Too quiet — strum a string" : "Good level ✓"}
                  </span>
                </div>
                <div className="relative h-5 rounded-lg bg-zinc-800 overflow-hidden">
                  <div className="absolute inset-y-0 left-[8%] w-px bg-white/10" />
                  <div
                    className={cn(
                      "h-full rounded-lg transition-all duration-75",
                      tooQuiet ? "bg-amber-500" : "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                    )}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
              </div>

              {/* Gain slider — manual only */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-widest text-zinc-500">Input Sensitivity</span>
                  <span className="text-xs font-mono text-zinc-400">{inputGain.toFixed(1)}×</span>
                </div>
                <Slider
                  min={0.5} max={10} step={0.1}
                  value={[inputGain]}
                  onValueChange={([v]) => onInputGainChange(v)}
                />

              </div>
            </div>



            <Button
              onClick={onNext}
              className="w-full h-12 mt-4"
            >
              Tune Guitar <FaChevronRight className="ml-1.5 h-3 w-3" />
            </Button>
          </>
        )}

        <button onClick={onCancel} className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors text-center py-1">
          Skip calibration
        </button>
      </div>
    </div>
  );
});

function MicrophoneTips() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-amber-500/10 p-4 flex items-start gap-4">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <FaHeadphones className="text-lg text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-300 mb-1">Use wired headphones</p>
          <p className="text-xs text-amber-200/60 leading-relaxed">
            Without headphones the mic picks up the backing track through your speakers and causes false detections.
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-amber-500/10 p-4 flex items-start gap-4">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <FaVolumeOff className="text-lg text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-300 mb-1">Find a quiet spot</p>
          <p className="text-xs text-amber-200/60 leading-relaxed">
            Background noise causes false note detections. Close doors and turn off any music.
          </p>
        </div>
      </div>
    </div>
  );
}

function InterfaceTips() {
  return (
    <div className="rounded-lg bg-zinc-900/70 p-4 flex items-start gap-4">
      <div className="shrink-0 w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
        <FaPlug className="text-lg text-zinc-400" />
      </div>
      <div>
        <p className="text-sm font-bold text-zinc-200 mb-1">Before you start</p>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Make sure your interface is selected as the browser's microphone input and your guitar is plugged in.
          You'll set the gain level on the next screen.
        </p>
      </div>
    </div>
  );
}
