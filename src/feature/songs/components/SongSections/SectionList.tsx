import type { MasteryLevel, SongSection } from "feature/songs/types/songSection.type";
import { SECTION_COLORS } from "feature/songs/types/songSection.type";
import { Plus } from "lucide-react";
import { SectionRow } from "./SectionRow";

interface SectionListProps {
  sections: SongSection[];
  loopSectionId: string | null;
  currentTime: number;
  onPlay: (section: SongSection) => void;
  onLoop: (section: SongSection) => void;
  onMasteryChange: (id: string, mastery: MasteryLevel) => void;
  onRename: (id: string, name: string) => void;
  onTimeChange: (id: string, startTime: number) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  isLocked?: boolean;
}

export const SectionList = ({
  sections,
  loopSectionId,
  onPlay,
  onLoop,
  onMasteryChange,
  onRename,
  onTimeChange,
  onDelete,
  onAdd,
  isLocked,
}: SectionListProps) => {
  const sorted = [...sections].sort((a, b) => a.startTime - b.startTime);

  return (
    <div className="space-y-1">
      {sorted.length === 0 && (
        <p className="text-xs text-zinc-600 text-center py-6">
          No sections yet — click below to mark the current timestamp
        </p>
      )}

      {sorted.map((section) => (
        <SectionRow
          key={section.id}
          section={section}
          isLooping={loopSectionId === section.id}
          onPlay={onPlay}
          onLoop={onLoop}
          onMasteryChange={onMasteryChange}
          onRename={onRename}
          onTimeChange={onTimeChange}
          onDelete={onDelete}
          isLocked={isLocked}
        />
      ))}

      {!isLocked && (
        <button
          type="button"
          onClick={onAdd}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-dashed border-white/20 text-xs font-medium text-white hover:border-white/40 hover:bg-white/5 transition-all mt-1"
        >
          <Plus className="h-4 w-4" />
          Add Section
        </button>
      )}
    </div>
  );
};

export const nextSectionColor = (sections: SongSection[]): string =>
  SECTION_COLORS[sections.length % SECTION_COLORS.length];
