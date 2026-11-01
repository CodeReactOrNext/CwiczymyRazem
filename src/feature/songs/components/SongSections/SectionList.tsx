import { PRESSABLE_KEY } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import type { MasteryLevel, SongSection } from "feature/songs/types/songSection.type";
import { SECTION_COLORS } from "feature/songs/types/songSection.type";
import { useTranslation } from "hooks/useTranslation";
import { Plus } from "lucide-react";

import { SectionRow } from "./SectionRow";

const SUGGESTED_SECTIONS = ["Intro", "Verse", "Pre-Chorus", "Chorus", "Bridge", "Solo", "Riff", "Outro"];

interface SectionListProps {
  sections: SongSection[];
  loopSectionId: string | null;
  currentTime: number;
  duration: number;
  onPlay: (section: SongSection) => void;
  onLoop: (section: SongSection) => void;
  onMasteryChange: (id: string, mastery: MasteryLevel) => void;
  onRename: (id: string, name: string) => void;
  onTimeChange: (id: string, startTime: number) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onAddNamed: (name: string) => void;
  isLocked?: boolean;
}

export const SectionList = ({
  sections,
  loopSectionId,
  duration,
  onPlay,
  onLoop,
  onMasteryChange,
  onRename,
  onTimeChange,
  onDelete,
  onAdd,
  onAddNamed,
  isLocked,
}: SectionListProps) => {
  const { t } = useTranslation("songs");
  const sorted = [...sections].sort((a, b) => a.startTime - b.startTime);

  return (
    <div className="space-y-1">
      {sorted.length === 0 && (
        <div className="py-6 flex flex-col items-center gap-4">
          <p className="text-xs text-zinc-600">
            {t("sections.empty")}
          </p>
          {!isLocked && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {SUGGESTED_SECTIONS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onAddNamed(name)}
                  className={cn(
                    PRESSABLE_KEY,
                    "px-3 py-1.5 rounded-full bg-zinc-800/60 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {sorted.map((section, idx) => {
        const next = sorted[idx + 1];
        const endTime = next ? next.startTime : duration;
        return (
          <SectionRow
            key={section.id}
            section={section}
            endTime={endTime}
            isLastSection={!next}
            isLooping={loopSectionId === section.id}
            onPlay={onPlay}
            onLoop={onLoop}
            onMasteryChange={onMasteryChange}
            onRename={onRename}
            onTimeChange={onTimeChange}
            onEndTimeChange={next ? (t) => onTimeChange(next.id, t) : undefined}
            onDelete={onDelete}
            isLocked={isLocked}
          />
        );
      })}

      {!isLocked && (
        <button
          type="button"
          onClick={() => onAdd()}
          className={cn(
            PRESSABLE_KEY,
            "w-full flex items-center justify-center gap-2 py-3.5 rounded-lg bg-zinc-800/60 text-xs font-medium text-white hover:bg-zinc-800 transition-colors mt-1"
          )}
        >
          <Plus className="h-4 w-4" />
          {t("sections.add")}
        </button>
      )}
    </div>
  );
};

export const nextSectionColor = (sections: SongSection[]): string =>
  SECTION_COLORS[sections.length % SECTION_COLORS.length];
