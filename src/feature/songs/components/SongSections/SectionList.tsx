import type { MasteryLevel, SongSection } from "feature/songs/types/songSection.type";
import { SECTION_COLORS } from "feature/songs/types/songSection.type";
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
  const sorted = [...sections].sort((a, b) => a.startTime - b.startTime);

  return (
    <div className="space-y-1">
      {sorted.length === 0 && (
        <div className="py-6 flex flex-col items-center gap-4">
          <p className="text-xs text-zinc-600">
            No sections yet — click below to mark the current timestamp
          </p>
          {!isLocked && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {SUGGESTED_SECTIONS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onAddNamed(name)}
                  className="px-3 py-1.5 rounded-full bg-white/[0.04] text-xs font-medium text-zinc-400 hover:bg-white/[0.09] hover:text-white transition-colors"
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
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg bg-white/[0.03] text-xs font-medium text-white hover:bg-white/5 transition-all mt-1"
        >
          <Plus className="h-4 w-4" />
          Add section
        </button>
      )}
    </div>
  );
};

export const nextSectionColor = (sections: SongSection[]): string =>
  SECTION_COLORS[sections.length % SECTION_COLORS.length];
