import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "assets/components/ui/alert-dialog";
import { cn } from "assets/lib/utils";

import { FameCoin } from "./FameCoin";
import { ModArt } from "./ModArt";

interface ModRemoveDialogProps {
  /** The mod on its way off. `null` keeps the dialog shut. */
  mod: { id: string; label: string; points: number } | null;
  /** The instrument it is coming off — the mod's name alone is not enough. */
  itemName: string;
  fameCost: number;
  fame: number;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * The one job on the mod bench that gives nothing back, so it is the one job
 * that asks first.
 *
 * Every other button here trades parts for something the player keeps. This one
 * trades Fame for an empty slot and burns the mod doing it, which is exactly the
 * kind of thing a player clicks once and regrets — so it goes through the same
 * `alert-dialog` a teardown does, and says plainly that the mod is not being
 * stored anywhere.
 */
export const ModRemoveDialog = ({
  mod,
  itemName,
  fameCost,
  fame,
  isLoading,
  onConfirm,
  onCancel,
}: ModRemoveDialogProps) => {
  if (!mod) return null;

  const affordable = fame >= fameCost;

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !isLoading) onCancel();
      }}>
      <AlertDialogContent className='max-w-sm gap-6 border-0 bg-zinc-900 p-6'>
        <AlertDialogHeader className='space-y-2'>
          <AlertDialogTitle className='text-lg font-bold text-white'>
            Take {mod.label} off?
          </AlertDialogTitle>
          <AlertDialogDescription className='text-sm leading-relaxed text-zinc-400'>
            It comes off {itemName} and is destroyed on the way out — the mod is
            not put in your stash, it cannot be fitted to anything else, and
            nothing brings it back.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* What the instrument loses, in the same art and the same numbers the
            bench showed a moment ago. Dimmed rather than warning-coloured: it is
            a consequence to read, not an error to fix. */}
        <div className='flex items-center gap-4 rounded-lg bg-zinc-800/50 p-4'>
          <ModArt modId={mod.id} size={52} dimmed />
          <div className='flex min-w-0 flex-col gap-1'>
            <span className='truncate text-sm font-bold text-zinc-300'>
              {mod.label}
            </span>
            <span className='text-xs text-zinc-500'>
              <span className='tabular-nums'>+{mod.points}</span> level goes
              with it · one slot comes back
            </span>
          </div>
        </div>

        <div className='flex items-center justify-between gap-4 rounded-lg bg-zinc-950/40 p-4'>
          <span className='flex items-center gap-2.5'>
            <FameCoin size={22} />
            <span className='text-sm font-bold tabular-nums text-zinc-100'>
              {fameCost} Fame
            </span>
          </span>
          <span
            className={cn(
              "text-xs tabular-nums",
              affordable ? "text-zinc-500" : "text-amber-400",
            )}>
            you have {fame}
          </span>
        </div>

        <AlertDialogFooter className='gap-2 sm:space-x-0'>
          <AlertDialogCancel
            disabled={isLoading}
            className='mt-0 border-0 bg-zinc-700 text-white hover:bg-zinc-600 hover:text-white sm:flex-1'>
            Keep it
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              // The caller unmounts this once the job lands, so the dialog must
              // not close itself out from under a request still in flight.
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading || !affordable}
            className='bg-orange-600 text-white hover:bg-orange-700 sm:flex-1'>
            {isLoading ? "Taking it off…" : "Take it off"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
