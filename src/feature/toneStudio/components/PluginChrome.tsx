import { cn } from "assets/lib/utils";
import { PLATE_NOISE_BG } from "feature/arsenal/components/TierPlate";
import type { ToneAccent } from "feature/toneStudio/utils/chain";
import { ACCENT_HEX, ledGlow } from "feature/toneStudio/utils/chassis";
import type { ReactNode } from "react";

/**
 * The small parts every panel of the plugin window is assembled from — grain,
 * LEDs, plate buttons, segmented switches. A plugin looks like one machine
 * because its screws are all the same screw; these are the screws.
 */

/** Grain, blended into the plate rather than laid over it as a haze. */
export const Grain = ({ opacity = 0.05 }: { opacity?: number }) => (
  <span
    aria-hidden
    className='pointer-events-none absolute inset-0 mix-blend-overlay'
    style={{
      opacity,
      backgroundImage: PLATE_NOISE_BG,
      backgroundSize: "140px 140px",
    }}
  />
);

interface LedProps {
  on: boolean;
  accent: ToneAccent;
  size?: number;
}

/** The lamp on a pedal: lit in the block's own colour, dark glass when bypassed. */
export const Led = ({ on, accent, size = 7 }: LedProps) => (
  <span
    aria-hidden
    className='inline-block shrink-0 rounded-full transition-all'
    style={{
      width: size,
      height: size,
      background: on
        ? `radial-gradient(circle at 35% 30%, #ffffff, ${ACCENT_HEX[accent]} 60%, ${ACCENT_HEX[accent]}aa 100%)`
        : "radial-gradient(circle at 35% 30%, #3a3a40, #17171a 70%)",
      boxShadow: on ? ledGlow(accent) : "inset 0 1px 2px rgba(0,0,0,0.8)",
    }}
  />
);

/** A machined button on the faceplate — the plugin's answer to a text link. */
export const plateButtonClass = (active?: boolean) =>
  cn(
    "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm transition-colors disabled:opacity-40",
    active
      ? "bg-zinc-700/70 text-zinc-100"
      : "bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/60 hover:text-white",
  );

interface SegmentedControlProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  accent?: ToneAccent;
}

/** Two-position mode switch, recessed into its own well like a hardware toggle. */
export const SegmentedControl = <T extends string>({
  value,
  options,
  onChange,
  accent = "cyan",
}: SegmentedControlProps<T>) => (
  <div
    className='flex items-center gap-1 rounded-md p-1'
    style={{
      background: "#0b0b0d",
      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.8)",
    }}>
    {options.map((option) => {
      const active = option.value === value;
      return (
        <button
          key={option.value}
          type='button'
          onClick={() => onChange(option.value)}
          className='rounded px-3 py-1 text-[11px] font-medium transition-colors'
          style={
            active
              ? {
                  color: ACCENT_HEX[accent],
                  background: `${ACCENT_HEX[accent]}1a`,
                }
              : { color: "#71717a" }
          }>
          {option.label}
        </button>
      );
    })}
  </div>
);

interface BypassSwitchProps {
  active: boolean;
  accent: ToneAccent;
  onToggle: () => void;
  label?: string;
}

/** Engaged/bypassed for a chain block — a lamp plus a switch track, so it reads
 *  as something you click rather than a status word. */
export const BypassSwitch = ({
  active,
  accent,
  onToggle,
  label,
}: BypassSwitchProps) => (
  <button
    type='button'
    onClick={onToggle}
    title={active ? "Bypass this block" : "Engage this block"}
    className='flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors hover:bg-zinc-800/60'>
    <Led on={active} accent={accent} size={9} />
    <span
      className='relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors'
      style={{
        background: active ? ACCENT_HEX[accent] : "#3f3f46",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6)",
      }}>
      <span
        className={cn(
          "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
          active && "translate-x-4",
        )}
      />
    </span>
    <span style={{ color: active ? ACCENT_HEX[accent] : "#71717a" }}>
      {label ?? (active ? "On" : "Bypassed")}
    </span>
  </button>
);

interface PowerRockerProps {
  on: boolean;
  disabled?: boolean;
  onToggle: () => void;
  /** Shown when the switch cannot be thrown — why, rather than what it does. */
  disabledReason?: string;
}

/**
 * The window's mains switch.
 *
 * It used to be a text button reading "Running", which is a description of the
 * state rather than a switch: nothing about it said it could be thrown, and
 * nothing said what throwing it would do. This is the rocker an amp actually
 * has — it tilts, its lens lights when current is flowing, and the label next
 * to it names the action rather than the status.
 */
export const PowerRocker = ({
  on,
  disabled,
  onToggle,
  disabledReason,
}: PowerRockerProps) => (
  <button
    type='button'
    onClick={onToggle}
    disabled={disabled}
    title={disabledReason ?? (on ? "Turn the amp off" : "Turn the amp on")}
    className='group flex shrink-0 items-center gap-2.5 rounded-md px-1.5 py-1 transition-opacity disabled:opacity-40'>
    <span
      className='relative block h-9 w-[26px] rounded'
      style={{
        background: "#08080a",
        boxShadow: "inset 0 2px 6px rgba(0,0,0,0.95)",
        perspective: "110px",
      }}>
      <span
        className='absolute inset-[2px] flex items-center justify-center rounded-[3px] transition-transform duration-150'
        style={{
          // Pressed in at the bottom when live, at the top when dead — the way
          // you can tell a rocker's position across a dark stage.
          transform: `rotateX(${on ? -15 : 15}deg)`,
          background: "linear-gradient(#42424a 0%, #26262c 46%, #16161a 100%)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.7)",
        }}>
        <span
          className='block h-[14px] w-[10px] rounded-[2px] transition-all'
          style={{
            background: on
              ? "linear-gradient(#fff3d0, #ffb347 45%, #e8761a)"
              : "linear-gradient(#3a2a1c, #241a12)",
            boxShadow: on
              ? "0 0 7px rgba(255,170,60,0.9), 0 0 16px rgba(255,140,30,0.55)"
              : "inset 0 1px 2px rgba(0,0,0,0.8)",
          }}
        />
      </span>
    </span>

    <span className='flex flex-col items-start leading-tight'>
      <span className='text-sm font-medium text-zinc-200'>
        {on ? "Turn off" : "Turn on"}
      </span>
      <span
        className='font-mono text-[10px]'
        style={{ color: on ? "#fbbf24" : "#52525b" }}>
        {on ? "live" : "silent"}
      </span>
    </span>
  </button>
);

interface PickerRowProps {
  selected: boolean;
  accent: ToneAccent;
  onSelect: () => void;
  disabled?: boolean;
  children: ReactNode;
  /** Trailing control (delete), outside the selecting button. */
  action?: ReactNode;
}

/** One entry in a loaded-file list (IRs, NAM captures, presets). */
export const PickerRow = ({
  selected,
  accent,
  onSelect,
  disabled,
  children,
  action,
}: PickerRowProps) => (
  <div
    className='flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors'
    style={{
      background: selected ? `${ACCENT_HEX[accent]}14` : "rgba(39,39,42,0.4)",
      color: selected ? ACCENT_HEX[accent] : "#d4d4d8",
    }}>
    <button
      type='button'
      disabled={disabled}
      onClick={onSelect}
      className='flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-not-allowed'>
      {children}
    </button>
    {action}
  </div>
);
