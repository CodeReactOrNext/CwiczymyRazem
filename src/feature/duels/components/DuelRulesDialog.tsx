import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { formatRatingDelta } from "feature/duels/utils/duelFormat";
import {
  DUEL_MIN_RATING,
  DUEL_PROVISIONAL_DUELS,
  DUEL_START_RATING,
} from "feature/duels/utils/duelRules";
import { eloExamples } from "feature/duels/utils/duelScreens";
import { useTranslation } from "hooks/useTranslation";
import { ChevronDown } from "lucide-react";

/** The rating the example table is worked out for — a typical player a little past the start. */
const EXAMPLE_RATING = 1100;
const STEP_COUNT = 3;
const MORE_COUNT = 5;

/**
 * What ELO is, in words and in one worked example. The numbers come from the
 * real rating formula, so the table can't drift from what a duel does.
 */
export const EloExplainer = () => {
  const { t } = useTranslation("duels");
  const rows = eloExamples(EXAMPLE_RATING);
  const delta = (value: number) => (
    <td
      className={cn(
        "py-2 text-right tabular-nums",
        value > 0 ? "font-semibold text-emerald-400" : "text-zinc-400",
      )}>
      {formatRatingDelta(value)}
    </td>
  );

  return (
    <section className='flex flex-col gap-3 rounded-2xl bg-zinc-800/50 p-4 sm:p-5'>
      <h3 className='text-base font-semibold text-zinc-50'>{t("elo.title")}</h3>
      <p className='text-sm leading-relaxed text-zinc-300'>
        {t("elo.body_0", { start: DUEL_START_RATING })}
      </p>
      <p className='text-sm leading-relaxed text-zinc-300'>{t("elo.body_1")}</p>
      <table className='mt-1 w-full text-sm'>
        <caption className='pb-2 text-left text-xs text-zinc-500'>
          {t("elo.example", { rating: EXAMPLE_RATING })}
        </caption>
        <thead>
          <tr className='text-[11px] font-semibold text-zinc-500'>
            <th className='pb-1 text-left font-semibold'>
              {t("elo.col_opponent")}
            </th>
            <th className='pb-1 text-right font-semibold'>
              {t("elo.col_win")}
            </th>
            <th className='pb-1 text-right font-semibold'>
              {t("elo.col_draw")}
            </th>
            <th className='pb-1 text-right font-semibold'>
              {t("elo.col_loss")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.strength}>
              <td className='py-2 text-zinc-200'>
                <span className='tabular-nums'>{row.opponent}</span>
                <span className='text-zinc-500'>
                  {" "}
                  · {t(`elo.strength.${row.strength}`)}
                </span>
              </td>
              {delta(row.win)}
              {delta(row.draw)}
              {delta(row.loss)}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className='flex flex-col gap-2 text-sm leading-relaxed text-zinc-400'>
        <li>{t("elo.provisional", { count: DUEL_PROVISIONAL_DUELS })}</li>
        <li>{t("elo.floor", { min: DUEL_MIN_RATING })}</li>
        <li>{t("elo.ladder")}</li>
      </ul>
    </section>
  );
};

export type DuelRulesView = "rules" | "elo";

interface DuelRulesDialogProps {
  /** Null when closed. "elo" opens straight on the rating, from the stats strip. */
  view: DuelRulesView | null;
  onViewChange: (view: DuelRulesView | null) => void;
  rating: number;
}

/**
 * "How it works": three steps, what ELO is, and the fine print folded away.
 * Opened from the rating it shows only the ELO part, with a way to the rest.
 */
export const DuelRulesDialog = ({
  view,
  onViewChange,
  rating,
}: DuelRulesDialogProps) => {
  const { t } = useTranslation("duels");
  return (
    <Dialog
      open={view !== null}
      onOpenChange={(open) => !open && onViewChange(null)}>
      <DialogContent className='flex max-w-lg flex-col gap-5 bg-zinc-900 sm:max-h-[calc(100dvh-2rem)] sm:overflow-y-auto sm:border-0 sm:p-7'>
        {view === "elo" ? (
          <>
            <DialogTitle className='pr-12 text-xl text-zinc-50'>
              {t("elo.your", { rating })}
            </DialogTitle>
            <EloExplainer />
            <Button
              variant='ghost'
              size='lg'
              className='h-11 w-full'
              onClick={() => onViewChange("rules")}>
              {t("elo.all_rules")}
            </Button>
          </>
        ) : (
          <>
            <DialogTitle className='pr-12 text-xl text-zinc-50'>
              {t("rules_short.open")}
            </DialogTitle>
            <ol className='flex flex-col gap-4'>
              {Array.from({ length: STEP_COUNT }, (_, i) => (
                <li key={i} className='flex gap-4'>
                  <span className='w-4 shrink-0 font-teko text-2xl font-semibold leading-none text-zinc-500'>
                    {i + 1}
                  </span>
                  <span>
                    <span className='block font-semibold text-zinc-100'>
                      {t(`rules_short.steps.${i}.title`)}
                    </span>
                    <span className='text-sm text-zinc-400'>
                      {t(`rules_short.steps.${i}.body`)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            <EloExplainer />
            <details className='group text-sm text-zinc-400'>
              <summary className='flex cursor-pointer list-none items-center gap-2 font-semibold text-zinc-200 [&::-webkit-details-marker]:hidden'>
                <ChevronDown
                  size={16}
                  className='transition-transform group-open:rotate-180'
                />
                {t("rules_short.more")}
              </summary>
              <ul className='mt-3 flex list-disc flex-col gap-2 pl-5 leading-relaxed'>
                {Array.from({ length: MORE_COUNT }, (_, i) => (
                  <li key={i}>{t(`rules_short.more_list.${i}`)}</li>
                ))}
              </ul>
            </details>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
