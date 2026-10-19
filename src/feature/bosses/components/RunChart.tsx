import type { Translate } from "lib/i18n/translate";
import { useState } from "react";

import type { NotesPerBeat } from "../types/boss.types";
import { subdivisionKey } from "../utils/bossArt";
import type { PhaseRecord } from "../utils/bossEngine";

/** About the width the verdict gives it, so a column stays near its 24px cap on screen. */
const WIDTH = 440;
const PLOT = 88;
const AXIS = 16;
const MAX_BAR = 24;
/** A phase that cost nothing still gets a sliver, so it reads as played. */
const STUB = 2;

/** A column: square on the baseline, 4px rounded at its data end. */
const columnPath = (x: number, w: number, h: number) => {
  const top = PLOT - h;
  const r = Math.min(4, h, w / 2);
  return `M${x} ${PLOT} V${top + r} Q${x} ${top} ${x + r} ${top} H${x + w - r} Q${x + w} ${top} ${x + w} ${top + r} V${PLOT} Z`;
};

/**
 * The run phase by phase: HP lost in each, one column per phase, the hardest
 * in the accent. Hovering a column reads out its tempo, rhythm and cost in the
 * line above the plot; a table carries the same for screen readers.
 */
export const RunChart = ({ log, t }: { log: PhaseRecord[]; t: Translate }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  if (log.length === 0) return null;

  const most = Math.max(...log.map((p) => p.damageTaken));
  const hardest = most > 0 ? log.find((p) => p.damageTaken === most) : undefined;
  const slot = WIDTH / log.length;
  const barW = Math.min(MAX_BAR, Math.max(4, slot - 6));
  const rhythm = (notesPerBeat: number) =>
    t(`subdivision.${subdivisionKey({ notesPerBeat: notesPerBeat as NotesPerBeat })}`);
  const detail = (p: PhaseRecord) =>
    t("result.phase_detail", { phase: p.phase, bpm: p.bpm, rhythm: rhythm(p.notesPerBeat), hp: p.damageTaken });
  // Past ten phases, every other number on the axis.
  const labelEvery = log.length > 10 ? 2 : 1;

  const readout =
    hovered !== null
      ? detail(log[hovered])
      : hardest
        ? t("result.hardest", { phase: hardest.phase, hp: hardest.damageTaken })
        : t("result.no_damage");

  return (
    <figure className='space-y-2 text-left'>
      <figcaption className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs'>
        <span className='text-zinc-400'>{t("result.chart_title")}</span>
        <span className='tabular-nums text-zinc-300' aria-live='polite'>
          {readout}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${WIDTH} ${PLOT + AXIS}`}
        className='h-auto w-full'
        role='img'
        aria-label={t("result.chart_title")}
        onMouseLeave={() => setHovered(null)}>
        <line x1={0} x2={WIDTH} y1={PLOT + 0.5} y2={PLOT + 0.5} stroke='#27272a' strokeWidth={1} />
        {log.map((p, i) => {
          const x = i * slot + (slot - barW) / 2;
          const h = most > 0 ? Math.max(STUB, (p.damageTaken / most) * (PLOT - 4)) : STUB;
          const isHardest = p === hardest;
          const fill = hovered === i ? "#d4d4d8" : isHardest ? "#fb923c" : "#52525b";
          return (
            <g key={p.phase}>
              <path d={columnPath(x, barW, h)} fill={fill} />
              {i % labelEvery === 0 && (
                <text
                  x={x + barW / 2}
                  y={PLOT + 12}
                  textAnchor='middle'
                  fontSize={9}
                  fill='#71717a'
                  style={{ fontVariantNumeric: "tabular-nums" }}>
                  {p.phase}
                </text>
              )}
              {/* The whole slot answers the pointer, not just the column. */}
              <rect
                x={i * slot}
                y={0}
                width={slot}
                height={PLOT + AXIS}
                fill='transparent'
                onMouseEnter={() => setHovered(i)}
                aria-hidden
              />
            </g>
          );
        })}
      </svg>
      <table className='sr-only'>
        <caption>{t("result.chart_title")}</caption>
        <tbody>
          {log.map((p) => (
            <tr key={p.phase}>
              <td>{detail(p)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};
