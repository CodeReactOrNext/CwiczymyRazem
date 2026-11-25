import { Button } from "assets/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { useState } from "react";

import { useBossText } from "../hooks/useBossText";
import type { BossDefinition } from "../types/boss.types";

const STEPS = ["play", "strike", "survive"] as const;

interface BossHowToProps {
  boss: BossDefinition;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** What a fight comes down to, three sentences and one at a time. The rest —
 *  slams, powers, boons — the fight says as it brings it. */
export const BossHowTo = ({ boss, open, onOpenChange }: BossHowToProps) => {
  const { t, bossName } = useBossText(boss);
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;

  const close = (next: boolean) => {
    onOpenChange(next);
    // Opened again, it starts from the top.
    if (!next) setStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className='bg-zinc-900 p-8 text-zinc-100 sm:max-w-md'>
        <DialogTitle className='sr-only'>
          {t("guide.open")}: {bossName}
        </DialogTitle>
        <div className='flex flex-col items-center gap-6 pt-2 text-center' aria-live='polite'>
          <span aria-hidden className='font-teko text-8xl leading-[0.8] text-zinc-100'>
            {step + 1}
          </span>
          <DialogDescription className='min-h-[4rem] font-display text-xl font-bold leading-snug text-zinc-50 [text-wrap:balance]'>
            {t(`how.${STEPS[step]}`)}
          </DialogDescription>
          <span className='flex gap-1.5' aria-label={t("guide.progress", { step: step + 1, count: STEPS.length })}>
            {STEPS.map((key, i) => (
              <span key={key} className={cn("h-1.5 w-6 rounded-full", i === step ? "bg-zinc-100" : "bg-zinc-700")} />
            ))}
          </span>
          <Button size='xl' className='w-full' onClick={() => (last ? close(false) : setStep(step + 1))}>
            {last ? t("guide.got_it") : t("guide.next")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
