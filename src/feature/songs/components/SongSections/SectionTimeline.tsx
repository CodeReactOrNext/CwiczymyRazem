import { cn } from "assets/lib/utils";
import type { SongSection } from "feature/songs/types/songSection.type";
import { GripVertical } from "lucide-react";
import { useRef } from "react";

interface SectionTimelineProps {
  sections: SongSection[];
  currentTime: number;
  duration: number;
  loopSectionId: string | null;
  onSeek: (time: number) => void;
  onSectionTimeChange: (id: string, startTime: number) => void;
  isLocked?: boolean;
}

export const SectionTimeline = ({
  sections,
  currentTime,
  duration,
  loopSectionId,
  onSeek,
  onSectionTimeChange,
  isLocked,
}: SectionTimelineProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{ id: string } | null>(null);

  const sorted = [...sections].sort((a, b) => a.startTime - b.startTime);

  const toPercent = (t: number) =>
    duration > 0 ? Math.min(100, (t / duration) * 100) : 0;

  const timeFromPointer = (clientX: number): number => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * duration;
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    if (draggingRef.current || isLocked) return;
    onSeek(timeFromPointer(e.clientX));
  };

  const handleSegmentPointerDown = (e: React.PointerEvent, section: SongSection) => {
    if (isLocked) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = { id: section.id };
  };

  const handleSegmentPointerMove = (e: React.PointerEvent, section: SongSection) => {
    if (!draggingRef.current || draggingRef.current.id !== section.id) return;
    onSectionTimeChange(section.id, Math.round(Math.max(0, timeFromPointer(e.clientX))));
  };

  const handleSegmentPointerUp = (e: React.PointerEvent) => {
    draggingRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  if (duration === 0) return null;

  return (
    <div
      ref={trackRef}
      className="relative h-14 w-full cursor-pointer select-none"
      onClick={handleTrackClick}
    >
      {/* base track */}
      <div className="absolute inset-0 bg-white/[0.03] rounded-xl border border-white/5" />

      {/* playhead */}
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-black z-30 pointer-events-none"
        style={{ left: `${(currentTime / duration) * 100}%` }}
      />

      {/* sections */}
      <div className="absolute inset-0 px-0.5">
        <div className="relative h-full w-full">
          {sorted.map((section, idx) => {
            const nextStartTime = sorted[idx + 1]?.startTime ?? duration;
            const widthPct = Math.max(0, ((nextStartTime - section.startTime) / duration) * 100);
            const leftPct = (section.startTime / duration) * 100;
            const isActive = currentTime >= section.startTime && currentTime < nextStartTime;
            const isLooping = loopSectionId === section.id;

            return (
              <div
                key={section.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek(section.startTime);
                }}
                className={cn(
                  "absolute top-0 h-full flex items-center overflow-hidden transition-all rounded-[8px] group",
                  isActive ? "z-10 scale-y-[1.08] ring-2 ring-white/40 brightness-[1.05]" : "opacity-80 hover:opacity-100",
                  isLooping && !isActive && "ring-1 ring-white/30",
                  isLocked && "opacity-60"
                )}
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  backgroundColor: section.color,
                }}
              >
                {/* Grip handle */}
                <div
                  onPointerDown={(e) => handleSegmentPointerDown(e, section)}
                  onPointerMove={(e) => handleSegmentPointerMove(e, section)}
                  onPointerUp={handleSegmentPointerUp}
                  className={cn(
                    "absolute left-0 top-0 h-full w-4 bg-black/10 flex items-center justify-center transition-colors hover:bg-black/20",
                    isLocked ? "cursor-default" : "cursor-grab active:cursor-grabbing"
                  )}
                >
                  <GripVertical className="h-4 w-4 text-white/50" />
                </div>

                {/* Text Label - Centered */}
                <div className="flex-1 h-full flex items-center justify-center pl-4 pr-1 overflow-hidden">
                  <div className="px-2 py-0.5 bg-black/30 rounded-[4px] backdrop-blur-[1px] max-w-full">
                    <span
                      className={cn(
                        "text-[11px] font-bold truncate block pointer-events-none transition-colors",
                        isActive ? "text-white" : "text-white/90"
                      )}
                    >
                      {section.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
