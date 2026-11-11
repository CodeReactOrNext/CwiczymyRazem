import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button, buttonVariants } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { AnimatePresence, m } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { EASE, fade } from "lib/motion/motion";
import { Guitar, Mic, X } from "lucide-react";

import { QUARTER_TURN_STYLE } from "./tablatureDirection";

/** Heights the sound bars bounce through, one row per bar. */
const BAR_HEIGHTS = [
  [0.35, 1, 0.5],
  [0.6, 0.3, 1],
  [1, 0.45, 0.7],
  [0.4, 0.9, 0.35],
  [0.7, 0.5, 1],
];

/**
 * Guitar → sound → mic: the bars carry the playing across and the mic answers
 * with rings, which is what turning it on does. Bars and rings both scale, so
 * with reduced motion on they hold still and the picture still reads.
 */
const MicListening = () => (
  <div
    aria-hidden
    className='flex items-center justify-center gap-6 overflow-hidden rounded-lg bg-zinc-900/40 py-10 shortwide:h-full shortwide:gap-4 shortwide:px-4 shortwide:py-8'>
    <Guitar className='h-10 w-10 shrink-0 text-zinc-400' />

    <span className='flex h-8 items-center gap-1'>
      {BAR_HEIGHTS.map((heights, i) => (
        <m.span
          key={i}
          className='h-full w-1 origin-center rounded-full bg-cyan-400'
          animate={{ scaleY: [...heights, heights[0]] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: EASE.inOut,
            delay: i * 0.1,
          }}
        />
      ))}
    </span>

    <span className='relative flex h-16 w-16 shrink-0 items-center justify-center'>
      {[0, 1].map((i) => (
        <m.span
          key={i}
          className='absolute inset-0 rounded-full bg-cyan-400/20'
          animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: EASE.out,
            delay: i * 1,
          }}
        />
      ))}
      <span className='relative flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400'>
        <Mic className='h-7 w-7' />
      </span>
    </span>
  </div>
);

interface MicModeDialogProps {
  isOpen: boolean;
  examMode?: boolean;
  /**
   * The phone's practice screen lies on its side on an upright phone; the
   * prompt lies the same way so it reads with the phone held sideways.
   */
  turned?: boolean;
  onEnableMic: () => void;
  onSkipMic: () => void;
  /** Exam only — the prompt can't be skipped there, so this is its way out. */
  onLeave?: () => void;
}

/**
 * Picture over text and buttons; on a phone held sideways (`shortwide:`) the
 * picture moves beside them, so the prompt fits the low screen without scrolling.
 */
const MicModeBody = ({
  examMode,
  onEnableMic,
  onSkipMic,
  onLeave,
}: Omit<MicModeDialogProps, "isOpen" | "turned">) => {
  const { t } = useTranslation("calibration");
  return (
    <div className='flex flex-col gap-4 shortwide:flex-row shortwide:items-stretch shortwide:gap-6'>
      <div className='shortwide:w-2/5 shortwide:shrink-0'>
        <MicListening />
      </div>
      <div className='flex flex-col shortwide:flex-1 shortwide:justify-center'>
        <DialogTitle className='text-center text-xl shortwide:text-left'>
          {examMode ? t("mic_mode.required") : t("mic_mode.tracking")}
        </DialogTitle>
        <DialogDescription className='pt-2 text-center leading-relaxed text-zinc-400 shortwide:text-left'>
          {examMode ? t("mic_mode.exam_body") : t("mic_mode.body")}
        </DialogDescription>
        <div className='flex flex-col gap-2 pt-6 shortwide:pt-5'>
          <Button onClick={onEnableMic} className='w-full font-bold'>
            {t("mic_mode.enable")}
          </Button>
          {!examMode && (
            <Button variant='ghost' onClick={onSkipMic} className='w-full text-zinc-500 hover:text-zinc-300'>
              {t("mic_mode.skip")}
            </Button>
          )}
          {examMode && onLeave && (
            <Button variant='ghost' onClick={onLeave} className='w-full text-zinc-500 hover:text-zinc-300'>
              {t("common:practice.exit")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export const MicModeDialog = ({ isOpen, examMode, turned, onEnableMic, onSkipMic, onLeave }: MicModeDialogProps) => {
  const body = (
    <MicModeBody examMode={examMode} onEnableMic={onEnableMic} onSkipMic={onSkipMic} onLeave={onLeave} />
  );
  const blockDismiss = examMode ? (e: Event) => e.preventDefault() : undefined;

  if (turned) {
    // Laid on its side like the practice screen beneath (see `TurnedScreen`).
    // The rotated layer is the dialog's content and fills the screen, so a tap
    // beside the card is caught here; the card fades in on its own, because an
    // enter animation on the layer would play its transform from unrotated.
    return (
      <DialogPrimitive.Root
        open={isOpen}
        onOpenChange={(open) => { if (!open && !examMode) onSkipMic(); }}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className='app-scrim fixed inset-0 z-[99999998] bg-black/80 data-[state=open]:animate-in data-[state=open]:fade-in-0' />
          <DialogPrimitive.Content
            className='sideways-screen fixed left-0 top-0 z-[99999999] flex items-center justify-center overflow-y-auto overscroll-contain p-6 font-openSans outline-none'
            style={{
              ...QUARTER_TURN_STYLE,
              width: "100dvh",
              height: "100dvw",
              paddingLeft: "calc(1.5rem + env(safe-area-inset-top, 0px))",
              paddingRight: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
            }}
            onEscapeKeyDown={blockDismiss}
            onClick={(e) => { if (e.target === e.currentTarget && !examMode) onSkipMic(); }}>
            <div className='relative w-full max-w-2xl rounded-lg bg-background p-6 animate-in fade-in-0'>
              {body}
              {!examMode && (
                <DialogPrimitive.Close
                  className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "absolute right-3 top-3")}>
                  <X />
                  <span className='sr-only'>Close</span>
                </DialogPrimitive.Close>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }

  return (
    <>
      {/* Leaves with the dialog instead of vanishing a frame before it. */}
      <AnimatePresence>
        {examMode && isOpen && (
          <m.div
            key='mic-exam-backdrop'
            initial='hidden'
            animate='visible'
            exit='hidden'
            variants={fade}
            className='fixed inset-0 z-[99999998] bg-black/60 backdrop-blur-sm'
          />
        )}
      </AnimatePresence>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => { if (!open && !examMode) onSkipMic(); }}>
        <DialogContent
          className={cn("z-[99999999] sm:max-w-md shortwide:max-w-2xl", examMode && "[&>button.absolute]:hidden")}
          onPointerDownOutside={blockDismiss}
          onEscapeKeyDown={blockDismiss}>
          {body}
        </DialogContent>
      </Dialog>
    </>
  );
};
