import { Button } from "assets/components/ui/button";
import { Skeleton } from "assets/components/ui/skeleton";
import { EmptyState } from "components/EmptyState/EmptyState";
import { AddRecordingModal } from "feature/recordings/components/AddRecordingModal";
import { RecordingCard } from "feature/recordings/components/RecordingCard";
import { RecordingViewModal } from "feature/recordings/components/RecordingViewModal";
import { useRecordings } from "feature/recordings/hooks/useRecordings";
import { useTranslation } from "hooks/useTranslation";
import { Mic2, Plus } from "lucide-react";
import { useState } from "react";

interface SongRecordingsSectionProps {
  songId: string;
  songTitle: string;
  songArtist: string;
}

export const SongRecordingsSection = ({ songId, songTitle, songArtist }: SongRecordingsSectionProps) => {
  const { t } = useTranslation("recordings");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);
  const { recordings, isLoading, total } = useRecordings(undefined, songId);

  return (
    <div className="flex flex-col gap-4 rounded-lg bg-zinc-800/40 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Mic2 className="h-4 w-4 text-zinc-500" />
          <span className="text-sm font-semibold text-zinc-200">
            Recordings{total > 0 ? ` (${total})` : ""}
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus />
          {t("view.add")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-hidden pb-1" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="block" className="h-80 w-72 shrink-0" />
          ))}
        </div>
      ) : recordings.length === 0 ? (
        <EmptyState
          size='compact'
          className='bg-transparent px-0'
          icon={<Mic2 />}
          title={t("song_section.empty")}
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-1 custom-scrollbar">
          {recordings.map((recording) => (
            <div key={recording.id} className="w-72 shrink-0">
              <RecordingCard recording={recording} onView={setActiveRecordingId} />
            </div>
          ))}
        </div>
      )}

      <AddRecordingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialSong={{ id: songId, title: songTitle, artist: songArtist }}
      />

      <RecordingViewModal
        isOpen={!!activeRecordingId}
        onClose={() => setActiveRecordingId(null)}
        recordingId={activeRecordingId}
      />
    </div>
  );
};
