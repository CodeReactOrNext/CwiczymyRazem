import { Square } from 'lucide-react';
import React from 'react';

// MDX content is compiled with no scope, so props must survive as plain strings
// — same pipe-delimited convention as StepList/AppCard.
interface ChecklistProps {
  /** Pipe-delimited items, each formatted as "Title::Description". */
  items: string;
}

const parseItems = (value: string) =>
  value
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [title, description] = item.split('::').map((part) => part.trim());
      return { title, description };
    });

export const Checklist = ({ items }: ChecklistProps) => {
  const parsed = parseItems(items);

  return (
    <div className="not-prose my-10 flex flex-col gap-3">
      {parsed.map((item) => (
        <div
          key={item.title}
          className="flex gap-4 rounded-xl bg-zinc-900/40 p-5"
        >
          <Square
            className="h-6 w-6 shrink-0 text-cyan-400"
            strokeWidth={2.5}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <div className="font-bold text-white">{item.title}</div>
            {item.description && (
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">{item.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
