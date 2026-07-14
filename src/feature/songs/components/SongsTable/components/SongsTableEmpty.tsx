import { Button } from "assets/components/ui/button";
import { useTranslation } from "hooks/useTranslation";
import { Music, Plus } from "lucide-react";

interface SongsTableEmptyProps {
  hasFilters: boolean;
  onAddSong: () => void;
}

export const SongsTableEmpty = ({
  hasFilters,
  onAddSong,
}: SongsTableEmptyProps) => {
  const { t } = useTranslation("songs");
  return (
    <div className='w-full max-w-2xl rounded-lg bg-zinc-900/40 px-6 py-14 text-center sm:px-12'>
      <div className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800'>
        <Music size={32} className='text-zinc-500' />
      </div>
      <h3 className='mb-2 text-xl font-bold text-white'>
        {hasFilters ? t("no_songs_found_with_filters") : t("no_songs_found")}
      </h3>
      <p className='mx-auto max-w-xs text-sm text-zinc-400'>
        {t("no_song_add_song")}
      </p>
      <Button
        variant='ghost'
        onClick={onAddSong}
        className='transition-background mt-8 h-11 rounded-lg bg-zinc-800/60 px-6 font-bold text-white hover:bg-zinc-800'
      >
        <Plus className='mr-2 h-4 w-4' />
        {t("add_new_song")}
      </Button>
    </div>
  );
};
