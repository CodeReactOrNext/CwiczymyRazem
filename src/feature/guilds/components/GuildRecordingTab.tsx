import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { FameCoin } from "feature/arsenal/components/Workshop/FameCoin";
import type {
  RecordingContract,
  RecordingMood,
  RecordingRating,
} from "feature/guilds/data/guildRecording";
import {
  getRecordingContract,
  getRecordingTier,
  RECORDING_CONTRACTS,
  RECORDING_FULL_SHARE_TAKES,
  RECORDING_GOLD,
  RECORDING_KEEP_ACCURACY,
  RECORDING_MAX_TIER,
  RECORDING_MIN_TAKES_FOR_PAY,
  RECORDING_PLATINUM,
  RECORDING_TAPE_CAP,
  recordingCoverSrc,
} from "feature/guilds/data/guildRecording";
import { STUDIO_ITEMS } from "feature/guilds/data/guildStudio";
import { useStudioText } from "feature/guilds/hooks/useStudioText";
import type { LastTake } from "feature/guilds/services/guildRecording.service";
import type {
  PartStanding,
  RecordingPerkKind,
  RecordingPerks,
  RecordingSessionView,
  RecordingTierView,
  RecordingView,
} from "feature/guilds/utils/guildRecording.utils";
import {
  isReleased,
  recordingPerkOf,
} from "feature/guilds/utils/guildRecording.utils";
import { m } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { fadeUp } from "lib/motion/motion";
import { Check, Lock, Mic, Repeat } from "lucide-react";
import { useState } from "react";

/**
 * The guild's Recording tab. With no session open it is a select screen: a
 * strip of the six tiers and the picked one on its stage — where the session
 * would be cut, how hard it is, what it pays and the one key that books it.
 * The guild picks how serious the session is; the client is drawn when it
 * books. With one open it is that session, on a stage of its own: the
 * record in the room it is being made in, how many takes it still is from
 * being one, how the client takes what they hear, every part's tape, the
 * last takes and who played them, and what the room adds. It only draws and calls back;
 * whoever hosts it owns the data and the writes.
 */

type T = ReturnType<typeof useTranslation>["t"];

const Fame = ({ amount }: { amount: number }) => (
  <span className='inline-flex items-center gap-1.5 tabular-nums'>
    <FameCoin size={16} />
    {amount.toLocaleString()}
  </span>
);

const RATING_TONE: Record<RecordingRating, string> = {
  shelved: "text-zinc-400",
  demo: "text-zinc-300",
  record: "text-emerald-400",
  gold: "text-amber-400",
  platinum: "text-zinc-100",
};

const ratingName = (t: T, rating: RecordingRating) =>
  t(`recording.ratings.${rating}`);

const tierName = (t: T, tier: number) =>
  t(`recording.tiers.t${tier}`, getRecordingTier(tier).name);

const partName = (t: T, contract: RecordingContract, partId: string) => {
  const part = contract.parts.find((entry) => entry.id === partId);
  return part ? t(`recording.parts.${part.role}`, part.name) : partId;
};

const Cover = ({
  contract,
  className,
}: {
  contract: RecordingContract;
  className?: string;
}) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src={recordingCoverSrc(contract.id)}
    alt=''
    loading='lazy'
    className={cn("aspect-square rounded-lg object-cover", className)}
  />
);

// ── Banners ─────────────────────────────────────────────────────────────────

const TakeVerdict = ({
  take,
  contract,
}: {
  take: LastTake;
  contract: RecordingContract | undefined;
}) => {
  const { t } = useTranslation("guilds");
  const accuracy = Math.round(take.accuracy);
  const text = take.kept
    ? t("recording.take.kept", {
        part: contract ? partName(t, contract, take.partId) : take.partId,
        accuracy,
        bpm: Math.round(take.bpm),
        points: take.points,
      })
    : take.reason === "scrapped"
      ? t("recording.take.scrapped", { accuracy, min: RECORDING_KEEP_ACCURACY })
      : take.reason === "no-takes"
        ? t("recording.take.no_takes")
        : t("recording.take.over");
  return (
    <p
      role='status'
      className={cn(
        "rounded-lg px-5 py-4 text-sm",
        take.kept
          ? "bg-emerald-500/10 text-emerald-300"
          : "bg-zinc-900/40 text-zinc-300",
      )}>
      {text}
    </p>
  );
};

const PayBanner = ({
  fame,
  busy,
  onClaim,
}: {
  fame: number;
  busy: boolean;
  onClaim: () => void;
}) => {
  const { t } = useTranslation("guilds");
  return (
    <section className='flex flex-wrap items-center justify-between gap-4 rounded-lg bg-amber-500/10 px-5 py-4'>
      <p className='text-sm text-amber-200'>
        {t("recording.pay_waiting", { fame: fame.toLocaleString() })}
      </p>
      <Button variant='secondary' disabled={busy} onClick={onClaim}>
        {t("recording.collect")} · <Fame amount={fame} />
      </Button>
    </section>
  );
};

const LastSession = ({
  last,
}: {
  last: NonNullable<RecordingView["last"]>;
}) => {
  const { t } = useTranslation("guilds");
  const contract = getRecordingContract(last.contractId);
  if (!contract) return null;
  return (
    <section className='flex items-center gap-4 rounded-lg bg-zinc-900/40 p-4 sm:p-5'>
      <Cover contract={contract} className='h-16 w-16 shrink-0' />
      <div className='min-w-0 space-y-1'>
        <p className='text-sm text-zinc-400'>
          {t("recording.last_title")} · {tierName(t, last.tier)}
        </p>
        <p className='font-medium text-zinc-100'>
          {contract.track}{" "}
          <span className={RATING_TONE[last.rating]}>
            · {ratingName(t, last.rating)}
          </span>
        </p>
        <p className='text-sm text-zinc-400'>
          {last.bank > 0
            ? t("recording.last_bank", { fame: last.bank.toLocaleString() })
            : t("recording.last_none")}
        </p>
      </div>
    </section>
  );
};

// ── The room's share ────────────────────────────────────────────────────────

const PERK_ORDER: RecordingPerkKind[] = [
  "takes",
  "sound",
  "tape",
  "desk",
  "walls",
  "bench",
];

const perkValue = (kind: RecordingPerkKind, perks: RecordingPerks): string => {
  if (kind === "takes") return String(perks.takesPerDay);
  const value = perks[kind];
  const sign = kind === "tape" || kind === "bench" ? "−" : "+";
  return `${sign}${value}%`;
};

const RoomShare = ({
  perks,
  onOpenStudio,
}: {
  perks: RecordingPerks;
  onOpenStudio: () => void;
}) => {
  const { t } = useTranslation("guilds");
  const studioText = useStudioText();
  return (
    <section className='space-y-5 rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='max-w-xl space-y-1'>
          <h3 className='font-display text-lg font-bold text-zinc-100'>
            {t("recording.room_title")}
          </h3>
          <p className='text-sm text-zinc-400'>{t("recording.room_hint")}</p>
        </div>
        <Button variant='secondary' onClick={onOpenStudio}>
          {t("recording.room_link")}
        </Button>
      </div>
      <dl className='grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3'>
        {PERK_ORDER.map((kind) => {
          const gear = STUDIO_ITEMS.filter(
            (item) => recordingPerkOf(item.id) === kind,
          );
          const idle =
            kind === "takes" ? perks.takesPerDay <= 2 : perks[kind] === 0;
          return (
            <div key={kind} className='space-y-1'>
              <dt className='text-sm text-zinc-400'>
                {t(`recording.perks.${kind}`)}
              </dt>
              <dd
                className={cn(
                  "font-display text-2xl font-bold tabular-nums",
                  idle ? "text-zinc-500" : "text-zinc-100",
                )}>
                {perkValue(kind, perks)}
              </dd>
              <dd className='flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500'>
                {gear.map((item) => (
                  <span
                    key={item.id}
                    className='inline-flex items-center gap-1'>
                    <item.icon size={12} aria-hidden />
                    {studioText.itemName(item.id)}
                  </span>
                ))}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
};

// ── Tier select ─────────────────────────────────────────────────────────────

const tierArtSrc = (tier: number): string =>
  `/images/guild-recording/tier-${tier}.webp`;

/** One big number of the stage and what it counts. */
const Stat = ({
  value,
  label,
  className,
}: {
  value: string | number;
  label: string;
  className?: string;
}) => (
  <div>
    <p
      className={cn(
        "font-teko text-5xl tabular-nums leading-none text-zinc-100",
        className,
      )}>
      {value}
    </p>
    <p className='mt-1 text-xs text-zinc-400'>{label}</p>
  </div>
);

/**
 * A tier on the strip: its room, its number and where the guild stands on
 * it. The picked one is lit; the others wait in grey until hovered. A locked
 * tier can still be picked — to look at what is coming.
 */
const TierTile = ({
  state,
  selected,
  onSelect,
}: {
  state: RecordingTierView;
  selected: boolean;
  onSelect: () => void;
}) => {
  const { t } = useTranslation("guilds");
  return (
    <button
      type='button'
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "group flex flex-col gap-3 rounded-lg p-2 text-left transition-colors duration-fast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:p-3",
        selected ? "bg-zinc-800/60" : "bg-zinc-900/40 hover:bg-zinc-800/40",
      )}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={tierArtSrc(state.tier)}
        alt=''
        loading='lazy'
        className={cn(
          "aspect-[4/3] w-full rounded object-cover transition-[opacity,filter] duration-base",
          selected
            ? "opacity-100"
            : "opacity-50 grayscale group-hover:opacity-80 group-hover:grayscale-0",
        )}
      />
      <span className='flex min-w-0 items-center gap-2.5 px-1'>
        <span
          className={cn(
            "font-teko text-3xl tabular-nums leading-none",
            selected ? "text-zinc-100" : "text-zinc-400",
          )}>
          {state.tier}
        </span>
        <span className='min-w-0'>
          <span
            className={cn(
              "block truncate text-sm font-semibold",
              selected ? "text-zinc-100" : "text-zinc-300",
            )}>
            {tierName(t, state.tier)}
          </span>
          <span className='flex items-center gap-1 text-xs text-zinc-500'>
            {!state.unlocked && <Lock size={11} aria-hidden />}
            {!state.unlocked ? (
              t("recording.tier_closed")
            ) : state.best && isReleased(state.best) ? (
              <span className={RATING_TONE[state.best]}>
                {ratingName(t, state.best)}
              </span>
            ) : (
              t("recording.tier_open")
            )}
          </span>
        </span>
      </span>
    </button>
  );
};

interface TierStageProps {
  state: RecordingTierView;
  bank: number;
  busy: boolean;
  onBook: () => void;
}

/**
 * The picked tier on its stage: the room the session would be cut in, how
 * hard the track is played there, what a release pays, and the key that
 * books it — or, on a tier still shut, what opens it.
 */
const TierStage = ({ state, bank, busy, onBook }: TierStageProps) => {
  const { t } = useTranslation("guilds");
  const tier = getRecordingTier(state.tier);
  const short = state.fee - bank;

  return (
    <section className='overflow-hidden rounded-lg bg-zinc-900/40'>
      <div className='grid lg:min-h-[30rem] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]'>
        <div className='relative h-56 sm:h-72 lg:h-auto'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={state.tier}
            src={tierArtSrc(state.tier)}
            alt=''
            className={cn(
              "absolute inset-0 h-full w-full object-cover duration-slow animate-in fade-in",
              !state.unlocked && "grayscale",
            )}
          />
          {/* The room's floor runs into the dark, so the picture has no edge. */}
          <div
            aria-hidden
            className='pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-zinc-950/70 to-transparent'
          />
          <span className='absolute bottom-3 left-5 font-teko text-8xl tabular-nums leading-none text-zinc-100/90 sm:bottom-4 sm:left-7 sm:text-9xl'>
            {state.tier}
          </span>
        </div>

        <m.div
          key={state.tier}
          className='flex flex-col justify-center gap-8 p-6 lg:py-12 lg:pl-10 lg:pr-12'
          initial='hidden'
          animate='visible'
          variants={fadeUp}>
          <div className='space-y-2'>
            <p className='text-sm text-zinc-400'>
              {t("recording.tier_of", {
                tier: state.tier,
                max: RECORDING_MAX_TIER,
              })}
            </p>
            <h2 className='font-display text-4xl font-semibold tracking-tight text-zinc-100 lg:text-5xl'>
              {tierName(t, state.tier)}
            </h2>
            <p className='max-w-prose pt-1 text-sm leading-relaxed text-zinc-400'>
              {t(`recording.tier_pitch.t${state.tier}`)}
            </p>
          </div>

          <div className='flex flex-wrap gap-x-10 gap-y-5'>
            <Stat
              value={`${Math.round(tier.tempo * 100)}%`}
              label={t("recording.stat_tempo")}
            />
            <Stat value={tier.parts} label={t("recording.stat_parts")} />
            <Stat
              value={t(`recording.rhythm_short.d${tier.density}`)}
              label={t("recording.stat_rhythm")}
            />
          </div>

          <div className='flex flex-wrap gap-x-10 gap-y-5'>
            <Stat
              value={state.fame.toLocaleString()}
              label={t("recording.stat_fame")}
              className='text-amber-400'
            />
            <Stat
              value={state.bank.toLocaleString()}
              label={t("recording.stat_bank")}
              className='text-amber-400'
            />
          </div>

          {state.unlocked ? (
            <div className='space-y-3'>
              <div className='flex flex-wrap items-center gap-x-5 gap-y-3'>
                <Button
                  disabled={busy || short > 0}
                  onClick={onBook}
                  className='h-14 min-w-56 gap-3 bg-white px-10 text-lg text-zinc-950 shadow-none hover:bg-zinc-200 [&_svg]:size-5'>
                  <Mic aria-hidden />
                  {t("recording.book_session")}
                </Button>
                <p className='flex items-center gap-2 text-lg font-semibold tabular-nums text-amber-400'>
                  <FameCoin size={20} />
                  {state.fee.toLocaleString()}
                </p>
              </div>
              <p className='text-sm text-zinc-400'>
                {short > 0
                  ? t("recording.short", { count: short.toLocaleString() })
                  : t("recording.treasury_has", {
                      fame: bank.toLocaleString(),
                    })}
                {state.best && isReleased(state.best) && (
                  <span className={cn("ml-3", RATING_TONE[state.best])}>
                    {ratingName(t, state.best)}
                    {state.count > 1 && ` ×${state.count}`}
                  </span>
                )}
              </p>
            </div>
          ) : (
            <p className='flex items-center gap-3 text-base text-zinc-300'>
              <Lock size={18} className='shrink-0 text-zinc-500' aria-hidden />
              {t("recording.tier_locked", {
                tier: tierName(t, state.tier - 1),
              })}
            </p>
          )}
        </m.div>
      </div>
    </section>
  );
};

/** The strip of tiers and the picked one's stage. Opens on the highest tier the guild may book. */
const TierSelect = ({
  tiers,
  bank,
  busy,
  onBook,
}: {
  tiers: RecordingTierView[];
  bank: number;
  busy: boolean;
  onBook: (tier: number) => void;
}) => {
  const { t } = useTranslation("guilds");
  const [picked, setPicked] = useState<number | null>(null);
  const highestOpen = [...tiers].reverse().find((state) => state.unlocked);
  const state =
    tiers.find((entry) => entry.tier === picked) ?? highestOpen ?? tiers[0];
  if (!state) return null;

  return (
    <>
      <div
        className='grid grid-cols-3 gap-2 lg:grid-cols-6'
        role='group'
        aria-label={t("recording.tiers_label")}>
        {tiers.map((entry) => (
          <TierTile
            key={entry.tier}
            state={entry}
            selected={entry.tier === state.tier}
            onSelect={() => setPicked(entry.tier)}
          />
        ))}
      </div>
      <TierStage
        state={state}
        bank={bank}
        busy={busy}
        onBook={() => onBook(state.tier)}
      />
    </>
  );
};

/** Everybody who might walk in: the covers, and what they play. */
const ClientPool = () => {
  const { t } = useTranslation("guilds");
  return (
    <section className='space-y-5 rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
      <div className='max-w-2xl space-y-1'>
        <h3 className='font-display text-lg font-bold text-zinc-100'>
          {t("recording.pool_title")}
        </h3>
        <p className='text-sm leading-relaxed text-zinc-400'>
          {t("recording.pool_hint")}
        </p>
        <p className='text-sm leading-relaxed text-zinc-400'>
          {t("recording.intro")} {t("recording.clients_hint")}
        </p>
      </div>
      <ul className='grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-9'>
        {RECORDING_CONTRACTS.map((contract) => (
          <li key={contract.id} className='space-y-2'>
            <Cover contract={contract} className='w-full' />
            <p className='text-xs leading-snug text-zinc-400'>
              <span className='block truncate text-zinc-200'>
                {contract.client}
              </span>
              {t(`recording.genres.${contract.genre}`)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
};

// ── The open session ────────────────────────────────────────────────────────

/** "6d 23h" while there are days left, "5h 12m" on the last one. */
const timeShort = (t: T, endsAt: number, now: number): string => {
  const minutes = Math.max(0, Math.floor((endsAt - now) / 60_000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  return days > 0
    ? t("recording.time_days", { days, hours })
    : t("recording.time_hours", { hours, minutes: minutes % 60 });
};

/** Where on the milestone line a fill sits, 0–100 of its width. */
const onLine = (fill: number) =>
  `${(Math.min(RECORDING_TAPE_CAP, Math.max(0, fill)) / RECORDING_TAPE_CAP) * 100}%`;

const MILESTONES: { rating: RecordingRating; at: number }[] = [
  { rating: "record", at: 1 },
  { rating: "gold", at: RECORDING_GOLD },
  { rating: "platinum", at: RECORDING_PLATINUM },
];

/**
 * The whole session on one line: how full the tapes are on average, and the
 * three places the line is going — released, gold, platinum.
 */
const MilestoneLine = ({ session }: { session: RecordingSessionView }) => {
  const { t } = useTranslation("guilds");
  return (
    <div className='space-y-3'>
      <div className='relative h-3 rounded-full bg-zinc-800'>
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-slow",
            session.recorded ? "bg-emerald-400" : "bg-zinc-200",
          )}
          style={{ width: onLine(session.mean) }}
        />
        {MILESTONES.map(({ rating, at }) => (
          <span
            key={rating}
            aria-hidden
            className='absolute top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-zinc-500'
            style={{ left: onLine(at) }}
          />
        ))}
      </div>
      <ol className='relative h-10 text-xs'>
        {MILESTONES.map(({ rating, at }) => {
          const reached = session.recorded && session.mean >= at;
          return (
            <li
              key={rating}
              className={cn(
                "absolute -translate-x-1/2 text-center leading-tight",
                reached ? RATING_TONE[rating] : "text-zinc-400",
              )}
              style={{ left: onLine(at) }}>
              <span className='block font-medium'>{ratingName(t, rating)}</span>
              <span className='block tabular-nums text-zinc-500'>
                {Math.round(at * 100)}%
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

/** What the session still needs, as the one number a member looks for. */
const Goal = ({ session }: { session: RecordingSessionView }) => {
  const { t } = useTranslation("guilds");
  if (!session.next)
    return (
      <Stat
        value={ratingName(t, "platinum")}
        label={t("recording.goal_done")}
        className='text-4xl'
      />
    );
  return (
    <Stat
      value={session.next.takes}
      label={t(`recording.goal.${session.next.rating}`)}
      className='text-7xl'
    />
  );
};

interface SessionStageProps {
  session: RecordingSessionView;
  contract: RecordingContract;
}

/**
 * The session on its stage: the record being made, in the room it is being
 * made in, and how far it still is from being one.
 */
const SessionStage = ({ session, contract }: SessionStageProps) => {
  const { t } = useTranslation("guilds");
  // Read once: a countdown that ticks would redraw the tapes every second.
  const [now] = useState(() => Date.now());

  return (
    <section className='overflow-hidden rounded-lg bg-zinc-900/40'>
      <div className='grid lg:min-h-[30rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]'>
        <div className='relative h-64 sm:h-80 lg:h-auto'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={tierArtSrc(session.tier)}
            alt=''
            className='absolute inset-0 h-full w-full object-cover'
          />
          <div
            aria-hidden
            className='pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent'
          />
          <Cover
            contract={contract}
            className='absolute bottom-5 left-5 h-36 w-36 sm:bottom-7 sm:left-7 sm:h-48 sm:w-48'
          />
        </div>

        <div className='flex flex-col justify-center gap-8 p-6 lg:py-10 lg:pl-10 lg:pr-12'>
          <div className='space-y-2'>
            <p className='flex flex-wrap items-center gap-x-2 text-sm text-zinc-400'>
              <span className='h-2 w-2 rounded-full bg-red-500' aria-hidden />
              {t("recording.now")} ·{" "}
              {t("recording.session_meta", {
                tier: session.tier,
                name: tierName(t, session.tier),
                bpm: session.bpm,
              })}
            </p>
            <h2 className='font-display text-4xl font-semibold tracking-tight text-zinc-100 lg:text-5xl'>
              {contract.track}
            </h2>
            <p className='text-sm text-zinc-300'>
              {contract.client} · {t(`recording.genres.${contract.genre}`)}
            </p>
          </div>

          <div className='flex flex-wrap items-end gap-x-10 gap-y-5'>
            <Goal session={session} />
            <Stat
              value={`${Math.round(session.mean * 100)}%`}
              label={t("recording.stat_on_tape")}
            />
            <Stat
              value={timeShort(t, session.endsAt, now)}
              label={t("recording.stat_time")}
            />
          </div>

          <div className='space-y-2'>
            <MilestoneLine session={session} />
            {!session.recorded && (
              <p className='text-sm text-zinc-400'>
                {t("recording.release_rule")}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const MOOD_ORDER: RecordingMood[] = [
  "cold",
  "listening",
  "nodding",
  "grinning",
  "speechless",
];

/**
 * How the client takes what they have heard: their mood on a five-step
 * meter, what they say, the accuracy it comes from and the tip it is worth.
 */
const ClientMood = ({
  session,
  contract,
}: {
  session: RecordingSessionView;
  contract: RecordingContract;
}) => {
  const { t } = useTranslation("guilds");
  const level = session.mood ? MOOD_ORDER.indexOf(session.mood) + 1 : 0;
  const mood = session.mood ?? "waiting";

  return (
    <section className='flex flex-col gap-8 rounded-lg bg-zinc-900/40 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between'>
      <div className='min-w-0 max-w-2xl space-y-3'>
        <p className='text-sm text-zinc-400'>
          {t("recording.client_title", { client: contract.client })}
        </p>
        <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
          <h3 className='font-display text-2xl font-semibold text-zinc-100'>
            {t(`recording.moods.${mood}`)}
          </h3>
          <span
            className='flex gap-1.5'
            role='img'
            aria-label={t("recording.mood_level", {
              level,
              max: MOOD_ORDER.length,
            })}>
            {MOOD_ORDER.map((id, i) => (
              <span
                key={id}
                className={cn(
                  "h-2.5 w-8 rounded-full",
                  i < level ? "bg-amber-400" : "bg-zinc-700",
                )}
              />
            ))}
          </span>
        </div>
        <p className='text-sm leading-relaxed text-zinc-300'>
          “
          {session.mood
            ? t(`recording.mood_lines.${session.mood}`)
            : t(`recording.contracts.${contract.id}.pitch`, contract.pitch)}
          ”
        </p>
      </div>
      <div className='flex shrink-0 flex-wrap gap-x-10 gap-y-5'>
        <Stat
          value={
            session.accuracy === null ? "—" : `${Math.round(session.accuracy)}%`
          }
          label={t("recording.stat_accuracy")}
        />
        <Stat value={session.takes} label={t("recording.stat_takes")} />
        <Stat
          value={`+${session.tip}%`}
          label={t("recording.stat_tip")}
          className={session.tip > 0 ? "text-amber-400" : "text-zinc-500"}
        />
      </div>
    </section>
  );
};

/** The tape: the stretch to a full part, then the overdubs past it. */
const Tape = ({ part }: { part: PartStanding }) => {
  const base = Math.min(1, part.fill);
  const overdub = Math.max(0, (part.fill - 1) / (RECORDING_TAPE_CAP - 1));
  return (
    <div className='flex h-3 gap-1' aria-hidden>
      <div className='flex-[2] overflow-hidden rounded-full bg-zinc-800'>
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-slow",
            base >= 1 ? "bg-emerald-400" : "bg-zinc-200",
          )}
          style={{ width: `${base * 100}%` }}
        />
      </div>
      <div className='flex-[3] overflow-hidden rounded-full bg-zinc-800/60'>
        <div
          className='h-full rounded-full bg-amber-400 transition-[width] duration-slow'
          style={{ width: `${overdub * 100}%` }}
        />
      </div>
    </div>
  );
};

interface PartRowProps {
  contract: RecordingContract;
  part: PartStanding;
  canRecord: boolean;
  onRecord: () => void;
  onRehearse: () => void;
}

/**
 * One part: how full its tape is, in one big number, how many takes it
 * still wants, how good the takes on it have been — and the two ways in.
 */
const PartRow = ({
  contract,
  part,
  canRecord,
  onRecord,
  onRehearse,
}: PartRowProps) => {
  const { t } = useTranslation("guilds");
  const role = contract.parts.find((entry) => entry.id === part.id)?.role;
  const done = part.fill >= 1;
  return (
    <li className='space-y-3'>
      <div className='flex flex-wrap items-end justify-between gap-x-6 gap-y-3'>
        <div className='flex min-w-0 items-end gap-5'>
          <p
            className={cn(
              "w-24 shrink-0 font-teko text-5xl tabular-nums leading-none",
              done ? "text-emerald-400" : "text-zinc-100",
            )}>
            {Math.round(part.fill * 100)}%
          </p>
          <div className='min-w-0 space-y-1'>
            <p className='flex items-center gap-2 font-medium text-zinc-100'>
              {partName(t, contract, part.id)}
              {done && (
                <Check
                  size={16}
                  className='text-emerald-400'
                  aria-label={t("recording.part_done")}
                />
              )}
            </p>
            <p className='text-sm text-zinc-400'>
              {done
                ? t("recording.part_done")
                : t("recording.part_to_go", { count: part.takesToGo })}
              {" · "}
              {part.accuracy === null
                ? t("recording.part_no_takes")
                : t("recording.part_stats", {
                    takes: part.takes,
                    accuracy: Math.round(part.accuracy),
                  })}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='ghost' size='sm' onClick={onRehearse}>
            <Repeat size={15} className='mr-2' aria-hidden />
            {t("recording.rehearse")}
          </Button>
          <Button
            variant='secondary'
            size='sm'
            disabled={!canRecord}
            onClick={onRecord}>
            <Mic size={15} className='mr-2' aria-hidden />
            {t("recording.record")}
          </Button>
        </div>
      </div>
      <Tape part={part} />
      <p className='text-xs tabular-nums text-zinc-500'>
        {role && `${t(`recording.part_hints.${role}`)} `}
        {t("recording.tape", {
          tape: part.tape.toLocaleString(),
          target: part.target.toLocaleString(),
        })}
      </p>
    </li>
  );
};

/** How a take's accuracy reads at a glance: the good ones stand out. */
const accuracyTone = (accuracy: number) =>
  accuracy >= 88 ? "text-emerald-400" : "text-zinc-200";

interface SessionProps {
  session: RecordingSessionView;
  perks: RecordingPerks;
  busy: boolean;
  onRecord: (partId: string) => void;
  onRehearse: (partId: string) => void;
  onDeliver: () => void;
}

const Session = ({
  session,
  perks,
  busy,
  onRecord,
  onRehearse,
  onDeliver,
}: SessionProps) => {
  const { t } = useTranslation("guilds");
  const [confirming, setConfirming] = useState(false);
  const contract = getRecordingContract(session.contractId);
  if (!contract) return null;
  const canRecord = session.me.takesLeft > 0;

  return (
    <>
      <SessionStage session={session} contract={contract} />
      <ClientMood session={session} contract={contract} />

      <section className='space-y-8 rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
        <div className='flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2'>
          <h3 className='font-display text-lg font-bold text-zinc-100'>
            {t("recording.parts_title")}
          </h3>
          <p className='text-sm text-zinc-400'>
            {canRecord
              ? t("recording.takes_today", {
                  left: session.me.takesLeft,
                  total: perks.takesPerDay,
                })
              : t("recording.takes_none")}
          </p>
        </div>
        <ul className='space-y-8'>
          {session.parts.map((part) => (
            <PartRow
              key={part.id}
              contract={contract}
              part={part}
              canRecord={canRecord}
              onRecord={() => onRecord(part.id)}
              onRehearse={() => onRehearse(part.id)}
            />
          ))}
        </ul>
        <ul className='max-w-2xl space-y-2 text-sm leading-relaxed text-zinc-400'>
          <li>{t("recording.how_1")}</li>
          <li>{t("recording.how_2")}</li>
          <li>{t("recording.how_3")}</li>
          <li>
            {t("recording.how_4", {
              count: RECORDING_MIN_TAKES_FOR_PAY,
              full: RECORDING_FULL_SHARE_TAKES,
            })}
          </li>
        </ul>
      </section>

      <section className='grid gap-10 rounded-lg bg-zinc-900/40 p-5 sm:p-6 lg:grid-cols-2'>
        <div className='space-y-5'>
          <h3 className='font-display text-lg font-bold text-zinc-100'>
            {t("recording.recent_title")}
          </h3>
          {session.recent.length === 0 ? (
            <p className='text-sm text-zinc-400'>
              {t("recording.recent_empty")}
            </p>
          ) : (
            <ol className='space-y-3'>
              {session.recent.map((take) => (
                <li
                  key={`${take.uid}:${take.at}`}
                  className='flex items-baseline gap-4 text-sm'>
                  <span
                    className={cn(
                      "w-14 shrink-0 font-teko text-2xl tabular-nums leading-none",
                      accuracyTone(take.accuracy),
                    )}>
                    {Math.round(take.accuracy)}%
                  </span>
                  <span className='min-w-0 flex-1 truncate text-zinc-300'>
                    <span className='font-medium text-zinc-100'>
                      {take.displayName}
                    </span>{" "}
                    · {partName(t, contract, take.partId)}
                  </span>
                  <span className='shrink-0 tabular-nums text-zinc-400'>
                    +{take.points}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className='space-y-5'>
          <h3 className='font-display text-lg font-bold text-zinc-100'>
            {t("recording.crew")}
          </h3>
          {session.crew.length === 0 ? (
            <p className='text-sm text-zinc-400'>{t("recording.crew_empty")}</p>
          ) : (
            <ol className='space-y-3'>
              {session.crew.map((member) => (
                <li
                  key={member.uid}
                  className='flex items-baseline gap-4 text-sm'>
                  <span
                    className={cn(
                      "w-14 shrink-0 font-teko text-2xl tabular-nums leading-none",
                      accuracyTone(member.accuracy),
                    )}>
                    {Math.round(member.accuracy)}%
                  </span>
                  <span className='min-w-0 flex-1 truncate font-medium text-zinc-100'>
                    {member.displayName}
                  </span>
                  <span className='shrink-0 tabular-nums text-zinc-400'>
                    {t("recording.crew_row", {
                      takes: member.takes,
                      points: member.points.toLocaleString(),
                    })}
                  </span>
                </li>
              ))}
            </ol>
          )}
          {session.canDeliver && (
            <div className='flex flex-wrap items-center gap-x-4 gap-y-2 pt-2'>
              {confirming ? (
                <>
                  <span className='text-sm text-zinc-300'>
                    {t("recording.deliver_confirm", {
                      rating: ratingName(t, session.rating),
                    })}
                  </span>
                  <Button
                    variant='secondary'
                    disabled={busy}
                    onClick={onDeliver}>
                    {t("recording.deliver_yes")}
                  </Button>
                  <Button variant='ghost' onClick={() => setConfirming(false)}>
                    {t("recording.deliver_no")}
                  </Button>
                </>
              ) : (
                <Button variant='ghost' onClick={() => setConfirming(true)}>
                  {t("recording.deliver")}
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

// ── The tab ─────────────────────────────────────────────────────────────────

export interface GuildRecordingTabProps {
  view: RecordingView;
  /** What became of the take the player has just come back from, if any. */
  lastTake: LastTake | null;
  busy?: boolean;
  onBook: (tier: number) => void;
  onRecord: (partId: string) => void;
  onRehearse: (partId: string) => void;
  onDeliver: () => void;
  onClaim: () => void;
  onOpenStudio: () => void;
}

export const GuildRecordingTab = ({
  view,
  lastTake,
  busy = false,
  onBook,
  onRecord,
  onRehearse,
  onDeliver,
  onClaim,
  onOpenStudio,
}: GuildRecordingTabProps) => {
  const { session } = view;

  return (
    <div className='mx-auto w-full max-w-5xl space-y-6'>
      {lastTake && (
        <TakeVerdict
          take={lastTake}
          contract={getRecordingContract(
            session?.contractId ?? view.last?.contractId,
          )}
        />
      )}
      {view.pay > 0 && (
        <PayBanner fame={view.pay} busy={busy} onClaim={onClaim} />
      )}

      {session ? (
        <Session
          session={session}
          perks={view.perks}
          busy={busy}
          onRecord={onRecord}
          onRehearse={onRehearse}
          onDeliver={onDeliver}
        />
      ) : (
        <>
          <TierSelect
            tiers={view.tiers}
            bank={view.bank}
            busy={busy}
            onBook={onBook}
          />

          {view.last && <LastSession last={view.last} />}
          <ClientPool />
        </>
      )}

      <RoomShare perks={view.perks} onOpenStudio={onOpenStudio} />
    </div>
  );
};
