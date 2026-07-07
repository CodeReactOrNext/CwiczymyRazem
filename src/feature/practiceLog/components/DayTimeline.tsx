import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { useMemo } from "react";
import { convertMsToHM } from "utils/converter";

import { SESSION_TYPE_CONFIG } from "../config/sessionType";
import type { PracticeLogSession } from "../types/practiceLog.types";

interface DayTimelineProps {
  /** Sessions of the selected day (any order). */
  sessions: PracticeLogSession[];
}

const AXIS_PAD_PCT = 4; // keep edge labels inside the card
const CLUSTER_PCT = 8; // stagger stems closer than this
const SHORT_STEM = 34;
const TALL_STEM = 62;
const BASELINE_FROM_BOTTOM = 44;
const CONTAINER_HEIGHT = 150;

const hourLabel = (h: number) => `${String(h % 24).padStart(2, "0")}:00`;

/** Fractional hour of day, e.g. 22:08 → 22.133 */
const hourOf = (date: Date) => date.getHours() + date.getMinutes() / 60;

export const DayTimeline = ({ sessions }: DayTimelineProps) => {
  const { t } = useTranslation(["practice_log", "common"]);

  const model = useMemo(() => {
    if (sessions.length === 0) return null;

    const ordered = [...sessions].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    const hours = ordered.map((s) => hourOf(s.date));
    let start = Math.max(0, Math.floor(Math.min(...hours)) - 1);
    let end = Math.min(24, Math.ceil(Math.max(...hours)) + 1);
    if (end - start < 3) {
      end = Math.min(24, start + 3);
      start = Math.max(0, end - 3);
    }
    const span = end - start;

    const step = span <= 6 ? 1 : span <= 10 ? 2 : span <= 16 ? 3 : 4;
    const ticks: number[] = [];
    for (let h = start; h <= end; h += step) ticks.push(h);
    if (ticks[ticks.length - 1] !== end) ticks.push(end);

    const toPct = (hour: number) =>
      AXIS_PAD_PCT + ((hour - start) / span) * (100 - 2 * AXIS_PAD_PCT);

    let lane = 0;
    let prevPct = -100;
    const markers = ordered.map((session, index) => {
      const pct = toPct(hourOf(session.date));
      lane = pct - prevPct < CLUSTER_PCT ? (lane === 0 ? 1 : 0) : 0;
      prevPct = pct;
      return {
        session,
        index: index + 1,
        pct,
        stem: lane === 0 ? SHORT_STEM : TALL_STEM,
      };
    });

    const totalMs = ordered.reduce((sum, s) => sum + s.timeMs, 0);

    return { ticks, toPct, markers, totalMs, count: ordered.length };
  }, [sessions]);

  if (!model) return null;

  const baselineTop = CONTAINER_HEIGHT - BASELINE_FROM_BOTTOM;

  return (
    <section className="rounded-xl bg-white/[0.03] p-4 backdrop-blur-sm sm:p-5">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-[15px] font-semibold text-zinc-100">
          {t("timeline.heading")}
        </h3>
        <p className="flex items-center gap-2.5 text-[11px] tabular-nums text-zinc-500">
          <span>{t("page.day_sessions", { count: model.count })}</span>
          <span>{convertMsToHM(model.totalMs)}h</span>
        </p>
      </div>

      <div
        className="relative w-full"
        style={{ height: CONTAINER_HEIGHT }}
        aria-hidden="true"
      >
        {/* baseline */}
        <div
          className="absolute inset-x-0 h-px bg-white/10"
          style={{ top: baselineTop }}
        />

        {/* hour ticks + labels */}
        {model.ticks.map((h) => (
          <div
            key={h}
            className="absolute flex -translate-x-1/2 flex-col items-center"
            style={{ top: baselineTop, left: `${model.toPct(h)}%` }}
          >
            <span className="h-1.5 w-px bg-white/15" />
            <span className="mt-1.5 text-[10px] tabular-nums text-zinc-600">
              {hourLabel(h)}
            </span>
          </div>
        ))}

        {/* session milestones */}
        {model.markers.map(({ session, index, pct, stem }) => {
          const style = SESSION_TYPE_CONFIG[session.type];
          return (
            <div
              key={session.id}
              className="absolute flex -translate-x-1/2 flex-col items-center"
              style={{ bottom: BASELINE_FROM_BOTTOM, left: `${pct}%` }}
            >
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-lg",
                  style.accentSolid,
                  style.accentText
                )}
              >
                {index}
              </div>
              <div
                className={cn("w-0 border-l-2 border-dotted", style.accentBorder)}
                style={{ height: stem }}
              />
              <div
                className={cn("h-2 w-2 rounded-full", style.accentSolid)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};
