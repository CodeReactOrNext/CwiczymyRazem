import { Button } from "assets/components/ui/button";
import { Checkbox } from "assets/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Slider } from "assets/components/ui/slider";
import { ArrangementPicker } from "feature/songs/components/Arrangements/ArrangementPicker";
import type { SongArrangement } from "feature/songs/types/songs.type";
import { useTranslation } from "hooks/useTranslation";
import { Interpolate } from "lib/i18n/Interpolate";
import { CircleCheck } from "lucide-react";
import { useState } from "react";
import { convertMsToHMS } from "utils/converter";

interface TimeSplitterModalProps {
  isOpen: boolean;
  totalTime: number;
  onConfirm: (hearingTime: number, techniqueTime: number, markAsLearned: boolean) => void;
  onCancel: () => void;
  songTitle: string;
  isLoading?: boolean;
  /** The song already sits in the user's "learned" list — nothing to mark. */
  isAlreadyLearned?: boolean;
  /** When given, the modal also asks which arrangement the time goes to. */
  arrangement?: SongArrangement | null;
  onArrangementChange?: (arrangement: SongArrangement | null) => void;
}

export const TimeSplitterModal = ({
  isOpen,
  totalTime,
  onConfirm,
  onCancel,
  songTitle,
  isLoading = false,
  isAlreadyLearned = false,
  arrangement,
  onArrangementChange,
}: TimeSplitterModalProps) => {
  const { t } = useTranslation(["timer", "practice_hub"]);
  // Share of the session spent on technique. Dragging right means more
  // technique — players have that in their hands, so it must not flip.
  const [techniquePercent, setTechniquePercent] = useState(50);
  const [markAsLearned, setMarkAsLearned] = useState(false);

  const hearingPercent = 100 - techniquePercent;
  const techniqueTime = Math.round(totalTime * (techniquePercent / 100));
  const hearingTime = totalTime - techniqueTime;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className='flex flex-col gap-0 border-0 bg-zinc-950 text-zinc-100 sm:max-w-xl'>
        <DialogHeader className='space-y-2 pr-10 text-left'>
          <DialogTitle className='text-lg font-semibold'>{t("time_splitter.title")}</DialogTitle>
          <DialogDescription className='text-sm leading-relaxed text-zinc-400'>
            <Interpolate
              text={t("practice_hub:time_splitter_practiced")}
              values={{
                song: <span className='font-medium text-zinc-100'>{songTitle}</span>,
                time: (
                  <span className='font-medium tabular-nums text-zinc-100'>
                    {convertMsToHMS(totalTime)}
                  </span>
                ),
              }}
            />
          </DialogDescription>
        </DialogHeader>

        <div className='mt-8 flex-1 space-y-8'>
          {onArrangementChange && (
            <section className='space-y-3'>
              <p className='text-sm font-medium text-zinc-300'>{t("practice_hub:which_part")}</p>
              <ArrangementPicker
                value={arrangement ?? null}
                onChange={onArrangementChange}
                noneLabel={t("practice_hub:any_part")}
              />
            </section>
          )}

          <section className='space-y-3'>
            <p className='text-sm font-medium text-zinc-300'>{t("time_splitter.question")}</p>
            <div className='rounded-lg bg-zinc-900/60 p-4'>
              <div className='flex items-end justify-between gap-4'>
                <div>
                  <p className='text-xs text-zinc-400'>
                    {t("time_splitter.hearing")}
                    <span className='ml-1.5 tabular-nums text-zinc-500'>{hearingPercent}%</span>
                  </p>
                  <p className='mt-1 text-2xl font-semibold tabular-nums text-cyan-400'>
                    {convertMsToHMS(hearingTime)}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='text-xs text-zinc-400'>
                    <span className='mr-1.5 tabular-nums text-zinc-500'>{techniquePercent}%</span>
                    {t("time_splitter.technique")}
                  </p>
                  <p className='mt-1 text-2xl font-semibold tabular-nums text-amber-400'>
                    {convertMsToHMS(techniqueTime)}
                  </p>
                </div>
              </div>
              <Slider
                value={[techniquePercent]}
                onValueChange={(val) => setTechniquePercent(val[0])}
                max={100}
                step={5}
                aria-label={`${t("time_splitter.hearing")} / ${t("time_splitter.technique")}`}
                className='mt-5 cursor-pointer py-2 [&_[data-slot=slider-range]]:bg-amber-400 [&_[data-slot=slider-track]]:bg-cyan-400/80 [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:border-0 [&_[role=slider]]:bg-zinc-100 [&_[role=slider]]:shadow-none'
              />
            </div>
          </section>

          {isAlreadyLearned ? (
            <div className='flex items-center gap-3 rounded-lg bg-emerald-500/10 p-4'>
              <CircleCheck className='h-5 w-5 shrink-0 text-emerald-400' aria-hidden />
              <div>
                <p className='text-sm font-medium text-emerald-400'>
                  {t("time_splitter.already_learned_title")}
                </p>
                <p className='mt-0.5 text-xs text-zinc-400'>
                  {t("time_splitter.already_learned_description")}
                </p>
              </div>
            </div>
          ) : (
            <label
              htmlFor='learned-check'
              className='flex cursor-pointer items-start gap-3 rounded-lg bg-zinc-900/60 p-4 transition-background hover:bg-zinc-800/60'>
              <Checkbox
                id='learned-check'
                checked={markAsLearned}
                onCheckedChange={(checked) => setMarkAsLearned(checked === true)}
                className='mt-0.5 h-5 w-5 rounded border-zinc-600 shadow-none data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-zinc-950'
              />
              <span>
                <span className='block text-sm font-medium text-zinc-100'>
                  {t("time_splitter.learned_title")}
                </span>
                <span className='mt-0.5 block text-xs text-zinc-400'>
                  {t("time_splitter.learned_description")}
                </span>
              </span>
            </label>
          )}
        </div>

        <div className='mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between'>
          <Button
            variant='ghost'
            onClick={onCancel}
            disabled={isLoading}
            className='text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100'>
            {t("time_splitter.resume")}
          </Button>
          <Button
            onClick={() => onConfirm(hearingTime, techniqueTime, markAsLearned)}
            loading={isLoading}
            className='bg-white text-zinc-950 shadow-none hover:bg-zinc-200'>
            {isLoading ? t("time_splitter.saving") : t("time_splitter.confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
