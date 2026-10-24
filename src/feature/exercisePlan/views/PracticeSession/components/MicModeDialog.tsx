import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { AnimatePresence, m } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { EASE, fade } from "lib/motion/motion";
import { Guitar, Mic } from "lucide-react";

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
    className='flex items-center justify-center gap-6 rounded-lg bg-zinc-900/40 py-10'>
    <Guitar className='h-10 w-10 text-zinc-400' />

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

    <span className='relative flex h-16 w-16 items-center justify-center'>
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
  onEnableMic: () => void;
  onSkipMic: () => void;
}

export const MicModeDialog = ({ isOpen, examMode, onEnableMic, onSkipMic }: MicModeDialogProps) => {
  const { t } = useTranslation("calibration");
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
            className="fixed inset-0 z-[99999998] bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => { if (!open && !examMode) onSkipMic(); }}
      >
        <DialogContent
          className={`sm:max-w-md z-[99999999]${examMode ? " [&>button.absolute]:hidden" : ""}`}
          onPointerDownOutside={examMode ? (e) => e.preventDefault() : undefined}
          onEscapeKeyDown={examMode ? (e) => e.preventDefault() : undefined}
        >
          <DialogHeader>
            <div className="mb-4">
              <MicListening />
            </div>
            <DialogTitle className="text-center text-xl">
              {examMode ? t("mic_mode.required") : t("mic_mode.tracking")}
            </DialogTitle>
            <DialogDescription className="text-center text-zinc-400 leading-relaxed pt-2">
              {examMode
                ? t("mic_mode.exam_body")
                : t("mic_mode.body")
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col sm:gap-2 pt-4">
            <Button onClick={onEnableMic} className="w-full font-bold">
              {t("mic_mode.enable")}
            </Button>
            {!examMode && (
              <Button variant="ghost" onClick={onSkipMic} className="w-full text-zinc-500 hover:text-zinc-300">
                {t("mic_mode.skip")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
