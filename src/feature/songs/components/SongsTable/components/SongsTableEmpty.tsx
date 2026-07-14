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
    <div className='flex flex-col items-center justify-center rounded-lg bg-zinc-900/40 px-6 py-20 text-center'>
      <div className='mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800'>
        <Music size={32} className='text-zinc-500' />
      </div>
      <h3 className='mb-2 text-xl font-bold text-white'>
        {hasFilters
          ? t("no_songs_found_with_filters")
          : t("no_songs_found")}
      </h3>
      <p className='max-w-xs text-sm text-zinc-400'>{t("no_song_add_song")}</p>
      <Button
        onClick={onAddSong}
        className='mt-8 h-11 rounded-lg bg-white px-8 font-bold text-black hover:bg-zinc-100'
      >
        <Plus className='mr-2 h-4 w-4' />
        {t("add_new_song")}
      </Button>
    </div>
  );
};
