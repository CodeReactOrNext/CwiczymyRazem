import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "assets/components/ui/dropdown-menu";
import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import { RippleButton } from "hooks/useRipple";
import { Volume1, Volume2, VolumeX } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { GiGuitar, GiMetronome } from "react-icons/gi";

import type { AudioTrackConfig } from "../../../hooks/useTablatureAudio";

interface VolumeButtonProps {
  /** Metronome click volume — omit (with its setters) to hide the metronome section. */
  metronome?: { volume?: number; setVolume?: (v: number) => void };
  isMetronomeMuted?: boolean;
  setIsMetronomeMuted?: (v: boolean) => void;
  /** Overall boost on top of every track's own volume (1 = normal, up to 2 = +100%).
   *  Omit (with its setter) to hide the GP boost section — it only affects Guitar Pro playback. */
  masterVolume?: number;
  onMasterVolumeChange?: (v: number) => void;
  /** Per-track volume — shown whenever there's at least one track (the "main" backing
   *  track), with one row per track once a Guitar Pro file has more than one instrument. */
  audioTracks?: AudioTrackConfig[];
  setTrackConfigs?: Dispatch<SetStateAction<Record<string, { volume: number; isMuted: boolean }>>>;
  /** Icon-only trigger sized for the compact toolbar layout. */
  compact?: boolean;
  /** Height class to align with sibling toolbar buttons (e.g. "h-12" / "h-8"). */
  h?: string;
  /** Full-width labelled trigger for the mobile/landscape-drawer toolbar layout. */
  mobile?: boolean;
}

const sectionLabel = "text-[10px] font-semibold tracking-[0.12em] text-zinc-400";
const valueBadge = (highlighted: boolean) =>
  cn(
    "min-w-[2.75rem] rounded-md px-1.5 py-0.5 text-center font-mono text-[11px] font-bold tabular-nums",
    highlighted ? "bg-cyan-500/15 text-cyan-400" : "bg-white/10 text-white"
  );

export const VolumeButton = ({
  metronome,
  isMetronomeMuted = false,
  setIsMetronomeMuted,
  masterVolume,
  onMasterVolumeChange,
  audioTracks,
  setTrackConfigs,
  compact = false,
  h = "h-12",
  mobile = false,
}: VolumeButtonProps) => {
  const showMetronome = !!metronome && !!setIsMetronomeMuted && metronome.volume !== undefined;
  const showMasterVolume = masterVolume !== undefined && !!onMasterVolumeChange;
  // Shown whenever there's at least the main (backing) track — a GP file with
  // several instruments just means more rows in the same list.
  const showTracks = !!audioTracks && audioTracks.length > 0 && !!setTrackConfigs;
  const tracksLabel = (audioTracks?.length ?? 0) > 1 ? "Instruments" : "Backing track";

  if (!showMetronome && !showMasterVolume && !showTracks) return null;

  const metronomeVolume = metronome?.volume ?? 0.5;
  const isBoosted = showMasterVolume && masterVolume! > 1;
  const VolumeIcon = isBoosted
    ? Volume2
    : showMetronome && (isMetronomeMuted || metronomeVolume <= 0.0001)
    ? VolumeX
    : Volume2;

  const trigger = mobile ? (
    <RippleButton
      title='Volume'
      className='flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-lg bg-zinc-800 text-zinc-400 transition-all active:scale-95'>
      <VolumeIcon className='h-4 w-4 shrink-0' strokeWidth={2.5} />
      <span className='truncate text-[10px] font-semibold tracking-wide'>Volume</span>
    </RippleButton>
  ) : (
    <RippleButton
      title='Volume'
      className={cn(
        "flex items-center justify-center shrink-0 rounded-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/50",
        compact ? "h-8 w-8 active:scale-90" : cn("w-12 active:scale-95", h),
        isBoosted
          ? "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
          : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
      )}>
      <VolumeIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2.5} />
    </RippleButton>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align='center'
        sideOffset={8}
        // Bind to Radix's own collision-aware height instead of a fixed vh value —
        // a long GP track list needs to scroll no matter where the trigger sits on screen.
        // z-[99999999] clears the session's full-screen layer (z-[999999] desktop /
        // z-[9999999] mobile) — the default z-50 would paint underneath it.
        className='z-[99999999] w-72 max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto rounded-xl border border-white/10 bg-zinc-900/95 p-3.5 text-white shadow-xl shadow-black/40 backdrop-blur-md'>
        {showMetronome && (
          <div>
            <div className='mb-3 flex items-center justify-between'>
              <span className={cn(sectionLabel, "flex items-center gap-1.5")}>
                <GiMetronome className='h-3 w-3' />
                Metronome
              </span>
              <span className={valueBadge(!isMetronomeMuted)}>
                {isMetronomeMuted ? "Muted" : `${Math.round(metronomeVolume * 100)}%`}
              </span>
            </div>
            <div className='flex items-center gap-2.5'>
              <button
                onClick={() => setIsMetronomeMuted!(!isMetronomeMuted)}
                title={isMetronomeMuted ? "Unmute metronome" : "Mute metronome"}
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors active:scale-95",
                  isMetronomeMuted
                    ? "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}>
                {isMetronomeMuted || metronomeVolume <= 0.0001 ? (
                  <VolumeX className='h-4 w-4' strokeWidth={2.5} />
                ) : metronomeVolume < 0.5 ? (
                  <Volume1 className='h-4 w-4' strokeWidth={2.5} />
                ) : (
                  <Volume2 className='h-4 w-4' strokeWidth={2.5} />
                )}
              </button>
              <Slider
                value={[isMetronomeMuted ? 0 : metronomeVolume]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={([v]) => {
                  if (isMetronomeMuted && v > 0) setIsMetronomeMuted!(false);
                  metronome?.setVolume?.(v);
                }}
                className={cn(
                  "flex-1 cursor-pointer",
                  "[&>span:first-child]:bg-white/15 [&>span:first-child>span]:bg-white",
                  "[&_[role=slider]]:border-white/60 [&_[role=slider]]:bg-white"
                )}
              />
            </div>
          </div>
        )}

        {showMasterVolume && (
          <div className={showMetronome ? "mt-4" : undefined}>
            <div className='mb-3 flex items-center justify-between'>
              <span className={sectionLabel}>Boost volume</span>
              <span className={valueBadge(isBoosted)}>{Math.round(masterVolume! * 100)}%</span>
            </div>
            <Slider
              value={[masterVolume! * 100]}
              min={0}
              max={200}
              step={5}
              onValueChange={([v]) => onMasterVolumeChange!(v / 100)}
              className={cn(
                "cursor-pointer",
                "[&>span:first-child]:bg-white/15",
                isBoosted
                  ? "[&>span:first-child>span]:bg-cyan-400 [&_[role=slider]]:border-cyan-400/60 [&_[role=slider]]:bg-cyan-400"
                  : "[&>span:first-child>span]:bg-white [&_[role=slider]]:border-white/60 [&_[role=slider]]:bg-white"
              )}
            />
            <p className='mt-2 text-[10px] leading-relaxed text-zinc-500'>
              Boost the Guitar Pro playback above 100% if it sounds too quiet.
            </p>
          </div>
        )}

        {showTracks && (
          <div className={cn("space-y-3", (showMetronome || showMasterVolume) && "mt-4")}>
            <span className={cn(sectionLabel, "flex items-center gap-1.5")}>
              <GiGuitar className='h-3 w-3' />
              {tracksLabel}
            </span>
            {audioTracks!.map((track) => {
              const muteButton = (
                <button
                  onClick={() =>
                    setTrackConfigs!((prev) => ({
                      ...prev,
                      [track.id]: { ...prev[track.id], isMuted: !prev[track.id]?.isMuted },
                    }))
                  }
                  title={track.isMuted ? "Unmute" : "Mute"}
                  className={cn(
                    "shrink-0 rounded p-1 transition-colors",
                    track.isMuted ? "bg-red-500/10 text-red-400" : "text-zinc-500 hover:text-white"
                  )}>
                  {track.isMuted ? (
                    <VolumeX className='h-3.5 w-3.5' strokeWidth={2.5} />
                  ) : (
                    <Volume2 className='h-3.5 w-3.5' strokeWidth={2.5} />
                  )}
                </button>
              );

              return (
                <div key={track.id} className='space-y-1.5'>
                  {/* A single track's name is already covered by the section label above —
                      only label individual rows once there's more than one to tell apart. */}
                  {audioTracks!.length > 1 && (
                    <div className='flex items-center justify-between'>
                      <span className='max-w-[150px] truncate text-[11px] font-semibold text-zinc-300'>
                        {track.id === "main" ? "Main Instrument" : track.name}
                      </span>
                      {muteButton}
                    </div>
                  )}
                  <div className='flex items-center gap-2.5'>
                    {audioTracks!.length === 1 && muteButton}
                    <Slider
                      value={[track.isMuted ? 0 : track.volume * 100]}
                      max={100}
                      step={1}
                      className='flex-1 cursor-pointer'
                      onValueChange={([val]) =>
                        setTrackConfigs!((prev) => ({
                          ...prev,
                          [track.id]: { ...prev[track.id], volume: val / 100, isMuted: val === 0 },
                        }))
                      }
                    />
                    <span className='w-8 shrink-0 text-right font-mono text-[10px] text-zinc-500'>
                      {Math.round(track.volume * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
