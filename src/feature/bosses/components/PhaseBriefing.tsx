import type { Translate } from "lib/i18n/translate";

import type { NotesPerBeat } from "../types/boss.types";
import { subdivisionKey } from "../utils/bossArt";
import type { BossFightState } from "../utils/bossEngine";
import { chordRhythmKey, phaseBpm } from "../utils/bossEngine";
import type { ThreatId } from "../utils/phaseChanges";
import { describeChordChanges, describePhaseChanges } from "../utils/phaseChanges";
import { buildSpiderTablature } from "../utils/spiderTab";
import { ChordDiagram } from "./ChordDiagram";
import { MiniTab } from "./MiniTab";

/** Under this the notes count as coming at the same speed. */
const SAME_SPEED = 0.02;

/** "Notes come 38% faster" — the one-line verdict on a phase's speed. */
export const speedHeadline = (speedChange: number, t: Translate) =>
  Math.abs(speedChange) < SAME_SPEED
    ? t("briefing.same_speed")
    : t(speedChange > 0 ? "briefing.faster" : "briefing.slower", {
        percent: Math.round(Math.abs(speedChange) * 100),
      });

interface Line {
  label: string;
  value: string;
  changed: boolean;
}

/** The lines of the spider's briefing, and the opening bar of its new drill. */
const spiderBriefing = (fight: BossFightState, t: Translate) => {
  if (fight.plan.kind !== "spider" || fight.previousPlan?.kind !== "spider") return null;
  const changes = describePhaseChanges(fight.previousPlan, fight.plan, fight.previousBpm, phaseBpm(fight));
  const { bpm, rhythm, route, patterns, frets } = changes;
  const rhythmName = (notesPerBeat: NotesPerBeat) => t(`subdivision.${subdivisionKey({ notesPerBeat })}`);
  const lines: Line[] = [
    {
      label: t("briefing.tempo"),
      value: bpm.from === bpm.to ? `${bpm.to} BPM` : `${bpm.from} → ${bpm.to} BPM`,
      changed: bpm.from !== bpm.to,
    },
    {
      label: t("briefing.rhythm"),
      value: rhythm.changed ? `${rhythmName(rhythm.from)} → ${rhythmName(rhythm.to)}` : rhythmName(rhythm.to),
      changed: rhythm.changed,
    },
    { label: t("briefing.route"), value: t(`route.${route.to}`), changed: route.changed },
    { label: t("briefing.fingers"), value: patterns.to.join(" · "), changed: patterns.changed },
    {
      label: t("briefing.neck"),
      value: t("briefing.frets", { low: frets.low, high: frets.high }),
      changed: frets.changed,
    },
  ];
  const preview = (
    <figure className='w-full max-w-sm space-y-1'>
      <figcaption className='text-xs text-zinc-500'>{t("briefing.first_bar")}</figcaption>
      <MiniTab measure={buildSpiderTablature(fight.plan.variation)[0]} label={t("briefing.first_bar")} />
    </figure>
  );
  return { changes, lines, preview };
};

/** The lines of the colossus's briefing, and the shapes of its new progression. */
const chordBriefing = (fight: BossFightState, t: Translate) => {
  if (fight.plan.kind !== "chords" || fight.previousPlan?.kind !== "chords") return null;
  const changes = describeChordChanges(fight.previousPlan, fight.plan, fight.previousBpm, phaseBpm(fight));
  const { bpm, rhythm, family, progression, quakes } = changes;
  const rhythmName = (beatsPerChord: 1 | 2 | 4) => t(chordRhythmKey(beatsPerChord));
  const lines: Line[] = [
    {
      label: t("briefing.tempo"),
      value: bpm.from === bpm.to ? `${bpm.to} BPM` : `${bpm.from} → ${bpm.to} BPM`,
      changed: bpm.from !== bpm.to,
    },
    {
      label: t("briefing.rhythm"),
      value: rhythm.changed ? `${rhythmName(rhythm.from)} → ${rhythmName(rhythm.to)}` : rhythmName(rhythm.to),
      changed: rhythm.changed,
    },
    { label: t("briefing.chords"), value: t(`chord_family.${family.to}`), changed: family.changed },
    {
      label: t("briefing.progression"),
      value: progression.to.join(" → "),
      changed: progression.changed,
    },
    {
      label: t("briefing.quakes"),
      value: t("briefing.quakes_per_pass", { count: quakes.to }),
      changed: quakes.changed,
    },
  ];
  const preview = (
    <figure className='space-y-1'>
      <figcaption className='text-xs text-zinc-500'>{t("briefing.shapes")}</figcaption>
      <ul className='flex flex-wrap gap-3'>
        {fight.plan.variation.progression.map((chord) => (
          <li key={chord} className='flex flex-col items-center gap-0.5'>
            <ChordDiagram chord={chord} className='h-16 w-auto' />
            <span className='text-sm font-semibold text-zinc-100'>{chord}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
  return { changes, lines, preview };
};

/**
 * What the next phase does differently, led by the one number that tells
 * how much harder it is — how much faster the notes (or the changes) come.
 * Only what changes gets a line of its own; what stays the same shares one
 * dim line.
 */
export const PhaseBriefing = ({ fight, t }: { fight: BossFightState; t: Translate }) => {
  const briefing = spiderBriefing(fight, t) ?? chordBriefing(fight, t);
  if (!briefing) return null;
  const { changes, lines, preview } = briefing;
  const { gained, lost, speedChange } = changes;
  const threatNames = (ids: ThreatId[]) => ids.map((id) => t(`threats.${id}`)).join(", ");

  const changed = lines.filter((line) => line.changed);
  const unchanged = lines.filter((line) => !line.changed);

  return (
    <section className='space-y-4' aria-label={t("briefing.title")}>
      <div className='flex flex-wrap items-end justify-between gap-x-8 gap-y-3'>
        <div className='space-y-1'>
          <p className='text-xs text-zinc-500'>{t("briefing.title")}</p>
          <p className='font-display text-xl font-semibold text-zinc-100'>{speedHeadline(speedChange, t)}</p>
        </div>
        {preview}
      </div>

      {changed.length > 0 && (
        <dl className='grid gap-x-10 gap-y-2 sm:grid-cols-2'>
          {changed.map((line) => (
            <div key={line.label} className='flex items-baseline justify-between gap-4 text-sm'>
              <dt className='shrink-0 text-zinc-400'>{line.label}</dt>
              <dd className='text-right font-medium tabular-nums text-zinc-100'>{line.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {(gained.length > 0 || lost.length > 0) && (
        <p className='text-sm'>
          {gained.length > 0 && (
            <span className='font-medium text-orange-400'>
              {t("briefing.gained", { list: threatNames(gained) })}
            </span>
          )}
          {gained.length > 0 && lost.length > 0 && <span className='text-zinc-600'> · </span>}
          {lost.length > 0 && (
            <span className='text-zinc-500'>{t("briefing.lost", { list: threatNames(lost) })}</span>
          )}
        </p>
      )}

      {unchanged.length > 0 && (
        <p className='text-xs text-zinc-500'>
          {t("briefing.unchanged", {
            list: unchanged.map((line) => `${line.label}: ${line.value}`).join(" · "),
          })}
        </p>
      )}
    </section>
  );
};
