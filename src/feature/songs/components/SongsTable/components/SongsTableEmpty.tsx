import { Button } from "assets/components/ui/button";
import { TableCell, TableRow } from "assets/components/ui/table";
import { Music } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FaPlusCircle } from "react-icons/fa";

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
    <TableRow>
      <TableCell colSpan={5} className='h-40 text-center'>
        <div className='flex flex-col items-center justify-center space-y-4 border border-dashed p-12'>
          <p className='text-lg font-medium '>
            <Music
              size={40}
              className='mx-auto mb-2 text-2xl text-muted-foreground'
            />
            {hasFilters
              ? t("no_songs_found_with_filters")
              : t("no_songs_found")}
          </p>
          <p className='text-muted-foreground'>{t("no_song_add_song")}</p>
          <div className='flex items-center space-x-4'>
            <Button onClick={onAddSong} className='flex items-center space-x-2'>
              <FaPlusCircle className='h-4 w-4' />
              <span>{t("add_new_song")}</span>
            </Button>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};
