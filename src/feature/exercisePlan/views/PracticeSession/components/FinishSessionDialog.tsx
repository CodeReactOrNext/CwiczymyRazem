import { Button } from "assets/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Check, Clock, FlagTriangleRight, Minus } from "lucide-react";
import type { ReactNode } from "react";

interface FinishSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * `plan` — the session's bar is met, the player is simply skipping the
   * exercises left in the plan: everything is awarded as usual.
   * `early` — the bar is *not* met. The time is logged, the skill points are not.
   */
  mode: "plan" | "early";
  /** Blocks the confirm: nothing has been practised long enough to log yet. */
  disabled?: boolean;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
}

const Outcome = ({
  tone, icon, title, description,
}: {
  tone: "kept" | "lost";
  icon: ReactNode;
  title: string;
  description: string;
}) => (
  <div className='flex items-start gap-3'>
    <span
      aria-hidden
      className={cn(
        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded",
        tone === "kept" ? "text-emerald-400" : "text-zinc-500",
      )}>
      {icon}
    </span>
    <div className='space-y-1'>
      <p className={cn("text-sm font-semibold", tone === "kept" ? "text-zinc-100" : "text-zinc-400")}>
        {title}
      </p>
      <p className='text-xs leading-relaxed text-zinc-500'>{description}</p>
    </div>
  </div>
);

/**
 * Confirmation for leaving a session before it is played out.
 *
 * Its job is to make the trade explicit before the player commits to it — the
 * practice time is always kept, the skill points are what an early finish
 * costs. Exams never reach this dialog: there is no early finish to offer when
 * the whole point is to play the thing through.
 */
export const FinishSessionDialog = ({
  open, onOpenChange, mode, disabled, isLoading, onConfirm,
}: FinishSessionDialogProps) => {
  const { t } = useTranslation(["common"]);
  const isEarly = mode === "early";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* z-index must beat the session view, overlay included, or this dialog
          opens invisibly behind it. */}
      <DialogContent
        className='max-w-md bg-zinc-900 text-white sm:p-8 z-[99999999]'
        overlayClassName='z-[99999998]'>
        <DialogHeader className='space-y-3'>
          <span
            aria-hidden
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-lg",
              isEarly ? "bg-amber-500/10 text-amber-400" : "bg-cyan-500/10 text-cyan-400",
            )}>
            {isEarly ? <Clock className='h-5 w-5' /> : <FlagTriangleRight className='h-5 w-5' />}
          </span>
          <DialogTitle className='text-xl font-bold tracking-tight'>
            {isEarly
              ? t("common:practice.finish_early.title")
              : t("common:practice.finish_plan_early_title")}
          </DialogTitle>
          <DialogDescription className='text-sm leading-relaxed text-zinc-400'>
            {isEarly
              ? t("common:practice.finish_early.description")
              : t("common:practice.finish_plan_early_description")}
          </DialogDescription>
        </DialogHeader>

        {isEarly && (
          <div className='mt-2 space-y-5'>
            <Outcome
              tone='kept'
              icon={<Check className='h-4 w-4' />}
              title={t("common:practice.finish_early.kept_title")}
              description={t("common:practice.finish_early.kept_description")}
            />
            <Outcome
              tone='lost'
              icon={<Minus className='h-4 w-4' />}
              title={t("common:practice.finish_early.lost_title")}
              description={t("common:practice.finish_early.lost_description")}
            />
          </div>
        )}

        <DialogFooter className='mt-8 flex flex-col gap-2 sm:flex-row'>
          <Button
            variant='ghost'
            className='flex-1 rounded-lg bg-white/5 text-sm font-semibold text-zinc-300 transition-background hover:bg-white/10 hover:text-white'
            onClick={() => onOpenChange(false)}>
            {t("common:cancel")}
          </Button>
          <Button
            className='flex-1 rounded-lg bg-white text-sm font-bold text-black transition-background hover:bg-zinc-200'
            loading={isLoading}
            disabled={disabled}
            onClick={onConfirm}>
            {isEarly
              ? t("common:practice.finish_early.confirm")
              : t("common:practice.finish_plan_early_action")}
          </Button>
        </DialogFooter>

        {disabled && (
          <p className='-mt-2 text-center text-[11px] text-zinc-500'>
            {t("common:practice.finish_early.blocked")}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};
