'use client';

import { Button } from 'assets/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from 'assets/components/ui/dialog';
import { cn } from 'assets/lib/utils';
import type { SongPracticeMode } from 'feature/exercisePlan/types/exercise.types';
import { DEFAULT_SONG_EXERCISE_MINUTES } from 'feature/exercisePlan/utils/songToExercise';
import { Check, FileMusic, ListVideo, Music } from 'lucide-react';
import { useState } from 'react';

import { ExerciseTimeField, parseExerciseMinutes } from './ExerciseTimeField';

export interface PendingPlanSong {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  /** The player has a Guitar Pro file attached to this song. */
  hasGpFile: boolean;
  /** How many sections the player has marked on the song's video; null while unknown. */
  sectionCount: number | null;
  /** Set when the item is already in the plan and is being changed. */
  current?: { timeInMinutes: number; mode?: SongPracticeMode };
}

interface AddSongToPlanDialogProps {
  song: PendingPlanSong | null;
  onConfirm: (timeInMinutes: number, mode: SongPracticeMode) => void;
  onCancel: () => void;
}

const MODE_OPTIONS: {
  id: SongPracticeMode;
  label: string;
  description: string;
  Icon: typeof FileMusic;
}[] = [
  {
    id: 'gp',
    label: 'Guitar Pro tab',
    description: 'The tab you attached to the song — note detection, tempo and backing track included.',
    Icon: FileMusic,
  },
  {
    id: 'sections',
    label: 'Section map',
    description: 'The song’s video with your sections: loop a part, mark what you’ve nailed.',
    Icon: ListVideo,
  },
];

function AddSongToPlanForm({
  song,
  onConfirm,
  onCancel,
}: {
  song: PendingPlanSong;
  onConfirm: (timeInMinutes: number, mode: SongPracticeMode) => void;
  onCancel: () => void;
}) {
  const [time, setTime] = useState(
    String(song.current?.timeInMinutes ?? DEFAULT_SONG_EXERCISE_MINUTES)
  );
  // A tab was attached on purpose, so it wins the default; without one the
  // section map is the only mode that can be played right now.
  const [mode, setMode] = useState<SongPracticeMode>(
    song.current?.mode ?? (song.hasGpFile ? 'gp' : 'sections')
  );

  const minutes = parseExerciseMinutes(time);
  const isModeAvailable = (id: SongPracticeMode) => id !== 'gp' || song.hasGpFile;
  const canConfirm = minutes !== null && isModeAvailable(mode);

  const handleConfirm = () => {
    if (canConfirm && minutes !== null) onConfirm(minutes, mode);
  };

  return (
    <DialogContent
      className='border-white/10 bg-zinc-950/80 shadow-2xl backdrop-blur-xl sm:max-w-[420px] [&>button]:!rounded-[8px]'
      style={{ borderRadius: '8px' }}>
      <DialogHeader>
        <DialogTitle className='flex items-center gap-3 pr-6 text-[16px] font-bold leading-tight text-zinc-100'>
          <span className='h-10 w-10 shrink-0 overflow-hidden rounded bg-zinc-800'>
            {song.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={song.coverUrl} alt='' className='h-full w-full object-cover' />
            ) : (
              <span className='flex h-full w-full items-center justify-center text-zinc-500'>
                <Music className='h-4 w-4' />
              </span>
            )}
          </span>
          <span className='min-w-0'>
            <span translate='no' className='block truncate'>{song.title}</span>
            <span translate='no' className='block truncate text-xs font-medium text-zinc-400'>
              {song.artist}
            </span>
          </span>
        </DialogTitle>
      </DialogHeader>

      <div className='space-y-6 pt-2'>
        <div className='space-y-2.5'>
          <p className='text-[12px] font-bold tracking-wider text-zinc-500'>Practise it with</p>
          <div className='grid gap-2' role='radiogroup' aria-label='How to practise this song'>
            {MODE_OPTIONS.map(({ id, label, description, Icon }) => {
              const available = isModeAvailable(id);
              const selected = mode === id;
              const hint =
                id === 'gp' && !available
                  ? 'No Guitar Pro file attached — add one on the song’s page.'
                  : id === 'sections' && song.sectionCount === 0
                    ? 'No sections yet — you can pin a video and mark them during the session.'
                    : id === 'sections' && song.sectionCount !== null
                      ? `${song.sectionCount} ${song.sectionCount === 1 ? 'section' : 'sections'} marked.`
                      : null;
              return (
                <button
                  key={id}
                  type='button'
                  role='radio'
                  aria-checked={selected}
                  disabled={!available}
                  onClick={() => setMode(id)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40',
                    selected ? 'bg-cyan-500/10' : 'bg-zinc-900/60 hover:bg-zinc-800/60',
                    !available && 'pointer-events-none opacity-50'
                  )}>
                  <span
                    className={cn(
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded',
                      selected ? 'bg-cyan-500/15 text-cyan-400' : 'bg-zinc-800/80 text-zinc-400'
                    )}>
                    <Icon className='h-4 w-4' />
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='flex items-center gap-2 text-sm font-semibold text-zinc-100'>
                      {label}
                      {selected && <Check className='h-3.5 w-3.5 text-cyan-400' />}
                    </span>
                    <span className='mt-0.5 block text-xs leading-relaxed text-zinc-400'>
                      {description}
                    </span>
                    {hint && (
                      <span className='mt-1 block text-[11px] text-zinc-500'>{hint}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <ExerciseTimeField
          value={time}
          onChange={setTime}
          onSubmit={handleConfirm}
          onCancel={onCancel}
        />

        <div className='flex justify-end gap-2 pt-2'>
          <Button
            variant='ghost'
            className='rounded-[8px] font-semibold text-zinc-400 transition-colors hover:bg-white/5 hover:text-white'
            onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className='rounded-[8px] bg-cyan-600 px-6 font-bold text-white shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)] transition-all hover:bg-cyan-500'
            onClick={handleConfirm}
            disabled={!canConfirm}>
            {song.current ? 'Save' : 'Add to plan'}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

/**
 * Adding a song to a routine settles two things at once: how it will be
 * practised (the attached Guitar Pro tab, or the section map over its video)
 * and how long its slot is. Also reopened from the plan to change either.
 */
export function AddSongToPlanDialog({ song, onConfirm, onCancel }: AddSongToPlanDialogProps) {
  return (
    <Dialog open={!!song} onOpenChange={(open) => { if (!open) onCancel(); }}>
      {/* Keyed on the song so a fresh pick starts from that song's defaults. */}
      {song && <AddSongToPlanForm key={song.id} song={song} onConfirm={onConfirm} onCancel={onCancel} />}
    </Dialog>
  );
}
