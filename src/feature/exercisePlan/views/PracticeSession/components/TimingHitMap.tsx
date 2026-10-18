import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";

import { CALIBRATION_MAX_SPREAD_MS, calibrationHitMap } from "../utils/timingCalibration";

interface TimingHitMapProps {
  /** Per click, the pick's delay after it in ms (null: nothing heard). */
  delays: readonly (number | null)[];
}

/**
 * Where each pluck landed against its click: one row per click, the click on
 * the line at 0 and the pick at its delay from it, joined by the gap between
 * them. The shaded band is how tightly a run has to sit around its median to
 * pass, so a refused run shows which picks wandered out of it.
 */
export const TimingHitMap = ({ delays }: TimingHitMapProps) => {
  const { t } = useTranslation("session");
  const { fromMs, toMs, ticks, centerMs, rows } = calibrationHitMap(delays);
  const width = (ms: number) => `${(ms / (toMs - fromMs)) * 100}%`;
  const at = (ms: number) => width(ms - fromMs);
  // Each line's label sits on the side facing away from the other one.
  const ahead = centerMs !== null && centerMs < 0;
  const hits = rows.filter((row) => row.delayMs !== null).length;

  return (
    <div
      role='img'
      aria-label={
        centerMs === null
          ? t("timing.map.title")
          : t("timing.map.aria", { hits, total: rows.length, ms: Math.round(centerMs) })
      }>
      <p className='text-[11px] font-semibold tracking-wide text-zinc-500'>{t("timing.map.title")}</p>

      <div className='relative mt-3 h-4 whitespace-nowrap text-[11px] leading-4' aria-hidden>
        <span
          className={cn("absolute text-zinc-500", ahead ? "pl-1.5" : "-translate-x-full pr-1.5")}
          style={{ left: at(0) }}>
          {t("timing.map.click")}
        </span>
        {centerMs !== null && (
          <span
            className={cn(
              "absolute font-semibold tabular-nums text-zinc-100",
              ahead ? "-translate-x-full pr-1.5" : "pl-1.5",
            )}
            style={{ left: at(centerMs) }}>
            {Math.round(centerMs)} ms
          </span>
        )}
      </div>

      <div className='relative mt-1 rounded-md bg-zinc-900/60 py-2' aria-hidden>
        {centerMs !== null && (
          <div
            className='absolute inset-y-0 bg-emerald-500/10'
            style={{ left: at(centerMs - CALIBRATION_MAX_SPREAD_MS), width: width(2 * CALIBRATION_MAX_SPREAD_MS) }}
          />
        )}
        <div className='absolute inset-y-0 w-px bg-zinc-600' style={{ left: at(0) }} />
        {centerMs !== null && <div className='absolute inset-y-0 w-px bg-zinc-300' style={{ left: at(centerMs) }} />}

        {rows.map((row, i) => (
          <div key={i} className='relative h-3'>
            {row.delayMs === null ? (
              <span
                className='absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-700'
                style={{ left: at(0) }}
              />
            ) : (
              <>
                <span
                  className='absolute top-1/2 h-px -translate-y-1/2 bg-zinc-600'
                  style={{ left: at(Math.min(0, row.delayMs)), width: width(Math.abs(row.delayMs)) }}
                />
                <span
                  className={cn(
                    "absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full",
                    row.steady ? "bg-emerald-500" : "bg-amber-500",
                  )}
                  style={{ left: at(row.delayMs) }}
                />
              </>
            )}
          </div>
        ))}
      </div>

      <div className='relative mt-1.5 h-4 whitespace-nowrap text-[10px] tabular-nums leading-4 text-zinc-500' aria-hidden>
        {ticks.map((tick, i) => (
          <span
            key={tick}
            className={cn(
              "absolute",
              i === ticks.length - 1 ? "-translate-x-full" : i > 0 && "-translate-x-1/2",
            )}
            style={{ left: at(tick) }}>
            {tick > 0 ? `+${tick}` : tick < 0 ? `−${-tick}` : "0"}
            {i === ticks.length - 1 && " ms"}
          </span>
        ))}
      </div>
    </div>
  );
};
