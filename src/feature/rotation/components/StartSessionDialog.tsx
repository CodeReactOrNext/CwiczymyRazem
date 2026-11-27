import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Infinity as InfinityIcon, Timer } from "lucide-react";

import { useRotationDisplay } from "../hooks/useRotationDisplay";

interface StartSessionDialogProps {
  /** The session's set length, shown on the timed option. */
  minutes: number;
  onStart: (openTimer: boolean) => void;
  onClose: () => void;
}

/**
 * The one question before a rotation session: play it on the clock, each item
 * for its set length, or on an open timer that counts up until the player
 * finishes — for working through sections before a full run-through.
 */
export const StartSessionDialog = ({
  minutes,
  onStart,
  onClose,
}: StartSessionDialogProps) => {
  const { t } = useRotationDisplay();

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='flex flex-col gap-8 bg-zinc-900 sm:max-w-md sm:p-8'>
        <div className='space-y-2 pr-10'>
          <DialogTitle className='text-xl font-bold text-zinc-100'>
            {t("start.title")}
          </DialogTitle>
          <DialogDescription className='text-sm leading-relaxed text-zinc-400'>
            {t("start.description")}
          </DialogDescription>
        </div>

        <div className='grid gap-3'>
          <Button onClick={() => onStart(false)} size='xl'>
            <span className='flex items-center gap-3'>
              <Timer />
              {t("start.timed")}
              <span className='font-medium text-zinc-500'>
                {t("spotlight.minutes", { count: minutes })}
              </span>
            </span>
          </Button>
          <Button onClick={() => onStart(true)} size='xl' variant='secondary'>
            <span className='flex items-center gap-3'>
              <InfinityIcon className='text-zinc-400' />
              {t("start.open")}
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
