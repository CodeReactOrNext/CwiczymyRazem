import React from 'react';

interface Bar {
  labelLine1: string;
  labelLine2?: string;
  valueLabel: string;
  minutes: number;
  color: string;
}

const bars: Bar[] = [
  { labelLine1: 'Typical session', labelLine2: '(median)', valueLabel: '20 min', minutes: 20, color: '#0891b2' },
  { labelLine1: 'Average session', valueLabel: '60–80 min', minutes: 70, color: '#d97706' },
];

const CHART_MAX_MINUTES = 90;
const BAR_WIDTH = 24;
const CORNER_RADIUS = 4;
const BASELINE_Y = 220;
const CHART_TOP_Y = 20;
const CHART_HEIGHT = BASELINE_Y - CHART_TOP_Y;

const barPath = (x: number, minutes: number) => {
  const height = (minutes / CHART_MAX_MINUTES) * CHART_HEIGHT;
  const yTop = BASELINE_Y - height;
  const r = Math.min(CORNER_RADIUS, height);
  return {
    path: `M ${x},${BASELINE_Y} L ${x},${yTop + r} Q ${x},${yTop} ${x + r},${yTop} L ${x + BAR_WIDTH - r},${yTop} Q ${x + BAR_WIDTH},${yTop} ${x + BAR_WIDTH},${yTop + r} L ${x + BAR_WIDTH},${BASELINE_Y} Z`,
    yTop,
  };
};

const barXPositions = [90, 246];

export const SessionLengthChart = () => {
  return (
    <div className="my-10 rounded-lg bg-zinc-900/40 p-6">
      <p className="text-sm font-medium text-zinc-200">How long do Riff Quest sessions actually run?</p>
      <p className="mt-1 text-xs text-zinc-500">Real usage data from Riff Quest, June 28 – July 13, 2026</p>

      <svg viewBox="0 0 360 260" className="mt-6 w-full max-w-md" role="img" aria-label="Bar chart comparing typical (median) Riff Quest session length of 20 minutes against an average session length of 60 to 80 minutes.">
        <line x1={40} y1={BASELINE_Y} x2={320} y2={BASELINE_Y} stroke="#3f3f46" strokeWidth={1} />

        {bars.map((bar, i) => {
          const x = barXPositions[i];
          const { path, yTop } = barPath(x, bar.minutes);
          const labelX = x + BAR_WIDTH / 2;
          return (
            <g key={bar.labelLine1}>
              <path d={path} fill={bar.color} />
              <text x={labelX} y={yTop - 10} textAnchor="middle" fontSize={13} fontWeight={600} fill="#e4e4e7">
                {bar.valueLabel}
              </text>
              <text x={labelX} y={BASELINE_Y + 20} textAnchor="middle" fontSize={11} fill="#71717a">
                <tspan x={labelX} dy={0}>{bar.labelLine1}</tspan>
                {bar.labelLine2 && <tspan x={labelX} dy={14}>{bar.labelLine2}</tspan>}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="mt-4 text-xs leading-relaxed text-zinc-500">
        Average session length trends upward as players build the habit — it peaked at roughly 83 minutes during the week of June 28, 2026, well above the beginner baseline in this guide.
      </p>
    </div>
  );
};
