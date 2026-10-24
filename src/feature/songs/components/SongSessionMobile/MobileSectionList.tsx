import { cn } from "assets/lib/utils";
import { MASTERY_STYLES } from "feature/songs/components/SongSections/MasteryBadge";
import type {
  MasteryLevel,
  SongSection,
} from "feature/songs/types/songSection.type";
import { MASTERY_LABELS } from "feature/songs/types/songSection.type";
import {
  findSectionIndexAt,
  formatSectionTime,
  sortSections,
} from "feature/songs/utils/sectionTimes.utils";
import { useTranslation } from "hooks/useTranslation";
import { MoreHorizontal, Repeat2 } from "lucide-react";
import { useState } from "react";

import { SectionEditDrawer } from "./SectionEditDrawer";

interface MobileSectionListProps {
  sections: SongSection[];
  loopSectionId: string | null;
  currentTime: number;
  duration: number;
  onLoop: (section: SongSection) => void;
  onRename: (id: string, name: string) => void;
  onTimeChange: (id: string, startTime: number) => void;
  onMasteryChange: (id: string, mastery: MasteryLevel) => void;
  onDelete: (id: string) => void;
}

// No quick-add buttons here: before the video plays there is no playhead to
// put a section at, so they could only guess where each part starts. Marking
// while listening is the one way in.
const OnboardingSteps = () => {
  const { t } = useTranslation("timer");
  const steps = [
    t("song_timer.onboarding_step_1"),
    t("song_timer.onboarding_step_2"),
    t("song_timer.onboarding_step_3"),
  ];

  return (
    <div className='space-y-6 py-2'>
      <p className='text-base font-semibold text-zinc-100'>
        {t("song_timer.onboarding_title")}
      </p>
      <ol className='space-y-3'>
        {steps.map((step, i) => (
          <li key={step} className='flex items-center gap-3'>
            <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300'>
              {i + 1}
            </span>
            <span className='text-sm text-zinc-300'>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

/**
 * The song's sections on a phone. A row is one big target that loops the
 * section — the thing a player comes here to do; everything else (name,
 * start, mastery, delete) waits behind the row's options in a sheet.
 */
export const MobileSectionList = ({
  sections,
  loopSectionId,
  currentTime,
  duration,
  onLoop,
  onRename,
  onTimeChange,
  onMasteryChange,
  onDelete,
}: MobileSectionListProps) => {
  const { t } = useTranslation("timer");
  const [editingId, setEditingId] = useState<string | null>(null);
  const sorted = sortSections(sections);
  const playingIndex = findSectionIndexAt(sorted, currentTime);
  const editing = sections.find((s) => s.id === editingId) ?? null;

  return (
    <section className='space-y-4 rounded-lg bg-zinc-900/40 p-4'>
      <div className='flex items-baseline justify-between'>
        <h2 className='text-sm font-semibold text-zinc-200'>
          {t("song_timer.sections_title")}
        </h2>
        {sorted.length > 0 && (
          <span className='text-xs text-zinc-500'>{sorted.length}</span>
        )}
      </div>

      {sorted.length === 0 ? (
        <OnboardingSteps />
      ) : (
        <ul className='-mx-2 space-y-1'>
          {sorted.map((section, i) => {
            const isLooping = loopSectionId === section.id;
            const isPlaying = i === playingIndex;
            return (
              <li
                key={section.id}
                className={cn(
                  "flex items-center rounded-lg transition-colors",
                  isLooping
                    ? "bg-cyan-500/10"
                    : isPlaying
                      ? "bg-zinc-800/60"
                      : "bg-transparent",
                )}>
                <button
                  type='button'
                  onClick={() => onLoop(section)}
                  aria-pressed={isLooping}
                  className='flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-lg py-2 pl-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:bg-zinc-800'>
                  <span
                    className='h-2.5 w-2.5 shrink-0 rounded-full'
                    style={{ backgroundColor: section.color }}
                  />
                  <span className='min-w-0 flex-1'>
                    <span
                      className={cn(
                        "block truncate text-[15px] font-medium",
                        isLooping ? "text-cyan-300" : "text-zinc-100",
                      )}>
                      {section.name}
                    </span>
                    <span className='mt-0.5 flex items-center gap-2 text-xs'>
                      <span className='font-mono tabular-nums text-zinc-500'>
                        {formatSectionTime(section.startTime)}
                      </span>
                      {section.mastery > 0 && (
                        <span
                          className={cn(
                            "rounded px-1.5 py-px font-medium",
                            MASTERY_STYLES[section.mastery],
                          )}>
                          {t(
                            `sections.mastery_${section.mastery}`,
                            MASTERY_LABELS[section.mastery],
                          )}
                        </span>
                      )}
                    </span>
                  </span>
                  <Repeat2
                    aria-label={isLooping ? t("song_timer.looping") : undefined}
                    className={cn(
                      "h-5 w-5 shrink-0 transition-colors",
                      isLooping ? "text-cyan-400" : "text-zinc-600",
                    )}
                  />
                </button>
                <button
                  type='button'
                  onClick={() => setEditingId(section.id)}
                  aria-label={t("song_timer.section_options")}
                  className='flex h-14 w-12 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:text-zinc-100 active:bg-zinc-800'>
                  <MoreHorizontal className='h-5 w-5' />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <SectionEditDrawer
        section={editing}
        currentTime={currentTime}
        duration={duration}
        onClose={() => setEditingId(null)}
        onRename={onRename}
        onTimeChange={onTimeChange}
        onMasteryChange={onMasteryChange}
        onDelete={onDelete}
      />
    </section>
  );
};
