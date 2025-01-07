import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { addSong } from "utils/firebase/client/firebase.utils";
import { useAppSelector } from "store/hooks";
import { selectUserAuth } from "feature/user/store/userSlice";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "assets/components/ui/dialog";
import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";

interface AddSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddSongModal = ({ isOpen, onClose, onSuccess }: AddSongModalProps) => {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation("songs");
  const userId = useAppSelector(selectUserAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error(t("must_be_logged_in"));
      return;
    }

    if (!title.trim() || !artist.trim() || !rating) {
      toast.error(t("all_fields_required"));
      return;
    }

    try {
      setIsLoading(true);
      await addSong(title.trim(), artist.trim(), userId, rating);
      toast.success(t("song_added"));
      onSuccess();
      onClose();
      setTitle("");
      setArtist("");
      setRating(0);
    } catch (error) {
      if (error instanceof Error && error.message === "song_already_exists") {
        toast.error(t("song_already_exists"));
      } else {
        toast.error(t("error_adding_song"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("add_new_song")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='space-y-2'>
            <Label htmlFor='title'>{t("song_title")}</Label>
            <Input
              id='title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='artist'>{t("artist")}</Label>
            <Input
              id='artist'
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              required
            />
          </div>
          <div className='space-y-2'>
            <Label>{t("difficulty")} (1-10)</Label>
            <div className='flex gap-1'>
              {[...Array(10)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-6 w-6 cursor-pointer ${
                    rating >= i + 1
                      ? "fill-primary text-primary"
                      : "fill-muted text-muted-foreground"
                  }`}
                  onClick={() => setRating(i + 1)}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={isLoading}>
              {t("cancel")}
            </Button>
            <Button
              type='submit'
              disabled={
                isLoading || !title.trim() || !artist.trim() || !rating
              }>
              {isLoading ? (
                <span className='loading loading-spinner' />
              ) : (
                t("add")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSongModal;
