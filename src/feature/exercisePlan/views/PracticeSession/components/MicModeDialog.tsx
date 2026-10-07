import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { useTranslation } from "hooks/useTranslation";
import Image from "next/image";

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
      {examMode && isOpen && (
        <div className="fixed inset-0 z-[99999998] bg-black/60 backdrop-blur-sm" />
      )}
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
            <div className="mx-auto mb-4 flex justify-center">
              <Image
                src="/images/ilustration/plugin.png"
                alt={t("mic_mode.alt")}
                width={300}
                height={300}
                className="w-[300px] h-auto object-contain"
              />
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
            <Button onClick={onEnableMic} className="w-full bg-cyan-500 text-black hover:bg-cyan-400 font-bold">
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
