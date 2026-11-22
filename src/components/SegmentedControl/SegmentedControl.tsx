import { cn } from "assets/lib/utils";
import { inkAccent } from "lib/colorTheme/colorTheme";
import { Loader2 } from "lucide-react";
import { type ReactNode, useState } from "react";

/**
 * The app's one switch for "show me this slice": a tray with the choices side
 * by side and the picked one raised as a key. For filters and view
 * switches inside a page — category, rarity, owned or missing — not for page
 * navigation, which is the tab bar's job.
 *
 * A tray, not a row of keys: a filter drawn as six separate keys read as one
 * more row of buttons.
 *
 * Two ways in. `SegmentedControl` takes a list of options and does the rest —
 * use it whenever the choices are plain data. `SegmentGroup` + `Segment` are
 * the same parts for a toolbar that needs something custom inside a segment.
 */

/** The tray. Scrolls sideways on a narrow screen instead of wrapping. */
export const SegmentGroup = ({
  children,
  className,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
  "aria-busy"?: boolean;
}) => (
  <div
    role='group'
    className={cn(
      // A slot darker than the page, so the choices read as parts of one
      // control: on a tray as light as their own plates they came apart into
      // a row of separate buttons.
      // As wide as its choices, never the whole row: stretched across the page
      // it read as a bar of navigation. The 12px corner is the one place the
      // app goes past rounded-lg — it is what keeps the tray concentric with
      // the 8px keys inside its 4px padding.
      "no-scrollbar inline-flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-zinc-950/40 p-[5px]",
      className,
    )}
    {...rest}>
    {children}
  </div>
);

/** One choice in the tray. */
export const Segment = ({
  active,
  onClick,
  children,
  className,
  style,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <button
    type='button'
    onClick={onClick}
    aria-pressed={active}
    style={style}
    className={cn(
      // 44px tall under the finger, 32px with a mouse; the tray's 8px corner
      // minus its 4px padding leaves this 4px one concentric with it.
      // Every segment carries the 3px bottom edge, so picking one does not
      // nudge the labels; only the picked one paints it.
      "flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border-b-[3px] px-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:h-[34px]",
      // The picked segment is a key — the face and lip of the app's buttons —
      // sitting in the tray; the rest stay flat text. That is the whole
      // difference from a row of keys: one is down in a slot, not six in a row.
      active
        ? "border-b-black/30 bg-zinc-700 text-zinc-50"
        : // Not bare text: with nothing picked (a multi-select at rest) a tray
          // of plain words did not say it could be clicked. A faint plate under
          // each choice does; the picked one still stands out by its lip.
          "border-b-transparent bg-zinc-800/20 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100",
      className,
    )}>
    {children}
  </button>
);

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  /** Stands in for `label` on a phone, where three full names do not fit side by side. */
  shortLabel?: string;
  icon?: ReactNode;
  /** How many items the choice leaves on the list; shown quietly after the label. */
  count?: number;
  /** A colour the choice owns (a rarity, a song tier): a dot before the label, and the label itself once picked. */
  accent?: string;
}

interface SegmentedControlProps<T extends string> {
  /** What the control switches, for screen readers — it is not drawn. */
  label: string;
  options: SegmentOption<T>[];
  /** The picked values: one for a single choice, any number with `multiple`. */
  selected: T[];
  /** Each segment toggles on its own, so several can be on at once. */
  multiple?: boolean;
  onSelect: (value: T) => void;
  /**
   * The list this control narrows is being fetched. The segment that was
   * clicked last trades its icon or dot for a spinner until this goes false,
   * so the click visibly did something while the old results are still up.
   */
  isLoading?: boolean;
  className?: string;
}

export const SegmentedControl = <T extends string>({
  label,
  options,
  selected,
  onSelect,
  isLoading = false,
  className,
}: SegmentedControlProps<T>) => {
  // Which segment the current wait belongs to. Kept after loading ends —
  // it only shows while `isLoading` is on.
  const [lastPicked, setLastPicked] = useState<T | null>(null);

  return (
    <SegmentGroup
      aria-label={label}
      aria-busy={isLoading || undefined}
      className={className}>
      {options.map((option) => {
        const active = selected.includes(option.value);
        const isBusy = isLoading && lastPicked === option.value;
        return (
          <Segment
            key={option.value}
            active={active}
            onClick={() => {
              setLastPicked(option.value);
              onSelect(option.value);
            }}
            style={
              active && option.accent
                ? { color: inkAccent(option.accent) }
                : undefined
            }>
            {isBusy ? (
              // In the icon's or the dot's place, and no wider than a dot's
              // slot would allow without a jump: the label stays where it was.
              <Loader2
                aria-hidden
                className='h-3.5 w-3.5 shrink-0 animate-spin'
              />
            ) : (
              <>
                {option.icon}
                {option.accent && (
                  <span
                    aria-hidden
                    className='mx-1 h-1.5 w-1.5 shrink-0 rounded-full'
                    style={{ backgroundColor: option.accent }}
                  />
                )}
              </>
            )}
            {option.shortLabel ? (
              <>
                <span className='sm:hidden'>{option.shortLabel}</span>
                <span className='hidden sm:inline'>{option.label}</span>
              </>
            ) : (
              option.label
            )}
            {option.count !== undefined && (
              // The space is for the accessible name ("Theory 4", not
              // "Theory4"); in a flex row it draws nothing.
              <>
                {" "}
                <span className='font-medium tabular-nums text-zinc-400'>
                  {option.count}
                </span>
              </>
            )}
          </Segment>
        );
      })}
    </SegmentGroup>
  );
};
