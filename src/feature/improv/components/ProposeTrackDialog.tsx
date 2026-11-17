import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import { cn } from "assets/lib/utils";
import { useProposeImprovTrack } from "feature/improv/hooks/useImprov";
import { improvErrorCode } from "feature/improv/services/improv.service";
import { IMPROV_MAX_POOL_TRACKS_PER_USER } from "feature/improv/types/improv.types";
import {
  parseTakeLink,
  youtubeThumbnail,
} from "feature/improv/utils/improvLink";
import { useTranslation } from "hooks/useTranslation";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";

interface ProposeTrackDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

/**
 * Adds a backing track to the pool. A YouTube link is the whole form: the
 * server reads the track's name and channel from YouTube, so there is nothing
 * else to type.
 */
export const ProposeTrackDialog = ({
  isOpen,
  onOpenChange,
}: ProposeTrackDialogProps) => {
  const { t } = useTranslation("improv");
  const propose = useProposeImprovTrack();
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const youtubeId = parseTakeLink(youtubeUrl)?.youtubeId ?? null;
  const isBadLink = !!youtubeUrl.trim() && !youtubeId;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!youtubeId) return;
    setError(null);
    propose.mutate(youtubeUrl, {
      onSuccess: () => {
        toast.success(t("upload.success"));
        setYoutubeUrl("");
        onOpenChange(false);
      },
      onError: (failure) => {
        const code = improvErrorCode(failure);
        setError(
          code === "BAD_TRACK"
            ? t("upload.error_link")
            : code === "DUPLICATE"
              ? t("upload.error_DUPLICATE")
              : code === "LIMIT"
                ? t("upload.error_LIMIT", {
                    max: IMPROV_MAX_POOL_TRACKS_PER_USER,
                  })
                : t("upload.error"),
        );
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t("upload.title")}</DialogTitle>
          <DialogDescription>{t("upload.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className='flex flex-col gap-5'>
          <div className='space-y-2'>
            <Label htmlFor='improv-link'>{t("upload.link")}</Label>
            <Input
              id='improv-link'
              type='url'
              inputMode='url'
              autoFocus
              value={youtubeUrl}
              onChange={(event) => {
                setYoutubeUrl(event.target.value);
                setError(null);
              }}
              placeholder='https://www.youtube.com/watch?v=…'
              aria-invalid={isBadLink}
              className='h-11 border-zinc-700 bg-zinc-950/60'
            />
            <p
              role={isBadLink || error ? "alert" : undefined}
              className={cn(
                "text-xs",
                isBadLink || error ? "text-red-400" : "text-zinc-400",
              )}>
              {error ??
                (isBadLink ? t("upload.error_link") : t("upload.link_hint"))}
            </p>
          </div>

          {youtubeId && (
            <img
              src={youtubeThumbnail(youtubeId)}
              alt=''
              className='force-dark aspect-video w-full rounded-lg bg-zinc-900 object-cover'
            />
          )}

          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <p className='text-xs leading-relaxed text-zinc-400 sm:max-w-xs'>
              {t("upload.rights")}
            </p>
            <Button
              type='submit'
              loading={propose.isPending}
              disabled={!youtubeId}
              className='h-11 shrink-0 px-5'>
              {t("upload.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
