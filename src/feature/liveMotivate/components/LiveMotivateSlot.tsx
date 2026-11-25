import { PRESSABLE } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { CoinBurst } from "feature/liveMotivate/components/CoinBurst";
import styles from "feature/liveMotivate/components/LiveMotivate.module.css";
import { LIVE_MOTIVATE_FAME } from "feature/liveMotivate/liveMotivate.rules";
import { LiveMotivateFailure, motivateLive } from "feature/liveMotivate/services/liveMotivate.service";
import { liveSentKey, useLiveMotivateStore } from "feature/liveMotivate/store/useLiveMotivateStore";
import { addFame } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

/** How long the whole celebration stays on screen. */
const CELEBRATION_MS = 1400;
/** The motivator's own "+3" waits until the coins have mostly fallen. */
const RECEIPT_AFTER_MS = 900;
const RECEIPT_MS = 1600;

interface LiveMotivateSlotProps {
  recipientId: string;
  recipientName: string;
  /** The session being motivated — one motivation per session. */
  sessionKey: number;
  /** The avatar, exactly as the Live Now row draws it. */
  children: ReactNode;
}

/**
 * A practicing player's avatar in the Live Now row, with Motivate folded up beside it. Hovering
 * (or focusing) the avatar slides the key out; on a touch screen the first tap opens it and a
 * second tap on the avatar still goes to the profile. Once used, the key is gone for the rest of
 * that session and the row marks the avatar instead.
 */
export const LiveMotivateSlot = ({ recipientId, recipientName, sessionKey, children }: LiveMotivateSlotProps) => {
  const { t } = useTranslation("feed");
  const dispatch = useAppDispatch();
  const sentKey = liveSentKey(recipientId, sessionKey);
  const isSent = useLiveMotivateStore((state) => !!state.sent[sentKey]);
  const markSent = useLiveMotivateStore((state) => state.markSent);
  const unmarkSent = useLiveMotivateStore((state) => state.unmarkSent);

  const [isOpen, setIsOpen] = useState(false);
  const [celebration, setCelebration] = useState(0);
  const [receipt, setReceipt] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerTypeRef = useRef("mouse");

  // A tapped-open key closes when the next tap lands anywhere else.
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen]);

  const handleMotivate = async () => {
    if (isSent) return;
    const id = Date.now();
    markSent(sentKey);
    setIsOpen(false);
    setCelebration(id);
    setTimeout(() => setCelebration((current) => (current === id ? 0 : current)), CELEBRATION_MS);

    try {
      const result = await motivateLive(recipientId);
      if (result.senderFame > 0) {
        dispatch(addFame(result.senderFame));
        setTimeout(() => {
          setReceipt(result.senderFame);
          setTimeout(() => setReceipt(null), RECEIPT_MS);
        }, Math.max(0, id + RECEIPT_AFTER_MS - Date.now()));
      }
    } catch (error) {
      unmarkSent(sentKey);
      setCelebration(0);
      const reason = error instanceof LiveMotivateFailure ? error.reason : "UNKNOWN";
      toast.error(
        reason === "NOT_PLAYING"
          ? t("live_motivate_not_playing", { name: recipientName })
          : reason === "DAILY_LIMIT"
            ? t("live_motivate_daily_limit")
            : reason === "SESSION_FULL"
              ? t("live_motivate_session_full", { name: recipientName })
              : t("live_motivate_error"),
      );
    }
  };

  const shown = isOpen ? "open" : "folded";

  return (
    <div
      ref={rootRef}
      className='group/live flex items-center'
      onPointerDownCapture={(event) => {
        pointerTypeRef.current = event.pointerType;
      }}
      onClickCapture={(event) => {
        // Touch has no hover: the first tap on the avatar opens the key instead of leaving the page.
        if (isSent || isOpen || pointerTypeRef.current === "mouse") return;
        if ((event.target as HTMLElement).closest("[data-live-key]")) return;
        event.preventDefault();
        event.stopPropagation();
        setIsOpen(true);
      }}>
      <div className='relative'>
        {children}
        {celebration !== 0 && (
          <>
            <span key={`flash-${celebration}`} aria-hidden className={styles.flash} />
            <CoinBurst key={`burst-${celebration}`} count={8} spread={120} />
            <span
              key={`pop-${celebration}`}
              aria-hidden
              className={cn(styles.pop, "flex items-center gap-1 font-teko text-4xl font-semibold leading-none text-amber-400")}>
              <img src='/images/tokens/coin.png' alt='' className='h-6 w-6 object-contain' />+{LIVE_MOTIVATE_FAME}
            </span>
          </>
        )}
        {receipt !== null && (
          <span
            className={cn(
              styles.receipt,
              "flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-black",
            )}>
            {t("live_motivate_receipt", { fame: receipt })}
            <img src='/images/tokens/coin.png' alt='' className='h-3.5 w-3.5 object-contain' />
          </span>
        )}
      </div>

      {!isSent && (
        <button
          type='button'
          data-live-key
          data-state={shown}
          onClick={handleMotivate}
          aria-label={t("live_motivate_aria", { name: recipientName, fame: LIVE_MOTIVATE_FAME })}
          className={cn(
            PRESSABLE,
            "flex h-9 max-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full border-b-zinc-950 bg-zinc-800 px-0 text-sm font-bold text-zinc-100 opacity-0 transition-[max-width,opacity,padding,margin] duration-base hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70",
            "group-hover/live:ml-1.5 group-hover/live:max-w-44 group-hover/live:px-3 group-hover/live:opacity-100",
            "focus-visible:ml-1.5 focus-visible:max-w-44 focus-visible:px-3 focus-visible:opacity-100",
            "data-[state=open]:ml-1.5 data-[state=open]:max-w-44 data-[state=open]:px-3 data-[state=open]:opacity-100",
          )}>
          <img src='/images/tokens/coin.png' alt='' className={cn("h-5 w-5 object-contain", styles.idleCoin)} />
          {t("live_motivate")}
          <span className='pt-[0.15em] font-teko text-xl font-semibold leading-none text-amber-400'>
            +{LIVE_MOTIVATE_FAME}
          </span>
        </button>
      )}
    </div>
  );
};

/** What a motivated avatar wears in place of its corner mark until that session ends. */
export const LiveMotivatedMark = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "flex h-[18px] w-[18px] items-center justify-center rounded-full bg-amber-400 text-zinc-950 ring-2 ring-zinc-950",
      styles.checkIn,
      className,
    )}>
    <svg viewBox='0 0 16 16' className='h-[11px] w-[11px]' aria-hidden>
      <path d='M3 8.5l3 3 7-7' stroke='currentColor' strokeWidth='2.8' fill='none' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  </span>
);
