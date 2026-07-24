import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import { Gauge, Lock, Minus, Plus, Volume2, VolumeX } from "lucide-react";
import { useRef, useState } from "react";

import { SubdivisionIcon, SUBDIVISIONS } from "./SubdivisionIcon";

interface MetronomeProps {
  metronome: any;
  isMuted?: boolean;
  onMuteToggle?: (muted: boolean) => void;
  isHalfSpeed?: boolean;
  onHalfSpeedToggle?: (value: boolean) => void;
  /** Exam mode — BPM controls are disabled */
  locked?: boolean;
}

const getTempoColor = (bpm: number) => {
  if (bpm < 80) return "text-emerald-400";
  if (bpm < 120) return "text-amber-400";
  return "text-red-400";
};

const getSliderTrackColor = (bpm: number) => {
  if (bpm < 80) return "[&_[data-slot=slider-range]]:bg-emerald-500";
  if (bpm < 120) return "[&_[data-slot=slider-range]]:bg-amber-500";
  return "[&_[data-slot=slider-range]]:bg-red-500";
};

export const Metronome = ({
  metronome,
  isMuted = false,
  onMuteToggle,
  isHalfSpeed = false,
  onHalfSpeedToggle,
  locked = false,
}: MetronomeProps) => {
  const bpm = metronome.bpm;
  const setBpm = metronome.setBpm;
  const minBpm = metronome.minBpm;
  const maxBpm = metronome.maxBpm;

  const [isEditingBpm, setIsEditingBpm] = useState(false);
  const [bpmInput, setBpmInput] = useState("");
  const bpmInputRef = useRef<HTMLInputElement>(null);

  const handleBpmClick = () => {
    setBpmInput(String(bpm));
    setIsEditingBpm(true);
    setTimeout(() => bpmInputRef.current?.select(), 0);
  };

  const commitBpmInput = () => {
    const parsed = parseInt(bpmInput, 10);
    if (!isNaN(parsed)) {
      setBpm(Math.min(maxBpm, Math.max(minBpm, parsed)));
    }
    setIsEditingBpm(false);
  };

  const tempoColor = getTempoColor(bpm);

  return (
    <Card className='relative overflow-hidden rounded-lg border-0 bg-card/80 p-3 shadow-xl backdrop-blur-sm'>
      {onHalfSpeedToggle && (
        <div className='absolute left-3 top-3'>
          <button
            onClick={() => onHalfSpeedToggle(!isHalfSpeed)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-all",
              isHalfSpeed
                ? "bg-cyan-400 text-black shadow-[0_0_15px_rgba(34,211,238,0.8)]"
                : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
            )}
            title='Half Speed'>
            <Gauge className='h-4 w-4 shrink-0' strokeWidth={2.5} />
            <span className='text-[11px] font-bold tracking-wider'>0.5x</span>
          </button>
        </div>
      )}

      <div className='absolute right-2 top-2'>
        <button
          onClick={() => onMuteToggle?.(!isMuted)}
          className={cn(
            "rounded-lg p-1.5 transition-colors",
            isMuted
              ? "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              : "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-200",
          )}
          title={isMuted ? "Unmute" : "Mute"}>
          {isMuted ? (
            <VolumeX className='h-4 w-4' strokeWidth={2.5} />
          ) : (
            <Volume2 className='h-4 w-4' strokeWidth={2.5} />
          )}
        </button>
      </div>

      <div className='mt-1 flex flex-col items-center justify-center py-2'>
        {locked ? (
          <div className='flex flex-col items-center gap-2'>
            <div className='flex items-center gap-2'>
              <Lock size={14} className='text-amber-400' />
              <span
                className={cn(
                  "select-none text-4xl font-black tabular-nums",
                  tempoColor,
                )}>
                {bpm}
              </span>
            </div>
          </div>
        ) : isEditingBpm ? (
          <input
            ref={bpmInputRef}
            type='number'
            value={bpmInput}
            min={minBpm}
            max={maxBpm}
            onChange={(e) => setBpmInput(e.target.value)}
            onBlur={commitBpmInput}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitBpmInput();
              if (e.key === "Escape") setIsEditingBpm(false);
            }}
            className='w-20 rounded-lg bg-zinc-900/50 px-2 py-1 text-center text-4xl font-black tabular-nums text-cyan-400 outline-none ring-2 ring-cyan-500'
          />
        ) : (
          <button
            onClick={handleBpmClick}
            className={cn(
              "cursor-pointer select-none text-4xl font-black tabular-nums underline decoration-white/20 decoration-dashed underline-offset-4 transition-transform hover:scale-105 hover:decoration-white/50 active:scale-95",
              tempoColor,
            )}
            title='Click to edit BPM'>
            {bpm}
          </button>
        )}
        <span className='mt-2 select-none text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500'>
          {locked
            ? "BPM · exam mode"
            : isEditingBpm
              ? "↵ to confirm"
              : "BPM · click to edit"}
        </span>
      </div>

      <div className='mt-1 flex flex-col gap-2'>
        <div className='flex items-center gap-3'>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7 shrink-0 rounded-lg bg-zinc-800/40 text-zinc-100 transition-colors hover:bg-zinc-700/80 hover:text-white'
            onClick={() => setBpm(Math.max(minBpm, bpm - 1))}
            disabled={locked || bpm <= minBpm}>
            <Minus className='h-4 w-4' strokeWidth={2.5} />
          </Button>

          <div className='flex flex-1 flex-col gap-1'>
            <Slider
              value={[bpm]}
              min={minBpm}
              max={maxBpm}
              step={1}
              onValueChange={(value) => {
                if (!locked) setBpm(value[0]);
              }}
              className={cn(
                "py-1.5",
                locked ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                getSliderTrackColor(bpm),
              )}
            />
            <div className='flex select-none items-center justify-between px-1 text-[10px] font-bold text-zinc-600'>
              <span>{minBpm}</span>
              <span>{maxBpm}</span>
            </div>
          </div>

          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7 shrink-0 rounded-lg bg-zinc-800/40 text-zinc-100 transition-colors hover:bg-zinc-700/80 hover:text-white'
            onClick={() => setBpm(Math.min(maxBpm, bpm + 1))}
            disabled={locked || bpm >= maxBpm}>
            <Plus className='h-4 w-4' strokeWidth={2.5} />
          </Button>
        </div>

        {metronome.setSubdivision && (
          <div className='flex items-center gap-1 rounded-lg bg-zinc-900/40 p-1'>
            {SUBDIVISIONS.map(({ value, title }) => (
              <button
                key={value}
                onClick={() => metronome.setSubdivision(value)}
                disabled={locked}
                title={title}
                aria-label={title}
                className={cn(
                  "flex flex-1 items-center justify-center rounded-md py-1.5 transition-colors",
                  metronome.subdivision === value
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300",
                  locked && "cursor-not-allowed opacity-50",
                )}>
                <SubdivisionIcon value={value} className='h-5 w-5' />
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
