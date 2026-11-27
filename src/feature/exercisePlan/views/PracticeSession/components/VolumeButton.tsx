import { PRESSABLE_KEY } from "assets/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "assets/components/ui/dropdown-menu";
import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import { AutoBackingSection } from "feature/autoBacking/components/AutoBackingSection";
import { useTranslation } from "hooks/useTranslation";
import { AudioLines, ChevronDown, Headphones, Mic, Volume2, VolumeX } from "lucide-react";
import type { ComponentType, Dispatch, ReactNode, SetStateAction } from "react";
import { GiDrumKit, GiGuitar, GiGuitarBassHead, GiMetronome, GiPianoKeys } from "react-icons/gi";

import type { AudioTrackConfig } from "../../../hooks/useTablatureAudio";
import type { TabTrackType } from "../../../types/exercise.types";
import { GUITAR_MONITOR_MAX, useGuitarMonitorStore } from "./guitarMonitorStore";
import { SessionTooltip } from "./SessionTooltip";

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
  /** Says "Volume" beside the icon. */
  labelled?: boolean;
  /** Full-width labelled trigger for the mobile/landscape-drawer toolbar layout. */
  mobile?: boolean;
  /** Offer the "your guitar" row — hearing the input played back. Only while
   *  the browser's own input is open (the desktop app has its amp for this). */
  guitarMonitor?: boolean;
}

// One heading for every section of the menu.
const sectionLabel = "text-[13px] font-semibold text-zinc-200";

// Every fader the same: a white fill on a zinc track.
const faderClass = cn(
  "cursor-pointer",
  "[&>span:first-child]:bg-zinc-700 [&>span:first-child>span]:bg-white",
  "[&_[role=slider]]:border-white/60 [&_[role=slider]]:bg-white",
);

type IconComponent = ComponentType<{ className?: string }>;

/** A channel known by its instrument, so a row reads without its name. */
const TRACK_ICONS: Partial<Record<TabTrackType, IconComponent>> = {
  guitar: GiGuitar,
  bass: GiGuitarBassHead,
  drums: GiDrumKit,
  keys: GiPianoKeys,
  arp: AudioLines,
  vocals: Mic,
};

/**
 * One channel of the mix: its instrument as a key that mutes it, the name and
 * level over the fader. A muted channel dims and reads "Muted", not a level.
 */
const MixRow = ({
  icon: Icon,
  name,
  value,
  valueClassName,
  muted = false,
  onToggleMute,
  muteLabel,
  children,
}: {
  icon: IconComponent;
  name: string;
  value: string;
  valueClassName?: string;
  muted?: boolean;
  onToggleMute?: () => void;
  muteLabel?: string;
  children: ReactNode;
}) => (
  <div className='flex items-center gap-3'>
    {onToggleMute ? (
      <button
        type='button'
        onClick={onToggleMute}
        aria-pressed={muted}
        aria-label={muteLabel}
        title={muteLabel}
        className={cn(
          PRESSABLE_KEY,
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
          muted ? "bg-zinc-800 text-zinc-600 hover:text-zinc-300" : "bg-zinc-700 text-zinc-100 hover:bg-zinc-600",
        )}>
        <Icon className='h-4 w-4' />
      </button>
    ) : (
      <span aria-hidden className='flex h-9 w-9 shrink-0 items-center justify-center text-zinc-500'>
        <Icon className='h-4 w-4' />
      </span>
    )}
    <div className={cn("min-w-0 flex-1 transition-opacity", muted && "opacity-50")}>
      <div className='mb-2 flex items-center justify-between gap-2 text-xs font-medium text-zinc-300'>
        <span className='truncate'>{name}</span>
        <span className={cn("shrink-0 font-semibold tabular-nums text-zinc-400", valueClassName)}>{value}</span>
      </div>
      {children}
    </div>
  </div>
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
  labelled = false,
  mobile = false,
  guitarMonitor = false,
}: VolumeButtonProps) => {
  const { t } = useTranslation("session");
  const monitor = useGuitarMonitorStore();
  const showMetronome = !!metronome && !!setIsMetronomeMuted && metronome.volume !== undefined;
  const showMasterVolume = masterVolume !== undefined && !!onMasterVolumeChange;
  // Shown whenever there's at least the main (backing) track — a GP file with
  // several instruments just means more rows in the same list.
  const showTracks = !!audioTracks && audioTracks.length > 0 && !!setTrackConfigs;
  // A single row is always the session's own instrument (the tablature sampler or,
  // in a strumming exercise, the strum synth) — never a backing track. Calling it
  // one is why players hunted for a way to silence "the guitar" and found none.
  const tracksLabel = (audioTracks?.length ?? 0) > 1 ? t("volume.instruments") : t("media.guitar");

  if (!showMetronome && !showMasterVolume && !showTracks && !guitarMonitor) return null;

  const metronomeVolume = metronome?.volume ?? 0.5;
  const isBoosted = showMasterVolume && masterVolume! > 1;
  const VolumeIcon = isBoosted
    ? Volume2
    : showMetronome && (isMetronomeMuted || metronomeVolume <= 0.0001)
    ? VolumeX
    : Volume2;

  const trigger = mobile ? (
    <button
      type='button'
      title={t("volume.title")}
      className={cn(
        PRESSABLE_KEY,
        "flex h-12 w-full min-w-0 items-center justify-center gap-2 rounded-lg bg-zinc-800 text-zinc-400 transition-colors",
      )}>
      <VolumeIcon className='h-4 w-4 shrink-0' strokeWidth={2.5} />
      <span className='truncate text-xs font-semibold'>{t("volume.title")}</span>
    </button>
  ) : (
    <button
      type='button'
      aria-label={t("volume.title")}
      className={cn(
        PRESSABLE_KEY,
        "flex items-center justify-center shrink-0 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/50",
        compact ? "h-8 w-8" : cn(labelled ? "gap-2 px-2.5 font-medium" : "w-12", h),
        isBoosted
          ? "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
          : labelled
            ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
            : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
      )}>
      <VolumeIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={labelled ? 2 : 2.5} />
      {labelled && !compact && (
        <>
          <span className='text-[13px] font-medium'>{t("toolbar.backing")}</span>
          {/* A menu, so it carries the chevron every menu key in the toolbar does. */}
          <ChevronDown aria-hidden className='h-3.5 w-3.5 shrink-0 text-zinc-500' />
        </>
      )}
    </button>
  );

  return (
    <DropdownMenu>
      {mobile ? (
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      ) : (
        <SessionTooltip label={t("volume.hint")}>
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        </SessionTooltip>
      )}
      <DropdownMenuContent
        align='center'
        sideOffset={8}
        // Bind to Radix's own collision-aware height instead of a fixed vh value —
        // a long GP track list needs to scroll no matter where the trigger sits on screen.
        // z-[99999999] clears the session's full-screen layer (z-[999999] desktop /
        // z-[9999999] mobile) — the default z-50 would paint underneath it.
        className='z-[99999999] flex w-80 max-h-[var(--radix-dropdown-menu-content-available-height)] flex-col gap-6 overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/15'>
        {/* Every level in one place (metronome, the tab's own instrument and
            the band), so silencing the drums no longer means scrolling past the
            band's description to the bottom of the menu. */}
        <section className='flex flex-col gap-4'>
          <h4 className={sectionLabel}>{t("volume.mix")}</h4>

          {showMetronome && (
            <MixRow
              icon={GiMetronome}
              name={t("volume.metronome")}
              value={isMetronomeMuted ? t("volume.muted") : `${Math.round(metronomeVolume * 100)}%`}
              muted={isMetronomeMuted}
              onToggleMute={() => setIsMetronomeMuted!(!isMetronomeMuted)}
              muteLabel={isMetronomeMuted ? t("volume.unmute_metronome") : t("volume.mute_metronome")}>
              <Slider
                value={[isMetronomeMuted ? 0 : metronomeVolume]}
                min={0}
                max={1}
                step={0.05}
                aria-label={t("volume.metronome")}
                onValueChange={([v]) => {
                  if (isMetronomeMuted && v > 0) setIsMetronomeMuted!(false);
                  metronome?.setVolume?.(v);
                }}
                className={faderClass}
              />
            </MixRow>
          )}

          {showTracks &&
            audioTracks!.map((track) => {
              // A single row is always the session's own instrument (see tracksLabel).
              const name =
                audioTracks!.length === 1
                  ? tracksLabel
                  : track.id === "main"
                    ? t("volume.main_instrument")
                    : (track.name ?? track.id);
              const toggleMute = () =>
                setTrackConfigs!((prev) => ({
                  ...prev,
                  [track.id]: { ...prev[track.id], isMuted: !prev[track.id]?.isMuted },
                }));
              return (
                <MixRow
                  key={track.id}
                  icon={(track.trackType && TRACK_ICONS[track.trackType]) || GiGuitar}
                  name={name}
                  // Read the mute, not the stored level: a muted track kept
                  // showing "100%" next to a slider sitting at zero.
                  value={track.isMuted ? t("volume.muted") : `${Math.round(track.volume * 100)}%`}
                  muted={track.isMuted}
                  onToggleMute={toggleMute}
                  muteLabel={`${track.isMuted ? t("volume.unmute") : t("volume.mute")}: ${name}`}>
                  <Slider
                    value={[track.isMuted ? 0 : track.volume * 100]}
                    max={100}
                    step={1}
                    aria-label={name}
                    className={faderClass}
                    onValueChange={([val]) =>
                      setTrackConfigs!((prev) => ({
                        ...prev,
                        [track.id]: { ...prev[track.id], volume: val / 100, isMuted: val === 0 },
                      }))
                    }
                  />
                </MixRow>
              );
            })}

          {guitarMonitor && (
            <MixRow
              icon={Headphones}
              name={t("volume.your_guitar")}
              value={monitor.enabled ? `${Math.round(monitor.volume * 100)}%` : t("volume.off")}
              muted={!monitor.enabled}
              onToggleMute={() => monitor.setEnabled(!monitor.enabled)}
              muteLabel={monitor.enabled ? t("volume.monitor_off") : t("volume.monitor_on")}>
              <Slider
                value={[monitor.enabled ? monitor.volume * 100 : 0]}
                min={0}
                max={GUITAR_MONITOR_MAX * 100}
                step={5}
                aria-label={t("volume.your_guitar")}
                onValueChange={([v]) => {
                  monitor.setVolume(v / 100);
                  if (v > 0 && !monitor.enabled) monitor.setEnabled(true);
                  if (v === 0 && monitor.enabled) monitor.setEnabled(false);
                }}
                className={faderClass}
              />
              <p className='mt-2 text-xs leading-relaxed text-zinc-500'>
                {monitor.enabled ? t("volume.monitor_hint") : t("volume.monitor_off_hint")}
              </p>
            </MixRow>
          )}

          {showMasterVolume && (
            <MixRow
              icon={Volume2}
              name={t("volume.boost")}
              value={`${Math.round(masterVolume! * 100)}%`}
              valueClassName={isBoosted ? "text-cyan-400" : undefined}>
              <Slider
                value={[masterVolume! * 100]}
                min={0}
                max={200}
                step={5}
                aria-label={t("volume.boost")}
                onValueChange={([v]) => onMasterVolumeChange!(v / 100)}
                className={cn(
                  faderClass,
                  isBoosted &&
                    "[&>span:first-child>span]:bg-cyan-400 [&_[role=slider]]:border-cyan-400/60 [&_[role=slider]]:bg-cyan-400",
                )}
              />
              {isBoosted && <p className='mt-2 text-xs leading-relaxed text-zinc-500'>{t("media.boost_hint")}</p>}
            </MixRow>
          )}
        </section>

        <AutoBackingSection labelClassName={sectionLabel} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
