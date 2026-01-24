import { RecordingsGrid } from "feature/recordings/components/RecordingsGrid";
import { useRecordings } from "feature/recordings/hooks/useRecordings";
import { RecordingViewModal } from "feature/recordings/components/RecordingViewModal";
import { useState } from "react";
import { Video } from "lucide-react";

interface UserRecordingsSectionProps {
  userId: string;
}

export const UserRecordingsSection = ({ userId }: UserRecordingsSectionProps) => {
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);
  
  const { 
      recordings, 
      isLoading, 
      page, 
      setPage, 
      totalPages 
  } = useRecordings(userId);

  return (
    <div className="rounded-2xl bg-zinc-900/30 p-6 backdrop-blur-sm border border-white/5">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <Video className="h-6 w-6 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white leading-tight">Recordings</h2>
          <p className="text-sm text-zinc-500 font-medium">Performance and practice covers</p>
        </div>
      </div>

      <RecordingsGrid 
          recordings={recordings}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          onViewRecording={setActiveRecordingId}
      />

      <RecordingViewModal
          isOpen={!!activeRecordingId}
          onClose={() => setActiveRecordingId(null)}
          recordingId={activeRecordingId}
      />
    </div>
  );
};
