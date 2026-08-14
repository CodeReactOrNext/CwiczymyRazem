import { withCurrencyIcons } from "components/CurrencyIcons/withCurrencyIcons";
import React from "react";

interface StatRowProps {
  /** Pipe-delimited "Value:Label" pairs, e.g. "2,440+:guitarists on board". MDX
   *  content compiles with no scope, so props must survive as plain strings. */
  stats: string;
  caption?: string;
}

export const StatRow = ({ stats, caption }: StatRowProps) => {
  const items = stats.split("|").map((stat) => {
    const [value, label] = stat.split(":");
    return { value, label };
  });

  return (
    <div className='not-prose my-10 rounded-lg bg-zinc-900/40 p-6'>
      <div className='grid gap-6 sm:grid-cols-2'>
        {items.map((item) => (
          <div key={item.label}>
            <p className='text-4xl font-bold text-cyan-400'>
              {withCurrencyIcons(item.value)}
            </p>
            <p className='mt-1 text-sm text-zinc-400'>
              {withCurrencyIcons(item.label)}
            </p>
          </div>
        ))}
      </div>
      {caption && (
        <p className='mt-4 text-xs text-zinc-500'>
          {withCurrencyIcons(caption)}
        </p>
      )}
    </div>
  );
};
