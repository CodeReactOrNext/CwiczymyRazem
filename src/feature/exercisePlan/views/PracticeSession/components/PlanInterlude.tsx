import { Button } from "assets/components/ui/button";
import { Kostek } from "components/Mascot/Kostek";
import { useTranslation } from "hooks/useTranslation";
import { Interpolate } from "lib/i18n/Interpolate";

import { PROUD_STREAK } from "../utils/runVerdict";
import { TurnedScreen } from "./TurnedScreen";

interface PlanInterludeProps {
  done: number;
  total: number;
  /** The streak of the run just played; said out loud when it is one to be proud of. */
  streak: number;
  /** The upright phone, where the practice screen lies on its side. */
  turned: boolean;
  onContinue: () => void;
  isBusy?: boolean;
}

/** A breath half way through a plan: Kostek, one sentence, Continue. */
export const PlanInterlude = ({ done, total, streak, turned, onContinue, isBusy }: PlanInterludeProps) => {
  const { t } = useTranslation("session");
  const isProud = streak >= PROUD_STREAK;
  const progress = done * 2 === total ? t("interlude.halfway") : t("interlude.done_of", { done, total });

  return (
    <TurnedScreen turned={turned} className='z-[99999999] bg-zinc-950 duration-slow animate-in fade-in'>
      <div className='flex min-h-full flex-col'>
        <div className='flex flex-1 items-center justify-center gap-4 px-6 py-8 sm:gap-8'>
          <Kostek mood={isProud ? "celebrate" : "approve"} delay={0.2} className='h-32 shrink-0 sm:h-48 shortwide:h-32' />
          {/* Speech, so it gets a tail — the one shape besides the fill that says who talks. */}
          <div className='relative max-w-sm rounded-lg bg-zinc-900 px-5 py-4 text-lg font-bold leading-snug text-zinc-100 sm:px-7 sm:py-6 sm:text-2xl shortwide:px-5 shortwide:py-4 shortwide:text-lg'>
            <span
              aria-hidden
              className='absolute right-full top-1/2 -translate-y-1/2 border-y-8 border-r-8 border-y-transparent border-r-zinc-900'
            />
            {isProud ? (
              <Interpolate
                text={t("interlude.streak")}
                values={{
                  streak: <span className='text-orange-400'>{t("interlude.in_a_row", { count: streak })}</span>,
                  progress,
                }}
              />
            ) : (
              progress
            )}
          </div>
        </div>
        <div className='flex justify-end bg-zinc-900/60 px-6 py-5 shortwide:py-3'>
          <Button size='xl' autoFocus loading={isBusy} onClick={onContinue} className='w-full sm:w-auto shortwide:w-auto'>
            {t("verdict.continue")}
          </Button>
        </div>
      </div>
    </TurnedScreen>
  );
};
