import { cn } from "assets/lib/utils";
import type { SongSection } from "feature/songs/types/songSection.type";
import {
  formatSectionTime,
  nextSectionName,
} from "feature/songs/utils/sectionTimes.utils";
import { useTranslation } from "hooks/useTranslation";
import { Minus, Plus, Undo2, X } from "lucide-react";

/** The parts most songs are built from, in the order they usually come. */
const MARK_NAMES = [
  "Intro",
  "Verse",
  "Pre-Chorus",
  "Chorus",
  "Bridge",
  "Solo",
  "Riff",
  "Outro",
];

interface MarkSectionStripProps {
  /** The section just marked. */
  section: SongSection;
  sections: SongSection[];
  onRename: (id: string, name: string) => void;
  /** Moves the start and plays from there, so the player hears whether it's right. */
  onMoveStart: (id: string, startTime: number) => void;
  onUndo: (id: string) => void;
  onClose: () => void;
}

const iconButton =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800 hover:text-zinc-100 active:bg-zinc-800";

/**
 * Follows a tap on Mark, right under the controls so the video keeps playing
 * in view: name the new section with one tap, move its start a second either
 * way while hearing the result, or take the mark back if the tap was a miss.
 */
export const MarkSectionStrip = ({
  section,
  sections,
  onRename,
  onMoveStart,
  onUndo,
  onClose,
}: MarkSectionStripProps) => {
  const { t } = useTranslation("timer");
  const others = sections.filter((s) => s.id !== section.id);

  return (
    <div className='space-y-3 rounded-lg bg-zinc-900 p-3'>
      <div className='flex items-center gap-1'>
        <span
          className='ml-1 h-2.5 w-2.5 shrink-0 rounded-full'
          style={{ backgroundColor: section.color }}
        />
        <span className='ml-2 min-w-0 flex-1 truncate text-sm text-zinc-300'>
          {t("song_timer.mark_new_section")}
        </span>
        <button
          type='button'
          onClick={() => onMoveStart(section.id, section.startTime - 1)}
          aria-label={t("song_timer.nudge_back")}
          className={iconButton}>
          <Minus className='h-4 w-4' />
        </button>
        <span className='font-mono w-11 text-center text-sm font-semibold tabular-nums text-zinc-100'>
          {formatSectionTime(section.startTime)}
        </span>
        <button
          type='button'
          onClick={() => onMoveStart(section.id, section.startTime + 1)}
          aria-label={t("song_timer.nudge_forward")}
          className={iconButton}>
          <Plus className='h-4 w-4' />
        </button>
        <button
          type='button'
          onClick={() => onUndo(section.id)}
          aria-label={t("song_timer.mark_undo")}
          className={iconButton}>
          <Undo2 className='h-4 w-4' />
        </button>
        <button
          type='button'
          onClick={onClose}
          aria-label={t("song_timer.done")}
          className={iconButton}>
          <X className='h-4 w-4' />
        </button>
      </div>

      <div className='no-scrollbar -mx-3 flex gap-1.5 overflow-x-auto px-3'>
        {MARK_NAMES.map((base) => {
          const name = nextSectionName(others, base);
          const isCurrent = section.name === name;
          return (
            <button
              key={base}
              type='button'
              onClick={() => {
                onRename(section.id, name);
                onClose();
              }}
              aria-pressed={isCurrent}
              className={cn(
                "h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                isCurrent
                  ? "bg-cyan-500/10 text-cyan-400"
                  : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700 active:bg-zinc-700",
              )}>
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
