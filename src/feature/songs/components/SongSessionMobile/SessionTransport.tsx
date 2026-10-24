import { cn } from "assets/lib/utils";
import type { SongSection } from "feature/songs/types/songSection.type";
import {
  findSectionIndexAt,
  formatSectionTime,
  sortSections,
} from "feature/songs/utils/sectionTimes.utils";
import { useTranslation } from "hooks/useTranslation";
import {
  BookmarkPlus,
  Pause,
  Play,
  Repeat2,
  SkipBack,
  SkipForward,
} from "lucide-react";
import type { ReactNode } from "react";

/** Past this far into a section, "previous" goes back to its start first, like a music player. */
const RESTART_THRESHOLD = 2;

interface SessionTransportProps {
  sections: SongSection[];
  currentTime: number;
  duration: number;
  loopSectionId: string | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onLoop: (section: SongSection) => void;
  onMark: () => void;
}

const SideButton = ({
  label,
  icon,
  active,
  disabled,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) => (
  <button
    type='button'
    onClick={onClick}
    disabled={disabled}
    aria-pressed={active}
    className={cn(
      "flex h-14 w-16 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40",
      active
        ? "bg-cyan-500/10 text-cyan-400"
        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 active:bg-zinc-800",
    )}>
    {icon}
    {label}
  </button>
);

const SkipButton = ({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    type='button'
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className='flex h-12 w-12 items-center justify-center rounded-full text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 hover:bg-zinc-800 hover:text-zinc-100 active:bg-zinc-800'>
    {children}
  </button>
);

/**
 * The phone's song controls, under the video: one play button for the video
 * and the session time together, section skipping, the loop and marking a new
 * section at the playhead — the keyboard shortcuts of the desktop layout, as
 * buttons.
 */
export const SessionTransport = ({
  sections,
  currentTime,
  duration,
  loopSectionId,
  isPlaying,
  onTogglePlay,
  onSeek,
  onLoop,
  onMark,
}: SessionTransportProps) => {
  const { t } = useTranslation("timer");
  const sorted = sortSections(sections);
  const index = findSectionIndexAt(sorted, currentTime);
  const current = index >= 0 ? sorted[index] : null;
  const looping = sorted.find((s) => s.id === loopSectionId) ?? null;
  const next = sorted[index + 1] ?? null;

  // With a loop on, skipping moves the loop along instead of escaping it.
  const goTo = (section: SongSection) =>
    looping ? onLoop(section) : onSeek(section.startTime);

  const handlePrev = () => {
    if (current && currentTime - current.startTime > RESTART_THRESHOLD) {
      onSeek(current.startTime);
      return;
    }
    const previous = sorted[index - 1];
    if (previous) goTo(previous);
    else onSeek(0);
  };

  const label = looping ?? current;

  return (
    <div className='space-y-3 rounded-lg bg-zinc-900 px-3 pb-3 pt-3.5'>
      <div className='flex items-center justify-between gap-3 px-1'>
        <p className='flex min-w-0 items-center gap-2 text-sm'>
          {label ? (
            <>
              <span
                className='h-2 w-2 shrink-0 rounded-full'
                style={{ backgroundColor: label.color }}
              />
              <span className='truncate font-semibold text-zinc-100'>
                {label.name}
              </span>
              {looping && (
                <span className='shrink-0 text-xs font-medium text-cyan-400'>
                  {t("song_timer.looping")}
                </span>
              )}
            </>
          ) : (
            <span className='truncate text-zinc-400'>
              {t("song_timer.no_section")}
            </span>
          )}
        </p>
        <span className='font-mono shrink-0 text-xs tabular-nums text-zinc-400'>
          {formatSectionTime(currentTime)}
          {duration > 0 && ` / ${formatSectionTime(duration)}`}
        </span>
      </div>

      <div className='flex items-center justify-between'>
        <SideButton
          label={t("song_timer.loop_short")}
          icon={<Repeat2 className='h-5 w-5' />}
          active={!!looping}
          disabled={!looping && !current}
          onClick={() => {
            const target = looping ?? current;
            if (target) onLoop(target);
          }}
        />

        <div className='flex items-center gap-1'>
          <SkipButton
            label={t("song_timer.prev_section")}
            disabled={sorted.length === 0}
            onClick={handlePrev}>
            <SkipBack className='h-5 w-5 fill-current' />
          </SkipButton>
          <button
            type='button'
            onClick={onTogglePlay}
            aria-label={
              isPlaying ? t("song_timer.pause") : t("song_timer.play")
            }
            className='flex h-14 w-14 items-center justify-center rounded-full bg-white text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 hover:bg-zinc-200 active:bg-zinc-300'>
            {isPlaying ? (
              <Pause className='h-6 w-6 fill-current' />
            ) : (
              <Play className='ml-0.5 h-6 w-6 fill-current' />
            )}
          </button>
          <SkipButton
            label={t("song_timer.next_section")}
            disabled={!next}
            onClick={() => next && goTo(next)}>
            <SkipForward className='h-5 w-5 fill-current' />
          </SkipButton>
        </div>

        <SideButton
          label={t("song_timer.mark_short")}
          icon={<BookmarkPlus className='h-5 w-5' />}
          onClick={onMark}
        />
      </div>
    </div>
  );
};
