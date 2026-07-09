import React from 'react';

// next-mdx-remote v6 strips JSX expression attributes from MDX content, so props
// must survive as plain strings — same pipe-delimited convention as AppCard.
interface StepListProps {
  /** Pipe-delimited items, each formatted as "Title::Description". */
  steps: string;
}

const parseSteps = (value: string) =>
  value
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [title, description] = item.split('::').map((part) => part.trim());
      return { title, description };
    });

export const StepList = ({ steps }: StepListProps) => {
  const items = parseSteps(steps);

  return (
    <div className="not-prose my-10 flex flex-col gap-3">
      {items.map((step, index) => (
        <div
          key={step.title}
          className="flex gap-4 rounded-xl border border-white/10 bg-zinc-900/40 p-5"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-sm font-bold text-cyan-400">
            {index + 1}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white">{step.title}</div>
            {step.description && (
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">{step.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
