import { cn } from "assets/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  /** Accessible name when no visible <label> points at the switch. */
  "aria-label"?: string;
  id?: string;
}

/** On/off switch (role="switch"). Cyan when on, per the semantic palette. */
export const Switch = ({ checked, onChange, disabled, id, "aria-label": ariaLabel }: SwitchProps) => (
  <button
    type="button"
    role="switch"
    id={id}
    aria-checked={checked}
    aria-label={ariaLabel}
    disabled={disabled}
    onClick={onChange}
    className={cn(
      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-base outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50",
      checked ? "bg-cyan-500" : "bg-zinc-700"
    )}
  >
    <span
      className={cn(
        "inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-base",
        checked ? "translate-x-[22px]" : "translate-x-0.5"
      )}
    />
  </button>
);
