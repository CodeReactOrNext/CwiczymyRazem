import { cn } from "assets/lib/utils";
import { useGuitarTuning } from "feature/exercisePlan/views/PracticeSession/hooks/useGuitarTuning";
import { useGuitarAudioInput } from "hooks/useGuitarAudioInput";
import { RippleButton } from "hooks/useRipple";
import { useTranslation } from "hooks/useTranslation";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { useSessionTunerStore } from "../store/sessionTunerStore";
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
 * The native engine has one capture slot, so while a practice session has its
 * input open the tuner reads the session's pitch instead of opening its own
 * stream (its close() would tear the session's capture down).
 */
export const TunerButton = ({ h = "h-7" }: TunerButtonProps) => {
  const { t } = useTranslation("desktop");
  const audio = useGuitarAudioInput();
  const { tuning } = useGuitarTuning({ isGpFile: false, isExamMode: false });
  const sessionSource = useSessionTunerStore((s) => s.source);
  // "own" opens the tuner's own capture, "session" borrows the practice
  // session's input.
  const [mode, setMode] = useState<"own" | "session" | null>(null);

  const { init, close, isNative } = audio;

  // Whatever happens to the page, an open tuner never leaves the stream
  // running behind it.
  useEffect(() => {
    if (mode !== "own") return undefined;
    init();
    return () => close();
  }, [mode, init, close]);

  // The session's input going away closes the borrowed tuner for good, so it
  // doesn't pop back up when the next session opens one.
  useEffect(() => {
    if (mode !== "session") return undefined;
    return useSessionTunerStore.subscribe((s) => {
      if (!s.source) setMode(null);
    });
  }, [mode]);

  const handleOpen = useCallback(async () => {
    if (useSessionTunerStore.getState().source) {
      setMode("session");
      return;
    }
    const status = await window.nativeAudio?.getStatus().catch(() => null);
    if (status?.isOpen) {
      toast.info(t("tuner.in_use"));
      return;
    }
    setMode("own");
  }, [t]);

  if (!isNative) return null;

  const borrowed = mode === "session" ? sessionSource : null;
  const isOpen = mode === "own" || !!borrowed;
  const dialogProps = borrowed
    ? {
        frequencyRef: borrowed.frequencyRef,
        volumeRef: borrowed.volumeRef,
        isMicEnabled: borrowed.isListening,
        micHint: t("tuner.opening"),
        tuning: borrowed.tuning,
        isTuningLocked: borrowed.isTuningLocked,
      }
    : {
        frequencyRef: audio.audioRefs.frequencyRef,
        volumeRef: audio.audioRefs.volumeRef,
        isMicEnabled: audio.isListening,
        micHint: audio.error ?? t("tuner.opening"),
        tuning,
      };

  return (
    <>
      {/* The title bar's pill — the nav buttons' shape and ink, tinted
          violet (the tuner's colour everywhere else) while it's open. */}
      <RippleButton
        onClick={isOpen ? () => setMode(null) : handleOpen}
        title={t("tuner.title")}
        className={cn(
          "flex items-center gap-1.5 rounded-full pl-2.5 pr-3 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400/50",
          h,
          isOpen
            ? "bg-violet-500/10 text-violet-300 hover:bg-violet-500/15"
            : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100",
        )}>
        <TuningForkIcon className='h-3.5 w-3.5 shrink-0' />
        <span>{t("tuner.title")}</span>
      </RippleButton>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <TunerDialog {...dialogProps} onClose={() => setMode(null)} />,
          document.body,
        )}
    </>
  );
};
