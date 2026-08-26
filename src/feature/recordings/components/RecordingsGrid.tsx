import { Button } from "assets/components/ui/button";
import { Skeleton } from "assets/components/ui/skeleton";
import type { Recording } from "feature/recordings/types/types";
import { Video } from "lucide-react";

import { RecordingCard } from "./RecordingCard";

interface RecordingsGridProps {
  recordings: Recording[];
  onViewRecording: (recordingId: string) => void;
  isLoading: boolean;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}

const GRID_CLASS =
  "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

/** Mirrors RecordingCard's shape so the grid keeps its geometry while loading. */
const RecordingCardSkeleton = () => (
  <div className='flex flex-col overflow-hidden rounded-lg bg-zinc-900/40'>
    <Skeleton className='aspect-video w-full rounded-none' />
    <div className='flex flex-col gap-3 p-4'>
      <Skeleton className='h-[2.75rem] w-full rounded' />
      <Skeleton className='h-[28px] w-2/3 rounded' />
      <Skeleton className='h-[2.5rem] w-full rounded' />
      <div className='flex items-center gap-2 pt-1'>
        <Skeleton className='h-8 w-8 rounded-full' />
        <Skeleton className='h-3 w-28 rounded' />
      </div>
    </div>
    <div className='h-11 bg-zinc-800/30' />
  </div>
);

export const RecordingsGrid = ({
  recordings,
  onViewRecording,
  isLoading,
  page,
  totalPages,
  setPage,
}: RecordingsGridProps) => {
  if (isLoading && recordings.length === 0) {
    return (
      <div className={GRID_CLASS}>
        {Array.from({ length: 8 }).map((_, i) => (
          <RecordingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <div className='flex flex-col items-center gap-3 rounded-lg bg-zinc-900/40 px-6 py-20 text-center'>
        <Video className='h-8 w-8 text-zinc-500' />
        <h3 className='text-lg font-bold text-zinc-100'>No recordings found</h3>
        <p className='text-sm text-zinc-400'>
          Be the first to upload your cover!
        </p>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-10'>
      <div className={GRID_CLASS}>
        {recordings.map((recording) => (
          <RecordingCard
            key={recording.id}
            recording={recording}
            onView={() => onViewRecording(recording.id)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className='flex items-center justify-center gap-2'>
          <Button
            variant='ghost'
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className='bg-zinc-900/60 text-zinc-200 hover:bg-zinc-800'>
            Previous
          </Button>
          <span className='px-4 text-sm font-medium text-zinc-400'>
            Page {page} of {totalPages}
          </span>
          <Button
            variant='ghost'
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className='bg-zinc-900/60 text-zinc-200 hover:bg-zinc-800'>
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
