import { Button } from "assets/components/ui/button";
import { usesMicrophone } from "feature/exercisePlan/views/PracticeSession/components/CalibrationWizard/inputSource";
import { useTranslation } from "hooks/useTranslation";
import Image from "next/image";
import { useState } from "react";

import { useAutoBackingStore } from "../store/autoBackingStore";

/**
 * Whether the "your mic can hear the backing" note applies: the backing is
 * about to play, the mic is on, and the guitar comes in through a microphone.
 * An interface takes the guitar's signal by cable and never hears the
 * speakers, so it is left alone — as is everyone who has read the note.
 */
export function useBackingLeakNotice(micOn: boolean): boolean {
  const available = useAutoBackingStore((state) => state.available);
  const enabled = useAutoBackingStore((state) => state.enabled);
  const dismissed = useAutoBackingStore((state) => state.leakNoticeDismissed);
  // Read once: the answer only changes inside the input setup, which the gate isn't open over.
  const [throughMic] = useState(usesMicrophone);
  return micOn && available && enabled && !dismissed && throughMic;
}

/**
 * Shown on the start gate, before the clock runs — it used to be a toast that
 * popped up over the tab the moment the player started playing. Says what to
 * do (headphones) and what the symptom looks like, so a player whose notes
 * are being misread later knows where to look.
 */
export const BackingLeakNotice = () => {
  const { t } = useTranslation("session");
  const dismiss = useAutoBackingStore((state) => state.dismissLeakNotice);
  const setEnabled = useAutoBackingStore((state) => state.setEnabled);

  return (
    <div
      role='note'
      className='flex w-full max-w-lg flex-col items-center gap-5 rounded-lg bg-zinc-900 px-6 py-5 text-left sm:flex-row shortwide:flex-row shortwide:gap-4 shortwide:px-4 shortwide:py-3'>
      <div className='relative h-24 w-36 shrink-0 shortwide:h-16 shortwide:w-24'>
        <Image
          src='/images/setup/speaker-into-mic.webp'
          alt=''
          fill
          sizes='144px'
          className='select-none object-contain'
          draggable={false}
        />
      </div>
      <div className='min-w-0 space-y-3'>
        <div className='space-y-1.5'>
          <p className='text-sm font-semibold text-zinc-100'>
            {t("auto_backing.leak_notice.title")}
          </p>
          <p className='text-sm leading-relaxed text-zinc-300'>
            {t("auto_backing.leak_notice.body")}
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button size='sm' variant='secondary' onClick={dismiss}>
            {t("auto_backing.leak_notice.ok")}
          </Button>
          <Button size='sm' variant='ghost' onClick={() => setEnabled(false)}>
            {t("auto_backing.leak_notice.off")}
          </Button>
        </div>
      </div>
    </div>
  );
};
