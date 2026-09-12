import { cn } from "assets/lib/utils";
import { Grain } from "feature/toneStudio/components/PluginChrome";
import type { ToneAccent } from "feature/toneStudio/utils/chain";
import { accentWash, FACEPLATE_WASH } from "feature/toneStudio/utils/chassis";
import type { ReactNode } from "react";

interface FaceplateProps {
  accent: ToneAccent;
  title: string;
  /** The line printed under the model name on a real panel. */
  subtitle?: string;
  headerRight?: ReactNode;
  /** Dims the controls when the block is bypassed — the plate stays lit, the
   *  same way a bypassed pedal is still sitting on the board. */
  bypassed?: boolean;
  children: ReactNode;
  contentClassName?: string;
}

/**
 * The plate the selected module's controls are bolted to: one brushed surface,
 * lit by the module's own colour from the top edge, filling the middle of the
 * window. Every module wears the same plate, so switching tabs changes the
 * controls without the window changing shape underneath them.
 */
export const Faceplate = ({
  accent,
  title,
  subtitle,
  headerRight,
  bypassed,
  children,
  contentClassName,
}: FaceplateProps) => (
  <div
    // One height for every module, set by the tallest (a pedal stood on end).
    // A plugin window does not resize itself when you change channel, and the
    // status rail below would jump if this did — so on a desktop-sized window
    // the height is fixed outright, and anything that can grow without bound
    // (a list of captures) scrolls inside it. Narrow windows stack their
    // content and get the height they need.
    className='relative flex min-h-[42rem] flex-col overflow-hidden rounded-lg lg:h-[42rem]'
    style={{
      backgroundImage: `${accentWash(accent)}, ${FACEPLATE_WASH}`,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
    }}>
    <Grain opacity={0.06} />

    <div className='relative flex items-start justify-between gap-4 px-6 pt-5'>
      <div className='min-w-0'>
        <h2 className='font-display text-lg leading-tight text-zinc-100'>
          {title}
        </h2>
        {subtitle && (
          <p className='mt-0.5 text-[11px] text-zinc-500'>{subtitle}</p>
        )}
      </div>
      {headerRight}
    </div>

    <div
      className={cn(
        "relative flex min-h-0 flex-1 flex-col px-6 pb-7 pt-6 transition-opacity",
        bypassed && "opacity-40",
        contentClassName,
      )}>
      {children}
    </div>
  </div>
);
