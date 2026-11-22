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
import { buttonVariants } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: ReactNode;
  cancelLabel: ReactNode;
  /**
   * The dialog does not close itself on confirm: the caller closes it (through
   * `open`) once its work is done, so an async delete can keep it up with a
   * spinner and leave it open when it fails.
   */
  onConfirm: () => void | Promise<void>;
  /** Red confirm key — deleting, removing, scrapping. */
  destructive?: boolean;
  /** Spinner on the confirm key; both keys and Escape are locked meanwhile. */
  loading?: boolean;
  /** Locks only the confirm key, e.g. while a field in the body is invalid. */
  confirmDisabled?: boolean;
  /** Extra body between the description and the keys. */
  children?: ReactNode;
}

/**
 * The one confirmation dialog: title, optional description, a quiet ghost
 * Cancel and a confirm key — white by default, red when `destructive`.
 */
export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  destructive = false,
  loading = false,
  confirmDisabled = false,
  children,
}: ConfirmDialogProps) => (
  <AlertDialog
    open={open}
    onOpenChange={(next) => {
      if (!loading) onOpenChange(next);
    }}>
    <AlertDialogContent className='max-w-sm gap-6'>
      <AlertDialogHeader className='space-y-2'>
        <AlertDialogTitle className='text-lg font-bold text-white'>
          {title}
        </AlertDialogTitle>
        {description && (
          <AlertDialogDescription className='text-sm leading-relaxed text-zinc-400'>
            {description}
          </AlertDialogDescription>
        )}
      </AlertDialogHeader>
      {children}
      <AlertDialogFooter className='gap-2 sm:space-x-0'>
        <AlertDialogCancel
          disabled={loading}
          className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "mt-0 sm:flex-1")}>
          {cancelLabel}
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={(event) => {
            event.preventDefault();
            void onConfirm();
          }}
          disabled={loading || confirmDisabled}
          className={cn(
            buttonVariants({
              variant: destructive ? "destructive" : "default",
              size: "lg",
            }),
            "sm:flex-1",
          )}>
          {loading && <Loader2 className='animate-spin' aria-hidden />}
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
