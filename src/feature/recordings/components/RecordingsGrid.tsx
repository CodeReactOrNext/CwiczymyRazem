import { RecordingCard } from "./RecordingCard";
import type { Recording } from "feature/recordings/types/types";
import { Loader2 } from "lucide-react";
import { Button } from "assets/components/ui/button";

interface RecordingsGridProps {
  recordings: Recording[];
  onViewRecording: (recordingId: string) => void;
  isLoading: boolean;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}

export const RecordingsGrid = ({
  recordings,
  onViewRecording,
  isLoading,
  page,
  totalPages,
  setPage,
}: RecordingsGridProps) => {

  if (isLoading && recordings.length === 0) {
      // Skeleton loading could go here
      return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-cyan-500" /></div>;
  }

  if (recordings.length === 0) {
      return (
          <div className="text-center py-20 text-zinc-500">
              <h3 className="text-xl font-bold text-white mb-2">No recordings found</h3>
              <p>Be the first to upload your cover!</p>
          </div>
      );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {recordings.map((recording) => (
          <RecordingCard 
             key={recording.id} 
             recording={recording} 
             onView={() => onViewRecording(recording.id)}
          />
        ))}
      </div>

      {totalPages > 1 && (
         <div className="flex justify-center gap-2 mt-8">
            <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="border-white/10 bg-zinc-900 text-white hover:bg-zinc-800"
            >
                Previous
            </Button>
            <span className="flex items-center px-4 font-bold text-zinc-500">
                Page {page} of {totalPages}
            </span>
             <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="border-white/10 bg-zinc-900 text-white hover:bg-zinc-800"
            >
                Next
            </Button>
         </div>
      )}
    </div>
  );
};
