import { cn } from "assets/lib/utils";
import type { MasteryLevel, SongSection } from "feature/songs/types/songSection.type";
import { Play, Repeat2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MasteryBadge } from "./MasteryBadge";

const PREDEFINED_NAMES = [
  "Intro", "Verse", "Pre-Chorus", "Chorus", "Bridge",
  "Outro", "Solo", "Guitar Solo", "Bass Solo", "Interlude",
  "Breakdown", "Hook", "Riff", "Verse 2", "Chorus 2",
];

interface SectionRowProps {
  section: SongSection;
  isLooping: boolean;
  onPlay: (section: SongSection) => void;
  onLoop: (section: SongSection) => void;
  onMasteryChange: (id: string, mastery: MasteryLevel) => void;
  onRename: (id: string, name: string) => void;
  onTimeChange: (id: string, startTime: number) => void;
  onDelete: (id: string) => void;
  isLocked?: boolean;
}

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

const parseTime = (value: string): number | null => {
  const parts = value.split(":").map(Number);
  if (parts.length === 2 && !parts.some(isNaN)) return parts[0] * 60 + parts[1];
  if (parts.length === 1 && !isNaN(parts[0])) return parts[0];
  return null;
};

export const SectionRow = ({
  section,
  isLooping,
  onPlay,
  onLoop,
  onMasteryChange,
  onRename,
  onTimeChange,
  onDelete,
  isLocked,
}: SectionRowProps) => {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(section.name);
  const [editingTime, setEditingTime] = useState(false);
  const [timeValue, setTimeValue] = useState(formatTime(section.startTime));
  const nameInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus();
  }, [editingName]);

  useEffect(() => {
    if (editingTime) timeInputRef.current?.select();
  }, [editingTime]);

  const commitName = () => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== section.name) onRename(section.id, trimmed);
    else setNameValue(section.name);
    setEditingName(false);
  };

  const commitTime = () => {
    const parsed = parseTime(timeValue);
    if (parsed !== null && parsed !== section.startTime) onTimeChange(section.id, parsed);
    else setTimeValue(formatTime(section.startTime));
    setEditingTime(false);
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:px-4 sm:py-3 rounded-lg transition-all",
        isLooping
          ? "bg-cyan-500/5"
          : section.mastery === 3
          ? "bg-green-500/5"
          : "bg-white/[0.02] hover:bg-white/5"
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* color dot */}
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: section.color }}
        />

        {/* timestamp */}
        {editingTime ? (
          <input
            ref={timeInputRef}
            value={timeValue}
            onChange={(e) => setTimeValue(e.target.value)}
            onBlur={commitTime}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitTime();
              if (e.key === "Escape") {
                setTimeValue(formatTime(section.startTime));
                setEditingTime(false);
              }
            }}
            className="w-12 bg-white/5 rounded-lg px-2 py-1 text-[13px] text-white font-mono text-center outline-none transition-colors"
          />
        ) : (
          <button
            type="button"
            disabled={isLocked}
            onClick={() => {
              setTimeValue(formatTime(section.startTime));
              setEditingTime(true);
            }}
            className={cn(
              "w-12 text-[13px] font-mono text-zinc-500 hover:text-white transition-colors text-center shrink-0",
              isLocked && "hover:text-zinc-500 cursor-default"
            )}
          >
            {formatTime(section.startTime)}
          </button>
        )}

        {/* name */}
        {editingName ? (
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            <input
              ref={nameInputRef}
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitName();
                if (e.key === "Escape") {
                  setNameValue(section.name);
                  setEditingName(false);
                }
              }}
              className="w-full bg-white/5 rounded-lg px-3 py-1.5 text-sm text-white outline-none transition-colors"
            />
            <div
              className="flex flex-wrap gap-1"
              onMouseDown={(e) => e.preventDefault()}
            >
              {PREDEFINED_NAMES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    onRename(section.id, name);
                    setNameValue(name);
                    setEditingName(false);
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-[4px] text-[10px] font-medium transition-colors",
                    nameValue === name
                      ? "bg-cyan-500/10 text-cyan-400"
                      : "bg-white/[0.03] text-zinc-500 hover:bg-cyan-500/10 hover:text-cyan-400"
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={isLocked}
            onClick={() => setEditingName(true)}
            className={cn(
              "flex-1 text-left text-[15px] sm:text-base text-white/90 hover:text-white transition-colors truncate font-medium",
              isLocked && "hover:text-white/90 cursor-default"
            )}
          >
            {section.name}
          </button>
        )}
      </div>

      {/* controls */}
      <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 pl-5 sm:pl-0">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPlay(section)}
            title="Play from here"
            className="p-2 sm:p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <Play className="h-4 w-4 fill-current" />
          </button>

          <button
            type="button"
            onClick={() => onLoop(section)}
            title={isLooping ? "Stop loop" : "Loop this section"}
            className={cn(
              "p-2 sm:p-1.5 rounded-lg transition-all",
              isLooping
                ? "text-cyan-400 bg-cyan-500/10"
                : "text-zinc-500 hover:text-white hover:bg-white/5"
            )}
          >
            <Repeat2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <MasteryBadge
            mastery={section.mastery}
            onChange={(m) => onMasteryChange(section.id, m)}
            readonly={isLocked}
          />

          {!isLocked && (
            <button
              type="button"
              onClick={() => onDelete(section.id)}
              title="Delete section"
              className="p-2 sm:p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
