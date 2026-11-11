import * as DialogPrimitive from "@radix-ui/react-dialog";
import { buttonVariants } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { X } from "lucide-react";
import * as React from "react";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

/**
 * The base z-index splits by breakpoint (`z-[120]` phones, `sm:z-50` up), and
 * tailwind-merge only swaps a caller's `z-[…]` for the unprefixed one — the
 * `sm:z-50` would stay and drop the dialog under full-screen views (the
 * practice session) from 640px up. A caller that sets its own z gets only that.
 */
const hasOwnZ = (className?: string) => /(^|\s)!?z-/.test(className ?? "");

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "font-openSans app-scrim fixed inset-0 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      !hasOwnZ(className) && "z-[115] sm:z-50",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    /** Extra classes for the backdrop, e.g. a z-index bump when the dialog must sit above a full-screen modal. */
    overlayClassName?: string;
    /** Skip the default close button, e.g. when the caller renders its own. */
    hideCloseButton?: boolean;
  }
>(
  (
    { className, overlayClassName, hideCloseButton, children, ...props },
    ref,
  ) => (
    <DialogPortal>
      <DialogOverlay className={overlayClassName} />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          // Phones: a native bottom sheet — pinned to the bottom edge, as tall as
          // its content (up to 92% of the screen), rounded on top, sliding up,
          // above the bottom tab bar (z-[120] over its z-[100]) and clear of the
          // home indicator. From `sm` up: the centred dialog it always was.
          "font-openSans fixed inset-x-0 bottom-0 grid max-h-[92dvh] w-full gap-4 overflow-y-auto rounded-t-[22px] border-0 bg-background px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-9 shadow-lg duration-base data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full sm:inset-x-auto sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:overflow-visible sm:rounded-lg sm:border sm:p-6 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95 short:p-4 sm:short:max-h-[calc(100dvh-1.5rem)] sm:short:overflow-y-auto",
          !hasOwnZ(className) && "z-[120] sm:z-50",
          className,
        )}
        {...props}>
        {/* The sheet's grab handle — phones only, where the dialog is a sheet. */}
        <span
          aria-hidden
          className='pointer-events-none absolute left-1/2 top-2.5 h-1.5 w-10 -translate-x-1/2 rounded-full bg-zinc-600/70 sm:hidden'
        />
        {children}
        {/* Close is a key like every other button — face, lip and press. */}
        {!hideCloseButton && (
          <DialogPrimitive.Close
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "absolute right-4 top-4 z-[100] sm:right-6 sm:top-6",
            )}>
            <X />
            <span className='sr-only'>Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  ),
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "font-openSans flex flex-col space-y-1.5 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "font-openSans text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
};
