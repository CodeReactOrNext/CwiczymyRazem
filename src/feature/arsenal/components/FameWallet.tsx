"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

interface Delta {
  id: number;
  amount: number;
}

/**
 * Every change to a number, as its own short-lived entry — a sale, a purchase,
 * the bench fee. Kept as state rather than read off a ref so the floaters are
 * plain render output; the comparison against the previous value is the
 * "adjust state while rendering" pattern, not an effect.
 *
 * Nothing counts as a delta for the first moments on screen, `undefined` while
 * the profile loads included: the profile boots from a snapshot and the fresh
 * balance lands a beat later, and the wallet catching up must not read as a
 * windfall.
 */
const ARM_AFTER_MS = 1500;

const useDeltas = (value: number | undefined) => {
  const [prev, setPrev] = useState(value);
  const [deltas, setDeltas] = useState<Delta[]>([]);
  const [seq, setSeq] = useState(0);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setArmed(true), ARM_AFTER_MS);
    return () => clearTimeout(id);
  }, []);

  if (value !== prev) {
    setPrev(value);
    if (armed && prev !== undefined && value !== undefined) {
      // A burst of changes keeps only the last few on screen.
      setDeltas((d) => [...d.slice(-2), { id: seq, amount: value - prev }]);
      setSeq(seq + 1);
    }
  }

  const dismiss = (id: number) =>
    setDeltas((d) => d.filter((delta) => delta.id !== id));

  return { deltas, dismiss };
};

const noopSubscribe = () => () => {};

/** False on the server and through hydration, true after — a portal-safe gate. */
const useIsClient = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

/** A balance that rolls to its new value instead of snapping to it. */
const RollingFame = ({ value }: { value: number }) => {
  const raw = useMotionValue(value);
  const spring = useSpring(raw, { stiffness: 90, damping: 18 });
  const text = useTransform(spring, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    raw.set(value);
  }, [raw, value]);

  return <motion.span className='tabular-nums'>{text}</motion.span>;
};

const format = (amount: number) =>
  `${amount > 0 ? "+" : "−"}${Math.abs(amount).toLocaleString()}`;

/** Coins thrown in from below on a gain — where they land is the balance. */
const COIN_LANES = [-34, -17, 0, 17, 34];

const Floaters = ({
  deltas,
  dismiss,
}: {
  deltas: Delta[];
  dismiss: (id: number) => void;
}) => (
  <span
    aria-hidden
    className='pointer-events-none absolute inset-x-0 top-1/2 flex justify-center'>
    <AnimatePresence>
      {deltas.map((delta) => {
        const gain = delta.amount > 0;
        return (
          <motion.span
            key={delta.id}
            className={
              gain
                ? "absolute whitespace-nowrap text-sm font-black tabular-nums text-amber-300"
                : "absolute whitespace-nowrap text-sm font-black tabular-nums text-zinc-400"
            }
            initial={{ opacity: 0, y: gain ? 0 : -6, scale: 0.7 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: gain ? -34 : 26,
              scale: [0.7, 1.15, 1, 1],
            }}
            transition={{
              duration: 1.5,
              times: [0, 0.15, 0.7, 1],
              ease: "easeOut",
            }}
            onAnimationComplete={() => dismiss(delta.id)}>
            {format(delta.amount)}
          </motion.span>
        );
      })}
    </AnimatePresence>

    {deltas
      .filter((delta) => delta.amount > 0)
      .map((delta) =>
        COIN_LANES.map((lane, i) => (
          <motion.img
            key={`${delta.id}-${i}`}
            src='/images/coin.png'
            alt=''
            className='absolute h-3.5 w-3.5 object-contain'
            initial={{ opacity: 0, x: lane * 1.6, y: 46 + (i % 2) * 10 }}
            animate={{ opacity: [0, 1, 1, 0], x: 0, y: -4 }}
            transition={{ delay: i * 0.05, duration: 0.55, ease: "easeIn" }}
          />
        )),
      )}
  </span>
);

interface FameWalletProps {
  /** `undefined` while the profile loads — no delta is drawn for that. */
  fame: number | undefined;
}

/**
 * The arsenal's Fame balance, which every tab spends.
 *
 * It used to swap one number for another, so a sale or a purchase registered
 * only if the player happened to be looking at the banner and remembered the
 * old figure. Now every change shows as what it was — the coin turns, the
 * balance rolls, and the amount floats off it: up and gold for money in, down
 * and grey for money out. A gain also draws coins into the wallet.
 *
 * The banner is at the top of a long page, so when it is scrolled away the same
 * change shows on a small pill pinned to the corner of the screen instead.
 */
export const FameWallet = ({ fame }: FameWalletProps) => {
  const { t } = useTranslation("arsenal");
  const value = fame ?? 0;
  const { deltas, dismiss } = useDeltas(fame);
  const last = deltas[deltas.length - 1];

  const isClient = useIsClient();
  const ref = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) =>
      setOnScreen(entry.isIntersecting),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const coin = (
    <motion.img
      key={last?.id ?? "coin"}
      src='/images/coin.png'
      alt=''
      aria-hidden
      className='h-4 w-4 object-contain'
      initial={last ? { rotateY: 0, scale: 1.4 } : false}
      animate={{ rotateY: 360, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    />
  );

  return (
    <>
      <div
        ref={ref}
        className='relative flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5'>
        {coin}
        <span className='text-sm font-black text-amber-400'>
          <RollingFame value={value} />
        </span>
        <span className='text-[11px] text-zinc-400'>{t("common.fame")}</span>
        {onScreen && <Floaters deltas={deltas} dismiss={dismiss} />}
      </div>

      {isClient &&
        createPortal(
          <AnimatePresence>
            {!onScreen && deltas.length > 0 && (
              <motion.div
                key='fame-pill'
                className='pointer-events-none fixed right-4 top-20 z-[1050] flex items-center gap-1.5 rounded-lg bg-zinc-900/95 px-3 py-2'
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}>
                {coin}
                <span className='text-sm font-black text-amber-400'>
                  <RollingFame value={value} />
                </span>
                <Floaters deltas={deltas} dismiss={dismiss} />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
};
