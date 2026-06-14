import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "assets/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { Check, ChevronDown, Snail, X } from "lucide-react";
import { memo, useState } from "react";
import { createPortal } from "react-dom";
import { FaMicrophone, FaSync } from "react-icons/fa";
import { GiGuitar } from "react-icons/gi";

import { AmpSimButton } from "./AmpSimButton";
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
  disableTuner?: boolean;
  baseBpm?: number;
  trailing?: React.ReactNode;
  examMode?: boolean;
  /** Keep the backing-track (guitar) toggle available even in exam mode (e.g. scale exams). */
  showBackingInExam?: boolean;
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
  disableTuner = false,
  baseBpm,
  trailing,
  examMode = false,
  showBackingInExam = false,
}: MediaControlsToolbarProps) {
  const [isTunerOpen, setIsTunerOpen] = useState(false);

  // In exam mode the speed control is always hidden (tempo is fixed). The backing
  // track (guitar) toggle is hidden too, unless the exam explicitly keeps it
  // (e.g. scale exams, where hearing the reference scale is allowed).
  const showSpeed   = !examMode;
  const showBacking = !examMode || showBackingInExam;

  if (!hasMetronome && !hasAudioTrack && !hasMicControls) return null;

  const isSlowed = speedMultiplier < 1;
  const hasTuner = hasMicControls && !!frequencyRef && !!volumeRef && !disableTuner;
  const h = compact ? "h-8" : "h-12";

  if (compact) {
    return (
      <div className="flex flex-col gap-1.5">
        {showSpeed && hasMetronome && (
          <SpeedDropdown
            compact
            speedMultiplier={speedMultiplier}
            onSpeedMultiplierChange={onSpeedMultiplierChange}
            baseBpm={baseBpm}
            isSlowed={isSlowed}
            h="h-8"
          />
        )}

        <div className="flex gap-1.5 flex-wrap">
          {showBacking && hasAudioTrack && (
            <button
              onClick={onAudioToggle}
              disabled={isRiddleMode}
              title={isAudioMuted ? "Backing track off" : "Backing track on"}
              className={cn(
                "flex items-center justify-center h-8 w-8 rounded-lg transition-all active:scale-90",
                isAudioMuted
                  ? "bg-zinc-800 text-zinc-400 hover:text-white"
                  : "bg-cyan-950 text-cyan-400 hover:bg-cyan-900",
                isRiddleMode && "opacity-50 cursor-not-allowed"
              )}
            >
              <GiGuitar className="text-sm" />
            </button>
          )}

          {showBacking && hasAudioTrack && hasMicControls && (
            <div className="h-8 w-px bg-white/10 self-center mx-0.5" aria-hidden />
          )}

          {hasMicControls && (
            <>
              <button
                onClick={examMode && isMicEnabled ? undefined : onMicToggle}
                disabled={examMode && isMicEnabled}
                title={examMode && isMicEnabled ? "Pitch Detect required during exam" : isMicEnabled ? "Pitch Detect on" : "Pitch Detect off"}
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-lg transition-all active:scale-90",
                  isMicEnabled
                    ? "bg-emerald-950 text-emerald-400 hover:bg-emerald-900"
                    : "bg-zinc-800 text-zinc-400 hover:text-white",
                  examMode && isMicEnabled && "cursor-not-allowed active:scale-100 hover:bg-emerald-950"
                )}
              >
                <FaMicrophone className="h-3 w-3" />
              </button>

              {isMicEnabled && (
                <button
                  onClick={onRecalibrate}
                  title="Recalibrate"
                  className="flex items-center justify-center h-8 w-8 rounded-lg transition-all active:scale-90 bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <FaSync className="h-3 w-3" />
                </button>
              )}

              {/* Electron-only amp simulator (renders nothing on web) */}
              <AmpSimButton compact />

              {hasTuner && (
                <button
                  onClick={() => setIsTunerOpen(true)}
                  title="Tuner"
                  className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-lg transition-all active:scale-90",
                    isTunerOpen
                      ? "bg-violet-950 text-violet-400"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  )}
                >
                  <TuningForkIcon className="h-3 w-3" />
                </button>
              )}
            </>
          )}
          {trailing}
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
      {/* ── PLAYBACK zone: speed + backing track ── */}
      {((showSpeed && hasMetronome) || (showBacking && hasAudioTrack)) && (
        <div className="flex items-center gap-1.5">
          {showSpeed && hasMetronome && (
            <SpeedDropdown
              speedMultiplier={speedMultiplier}
              onSpeedMultiplierChange={onSpeedMultiplierChange}
              baseBpm={baseBpm}
              isSlowed={isSlowed}
              h={h}
            />
          )}

          {showBacking && hasAudioTrack && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onAudioToggle}
                  disabled={isRiddleMode}
                  className={cn(
                    "flex items-center justify-center w-12 rounded-lg transition-all active:scale-95",
                    h,
                    isAudioMuted
                      ? "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                      : "bg-cyan-950 text-cyan-400 hover:bg-cyan-900",
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
        </div>
      )}

      {/* ── Divider between playback and input zones ── */}
      {((showSpeed && hasMetronome) || (showBacking && hasAudioTrack)) && hasMicControls && (
        <div className="h-7 w-px bg-white/10 self-center" aria-hidden />
      )}

      {/* ── INPUT zone: mic / recalibrate / tuner ── */}
      {hasMicControls && (
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={examMode && isMicEnabled ? undefined : onMicToggle}
                disabled={examMode && isMicEnabled}
                className={cn(
                  "flex items-center gap-2 px-4 rounded-lg transition-all font-semibold active:scale-95",
                  h,
                  isMicEnabled
                    ? "bg-emerald-950 text-emerald-400 hover:bg-emerald-900"
                    : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700",
                  examMode && isMicEnabled && "cursor-not-allowed active:scale-100 hover:bg-emerald-950"
                )}
              >
                <FaMicrophone className="h-4 w-4 shrink-0" />
                <span className="text-[10px] font-semibold tracking-wide">Pitch Detect</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {examMode && isMicEnabled
                ? "Pitch Detect required during the exam"
                : isMicEnabled
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
                    "flex items-center gap-2 px-4 rounded-lg transition-all bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 active:scale-95",
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

          {/* Electron-only amp simulator (renders nothing on web) */}
          <AmpSimButton h={h} />

          {hasTuner && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsTunerOpen(true)}
                  className={cn(
                    "flex items-center gap-2 px-4 rounded-lg transition-all active:scale-95",
                    h,
                    isTunerOpen
                      ? "bg-violet-950 text-violet-400 hover:bg-violet-900"
                      : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                  )}
                >
                  <TuningForkIcon className="h-4 w-4 shrink-0" />
                  <span className="text-[10px] font-semibold tracking-wide">Tuner</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Chromatic tuner</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}

      {trailing}

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

function SpeedDropdown({
  speedMultiplier,
  onSpeedMultiplierChange,
  baseBpm,
  isSlowed,
  h,
  compact = false,
}: {
  speedMultiplier: number;
  onSpeedMultiplierChange: (value: number) => void;
  baseBpm?: number;
  isSlowed: boolean;
  h: string;
  compact?: boolean;
}) {
  const current = SPEED_MODES.find((m) => m.value === speedMultiplier) ?? SPEED_MODES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          title="Playback speed — slow down to learn tricky passages"
          className={cn(
            "flex items-center rounded-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/50 active:scale-95",
            h,
            compact ? "gap-1.5 px-2" : "gap-2 px-3",
            isSlowed
              ? "bg-cyan-950 text-cyan-300 hover:bg-cyan-900"
              : "bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700"
          )}
        >
          <Snail className={cn("shrink-0", compact ? "h-3 w-3" : "h-4 w-4")} />
          <span className={cn("font-mono font-bold", compact ? "text-[10px]" : "text-sm")}>{current.label}</span>
          <ChevronDown className={cn("opacity-60 shrink-0", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="min-w-[9rem] border border-white/10 bg-zinc-900 text-white">
        {SPEED_MODES.map(({ value, label }) => {
          const active = speedMultiplier === value;
          return (
            <DropdownMenuItem
              key={value}
              onSelect={() => onSpeedMultiplierChange(value)}
              className={cn(
                "flex cursor-pointer items-center gap-2 text-xs font-semibold focus:bg-zinc-800 focus:text-white",
                active ? "text-cyan-300" : "text-zinc-300"
              )}
            >
              <span className="w-9 font-mono">{label}</span>
              {baseBpm ? (
                <span className="font-mono text-[10px] text-zinc-500">{Math.round(baseBpm * value)} BPM</span>
              ) : null}
              {active && <Check className="ml-auto h-3.5 w-3.5 text-cyan-300" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
        className="relative bg-zinc-900 rounded-lg shadow-2xl p-8 w-72"
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
