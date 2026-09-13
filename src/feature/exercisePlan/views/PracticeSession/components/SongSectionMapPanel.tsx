import { cn } from "assets/lib/utils";
import { CommunityMapImportModal } from "feature/songs/components/SongSections/CommunityMapImportModal";
import { SectionList } from "feature/songs/components/SongSections/SectionList";
import { SectionTimeline } from "feature/songs/components/SongSections/SectionTimeline";
import { YouTubeSongPlayer } from "feature/songs/components/YouTubeSongPlayer";
import { useSongSectionMap } from "feature/songs/hooks/useSongSectionMap";
import { Keyboard } from "lucide-react";
import { memo } from "react";

import type { Exercise } from "../../../types/exercise.types";

interface SongSectionMapPanelProps {
  song: NonNullable<Exercise["songData"]>;
  userId: string;
  /** The video started — the session clock should be running for it. */
  onVideoPlay: () => void;
  /** Tighter spacing for the mobile content column. */
  compact?: boolean;
}

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: "M", label: "Mark section" },
  { keys: "L", label: "Toggle loop" },
  { keys: "← →", label: "Seek 5s" },
];

/**
 * A song item of a routine practised over its section map: the pinned YouTube
 * video with the sections marked on it, loops and mastery — the same map the
 * song timer page shows, saved to the same place, so work done here is there
 * next time and the other way round.
 *
 * Space is left to the session (its own play/pause); everything else the song
 * timer's keyboard does works here too.
 */
export const SongSectionMapPanel = memo(function SongSectionMapPanel({
  song,
  userId,
  onVideoPlay,
  compact = false,
}: SongSectionMapPanelProps) {
  const map = useSongSectionMap({
    userId,
    songId: song.songId,
    spaceTogglesVideo: false,
  });

  return (
    <div className={cn("w-full", compact ? "space-y-4" : "space-y-6")}>
      <YouTubeSongPlayer
        ref={map.playerRef}
        youtubeUrl={map.youtubeUrl}
        onUrlSave={map.handleUrlSave}
        onTimeUpdate={map.handleTimeUpdate}
        onDurationReady={map.setDuration}
        onPlay={onVideoPlay}
        isLocked={map.isLocked}
        onLockToggle={() => map.setIsLocked(!map.isLocked)}
        songTitle={song.title}
        songArtist={song.artist}
      />

      {map.youtubeUrl && (
        <>
          <SectionTimeline
            sections={map.sections}
            currentTime={map.currentTime}
            duration={map.duration}
            loopSectionId={map.loopSectionId}
            onSeek={map.handleSeek}
            onSectionTimeChange={map.handleTimeChange}
            isLocked={map.isLocked}
          />

          <SectionList
            sections={map.sections}
            loopSectionId={map.loopSectionId}
            currentTime={map.currentTime}
            duration={map.duration}
            onPlay={map.handleSectionPlay}
            onLoop={map.handleSectionLoop}
            onMasteryChange={map.handleMasteryChange}
            onRename={map.handleRename}
            onTimeChange={map.handleTimeChange}
            onDelete={map.handleDelete}
            onAdd={map.handleAddSection}
            onAddNamed={(name) => map.handleAddSection(name)}
            isLocked={map.isLocked}
          />

          {!compact && (
            <div className='flex flex-wrap items-center gap-x-6 gap-y-2 px-1'>
              <span className='flex items-center gap-2 text-xs font-bold text-zinc-500'>
                <Keyboard className='h-4 w-4 text-zinc-500' />
                Shortcuts
              </span>
              {SHORTCUTS.map(({ keys, label }) => (
                <span key={keys} className='flex items-center gap-2'>
                  <kbd className='rounded bg-zinc-800/60 px-1.5 py-0.5 font-mono text-[10px] text-zinc-100'>
                    {keys}
                  </kbd>
                  <span className='text-xs text-zinc-500'>{label}</span>
                </span>
              ))}
            </div>
          )}
        </>
      )}

      <CommunityMapImportModal
        map={map.sectionMap}
        open={map.isImportModalOpen}
        onOpenChange={map.setIsImportModalOpen}
        onImport={map.handleImportCommunityMap}
      />
    </div>
  );
});
