import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "assets/components/ui/dialog";
import { useTranslation } from "hooks/useTranslation";
import { Mic, Swords } from "lucide-react";

interface DuelJoinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  waitingOthers: number;
  onConfirm: () => void;
  isJoining: boolean;
  errorText: string | null;
}

/**
 * The one step before a duel starts: whether it starts now or waits in the
 * queue, and the mic rule — said here, right before the commitment, instead
 * of sitting on the page all the time.
 */
export const DuelJoinDialog = ({
  open,
  onOpenChange,
  waitingOthers,
  onConfirm,
  isJoining,
  errorText,
}: DuelJoinDialogProps) => {
  const { t } = useTranslation("duels");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex flex-col gap-5 bg-zinc-900 sm:max-w-md sm:p-7'>
        <DialogTitle className='pr-12 text-xl text-zinc-50'>
          {t("join.title")}
        </DialogTitle>
        <DialogDescription className='text-sm leading-relaxed text-zinc-300'>
          {waitingOthers > 0
            ? t("join.waiting", { count: waitingOthers })
            : t("join.nobody")}
        </DialogDescription>
        <p className='flex items-start gap-3 rounded-lg bg-zinc-800/60 px-4 py-3 text-sm leading-relaxed text-zinc-300'>
          <Mic size={16} className='mt-0.5 shrink-0 text-cyan-400' />
          {t("queue.mic")}
        </p>
        {errorText && (
          <p role='alert' className='text-sm text-orange-300'>
            {errorText}
          </p>
        )}
        <Button
          size='lg'
          onClick={onConfirm}
          loading={isJoining}
          className='w-full'>
          {!isJoining && <Swords className='' />}
          {isJoining ? t("queue.joining") : t("join.confirm")}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
