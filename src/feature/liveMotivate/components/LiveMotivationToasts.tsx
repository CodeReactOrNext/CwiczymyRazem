import { cn } from "assets/lib/utils";
import { QUARTER_TURN_STYLE } from "feature/exercisePlan/views/PracticeSession/components/tablatureDirection";
import { CoinBurst } from "feature/liveMotivate/components/CoinBurst";
import styles from "feature/liveMotivate/components/LiveMotivate.module.css";
import type { ReceivedLiveMotivation } from "feature/liveMotivate/store/useLiveMotivateStore";
import { useLiveMotivateStore } from "feature/liveMotivate/store/useLiveMotivateStore";
import { addFame, selectUserAuth } from "feature/user/store/userSlice";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useTranslation } from "hooks/useTranslation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { db } from "utils/firebase/client/firebase.utils";

/** How long a bubble stays up; a Hype a little longer. */
const BUBBLE_MS = 4000;
const HYPE_BUBBLE_MS = 5000;
/** Bubbles on screen at once — older ones give way. */
const MAX_BUBBLES = 2;
/** A notification written just before the session mounted still belongs to it (clock skew). */
const MOUNT_SLACK_MS = 5000;

interface Bubble {
  id: string;
  items: ReceivedLiveMotivation[];
  fame: number;
  hype: boolean;
  hypeCount: number;
  leaving: boolean;
}

interface LiveMotivationToastsProps {
  /** Phone layout: the bubble drops in under the top bar instead of rising over the bottom bar. */
  compact: boolean;
  /** The phone's practice screen is laid on its side, so the bubble turns with it. */
  turned: boolean;
  /** Exam, boss, duel or a hunt round: bubbles wait until this goes false. */
  hold: boolean;
}

const SenderAvatar = ({ item, ringClass }: { item: ReceivedLiveMotivation; ringClass: string }) =>
  item.senderAvatarUrl ? (
    <img
      src={item.senderAvatarUrl}
      alt=''
      className={cn("h-8 w-8 shrink-0 rounded-full object-cover ring-2", ringClass)}
    />
  ) : (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-700 ring-2",
        ringClass,
      )}>
      {item.senderName[0]?.toUpperCase() ?? "?"}
    </span>
  );

/** The amount, counting up from zero as the coin spins into place. */
const CountUp = ({ to }: { to: number }) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / 650);
      setValue(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) frame = requestAnimationFrame(step);
    };
    const delay = setTimeout(() => {
      frame = requestAnimationFrame(step);
    }, 250);
    return () => {
      clearTimeout(delay);
      cancelAnimationFrame(frame);
    };
  }, [to]);
  return <>{value}</>;
};

/**
 * Live motivations arriving during a practice session: a white bubble with who sent it and the
 * Fame it brought, counting up as a coin spins in. Three close together make a gold Hype bubble.
 * Silent on purpose — a sound would reach the microphone. Listens to the player's own
 * notifications (the same query the bell runs), so nothing new is stored for it.
 */
export const LiveMotivationToasts = ({ compact, turned, hold }: LiveMotivationToastsProps) => {
  const { t } = useTranslation("feed");
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectUserAuth);
  const addReceived = useLiveMotivateStore((state) => state.addReceived);
  const resetReceived = useLiveMotivateStore((state) => state.resetReceived);

  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const queueRef = useRef<ReceivedLiveMotivation[]>([]);
  const holdRef = useRef(hold);
  const seenRef = useRef(new Set<string>());
  const [mountedAt] = useState(() => Date.now());

  // A new session starts with an empty list for its summary.
  useEffect(() => {
    resetReceived();
  }, [resetReceived]);

  const show = useCallback((items: ReceivedLiveMotivation[]) => {
    if (!items.length) return;
    const hypeItem = items.find((item) => item.hype);
    const bubble: Bubble = {
      id: items.map((item) => item.id).join("-"),
      items,
      fame: items.reduce((sum, item) => sum + item.fame, 0),
      hype: !!hypeItem,
      hypeCount: hypeItem ? Math.max(hypeItem.hypeCount, items.length) : items.length,
      leaving: false,
    };
    setBubbles((current) => [...current, bubble].slice(-MAX_BUBBLES));
    const stay = bubble.hype ? HYPE_BUBBLE_MS : BUBBLE_MS;
    setTimeout(() => {
      setBubbles((current) => current.map((b) => (b.id === bubble.id ? { ...b, leaving: true } : b)));
    }, stay);
    setTimeout(() => {
      setBubbles((current) => current.filter((b) => b.id !== bubble.id));
    }, stay + 320);
  }, []);

  // Whatever waited out an exam or a round shows as soon as it is over.
  useEffect(() => {
    holdRef.current = hold;
    if (!hold && queueRef.current.length) {
      const waiting = queueRef.current;
      queueRef.current = [];
      show(waiting);
    }
  }, [hold, show]);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(10),
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const fresh: ReceivedLiveMotivation[] = [];
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.type !== "live_motivate" || seenRef.current.has(doc.id)) return;
          // Server timestamps are null until the write is confirmed; a live one is always confirmed.
          const at = data.timestamp?.toMillis?.() as number | undefined;
          if (!at || at < mountedAt - MOUNT_SLACK_MS) return;
          seenRef.current.add(doc.id);
          fresh.push({
            id: doc.id,
            senderName: data.senderName || "Someone",
            senderAvatarUrl: data.senderAvatarUrl ?? null,
            fame: data.fameAwarded ?? 0,
            hype: !!data.hype,
            hypeCount: data.hypeCount ?? 0,
          });
        });
        if (!fresh.length) return;
        // Oldest first, the order they were sent in.
        fresh.reverse();
        fresh.forEach((item) => addReceived(item));
        dispatch(addFame(fresh.reduce((sum, item) => sum + item.fame, 0)));
        if (holdRef.current) {
          queueRef.current = [...queueRef.current, ...fresh];
        } else {
          show(fresh);
        }
      },
      (error) => console.warn("Live motivations listener failed:", error),
    );
  }, [userId, addReceived, dispatch, show, mountedAt]);

  // Bubbles only ever appear after a snapshot, so the portal never runs on the server.
  if (bubbles.length === 0) return null;

  const stack = (
    <div
      aria-live='polite'
      className={cn(
        "pointer-events-none absolute flex gap-2.5",
        compact
          ? "inset-x-3 top-[calc(env(safe-area-inset-top,0px)+4rem)] flex-col items-center"
          : "bottom-28 right-6 flex-col-reverse items-end",
      )}>
      {bubbles.map((bubble) => {
        const first = bubble.items[0];
        const ring = bubble.hype ? "ring-amber-400" : "ring-white";
        return (
          <div
            key={bubble.id}
            className={cn(
              "relative flex max-w-full items-center gap-3 rounded-2xl border-b-[4px] py-2.5 pl-2.5 pr-3 text-black",
              bubble.hype ? "border-b-amber-700 bg-amber-400" : "border-b-zinc-300 bg-white",
              bubble.leaving ? styles.bubbleOut : compact ? styles.bubbleDrop : styles.bubbleIn,
            )}>
            {bubble.items.length > 1 || bubble.hype ? (
              <span className='flex shrink-0'>
                {bubble.items.slice(0, 3).map((item, i) => (
                  <span key={item.id} className={cn(i > 0 && "-ml-2")}>
                    <SenderAvatar item={item} ringClass={ring} />
                  </span>
                ))}
              </span>
            ) : (
              <SenderAvatar item={first} ringClass={ring} />
            )}
            <span className='min-w-0'>
              <span className='block truncate text-xs font-semibold text-black/60'>
                {bubble.items.length > 1
                  ? t("live_motivated_many", { name: first.senderName, count: bubble.items.length - 1 })
                  : t("live_motivated_you", { name: first.senderName })}
              </span>
              <span className='block text-[15px] font-extrabold leading-tight'>
                {bubble.hype ? t("live_hype", { count: bubble.hypeCount }) : t("live_keep_playing")}
              </span>
            </span>
            <span
              className={cn(
                "relative flex shrink-0 items-center gap-1 rounded-xl px-2 pb-0.5 pt-1.5 font-teko text-3xl font-semibold leading-[0.8] tabular-nums text-amber-600",
                bubble.hype ? "bg-white" : "bg-amber-100",
              )}>
              <img
                src='/images/tokens/coin.png'
                alt=''
                className={cn("-mt-1 h-6 w-6 object-contain [perspective:200px]", styles.spinIn)}
              />
              +<CountUp to={bubble.fame} />
              <CoinBurst count={bubble.hype ? 9 : 5} spread={bubble.hype ? 160 : 100} />
            </span>
          </div>
        );
      })}
    </div>
  );

  return createPortal(
    <div className='pointer-events-none fixed inset-0 z-[1000000000] overflow-hidden'>
      {turned ? (
        <div
          className='absolute left-0 top-0'
          style={{ ...QUARTER_TURN_STYLE, width: "100dvh", height: "100dvw" }}>
          {stack}
        </div>
      ) : (
        stack
      )}
    </div>,
    document.body,
  );
};
