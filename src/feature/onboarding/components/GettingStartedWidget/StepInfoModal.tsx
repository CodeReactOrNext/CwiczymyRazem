import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface StepInfoModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  icon: LucideIcon;
  title: string;
  description: string;
  body?: ReactNode;
  ctaLabel: string;
  onCta: () => void;
}

export const StepInfoModal = ({
  isOpen,
  onOpenChange,
  icon: Icon,
  title,
  description,
  body,
  ctaLabel,
  onCta,
}: StepInfoModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className='max-h-[85vh] overflow-y-auto sm:max-w-lg'>
        <DialogClose className='absolute right-4 top-4 z-[100] flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 outline-none transition-all focus:ring-2 focus:ring-cyan-500/50 hover:bg-zinc-700 hover:text-white'>
          <X className='h-5 w-5' />
          <span className='sr-only'>Close</span>
        </DialogClose>

        <DialogHeader>
          <div className='mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400'>
            <Icon className='h-5 w-5' />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {body && (
          <div className='text-sm leading-relaxed text-zinc-300'>{body}</div>
        )}

        <DialogFooter>
          <Button onClick={onCta} className='w-full'>
            {ctaLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
