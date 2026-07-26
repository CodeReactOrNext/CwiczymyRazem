import { Button } from "assets/components/ui/button";
import { AddRecordingModal } from "feature/recordings/components/AddRecordingModal";
import { RecordingCard } from "feature/recordings/components/RecordingCard";
import { RecordingViewModal } from "feature/recordings/components/RecordingViewModal";
import { useRecordings } from "feature/recordings/hooks/useRecordings";
import { Loader2, Mic2, Plus } from "lucide-react";
import { useState } from "react";

interface SongRecordingsSectionProps {
  songId: string;
  songTitle: string;
  songArtist: string;
}

export const SongRecordingsSection = ({ songId, songTitle, songArtist }: SongRecordingsSectionProps) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);
  const { recordings, isLoading, total } = useRecordings(undefined, songId);

  return (
    <div className="bg-zinc-800/40 rounded-lg p-6 space-y-4 shadow-sm backdrop-blur-sm mt-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic2 size={18} className="transition-all duration-500 text-zinc-700" />
          <span className="text-sm font-semibold text-zinc-300">
            Recordings{total > 0 ? ` (${total})` : ""}
          </span>
        </div>
        <Button
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Recording
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
        </div>
      ) : recordings.length === 0 ? (
        <p className="text-sm text-zinc-500 py-4 text-center">
          No recordings yet for this song — be the first to share your cover.
        </p>
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
