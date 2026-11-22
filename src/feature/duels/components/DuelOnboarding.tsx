import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { Kostek, type KostekMood } from "components/Mascot/Kostek";
import { useTranslation } from "hooks/useTranslation";
import { useState } from "react";

/** One mood per step: the duel itself, the waiting and playing, the win. */
const STEP_MOODS: KostekMood[] = ["duel", "wait", "celebrate"];

interface DuelOnboardingProps {
  onDone: () => void;
}

/**
 * The first visit, before any duel: three short screens with Kostek instead
 * of a list of rules on the page. Skippable; "How it works" has it all later.
 */
export const DuelOnboarding = ({ onDone }: DuelOnboardingProps) => {
  const { t } = useTranslation("duels");
  const [step, setStep] = useState(0);
  const isLast = step === STEP_MOODS.length - 1;

  return (
    <div className='mx-auto flex min-h-[32rem] w-full max-w-md flex-col items-center justify-center gap-7 py-8 text-center'>
      <div className='flex w-full items-center justify-between'>
        <ol
          className='flex gap-1.5'
          aria-label={`${step + 1} / ${STEP_MOODS.length}`}>
          {STEP_MOODS.map((_, i) => (
            <li
              key={i}
              className={cn(
                "h-1.5 w-7 rounded-full transition-colors",
                i <= step ? "bg-zinc-100" : "bg-zinc-800",
              )}
            />
          ))}
        </ol>
        <Button variant='ghost' size='sm' onClick={onDone}>
          {t("onboarding.skip")}
        </Button>
      </div>

      <Kostek mood={STEP_MOODS[step]} cue={step} className='h-32' />

      <div aria-live='polite'>
        <h2 className='text-2xl font-bold leading-tight text-zinc-50 [text-wrap:balance] sm:text-3xl'>
          {t(`onboarding.${step}.title`)}
        </h2>
        <p className='mt-3 text-base leading-relaxed text-zinc-400'>
          {t(`onboarding.${step}.body`)}
        </p>
      </div>

      <Button
        size='lg'
        onClick={() => (isLast ? onDone() : setStep(step + 1))}
        className='w-full'>
        {isLast ? t("onboarding.start") : t("onboarding.next")}
      </Button>
    </div>
  );
};
