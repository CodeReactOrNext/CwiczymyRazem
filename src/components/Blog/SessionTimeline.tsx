import React from 'react';

interface SessionTimelineProps {
  /** Pipe-delimited "Label:Minutes" pairs, e.g. "Warm-Up:10|Technique:20". MDX
   *  content compiles with no scope, so props must survive as plain strings. */
  blocks: string;
  title?: string;
}

export const SessionTimeline = ({ blocks, title }: SessionTimelineProps) => {
  const segments = blocks.split('|').map((block) => {
    const [label, minutes] = block.split(':');
    return { label, minutes: Number(minutes) };
  });
  const total = segments.reduce((sum, s) => sum + s.minutes, 0);

  return (
    <div className="not-prose my-10 space-y-4">
      {title && <p className="text-sm font-medium text-zinc-200">{title}</p>}

      <div className="space-y-2">
        {segments.map((segment, i) => (
          <div key={segment.label} className="flex items-baseline gap-4 py-3 px-4 rounded-lg bg-zinc-900/40">
            <span className="text-sm font-medium text-cyan-400 shrink-0 w-6">{i + 1}.</span>
            <span className="text-white flex-1">{segment.label}</span>
            <span className="text-zinc-400 shrink-0">{segment.minutes} min</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-500 pt-2">{total} minutes total</p>
    </div>
  );
};
