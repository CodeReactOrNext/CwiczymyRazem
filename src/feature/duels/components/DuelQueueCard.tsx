import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { useCancelDuelTicket, useJoinDuel } from "feature/duels/hooks/useDuels";
import { duelErrorCode } from "feature/duels/services/duels.service";
import type {
  DuelJoinResult,
  DuelOverview,
} from "feature/duels/types/duel.types";
import { formatTimeLeft } from "feature/duels/utils/duelFormat";
import { DUEL_MAX_OPEN } from "feature/duels/utils/duelRules";
import { useTranslation } from "hooks/useTranslation";
import { Loader2, Mic, Swords, X } from "lucide-react";

interface DuelQueueCardProps {
  uid: string | null;
  overview: DuelOverview | undefined;
  now: number;
  onJoined: (result: DuelJoinResult) => void;
}

type SlotState = "active" | "waiting" | "free";

/**
 * The three slots as segments: a running duel lit, a ticket still searching
 * breathing, a free slot dark — the limit and what fills it, at a glance.
 */
const SlotSegments = ({ slots }: { slots: SlotState[] }) => (
  <span className='flex items-center gap-1.5' aria-hidden='true'>
    {slots.map((state, i) => (
      <span
        key={i}
        className={cn(
          "h-1.5 w-8 rounded-full",
          state === "active" && "bg-zinc-100",
          state === "waiting" && "animate-pulse bg-zinc-400",
          state === "free" && "bg-zinc-800",
        )}
      />
    ))}
  </span>
);

/** Three dots taking turns — "still looking", without a spinner's urgency. */
const SearchingDots = () => (
  <span className='flex items-center gap-1' aria-hidden='true'>
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className='size-1.5 animate-pulse rounded-full bg-zinc-300'
        style={{ animationDelay: `${i * 200}ms` }}
      />
    ))}
  </span>
);

/**
 * Where a duel starts: the button that pairs you (or queues you), the mic rule
 * said before you commit, and the tickets you have waiting.
 */
export const DuelQueueCard = ({
  uid,
  overview,
  now,
  onJoined,
}: DuelQueueCardProps) => {
  const { t } = useTranslation("duels");
  const join = useJoinDuel(uid);
  const cancel = useCancelDuelTicket(uid);

  const tickets = overview?.tickets ?? [];
  const activeCount = overview?.active.length ?? 0;
  const used = tickets.length + activeCount;
  const free = Math.max(0, DUEL_MAX_OPEN - used);
  const isFull = !!overview && free === 0;
  const waiting = overview?.waitingOthers ?? 0;
  const slots: SlotState[] = Array.from({ length: DUEL_MAX_OPEN }, (_, i) =>
    i < activeCount ? "active" : i < used ? "waiting" : "free",
  );

  const errorCode = join.isError ? duelErrorCode(join.error) : null;
  const errorText =
    errorCode === "LIMIT"
      ? t("queue.error_limit", { max: DUEL_MAX_OPEN })
      : errorCode === "LOCKED"
        ? t("queue.error_locked")
        : join.isError
          ? t("queue.error")
          : null;

  return (
    <Card className='p-5 sm:p-7'>
      <div className='flex flex-wrap items-center justify-between gap-x-8 gap-y-6'>
        <div className='min-w-0 flex-[1_1_18rem]'>
          <h2 className='text-xl font-semibold text-zinc-50'>
            {t("queue.title")}
          </h2>
          <p className='mt-2 max-w-lg text-sm leading-relaxed text-zinc-400'>
            {t("queue.subtitle")}
          </p>
          <div className='mt-5 flex flex-wrap items-center gap-x-6 gap-y-2'>
            <span className='flex items-center gap-3 text-sm text-zinc-300'>
              <SlotSegments slots={slots} />
              <span className='tabular-nums'>
                {t("queue.slots", { free, max: DUEL_MAX_OPEN })}
              </span>
            </span>
            {waiting > 0 && !isFull && (
              <span className='flex items-center gap-2 text-sm text-cyan-300'>
                <span className='relative flex size-2'>
                  <span className='absolute inline-flex size-full animate-ping rounded-full bg-cyan-400 opacity-60' />
                  <span className='relative inline-flex size-2 rounded-full bg-cyan-400' />
                </span>
                {t("queue.waiting", { count: waiting })}
              </span>
            )}
          </div>
        </div>

        <button
          type='button'
          onClick={() => join.mutate(undefined, { onSuccess: onJoined })}
          disabled={!overview || isFull || join.isPending}
          className='inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-lg bg-white px-7 text-base font-semibold text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:pointer-events-none disabled:opacity-50 hover:bg-zinc-200 sm:w-auto'>
          {join.isPending ? (
            <Loader2 size={18} className='animate-spin' />
          ) : (
            <Swords size={18} />
          )}
          {join.isPending
            ? t("queue.joining")
            : isFull
              ? t("queue.full")
              : t("queue.join")}
        </button>
      </div>

      {/* Said before the click, not after: a run without the mic is no run. */}
      <p className='mt-6 flex items-start gap-3 rounded-lg bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100'>
        <Mic size={16} className='mt-0.5 shrink-0 text-cyan-400' />
        {t("queue.mic")}
      </p>

      {errorText && (
        <p role='alert' className='mt-4 text-sm text-orange-300'>
          {errorText}
        </p>
      )}

      {tickets.length > 0 && (
        <ul className='mt-5 space-y-1'>
          {tickets.map((ticket) => (
            <li
              key={ticket.id}
              className='-mx-3 flex items-center gap-3 rounded-lg px-3 py-2.5'>
              <SearchingDots />
              <span className='min-w-0 flex-1 truncate text-sm text-zinc-200'>
                {t("queue.ticket")}
              </span>
              <span className='shrink-0 text-xs tabular-nums text-zinc-400'>
                {t("queue.ticket_expires", {
                  time: formatTimeLeft(ticket.expiresAt - now),
                })}
              </span>
              <button
                type='button'
                aria-label={t("queue.cancel")}
                title={t("queue.cancel")}
                disabled={cancel.isPending}
                onClick={() => cancel.mutate(ticket.id)}
                className='flex size-8 shrink-0 items-center justify-center rounded text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 disabled:opacity-50 hover:bg-zinc-800 hover:text-zinc-100'>
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
