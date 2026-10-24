import { Button } from "assets/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "assets/components/ui/drawer";
import { cn } from "assets/lib/utils";
import { MASTERY_STYLES } from "feature/songs/components/SongSections/MasteryBadge";
import { PREDEFINED_NAMES } from "feature/songs/components/SongSections/SectionRow";
import type {
  MasteryLevel,
  SongSection,
} from "feature/songs/types/songSection.type";
import { MASTERY_LABELS } from "feature/songs/types/songSection.type";
import { formatSectionTime } from "feature/songs/utils/sectionTimes.utils";
import { useTranslation } from "hooks/useTranslation";
import { Trash2 } from "lucide-react";
import { useState } from "react";

const MASTERY_LEVELS: MasteryLevel[] = [0, 1, 2, 3, 4];

/** Steps a start can be moved by: 5 s to get near, 1 s to land on the beat. */
const NUDGES = [-5, -1, 1, 5];

const NudgeButton = ({
  seconds,
  onClick,
}: {
  seconds: number;
  onClick: () => void;
}) => {
  const { t } = useTranslation("timer");
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={t(
        seconds < 0 ? "song_timer.nudge_back_n" : "song_timer.nudge_forward_n",
        { count: Math.abs(seconds) },
      )}
      className='font-mono flex h-11 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-800/60 text-sm font-semibold tabular-nums text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800 hover:text-zinc-100'>
      {seconds > 0 ? `+${seconds}` : `−${Math.abs(seconds)}`}
    </button>
  );
};

interface SectionEditDrawerProps {
  /** The section being edited; null closes the drawer. */
  section: SongSection | null;
  currentTime: number;
  duration: number;
  onClose: () => void;
  onRename: (id: string, name: string) => void;
  onTimeChange: (id: string, startTime: number) => void;
  onMasteryChange: (id: string, mastery: MasteryLevel) => void;
  onDelete: (id: string) => void;
}

interface SectionEditBodyProps extends Omit<SectionEditDrawerProps, "section"> {
  section: SongSection;
}

const SectionEditBody = ({
  section,
  currentTime,
  duration,
  onClose,
  onRename,
  onTimeChange,
  onMasteryChange,
  onDelete,
}: SectionEditBodyProps) => {
  const { t } = useTranslation("timer");
  const [name, setName] = useState(section.name);

  const commitName = (next: string) => {
    const trimmed = next.trim();
    if (trimmed && trimmed !== section.name) onRename(section.id, trimmed);
    else setName(section.name);
  };

  const maxStart = duration > 0 ? Math.floor(duration) : Infinity;
  const setStart = (time: number) =>
    onTimeChange(section.id, Math.min(maxStart, Math.max(0, time)));
  const playhead = Math.floor(currentTime);

  return (
    <div className='flex flex-col gap-8 px-5 pb-6 pt-5'>
      <div className='space-y-1'>
        <DrawerTitle className='truncate text-xl font-bold text-zinc-100'>
          {section.name}
        </DrawerTitle>
        <DrawerDescription className='sr-only'>
          {t("song_timer.section_options")}
        </DrawerDescription>
      </div>

      <div className='space-y-3'>
        <label
          htmlFor='section-name'
          className='text-xs font-semibold text-zinc-400'>
          {t("song_timer.section_name")}
        </label>
        <input
          id='section-name'
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => commitName(name)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className='h-11 w-full rounded-lg bg-zinc-800/60 px-4 text-base text-zinc-100 outline-none transition-colors focus:bg-zinc-800'
        />
        <div className='flex flex-wrap gap-1.5'>
          {PREDEFINED_NAMES.map((preset) => (
            <button
              key={preset}
              type='button'
              onClick={() => {
                setName(preset);
                commitName(preset);
              }}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                section.name === preset
                  ? "bg-cyan-500/10 text-cyan-400"
                  : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
              )}>
              {preset}
            </button>
          ))}
        </div>
      </div>

      <div className='space-y-3'>
        <span className='text-xs font-semibold text-zinc-400'>
          {t("song_timer.section_start")}
        </span>
        <div className='flex items-center gap-1.5'>
          {NUDGES.filter((n) => n < 0).map((n) => (
            <NudgeButton
              key={n}
              seconds={n}
              onClick={() => setStart(section.startTime + n)}
            />
          ))}
          <span className='font-mono flex-1 text-center text-2xl font-semibold tabular-nums text-zinc-100'>
            {formatSectionTime(section.startTime)}
          </span>
          {NUDGES.filter((n) => n > 0).map((n) => (
            <NudgeButton
              key={n}
              seconds={n}
              onClick={() => setStart(section.startTime + n)}
            />
          ))}
        </div>
        <button
          type='button'
          disabled={playhead === section.startTime}
          onClick={() => setStart(playhead)}
          className='h-11 w-full rounded-lg bg-cyan-500/10 text-sm font-semibold text-cyan-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-cyan-500/20'>
          {t("song_timer.set_to_playhead", {
            time: formatSectionTime(playhead),
          })}
        </button>
      </div>

      <div className='space-y-3'>
        <span className='text-xs font-semibold text-zinc-400'>
          {t("song_timer.mastery")}
        </span>
        <div className='flex flex-wrap gap-1.5'>
          {MASTERY_LEVELS.map((level) => (
            <button
              key={level}
              type='button'
              onClick={() => onMasteryChange(section.id, level)}
              aria-pressed={section.mastery === level}
              className={cn(
                "h-9 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                section.mastery === level
                  ? cn(
                      MASTERY_STYLES[level],
                      level === 0 && "bg-zinc-800 text-zinc-100",
                    )
                  : "bg-zinc-800/40 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300",
              )}>
              {t(`sections.mastery_${level}`, MASTERY_LABELS[level])}
            </button>
          ))}
        </div>
      </div>

      <div className='flex items-center justify-between gap-3 pt-2'>
        <Button
          variant='ghost'
          onClick={() => {
            onDelete(section.id);
            onClose();
          }}
          className='h-11 gap-2 px-3 text-red-400 hover:bg-red-500/10 hover:text-red-300'>
          <Trash2 className='h-4 w-4' />
          {t("song_timer.delete_section")}
        </Button>
        <Button onClick={onClose} className='h-11 px-6'>
          {t("song_timer.done")}
        </Button>
      </div>
    </div>
  );
};

/**
 * Everything a section can be changed in, on a phone: name, start, mastery,
 * delete — one sheet instead of the desktop row's inline inputs and dropdown,
 * which are too small to hit with a finger.
 */
export const SectionEditDrawer = ({
  section,
  ...props
}: SectionEditDrawerProps) => {
  // Keeps the last section on screen while the sheet slides out, so it never
  // empties mid-animation.
  const [lastShown, setLastShown] = useState(section);
  if (section && section !== lastShown) setLastShown(section);
  const shown = section ?? lastShown;

  return (
    <Drawer
      open={!!section}
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
      shouldScaleBackground={false}>
      <DrawerContent
        overlayClassName='bg-black/60'
        className='pb-safe max-h-[90dvh] overflow-y-auto rounded-t-lg border-0 bg-zinc-900 pt-2 outline-none'>
        {shown && <SectionEditBody key={shown.id} section={shown} {...props} />}
      </DrawerContent>
    </Drawer>
  );
};
