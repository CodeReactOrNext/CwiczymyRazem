import { Button } from "assets/components/ui/button";
import { EmptyState } from "components/EmptyState/EmptyState";
import { useTranslation } from "hooks/useTranslation";
import { Plus } from "lucide-react";

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
    <EmptyState
      className='w-full max-w-2xl'
      mood={hasFilters ? "lookAround" : "wait"}
      title={
        hasFilters ? t("no_songs_found_with_filters") : t("no_songs_found")
      }
      description={t("no_song_add_song")}
      action={
        <Button onClick={onAddSong}>
          <Plus />
          {t("add_new_song")}
        </Button>
      }
    />
  );
};
