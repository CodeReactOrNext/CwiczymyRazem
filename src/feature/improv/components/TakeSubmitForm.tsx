import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { Input } from "assets/components/ui/input";
import { useSubmitImprovTake } from "feature/improv/hooks/useImprov";
import { improvErrorCode } from "feature/improv/services/improv.service";
import {
  IMPROV_MAX_TAKES_PER_ROUND,
  IMPROV_NOTE_MAX,
} from "feature/improv/types/improv.types";
import { parseTakeLink } from "feature/improv/utils/improvLink";
import { useTranslation } from "hooks/useTranslation";
import { Upload } from "lucide-react";
import type { FormEvent, RefObject } from "react";
import { useState } from "react";
import { FaDiscord } from "react-icons/fa6";
import { toast } from "sonner";

interface TakeSubmitFormProps {
  /** How many takes this player already has on the round. */
  myTakeCount: number;
  inputRef: RefObject<HTMLInputElement | null>;
  autoFocus?: boolean;
}

const KNOWN_ERRORS = ["BAD_LINK", "LIMIT", "DUPLICATE", "NO_ROUND"];

/**
 * Where a take goes in: a link to the video, and one line about it. There is
 * no upload — the video stays where the player put it, and the bot carries the
 * link to the round's Discord thread.
 */
export const TakeSubmitForm = ({
  myTakeCount,
  inputRef,
  autoFocus = false,
}: TakeSubmitFormProps) => {
  const { t } = useTranslation("improv");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = useSubmitImprovTake();

  const takesLeft = Math.max(0, IMPROV_MAX_TAKES_PER_ROUND - myTakeCount);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!parseTakeLink(url)) {
      setError(t("submit.error_BAD_LINK"));
      return;
    }
    setError(null);
    submit.mutate(
      { url, note },
      {
        onSuccess: (result) => {
          setUrl("");
          setNote("");
          toast.success(
            result.fame > 0
              ? t("submit.success_first", {
                  points: result.points,
                  fame: result.fame,
                })
              : t("submit.success", { points: result.points }),
          );
        },
        onError: (failure) => {
          const code = improvErrorCode(failure);
          setError(
            code && KNOWN_ERRORS.includes(code)
              ? t(`submit.error_${code}`, { max: IMPROV_MAX_TAKES_PER_ROUND })
              : t("submit.error"),
          );
        },
      },
    );
  };

  return (
    <Card className='p-4 sm:p-5'>
      <form onSubmit={onSubmit} className='flex flex-col gap-3'>
        <div className='flex flex-col gap-3 sm:flex-row'>
          <Input
            ref={inputRef}
            type='url'
            inputMode='url'
            autoFocus={autoFocus}
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setError(null);
            }}
            disabled={takesLeft === 0 || submit.isPending}
            placeholder={t("submit.placeholder")}
            aria-label={t("submit.placeholder")}
            aria-invalid={!!error}
            className='h-11 border-zinc-700 bg-zinc-950/60'
          />
          <Button
            type='submit'
            loading={submit.isPending}
            disabled={takesLeft === 0 || !url.trim()}
            className='h-11 shrink-0 px-5'>
            <span className='flex items-center gap-2'>
              <Upload />
              {t("submit.button")}
            </span>
          </Button>
        </div>

        <Input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={IMPROV_NOTE_MAX}
          disabled={takesLeft === 0 || submit.isPending}
          placeholder={t("submit.note_placeholder")}
          aria-label={t("submit.note_placeholder")}
          className='h-10 border-zinc-700 bg-zinc-950/60'
        />

        {error && (
          <p role='alert' className='text-sm text-red-400'>
            {error}
          </p>
        )}

        <p className='flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400'>
          <FaDiscord className='shrink-0 text-indigo-300' size={14} />
          <span>{t("submit.hint")}</span>
          <span className='text-zinc-500'>
            {takesLeft === 0
              ? t("submit.limit", { max: IMPROV_MAX_TAKES_PER_ROUND })
              : t("submit.takes_left", {
                  count: takesLeft,
                  max: IMPROV_MAX_TAKES_PER_ROUND,
                })}
          </span>
        </p>
      </form>
    </Card>
  );
};
