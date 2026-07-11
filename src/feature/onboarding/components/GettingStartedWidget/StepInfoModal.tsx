import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import type { LucideIcon } from "lucide-react";
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
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <div className='mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400'>
            <Icon className='h-5 w-5' />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {body && <div className='text-sm text-zinc-300 leading-relaxed'>{body}</div>}

        <DialogFooter>
          <Button onClick={onCta} className='w-full'>
            {ctaLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
