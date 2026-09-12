import { cn } from "assets/lib/utils";
import { useGuitarTuning } from "feature/exercisePlan/views/PracticeSession/hooks/useGuitarTuning";
import { useGuitarAudioInput } from "hooks/useGuitarAudioInput";
import { RippleButton } from "hooks/useRipple";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { TunerDialog } from "./TunerDialog";
import { TuningForkIcon } from "./TuningForkIcon";

interface TunerButtonProps {
  /** Height class to align with sibling toolbar buttons (e.g. "h-7"). */
  h?: string;
}

/**
 * Desktop-only tuner, reachable from any page: opens the same tuner dialog the
 * practice session has, on the native (ASIO/WASAPI) input. Renders nothing on
 * the web build — there the tuner lives on /tools/tuner and inside sessions.
 *
 * The native engine has one capture slot, so while a practice session is
 * running Pitch Detect this button refuses to open rather than steal the
 * stream (its close() would tear the session's capture down). The session's
 * own Tuner button covers that case.
 */
export const TunerButton = ({ h = "h-7" }: TunerButtonProps) => {
  const audio = useGuitarAudioInput();
  const { tuning } = useGuitarTuning({ isGpFile: false, isExamMode: false });
  const [open, setOpen] = useState(false);

  const { init, close, isNative } = audio;

  // Whatever happens to the page, an open tuner never leaves the stream
  // running behind it.
  useEffect(() => {
    if (!open) return undefined;
    init();
    return () => close();
  }, [open, init, close]);

  const handleOpen = useCallback(async () => {
    const status = await window.nativeAudio?.getStatus().catch(() => null);
    if (status?.isOpen) {
      toast.info(
        "The input is in use by your practice session — use its Tuner button.",
      );
      return;
    }
    setOpen(true);
  }, []);

  if (!isNative) return null;

  const micHint = audio.error ?? "Opening the audio interface…";

  return (
    <>
      {/* The title bar's pill — the nav buttons' shape and ink, tinted
          violet (the tuner's colour everywhere else) while it's open. */}
      <RippleButton
        onClick={open ? () => setOpen(false) : handleOpen}
        title='Tuner'
        className={cn(
          "flex items-center gap-1.5 rounded-full pl-2.5 pr-3 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400/50",
          h,
          open
            ? "bg-violet-500/10 text-violet-300 hover:bg-violet-500/15"
            : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100",
        )}>
        <TuningForkIcon className='h-3.5 w-3.5 shrink-0' />
        <span>Tuner</span>
      </RippleButton>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <TunerDialog
            frequencyRef={audio.audioRefs.frequencyRef}
            volumeRef={audio.audioRefs.volumeRef}
            isMicEnabled={audio.isListening}
            micHint={micHint}
            tuning={tuning}
            onClose={() => setOpen(false)}
          />,
          document.body,
        )}
    </>
  );
};
