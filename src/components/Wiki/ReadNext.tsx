import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { parsePairs } from "./parseProps";

interface ReadNextProps {
  /** Pipe-separated `"Label::/wiki/slug"` pairs. */
  links: string;
}

/** Where to go after an article — every wiki page ends with one of these. */
export const ReadNext = ({ links }: ReadNextProps) => {
  const items = parsePairs(links);

  return (
    <div className='not-prose my-10'>
      <p className='mb-3 text-xs font-bold text-zinc-400'>Read next</p>
      <div className='grid gap-3 sm:grid-cols-2'>
        {items.map((item) => (
          <Link
            key={item.title}
            href={item.description ?? "/wiki"}
            className='flex items-center justify-between gap-4 rounded-lg bg-zinc-900/40 px-5 py-4 text-sm font-bold text-zinc-200 no-underline transition-colors hover:bg-zinc-800/60 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
            {item.title}
            <ArrowRight className='h-4 w-4 shrink-0 text-zinc-500' aria-hidden='true' />
          </Link>
        ))}
      </div>
    </div>
  );
};
