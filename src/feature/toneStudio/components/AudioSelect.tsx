import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import { cn } from "assets/lib/utils";
import type { ReactNode } from "react";

export interface AudioSelectOption {
  value: string;
  label: string;
  /** Dimmed suffix — channel counts, "default", latency… */
  hint?: string;
}

interface AudioSelectProps {
  label?: ReactNode;
  /** Slot on the label row — e.g. the "refresh devices" button. */
  labelRight?: ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  options: AudioSelectOption[];
  placeholder?: string;
  /** Helper line under the control. */
  hint?: string;
  disabled?: boolean;
  title?: string;
  /** "sm" for the cramped in-session popover, "md" for full pages. */
  size?: "sm" | "md";
  className?: string;
}

/**
 * The one picker every audio-device control uses (Tone Studio + the in-session
 * amp popover). Native <select> menus render with the OS chrome — a white
 * Windows listbox with a blue highlight in the middle of a dark panel — and
 * clip their own text behind the arrow, so this wraps the shared Radix select
 * and gives it the app's flat, borderless dark surface instead.
 */
export const AudioSelect = ({
  label,
  labelRight,
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  hint,
  disabled,
  title,
  size = "md",
  className,
}: AudioSelectProps) => (
  <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
    {(label || labelRight) && (
      <div className='flex min-h-[1rem] items-center justify-between gap-2 text-xs text-zinc-400'>
        <span className='truncate'>{label}</span>
        {labelRight}
      </div>
    )}
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled || options.length === 0}>
      <SelectTrigger
        title={title}
        className={cn(
          "w-full border-0 bg-zinc-800/70 text-zinc-100 shadow-none transition-colors focus:ring-1 focus:ring-cyan-500/40 disabled:opacity-40 data-[placeholder]:text-zinc-500 hover:bg-zinc-800",
          size === "sm" ? "h-8 px-2.5 text-xs" : "h-10 px-3 text-sm",
        )}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      {/* Above the in-session toolbar popover, which sits on a very high z-index. */}
      <SelectContent className='z-[999999999] max-h-72 border-0 bg-zinc-900 text-zinc-200'>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className={cn(
              "cursor-pointer focus:bg-zinc-800 focus:text-white",
              size === "sm" && "text-xs",
            )}>
            <span className='flex items-baseline gap-1.5'>
              {option.label}
              {option.hint && (
                <span className='text-zinc-500'>{option.hint}</span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    {hint && <span className='text-[11px] text-zinc-500'>{hint}</span>}
  </div>
);
