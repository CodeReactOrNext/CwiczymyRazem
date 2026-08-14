import { cn } from "assets/lib/utils";
import { withCurrencyIcons } from "components/CurrencyIcons/withCurrencyIcons";
import type { ReactNode } from "react";

interface AppScreenProps {
  /** What the screen is called in the app, shown as the mock window's header. */
  title: string;
  caption?: string;
  className?: string;
  children: ReactNode;
}

/**
 * A stand-in for a screenshot: a mock app window drawn with the same components
 * and colours as the real screen, so wiki articles can show what something looks
 * like without shipping (and re-shooting) image files.
 */
export const AppScreen = ({
  title,
  caption,
  className,
  children,
}: AppScreenProps) => (
  <figure className='not-prose my-10'>
    <div className={cn("rounded-lg bg-zinc-900/40 p-5 sm:p-6", className)}>
      <div className='mb-5 flex items-center gap-2.5'>
        <span className='h-2 w-2 rounded-full bg-zinc-700' aria-hidden='true' />
        <span className='h-2 w-2 rounded-full bg-zinc-700' aria-hidden='true' />
        <span className='h-2 w-2 rounded-full bg-zinc-700' aria-hidden='true' />
        <span className='ml-2 text-xs font-bold text-zinc-400'>{title}</span>
      </div>
      {children}
    </div>
    {caption && (
      <figcaption className='mt-3 text-xs text-zinc-500'>
        {withCurrencyIcons(caption)}
      </figcaption>
    )}
  </figure>
);
