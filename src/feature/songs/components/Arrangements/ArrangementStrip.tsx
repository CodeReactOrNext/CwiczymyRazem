import { cn } from "assets/lib/utils";
import type { UserSongProgress } from "feature/songs/services/userSongProgress.service";
import type { SongArrangement } from "feature/songs/types/songs.type";
import type { SongSection } from "feature/songs/types/songSection.type";
import {
  ARRANGEMENT_META,
  ARRANGEMENT_ORDER,
  formatPlayTime,
  getSectionsMasteryPct,
} from "feature/songs/utils/arrangements.utils";

interface ArrangementStripProps {
  progress: UserSongProgress | null;
  sections: SongSection[];
  selected: SongArrangement | null;
  onSelect: (arrangement: SongArrangement | null) => void;
}

interface CardData {
  key: SongArrangement | null;
  label: string;
  dot?: string;
  playMs: number;
  sessions: number;
  masteryPct: number | null;
}

/**
 * Rocksmith-style arrangement cards: the whole song plus Lead / Rhythm / Bass,
 * each with its own play time, sessions and section mastery. Picking one scopes
 * the mastery panel below to that arrangement.
 */
export const ArrangementStrip = ({
  progress,
  sections,
  selected,
  onSelect,
}: ArrangementStripProps) => {
  const cards: CardData[] = [
    {
      key: null,
      label: "Whole song",
      playMs: progress?.totalPracticeMs ?? 0,
      sessions: progress?.sessionCount ?? 0,
      masteryPct: getSectionsMasteryPct(sections, null),
    },
    ...ARRANGEMENT_ORDER.map((arrangement) => {
      const slice = progress?.arrangements[arrangement];
      return {
        key: arrangement,
        label: ARRANGEMENT_META[arrangement].label,
        dot: ARRANGEMENT_META[arrangement].dot,
        playMs: slice?.totalPracticeMs ?? 0,
        sessions: slice?.sessionCount ?? 0,
        masteryPct: getSectionsMasteryPct(sections, arrangement),
      };
    }),
  ];

  return (
    <div className='mb-6 space-y-3'>
      <div className='flex flex-wrap items-baseline justify-between gap-2 px-1'>
        <span className='text-sm font-semibold text-zinc-300'>Arrangements</span>
        <span className='text-xs text-zinc-500'>
          Each part keeps its own time and mastery
        </span>
      </div>

      <div
        role='radiogroup'
        aria-label='Arrangement'
        className='grid grid-cols-2 gap-2 lg:grid-cols-4'>
        {cards.map((card) => {
          const isActive = selected === card.key;
          const hasTime = card.playMs > 0 || card.sessions > 0;
          return (
            <button
              key={card.key ?? "song"}
              type='button'
              role='radio'
              aria-checked={isActive}
              onClick={() => onSelect(card.key)}
              className={cn(
                "flex flex-col gap-3 rounded-lg p-4 text-left transition-background click-behavior focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                isActive ? "bg-zinc-800" : "bg-zinc-800/40 hover:bg-zinc-800/70"
              )}>
              <span className='flex items-center gap-2'>
                {card.dot && (
                  <span
                    aria-hidden
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      card.dot,
                      !isActive && !hasTime && "opacity-40"
                    )}
                  />
                )}
                <span
                  className={cn(
                    "text-sm font-bold",
                    isActive ? "text-zinc-100" : "text-zinc-300"
                  )}>
                  {card.label}
                </span>
              </span>

              <span className='flex items-end justify-between gap-2'>
                <span className='flex flex-col'>
                  <span
                    className={cn(
                      "text-lg font-bold tabular-nums leading-tight",
                      hasTime ? "text-zinc-100" : "text-zinc-500"
                    )}>
                    {hasTime ? formatPlayTime(card.playMs) : "—"}
                  </span>
                  <span className='text-xs text-zinc-400'>
                    {card.sessions} session{card.sessions === 1 ? "" : "s"}
                  </span>
                </span>
                {card.masteryPct !== null && (
                  <span
                    className={cn(
                      "text-sm font-bold tabular-nums",
                      card.masteryPct === 100 ? "text-emerald-400" : "text-zinc-400"
                    )}>
                    {card.masteryPct}%
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
