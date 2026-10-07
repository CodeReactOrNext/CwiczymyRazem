import { RecordingsGrid } from "feature/recordings/components/RecordingsGrid";
import { RecordingViewModal } from "feature/recordings/components/RecordingViewModal";
import { useRecordings } from "feature/recordings/hooks/useRecordings";
import { useTranslation } from "hooks/useTranslation";
import { useState } from "react";

interface UserRecordingsSectionProps {
  userId: string;
}

export const UserRecordingsSection = ({ userId }: UserRecordingsSectionProps) => {
  const { t } = useTranslation("profile");
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);
  
  const { 
      recordings, 
      isLoading, 
      page, 
      setPage, 
      totalPages 
  } = useRecordings(userId);

  return (
    <div className="rounded-2xl bg-zinc-900/30 p-6 backdrop-blur-sm">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white leading-tight">{t("layout.sections.recordings.title")}</h2>
        <p className="mt-1 text-sm text-zinc-400">{t("recordings_hint")}</p>
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
