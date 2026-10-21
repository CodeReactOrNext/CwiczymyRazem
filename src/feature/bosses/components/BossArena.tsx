import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar/Avatar";
import { selectUserAvatar, selectUserName } from "feature/user/store/userSlice";
import { AnimatePresence, m } from "framer-motion";
import type { Translate } from "lib/i18n/translate";
import { Sword } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "store/hooks";

import { useBossText } from "../hooks/useBossText";
import { useBossFightStore } from "../store/bossFightStore";
import type { BossDefinition, BossId, BossRecord } from "../types/boss.types";
import { buildOf } from "../utils/boons";
import type { BossForm } from "../utils/bossArt";
import { artPhaseFor, legPatternFor, moodFor } from "../utils/bossArt";
import type { BossFightState } from "../utils/bossEngine";
import {
  fightMultiplier,
  isRegenerating,
  isSlamComing,
  isWeakChange,
  isWeakSpotOpen,
  isWebbed,
  nextStrum,
  parryStreak,
  phaseBpm,
  phaseNumber,
  quakeMissesAllowed,
  quakeWarning,
  rhythmKeyOf,
  weakSpotCharge,
} from "../utils/bossEngine";
import { changeLabel } from "../utils/chordTab";
import type { ThreatId } from "../utils/phaseChanges";
import { threatsOf } from "../utils/phaseChanges";
import { BoonIcon } from "./BoonIcon";
import { BossArt } from "./BossArt";
import { ThreatIcon } from "./ThreatIcon";

/** Under this share of HP the player's bar warns. */
const LOW_HP = 0.25;
/** From this share of a full charge the sword reads as ready to strike. */
const SWORD_READY = 0.8;

// ── Floating numbers ────────────────────────────────────────────────────────

type ArenaZone = "boss" | "player";
type ArenaTone = "strike" | "hurt" | "block" | "heal";

interface ArenaEvent {
  id: number;
  zone: ArenaZone;
  tone: ArenaTone;
  text: string;
  /** Under the main text: the strike's multiplier. */
  detail?: string;
  /** Horizontal spread, -1…1, so quick events don't stack. */
  drift: number;
}

const EVENT_MS = 900;
const MAX_EVENTS = 6;

/** The numbers one change of the fight puts up. */
const eventsFor = (
  fight: BossFightState,
  previous: BossFightState,
  t: Translate,
): Omit<ArenaEvent, "id" | "drift">[] => {
  const out: Omit<ArenaEvent, "id" | "drift">[] = [];
  if (fight.strikeTick > previous.strikeTick && fight.lastStrike) {
    out.push({
      zone: "boss",
      tone: "strike",
      text: String(fight.lastStrike.damage),
      detail: fight.lastStrike.multiplier > 1 ? `×${fight.lastStrike.multiplier}` : undefined,
    });
  }
  if (fight.biteTick > previous.biteTick) {
    out.push(
      fight.lastBiteCaught
        ? { zone: "player", tone: "block", text: t(`arena.caught_${fight.lastBiteCaught}`) }
        : { zone: "player", tone: "hurt", text: `−${fight.lastBite}` },
    );
  }
  if (fight.slamTick > previous.slamTick && fight.lastSlam) {
    out.push(
      fight.lastSlam.blocked
        ? { zone: "player", tone: "block", text: t("arena.blocked") }
        : { zone: "player", tone: "hurt", text: `−${fight.lastSlam.damage}`, detail: t("arena.slam") },
    );
  }
  if (fight.phaseTick > previous.phaseTick && fight.lastHeal > 0) {
    out.push({ zone: "player", tone: "heal", text: `+${fight.lastHeal}` });
  }
  return out;
};

/**
 * Damage numbers, blocks and heals. Fed from the store's own subscription,
 * not from renders, so nothing is lost when notes come ten a second.
 */
const useArenaEvents = (t: Translate) => {
  const [events, setEvents] = useState<ArenaEvent[]>([]);
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    let nextId = 0;
    const timers = new Set<number>();
    const unsubscribe = useBossFightStore.subscribe((state, previous) => {
      if (state.fight === previous.fight) return;
      // A new run starts with a clean arena.
      if (state.fight.runSeed !== previous.fight.runSeed) {
        setEvents([]);
        return;
      }
      const fresh = eventsFor(state.fight, previous.fight, tRef.current).map((event) => {
        const id = nextId++;
        return { ...event, id, drift: Math.sin(id * 2.4) };
      });
      if (!fresh.length) return;
      setEvents((list) => [...list, ...fresh].slice(-MAX_EVENTS));
      fresh.forEach((event) => {
        const timer = window.setTimeout(() => {
          timers.delete(timer);
          setEvents((list) => list.filter((e) => e.id !== event.id));
        }, EVENT_MS);
        timers.add(timer);
      });
    });
    return () => {
      unsubscribe();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);
  return events;
};

const TONE_CLASS: Record<ArenaTone, string> = {
  strike: "text-zinc-50",
  hurt: "text-orange-300",
  block: "text-emerald-300",
  heal: "text-emerald-300",
};

const EventLayer = ({
  events,
  zone,
  compact,
}: {
  events: ArenaEvent[];
  zone: ArenaZone;
  compact: boolean;
}) => (
  <div className='pointer-events-none absolute inset-0 z-10' aria-hidden>
    <AnimatePresence>
      {events
        .filter((e) => e.zone === zone)
        .map((e) => (
          <m.span
            key={e.id}
            initial={{ opacity: 0, y: 0, scale: 0.85 }}
            animate={{ opacity: [0, 1, 1, 0], y: -30, scale: 1 }}
            transition={{ duration: EVENT_MS / 1000, ease: "easeOut" }}
            className={cn(
              "absolute left-1/2 flex -translate-x-1/2 flex-col items-center leading-none",
              zone === "boss" ? "top-[28%]" : "-top-2",
              TONE_CLASS[e.tone],
            )}
            style={{ marginLeft: `${e.drift * (compact ? 20 : 40)}px` }}>
            <span
              className={cn(
                "font-teko font-semibold tabular-nums",
                e.tone === "strike"
                  ? compact
                    ? "text-3xl"
                    : "text-5xl"
                  : e.tone === "block"
                    ? "font-display text-base"
                    : compact
                      ? "text-xl"
                      : "text-3xl",
              )}>
              {e.text}
            </span>
            {e.detail && <span className='text-xs tabular-nums opacity-80'>{e.detail}</span>}
          </m.span>
        ))}
    </AnimatePresence>
  </div>
);

// ── Bars ────────────────────────────────────────────────────────────────────

/** Plays one animation on `ref` each time `tick` moves on. */
const useAnimateOn = <T extends HTMLElement>(
  tick: number,
  keyframes: Keyframe[],
  duration: number,
) => {
  const ref = useRef<T>(null);
  const framesRef = useRef(keyframes);
  useEffect(() => {
    if (!tick) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    ref.current?.animate?.(framesRef.current, { duration, easing: "ease-out" });
  }, [tick, duration]);
  return ref;
};

const SHAKE: Keyframe[] = [
  { transform: "translateX(0)" },
  { transform: "translateX(-6px)" },
  { transform: "translateX(5px)" },
  { transform: "translateX(-2px)" },
  { transform: "translateX(0)" },
];
const FLASH: Keyframe[] = [{ opacity: 1 }, { opacity: 0.35 }, { opacity: 1 }];

/**
 * A health bar whose loss lingers for a beat, so every hit shows what it took.
 * `from` picks the end it drains away from: the boss's bar empties toward the
 * middle of the face-off, like the player's.
 */
const HealthBar = ({
  value,
  max,
  fillClass,
  from = "left",
  size = "lg",
}: {
  value: number;
  max: number;
  fillClass: string;
  from?: "left" | "right";
  size?: "md" | "lg";
}) => {
  const share = max > 0 ? (value / max) * 100 : 0;
  const anchor = from === "left" ? "left-0" : "right-0";
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-full bg-zinc-950/70",
        size === "lg" ? "h-5" : "h-3",
      )}>
      <div
        className={cn(
          "absolute inset-y-0 rounded-full bg-zinc-200/40 transition-[width] delay-[250ms] duration-slow",
          anchor,
        )}
        style={{ width: `${share}%` }}
      />
      <div
        className={cn(
          "absolute inset-y-0 rounded-full transition-[width,background-color] duration-fast",
          anchor,
          fillClass,
        )}
        style={{ width: `${share}%` }}
      />
    </div>
  );
};

/** The sword fills with every hit and strikes when full; a miss shatters it. */
const SwordMeter = ({ fight, t }: { fight: BossFightState; t: Translate }) => {
  const fill = Math.min(1, fight.charge / fight.chargeMax);
  const strikeRef = useAnimateOn<HTMLDivElement>(fight.strikeTick, FLASH, 300);
  const shatterRef = useAnimateOn<HTMLDivElement>(fight.shatterTick, SHAKE, 260);
  const poisoned = fight.poisonedNotes > 0;
  const ready = !poisoned && fill >= SWORD_READY;
  return (
    <div ref={shatterRef} className='flex items-center gap-2'>
      <Sword
        className={cn("h-4 w-4 shrink-0 transition-colors duration-fast", ready ? "text-zinc-50" : "text-zinc-500")}
        aria-hidden
      />
      <div
        ref={strikeRef}
        className='relative h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-800'
        role='meter'
        aria-label={t("arena.sword")}
        aria-valuemin={0}
        aria-valuemax={fight.chargeMax}
        aria-valuenow={Math.min(fight.charge, fight.chargeMax)}>
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-[width,background-color] duration-fast",
            poisoned ? "bg-purple-400" : ready ? "bg-zinc-50 motion-safe:animate-pulse" : "bg-zinc-400",
          )}
          style={{ width: `${fill * 100}%` }}
        />
      </div>
      <span
        className={cn(
          "w-24 shrink-0 truncate text-right text-xs tabular-nums",
          poisoned ? "text-purple-300" : ready ? "font-medium text-zinc-50" : "text-zinc-400",
        )}>
        {poisoned
          ? t("arena.poisoned_short")
          : ready
            ? t("arena.sword_ready")
            : t("arena.streak", { count: fight.combo, multiplier: fightMultiplier(fight) })}
      </span>
    </div>
  );
};

/** The run's boons as icons, with stacks — or what is left of a shield or second wind. */
const BuildIcons = ({ fight, t }: { fight: BossFightState; t: Translate }) => {
  const build = buildOf(fight.boons);
  if (!build.length) return null;
  const left: Partial<Record<string, number>> = {
    shield: fight.shieldCharges,
    secondWind: fight.forgivenLeft,
  };
  return (
    <ul className='flex flex-wrap items-center gap-x-3 gap-y-1.5' aria-label={t("result.build")}>
      {build.map(({ id, stacks }) => {
        const name = t(`boons.${id}.name`);
        const remaining = left[id];
        const count = remaining ?? (stacks > 1 ? stacks : null);
        const label =
          remaining !== undefined ? `${name} (${remaining})` : stacks > 1 ? `${name} ×${stacks}` : name;
        return (
          <li
            key={id}
            className={cn("flex items-center gap-1", remaining === 0 && "opacity-40")}
            title={label}
            aria-label={label}>
            <BoonIcon id={id} className='h-5 w-5' />
            {count !== null && (
              <span className='font-teko text-base leading-none tabular-nums text-zinc-300'>{count}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
};

// ── Threats ─────────────────────────────────────────────────────────────────

interface LiveAlert {
  threat: ThreatId;
  text: string;
  /** 0–1 — the slam's wind-up, the web or weak spot running out. */
  progress: number;
  tone: "danger" | "chance" | "info";
}

/** The one thing to watch right now, most urgent first: a slam or quake, the web, a weak spot, healing. */
const liveAlert = (fight: BossFightState, t: Translate): LiveAlert | null => {
  if (fight.outcome || fight.holding) return null;
  const quake = quakeWarning(fight);
  if (quake) {
    return quake.stage === "on"
      ? {
          threat: "quake",
          text: t(quakeMissesAllowed(fight) > 0 ? "arena.quake_on_steady" : "arena.quake_on", {
            count: quake.left,
          }),
          progress: quake.left / quake.total,
          tone: "danger",
        }
      : {
          threat: "quake",
          text: t("arena.quake_coming"),
          progress: 1 - quake.left / quake.total,
          tone: "danger",
        };
  }
  if (isSlamComing(fight)) {
    return {
      threat: "slams",
      text: t("arena.slam_coming", { streak: parryStreak(fight) }),
      progress: 1 - fight.notesToSlam / fight.slamWindup,
      tone: "danger",
    };
  }
  if (isWebbed(fight)) {
    return {
      threat: "web",
      text: t("arena.webbed"),
      progress: fight.webNotes / fight.plan.rules.webLength,
      tone: "danger",
    };
  }
  const next = nextStrum(fight);
  if (next !== null && fight.weakChange && isWeakChange(fight, next)) {
    return {
      threat: "weak_spots",
      text: t("arena.weak_change", {
        change: changeLabel(fight.weakChange),
        multiplier: weakSpotCharge(fight),
      }),
      progress: 0,
      tone: "chance",
    };
  }
  if (isWeakSpotOpen(fight)) {
    return {
      threat: "weak_spots",
      text: t("arena.weak_spot", { multiplier: weakSpotCharge(fight) }),
      progress: fight.weakSpotNotes / fight.plan.rules.weakSpotLength,
      tone: "chance",
    };
  }
  if (isRegenerating(fight)) {
    return { threat: "regen", text: t("arena.regenerating"), progress: 0, tone: "info" };
  }
  return null;
};

const ALERT_TEXT: Record<LiveAlert["tone"], string> = {
  danger: "text-orange-400",
  chance: "text-emerald-400",
  info: "text-zinc-200",
};
const ALERT_BAR: Record<LiveAlert["tone"], string> = {
  danger: "bg-orange-400",
  chance: "bg-emerald-400",
  info: "bg-zinc-400",
};

/** The live alert, large and over the stage — read in a glance from the tab. */
const AlertPill = ({
  alert,
  boss,
  compact,
}: {
  alert: LiveAlert | null;
  boss: BossId;
  compact: boolean;
}) => (
  <AnimatePresence>
    {alert && (
      <m.div
        key={alert.threat}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className={cn(
          "pointer-events-none z-20 flex flex-col gap-1.5 rounded-lg bg-zinc-950/85 px-3 py-2",
          compact ? "w-full" : "absolute bottom-3 left-1/2 w-max max-w-md -translate-x-1/2",
        )}
        role='status'>
        <span
          className={cn(
            "flex items-center gap-2 font-semibold",
            compact ? "text-sm" : "text-base",
            ALERT_TEXT[alert.tone],
          )}>
          <ThreatIcon id={alert.threat} boss={boss} className={cn("shrink-0", compact ? "h-5 w-5" : "h-6 w-6")} />
          <span className='truncate'>{alert.text}</span>
        </span>
        {alert.progress > 0 && (
          <span className='relative h-1 w-full overflow-hidden rounded-full bg-zinc-800'>
            <span
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-[width] duration-fast",
                ALERT_BAR[alert.tone],
              )}
              style={{ width: `${alert.progress * 100}%` }}
            />
          </span>
        )}
      </m.div>
    )}
  </AnimatePresence>
);

/** The phase's threats as icons; the one in play right now lights up. */
const ThreatIcons = ({
  fight,
  boss,
  live,
  t,
  align,
}: {
  fight: BossFightState;
  boss: BossId;
  live: ThreatId | null;
  t: Translate;
  align: "start" | "end";
}) => (
  <ul className={cn("flex flex-wrap items-center gap-2.5", align === "end" && "justify-end")}>
    {(["bites", ...threatsOf(fight.plan)] as const).map((id) => {
      const name = t(`threats.${id}`);
      return (
        <li key={id} title={name} aria-label={name}>
          <ThreatIcon
            id={id}
            boss={boss}
            className={cn(
              "transition-colors duration-fast",
              align === "end" ? "h-6 w-6" : "h-5 w-5",
              live === id ? (id === "weak_spots" ? "text-emerald-400" : "text-orange-400") : "text-zinc-500",
            )}
          />
        </li>
      );
    })}
  </ul>
);

// ── Arena ───────────────────────────────────────────────────────────────────

/** A leg — or a plate — for every eighth of the phase's HP gone; the molt puts them back. */
const piecesLostFor = (fight: Pick<BossFightState, "bossHp" | "bossMaxHp">) =>
  Math.min(7, Math.floor((1 - fight.bossHp / fight.bossMaxHp) * 8));

/**
 * The stage's light, in the colour of the boss's form — the spider's purple,
 * gold and enraged orange, the colossus's cyan runes, amber and orange — taken
 * half-way to grey and kept low, one gradient falling from the top: a lit
 * stage, not a coloured box.
 */
const STAGE_LIGHT: Record<BossId, Record<BossForm, string>> = {
  fretweaver: { 0: "120, 72, 159", 1: "165, 117, 63", 2: "174, 101, 67" },
  colossus: { 0: "64, 115, 133", 1: "165, 117, 63", 2: "174, 101, 67" },
};

const stageStyle = (boss: BossId, form: BossForm) => {
  const light = STAGE_LIGHT[boss][form];
  return {
    backgroundImage: `linear-gradient(180deg, rgba(${light}, 0.26) 0%, rgba(${light}, 0.08) 55%, rgba(9, 9, 11, 0) 100%)`,
  };
};

/** The boss's HP bar: the spider purple, the colossus the grey of its stone. */
const BOSS_BAR: Record<BossId, string> = {
  fretweaver: "bg-gradient-to-l from-purple-700 to-purple-400",
  colossus: "bg-gradient-to-l from-zinc-500 to-zinc-300",
};

interface BossArenaProps {
  boss: BossDefinition;
  /** The player's best, shown beside their name. */
  record: BossRecord;
  /** Phone layout: the spider beside the boss's bar, the player's below. */
  compact?: boolean;
}

/**
 * The fight above the tab, staged like a fighting game: the spider hangs large
 * in the middle of a lit stage, the player's side — HP, sword, build — faces
 * the boss's — HP, threats — across it, the phase sits over its head, and
 * whatever it is about to do is called out at its feet. Display only — the
 * fight lives in the store — so the desktop and phone views can both mount it.
 */
export const BossArena = ({ boss, record, compact = false }: BossArenaProps) => {
  const { t, bossName, bossTitle } = useBossText(boss);
  const fight = useBossFightStore((s) => s.fight);
  const draftOpen = useBossFightStore((s) => s.draftOpen);
  const playerName = useAppSelector(selectUserName) ?? t("arena.you");
  const playerAvatar = useAppSelector(selectUserAvatar);
  const events = useArenaEvents(t);
  const playerRef = useAnimateOn<HTMLDivElement>(fight.playerHurtTick, SHAKE, 300);
  const alert = liveAlert(fight, t);
  const lowHp = fight.playerHp / fight.playerMaxHp < LOW_HP;
  const bpm = phaseBpm(fight);
  const rhythm = t(rhythmKeyOf(fight.plan));
  const form = artPhaseFor(fight);
  const quake = quakeWarning(fight);

  const spider = (
    <div className={cn("relative shrink-0", compact ? "h-32 w-40" : "h-64 w-80 xl:h-80 xl:w-[25rem]")}>
      <BossArt
        boss={boss}
        className='h-full w-full'
        mood={moodFor(fight)}
        strikeTick={fight.strikeTick}
        biteTick={fight.biteTick}
        slamTick={fight.slamTick}
        windup={alert?.threat === "slams" || quake?.stage === "coming"}
        quaking={quake?.stage === "on"}
        exposed={alert?.threat === "weak_spots"}
        form={form}
        molting={fight.holding && fight.draft !== null && !draftOpen}
        pattern={legPatternFor(fight.plan)}
        webTorn={1 - fight.bossHp / fight.bossMaxHp}
        piecesLost={piecesLostFor(fight)}
        intro
      />
      <EventLayer events={events} zone='boss' compact={compact} />
    </div>
  );

  const hpNumber = (value: number, max: number, warn = false) => (
    <span
      className={cn(
        "font-teko leading-none tabular-nums",
        compact ? "text-2xl" : "text-4xl",
        warn ? "text-orange-300 motion-safe:animate-pulse" : "text-zinc-50",
      )}>
      {value}
      <span className={cn("text-zinc-500", compact ? "text-base" : "text-xl")}> / {max}</span>
    </span>
  );

  const playerSide = (
    <div ref={playerRef} className='relative w-full space-y-3'>
      <div className='flex items-end justify-between gap-4'>
        <div className='flex min-w-0 items-center gap-3'>
          {!compact && <Avatar name={playerName} avatarURL={playerAvatar} size='sm' />}
          <div className='min-w-0'>
            <p className={cn("truncate font-semibold text-zinc-100", compact ? "text-sm" : "text-base")}>
              {compact ? t("arena.your_hp") : playerName}
            </p>
            {!compact && (
              <p className='truncate text-xs text-zinc-400'>
                {record.bestPhase > 0 ? t("arena.record", { phase: record.bestPhase }) : t("arena.you")}
              </p>
            )}
          </div>
        </div>
        {hpNumber(fight.playerHp, fight.playerMaxHp, lowHp)}
      </div>
      <HealthBar
        value={fight.playerHp}
        max={fight.playerMaxHp}
        size={compact ? "md" : "lg"}
        fillClass={
          lowHp
            ? "bg-gradient-to-r from-orange-500 to-orange-300"
            : "bg-gradient-to-r from-emerald-600 to-emerald-400"
        }
      />
      <EventLayer events={events} zone='player' compact={compact} />
      <SwordMeter fight={fight} t={t} />
      <BuildIcons fight={fight} t={t} />
    </div>
  );

  const bossSide = (
    <div className='w-full space-y-3'>
      <div className={cn("flex items-end justify-between gap-4", !compact && "flex-row-reverse")}>
        <div className={cn("min-w-0", !compact && "text-right")}>
          <p className={cn("truncate font-semibold text-zinc-100", compact ? "text-sm" : "text-base")}>
            {bossName}
          </p>
          {!compact && <p className='truncate text-xs text-zinc-400'>{bossTitle}</p>}
        </div>
        {hpNumber(fight.bossHp, fight.bossMaxHp)}
      </div>
      <HealthBar
        value={fight.bossHp}
        max={fight.bossMaxHp}
        from={compact ? "left" : "right"}
        size={compact ? "md" : "lg"}
        fillClass={fight.enraged ? "bg-gradient-to-l from-orange-600 to-orange-400" : BOSS_BAR[boss.id]}
      />
      <ThreatIcons
        fight={fight}
        boss={boss.id}
        live={alert?.threat ?? null}
        t={t}
        align={compact ? "start" : "end"}
      />
      {fight.weakChange && (
        <p className={cn("text-xs text-zinc-400", !compact && "text-right")}>
          {t("arena.weak_change_label")}{" "}
          <span className='font-medium tabular-nums text-emerald-400'>{changeLabel(fight.weakChange)}</span>
        </p>
      )}
    </div>
  );

  const phaseLabel = (
    <div className='text-center'>
      <p className={cn("font-display font-semibold leading-none text-zinc-50", compact ? "text-base" : "text-3xl")}>
        {t("arena.phase", { phase: phaseNumber(fight) })}
      </p>
      <p className='mt-1.5 text-xs tabular-nums text-zinc-400'>
        {bpm} BPM · {rhythm}
        {fight.enraged && <span className='font-medium text-orange-400'> · {t("arena.enraged")}</span>}
      </p>
    </div>
  );

  if (compact) {
    return (
      <div className='relative space-y-3 overflow-hidden rounded-lg bg-zinc-900/60 p-3 text-left' style={stageStyle(boss.id, form)}>
        <div className='flex items-center gap-3'>
          {spider}
          <div className='min-w-0 flex-1 space-y-3'>
            {phaseLabel}
            {bossSide}
          </div>
        </div>
        {playerSide}
        <AlertPill alert={alert} boss={boss.id} compact />
      </div>
    );
  }

  return (
    <div className='relative w-full overflow-hidden rounded-lg bg-zinc-900/60 text-left' style={stageStyle(boss.id, form)}>
      <div className='grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-10 px-10 pb-6 pt-5'>
        <div className='flex justify-end'>
          <div className='w-full max-w-md'>{playerSide}</div>
        </div>
        <div className='flex flex-col items-center gap-2'>
          {phaseLabel}
          {spider}
        </div>
        <div className='flex justify-start'>
          <div className='w-full max-w-md'>{bossSide}</div>
        </div>
      </div>
      <AlertPill alert={alert} boss={boss.id} compact={false} />
    </div>
  );
};
