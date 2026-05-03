import { Tooltip, TooltipContent, TooltipTrigger } from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { Snail, X } from "lucide-react";
import { memo, useState } from "react";
import { createPortal } from "react-dom";
import { FaMicrophone, FaSync } from "react-icons/fa";
import { GiGuitar } from "react-icons/gi";

import { ArcTuner } from "./CalibrationWizard/components/ArcTuner";
import { useLiveTuner } from "../hooks/useLiveTuner";

const SPEED_MODES: { value: number; label: string }[] = [
  { value: 1,    label: "100%" },
  { value: 0.75, label: "75%"  },
  { value: 0.5,  label: "50%"  },
  { value: 0.25, label: "25%"  },
];

interface MediaControlsToolbarProps {
  hasMetronome: boolean;
  hasAudioTrack: boolean;
  hasMicControls: boolean;
  speedMultiplier: number;
  onSpeedMultiplierChange: (value: number) => void;
  isAudioMuted: boolean;
  isRiddleMode: boolean;
  onAudioToggle: () => void;
  isMicEnabled: boolean;
  onMicToggle: () => void;
  onRecalibrate: () => void;
  frequencyRef?: React.RefObject<number>;
  volumeRef?: React.RefObject<number>;
  compact?: boolean;
}

export const MediaControlsToolbar = memo(function MediaControlsToolbar({
  hasMetronome,
  hasAudioTrack,
  hasMicControls,
  speedMultiplier,
  onSpeedMultiplierChange,
  isAudioMuted,
  isRiddleMode,
  onAudioToggle,
  isMicEnabled,
  onMicToggle,
  onRecalibrate,
  frequencyRef,
  volumeRef,
  compact = false,
}: MediaControlsToolbarProps) {
  const [isTunerOpen, setIsTunerOpen] = useState(false);

  if (!hasMetronome && !hasAudioTrack && !hasMicControls) return null;

  const isSlowed = speedMultiplier < 1;
  const hasTuner = hasMicControls && !!frequencyRef && !!volumeRef;
  const h = compact ? "h-8" : "h-12";

  if (compact) {
    return (
      <div className="flex flex-col gap-1.5">
        {hasMetronome && (
          <div className={cn(
            "flex items-center rounded-[6px] border overflow-hidden transition-all",
            isSlowed ? "border-cyan-500/30 bg-cyan-500/5" : "border-white/5 bg-white/5"
          )}>
            <div className={cn(
              "flex items-center justify-center w-7 shrink-0 border-r border-white/5 h-8 select-none",
              isSlowed ? "text-cyan-400" : "text-zinc-500"
            )}>
              <Snail className="h-3 w-3" />
            </div>
            {SPEED_MODES.map(({ value, label }) => {
              const active = speedMultiplier === value;
              const isNormal = value === 1;
              return (
                <button
                  key={value}
                  onClick={() => onSpeedMultiplierChange(isNormal ? 1 : active ? 1 : value)}
                  className={cn(
                    "flex items-center justify-center flex-1 h-8 text-[10px] font-mono font-semibold transition-all border-r border-white/5 last:border-r-0",
                    active && isNormal
                      ? "bg-white/10 text-white"
                      : active
                      ? "bg-cyan-500/15 text-cyan-300"
                      : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex gap-1.5 flex-wrap">
          {hasAudioTrack && (
            <button
              onClick={onAudioToggle}
              disabled={isRiddleMode}
              title={isAudioMuted ? "Backing track off" : "Backing track on"}
              className={cn(
                "flex items-center justify-center h-8 w-8 rounded-[6px] transition-all border",
                isAudioMuted
                  ? "bg-white/5 border-white/5 text-zinc-400 hover:text-white"
                  : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20",
                isRiddleMode && "opacity-50 cursor-not-allowed"
              )}
            >
              <GiGuitar className="text-sm" />
            </button>
          )}

          {hasMicControls && (
            <>
              <button
                onClick={onMicToggle}
                title={isMicEnabled ? "Pitch Detect on" : "Pitch Detect off"}
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-[6px] transition-all border",
                  isMicEnabled
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                    : "bg-white/5 border-white/5 text-zinc-400 hover:text-white"
                )}
              >
                <FaMicrophone className="h-3 w-3" />
              </button>

              {isMicEnabled && (
                <button
                  onClick={onRecalibrate}
                  title="Recalibrate"
                  className="flex items-center justify-center h-8 w-8 rounded-[6px] transition-all border bg-white/5 border-white/5 text-zinc-400 hover:text-white"
                >
                  <FaSync className="h-3 w-3" />
                </button>
              )}

              {hasTuner && (
                <button
                  onClick={() => setIsTunerOpen(true)}
                  title="Tuner"
                  className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-[6px] transition-all border",
                    isTunerOpen
                      ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                      : "bg-white/5 border-white/5 text-zinc-400 hover:text-white"
                  )}
                >
                  <TuningForkIcon className="h-3 w-3" />
                </button>
              )}
            </>
          )}
        </div>

        {isTunerOpen && hasTuner && createPortal(
          <TunerDialog
            frequencyRef={frequencyRef!}
            volumeRef={volumeRef!}
            isMicEnabled={isMicEnabled}
            onClose={() => setIsTunerOpen(false)}
          />,
          document.body
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
      {hasMetronome && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center rounded-[8px] border overflow-hidden transition-all",
              h,
              isSlowed ? "border-cyan-500/30 bg-cyan-500/5" : "border-white/5 bg-white/5"
            )}>
              <div className={cn(
                "flex items-center gap-1.5 px-3 border-r border-white/5 h-full select-none",
                isSlowed ? "text-cyan-400" : "text-zinc-500"
              )}>
                <Snail className="h-4 w-4 shrink-0" />
                <span className="text-[10px] font-semibold tracking-wide hidden sm:block">Slow</span>
              </div>
              {SPEED_MODES.map(({ value, label }) => {
                const active = speedMultiplier === value;
                const isNormal = value === 1;
                return (
                  <button
                    key={value}
                    onClick={() => onSpeedMultiplierChange(isNormal ? 1 : active ? 1 : value)}
                    className={cn(
                      "flex items-center justify-center px-3 h-full text-xs font-mono font-semibold transition-all border-r border-white/5 last:border-r-0",
                      active && isNormal
                        ? "bg-white/10 text-white"
                        : active
                        ? "bg-cyan-500/15 text-cyan-300"
                        : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Play at reduced speed — great for learning difficult passages. Click active mode to return to normal.
          </TooltipContent>
        </Tooltip>
      )}

      {hasAudioTrack && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onAudioToggle}
              disabled={isRiddleMode}
              className={cn(
                "flex items-center justify-center w-12 rounded-[8px] transition-all border",
                h,
                isAudioMuted
                  ? "bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5"
                  : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20",
                isRiddleMode && "opacity-50 cursor-not-allowed"
              )}
            >
              <GiGuitar className="text-lg" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isAudioMuted ? "Backing track off" : "Backing track on"}
          </TooltipContent>
        </Tooltip>
      )}

      {hasMicControls && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onMicToggle}
                className={cn(
                  "flex items-center gap-2 px-4 rounded-[8px] transition-all border font-semibold",
                  h,
                  isMicEnabled
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                    : "bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <FaMicrophone className="h-4 w-4 shrink-0" />
                <span className="text-[10px] font-semibold tracking-wide">Pitch Detect</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isMicEnabled
                ? "Microphone active — app is listening to your guitar"
                : "Enable microphone to detect what you're playing"}
            </TooltipContent>
          </Tooltip>

          {isMicEnabled && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onRecalibrate}
                  className={cn(
                    "flex items-center gap-2 px-4 rounded-[8px] transition-all border bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5",
                    h
                  )}
                >
                  <FaSync className="h-4 w-4 shrink-0" />
                  <span className="text-[10px] font-semibold tracking-wide">Recalibrate</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Recalibrate microphone</TooltipContent>
            </Tooltip>
          )}

          {hasTuner && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsTunerOpen(true)}
                  className={cn(
                    "flex items-center gap-2 px-4 rounded-[8px] transition-all border",
                    h,
                    isTunerOpen
                      ? "bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20"
                      : "bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <TuningForkIcon className="h-4 w-4 shrink-0" />
                  <span className="text-[10px] font-semibold tracking-wide">Tuner</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Chromatic tuner</TooltipContent>
            </Tooltip>
          )}
        </>
      )}

      {isTunerOpen && hasTuner && createPortal(
        <TunerDialog
          frequencyRef={frequencyRef!}
          volumeRef={volumeRef!}
          isMicEnabled={isMicEnabled}
          onClose={() => setIsTunerOpen(false)}
        />,
        document.body
      )}
    </div>
  );
});

function TuningForkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {/* two prongs */}
      <path d="M5 2 C5 2 5 7 5 8 C5 9.5 6.5 10.5 8 10.5 C9.5 10.5 11 9.5 11 8 C11 7 11 2 11 2" />
      {/* stem */}
      <line x1="8" y1="10.5" x2="8" y2="15" />
    </svg>
  );
}

function TunerDialog({
  frequencyRef,
  volumeRef,
  isMicEnabled,
  onClose,
}: {
  frequencyRef: React.RefObject<number>;
  volumeRef: React.RefObject<number>;
  isMicEnabled: boolean;
  onClose: () => void;
}) {
  const { cents, hasNote, noteName, octave } = useLiveTuner(frequencyRef, volumeRef);
  const abs = Math.abs(cents);
  const isInTune = hasNote && abs < 10;
  const isClose  = hasNote && abs < 25;
  const noteColor = !hasNote ? "text-zinc-600" : isInTune ? "text-emerald-400" : isClose ? "text-amber-400" : "text-red-400";

  return (
    <div
      className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-zinc-900 border border-white/10 rounded-[8px] shadow-2xl p-8 w-72"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        <p className="text-[10px] font-semibold tracking-wide text-zinc-500 text-center mb-4">Tuner</p>

        {!isMicEnabled && (
          <p className="text-xs text-zinc-500 text-center mb-4">Enable Pitch Detect to use the tuner</p>
        )}

        <ArcTuner cents={cents} hasNote={hasNote} />

        <div className="flex flex-col items-center mt-2 gap-0.5">
          <span className={cn("text-5xl font-bold font-mono tracking-tight transition-colors duration-200", noteColor)}>
            {noteName}
          </span>
          <span className="text-sm text-zinc-600 font-mono">{octave}</span>
          <span className={cn("text-sm font-mono mt-1 transition-colors duration-200", noteColor)}>
            {hasNote ? (cents > 0 ? `+${Math.round(cents)}¢` : `${Math.round(cents)}¢`) : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
