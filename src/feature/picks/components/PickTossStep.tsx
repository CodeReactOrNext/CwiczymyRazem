import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { CoinBurst } from "feature/liveMotivate/components/CoinBurst";
import { PickIcon } from "feature/picks/components/PickIcon";
import { PICK_TARGETS_SHOWN, type PickTarget } from "feature/picks/picks.rules";
import {
  PickThrowFailure,
  throwPick,
} from "feature/picks/services/picks.service";
import { addFame } from "feature/user/store/userSlice";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { popIn } from "lib/motion/motion";
import { playUiSound } from "lib/uiSounds/uiSounds";
import { Check, RefreshCw } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

// ─────────────────────────────────────────────────────────────────────────────
// Post-session "Toss a pick": a few players who practiced in the last day, the
// least motivated first, and a pocket of picks. A tap sends one flying in an arc
// from the pocket to the player's avatar; it lands with a squash, a fan of coins
// and the Fame they got. The server decides everything that is paid — the
// animation runs ahead of the answer and steps back if the pick did not land.
// ─────────────────────────────────────────────────────────────────────────────

type CardState = "caught" | "already";

interface Flight {
  id: number;
  logId: string;
  /** Start, relative to the step's box. */
  x: number;
  y: number;
  dx: number;
  dy: number;
}

/** A copy of the record without `key`. */
const without = <T,>(
  record: Record<string, T>,
  key: string,
): Record<string, T> => {
  const next = { ...record };
  delete next[key];
  return next;
};

const FLIGHT_S = 0.62;
/** How long the landing (coins, "+Fame") stays up. */
const IMPACT_MS = 1400;

interface TargetCardProps {
  target: PickTarget;
  state?: CardState;
  flying: boolean;
  impactAt?: number;
  canToss: boolean;
  onToss: () => void;
  avatarRef: (el: HTMLDivElement | null) => void;
}

const TargetCard = ({
  target,
  state,
  flying,
  impactAt,
  canToss,
  onToss,
  avatarRef,
}: TargetCardProps) => {
  const { t } = useTranslation("session_summary");
  const caught = state === "caught";
  const what = [t("picks.minutes", { minutes: target.minutes }), target.title]
    .filter(Boolean)
    .join(" · ");

  return (
    <motion.li
      variants={{
        hidden: { opacity: 0, y: 16, scale: 0.97 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { type: "spring", stiffness: 380, damping: 28 },
        },
      }}
      className={cn(
        "relative flex items-center gap-4 rounded-lg p-4 transition-colors duration-slow sm:px-5",
        caught ? "bg-emerald-500/15" : "bg-zinc-800/40",
      )}>
      <motion.div
        ref={avatarRef}
        className='relative shrink-0'
        animate={
          impactAt
            ? { scale: [1, 1.3, 0.88, 1.08, 1], rotate: [0, -10, 7, -3, 0] }
            : { scale: 1, rotate: 0 }
        }
        transition={{ duration: 0.6, ease: "easeOut" }}>
        <Avatar
          name={target.userName}
          avatarURL={target.avatarUrl ?? undefined}
          size='md'
        />
        {impactAt && <CoinBurst count={7} spread={90} />}
        <AnimatePresence>
          {impactAt && (
            <motion.span
              key={impactAt}
              style={{ x: "-50%" }}
              className='pointer-events-none absolute left-1/2 top-0 z-40 whitespace-nowrap font-display text-xl font-extrabold tabular-nums text-amber-400'
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: -44,
                scale: [0.5, 1.15, 1, 1],
              }}
              transition={{
                duration: 1.2,
                times: [0, 0.2, 0.75, 1],
                ease: "easeOut",
              }}>
              +{target.fame}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      <div className='min-w-0 flex-1'>
        <p className='truncate font-semibold text-zinc-100'>
          {target.userName}
        </p>
        <p className='truncate text-sm text-zinc-400'>{what}</p>
        <p
          className={cn(
            "mt-0.5 text-xs",
            caught ? "text-emerald-400" : "text-zinc-500",
          )}>
          {caught
            ? t("picks.caught_fame", { fame: target.fame })
            : state === "already"
              ? t("picks.already")
              : target.motivations === 0
                ? t("picks.no_motivations")
                : t("picks.motivations", { count: target.motivations })}
        </p>
      </div>

      <AnimatePresence mode='wait' initial={false}>
        {caught ? (
          <motion.span
            key='caught'
            className='flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-emerald-500/15 px-4 text-sm font-semibold text-emerald-400'
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 520, damping: 20 }}>
            <Check className='h-4 w-4' aria-hidden />
            {t("picks.caught")}
          </motion.span>
        ) : state === "already" ? null : (
          <motion.span
            key='toss'
            exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.12 } }}>
            <Button
              size='lg'
              className='shrink-0 px-5'
              disabled={!canToss || flying}
              onClick={onToss}>
              <PickIcon className='!size-5' />
              {t("picks.toss")}
            </Button>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.li>
  );
};

interface PickTossStepProps {
  targets: PickTarget[];
  picksLeft: number;
  perDay: number;
}

export const PickTossStep = ({
  targets,
  picksLeft,
  perDay,
}: PickTossStepProps) => {
  const { t } = useTranslation("session_summary");
  const dispatch = useAppDispatch();
  const reduceMotion = useReducedMotion();

  const [left, setLeft] = useState(picksLeft);
  const [page, setPage] = useState(0);
  const [cards, setCards] = useState<Record<string, CardState>>({});
  const [inFlight, setInFlight] = useState<Record<string, true>>({});
  const [flights, setFlights] = useState<Flight[]>([]);
  const [impacts, setImpacts] = useState<Record<string, number>>({});

  // Ids for flights and landings, so a late timer never clears a newer one.
  const seq = useRef(0);
  const nextId = () => {
    seq.current += 1;
    return seq.current;
  };

  const boxRef = useRef<HTMLDivElement>(null);
  const pocketRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const avatarRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const pageCount = Math.ceil(targets.length / PICK_TARGETS_SHOWN);
  const shown = targets.slice(
    page * PICK_TARGETS_SHOWN,
    (page + 1) * PICK_TARGETS_SHOWN,
  );
  const caughtCount = Object.values(cards).filter(
    (state) => state === "caught",
  ).length;
  const pageDone = shown.every((target) => cards[target.logId]);

  const land = (logId: string) => {
    setInFlight((current) => without(current, logId));
    setCards((current) =>
      current[logId] ? current : { ...current, [logId]: "caught" },
    );
    const at = nextId();
    setImpacts((current) => ({ ...current, [logId]: at }));
    setTimeout(
      () =>
        setImpacts((current) =>
          current[logId] === at ? without(current, logId) : current,
        ),
      IMPACT_MS,
    );
    playUiSound("pick");
  };

  /** Undo a pick the server refused: the card opens again and the pick goes back in the pocket. */
  const giveBack = (logId: string) => {
    setInFlight((current) => without(current, logId));
    setFlights((current) => current.filter((flight) => flight.logId !== logId));
    setCards((current) => without(current, logId));
    setImpacts((current) => without(current, logId));
    setLeft((n) => n + 1);
  };

  const toss = (target: PickTarget) => {
    if (left <= 0 || cards[target.logId] || inFlight[target.logId]) return;

    const box = boxRef.current?.getBoundingClientRect();
    const from = pocketRefs.current[left - 1]?.getBoundingClientRect();
    const to = avatarRefs.current[target.logId]?.getBoundingClientRect();

    setLeft((n) => n - 1);
    setInFlight((current) => ({ ...current, [target.logId]: true }));

    if (reduceMotion || !box || !from || !to) {
      land(target.logId);
    } else {
      const x = from.left - box.left + from.width / 2;
      const y = from.top - box.top + from.height / 2;
      setFlights((current) => [
        ...current,
        {
          id: nextId(),
          logId: target.logId,
          x,
          y,
          dx: to.left - box.left + to.width / 2 - x,
          dy: to.top - box.top + to.height / 2 - y,
        },
      ]);
    }

    void throwPick(target.logId)
      .then((result) => {
        if (result.alreadyMotivated) {
          // Motivated already (from the feed, or another device): nothing paid, the pick comes back.
          setCards((current) => ({ ...current, [target.logId]: "already" }));
          setLeft((n) => n + 1);
          return;
        }
        if (result.throwerFame > 0) dispatch(addFame(result.throwerFame));
      })
      .catch((error: unknown) => {
        const reason =
          error instanceof PickThrowFailure ? error.reason : "UNKNOWN";
        giveBack(target.logId);
        if (reason === "DAILY_LIMIT") {
          setLeft(0);
          toast.error(t("picks.daily_limit"));
        } else {
          toast.error(t("picks.error"));
        }
      });
  };

  return (
    <div
      ref={boxRef}
      className='relative flex w-full max-w-2xl flex-col items-center gap-8 shortwide:gap-4'>
      <div className='flex flex-col items-center gap-3 text-center'>
        <h2 className='font-display text-2xl font-extrabold tracking-tight text-zinc-50 shortwide:text-xl sm:text-3xl'>
          {t("picks.title")}
        </h2>
        <p className='max-w-md text-sm leading-relaxed text-zinc-400'>
          {t("picks.subtitle")}
        </p>
      </div>

      {/* The pocket: today's picks, the spent ones as dashed outlines. */}
      <div
        className='flex flex-col items-center gap-3'
        aria-label={t("picks.pocket_aria", { count: left })}>
        <div className='flex items-end gap-2.5'>
          {Array.from({ length: perDay }, (_, i) => {
            const full = i < left;
            return (
              <motion.span
                key={i}
                ref={(el) => {
                  pocketRefs.current[i] = el;
                }}
                className='inline-flex'
                initial={
                  reduceMotion ? false : { scale: 0, rotate: -40, y: 12 }
                }
                animate={{
                  scale: full ? 1 : 0.82,
                  rotate: full ? -10 + i * 5 : 0,
                  y: 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 520,
                  damping: 18,
                  delay: reduceMotion ? 0 : 0.15 + i * 0.07,
                }}>
                <PickIcon
                  spent={!full}
                  className='h-9 w-9 shortwide:h-7 shortwide:w-7'
                />
              </motion.span>
            );
          })}
        </div>
        <span className='text-sm font-semibold tabular-nums text-amber-400'>
          {left > 0 ? t("picks.left", { count: left }) : t("picks.out")}
        </span>
      </div>

      <motion.ul
        key={page}
        className='flex w-full flex-col gap-3'
        initial='hidden'
        animate='visible'
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.08, delayChildren: 0.2 },
          },
        }}>
        {shown.map((target) => (
          <TargetCard
            key={target.logId}
            target={target}
            state={cards[target.logId]}
            flying={!!inFlight[target.logId]}
            impactAt={impacts[target.logId]}
            canToss={left > 0}
            onToss={() => toss(target)}
            avatarRef={(el) => {
              avatarRefs.current[target.logId] = el;
            }}
          />
        ))}
      </motion.ul>

      <AnimatePresence>
        {caughtCount > 0 && left === 0 && (
          <motion.p
            variants={popIn}
            initial='hidden'
            animate='visible'
            exit='hidden'
            className='text-center text-sm font-medium text-zinc-300'>
            {t("picks.all_out", { count: caughtCount })}
          </motion.p>
        )}
      </AnimatePresence>

      {pageCount > 1 && (
        <Button
          variant={pageDone && left > 0 ? "default" : "ghost"}
          onClick={() => setPage((p) => (p + 1) % pageCount)}>
          <RefreshCw aria-hidden />
          {t("picks.more")}
        </Button>
      )}

      {/* Picks in the air, above everything in the step. */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 z-30 overflow-visible'>
        {flights.map((flight) => {
          const lift = Math.min(160, 70 + Math.abs(flight.dx) * 0.3);
          return (
            <motion.span
              key={flight.id}
              className='absolute -ml-5 -mt-5 inline-flex'
              style={{ left: flight.x, top: flight.y }}
              initial={{ x: 0, y: 0, rotate: -10, scale: 1 }}
              animate={{
                x: [0, flight.dx * 0.5, flight.dx],
                y: [0, Math.min(0, flight.dy) - lift, flight.dy],
                rotate: [-10, 320, 700],
                scale: [1, 1.45, 0.7],
              }}
              transition={{
                duration: FLIGHT_S,
                times: [0, 0.45, 1],
                ease: [
                  [0.2, 0.8, 0.4, 1],
                  [0.55, 0, 0.85, 0.5],
                ],
              }}
              onAnimationComplete={() => {
                setFlights((current) =>
                  current.filter((f) => f.id !== flight.id),
                );
                land(flight.logId);
              }}>
              <PickIcon className='h-10 w-10' />
            </motion.span>
          );
        })}
      </div>
    </div>
  );
};
