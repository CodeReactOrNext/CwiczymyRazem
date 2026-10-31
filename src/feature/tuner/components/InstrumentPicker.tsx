import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import type { Instrument } from "utils/audio/tunings";
import { INSTRUMENTS } from "utils/audio/tunings";

interface InstrumentPickerProps {
  value: Instrument;
  onChange: (instrument: Instrument) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/** Segmented Guitar / Bass picker — which instrument tabs, tunings and pitch detection are for. */
export const InstrumentPicker = ({
  value,
  onChange,
  disabled = false,
  size = "md",
  className,
}: InstrumentPickerProps) => {
  const { t } = useTranslation("session");

  return (
    <div
      role='radiogroup'
      aria-label={t("tuning_modal.instrument")}
      className={cn(
        "flex gap-1 rounded-lg bg-zinc-900/60 p-1",
        disabled && "pointer-events-none opacity-40",
        className
      )}>
      {INSTRUMENTS.map((option) => {
        const isActive = value === option;
        return (
          <button
            key={option}
            type='button'
            role='radio'
            aria-checked={isActive}
            disabled={disabled}
            onClick={() => onChange(option)}
            className={cn(
              "flex flex-1 items-center justify-center rounded font-semibold transition-background click-behavior focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm",
              isActive
                ? "bg-zinc-700/80 text-white"
                : "text-zinc-300 hover:bg-zinc-800/70 hover:text-white"
            )}>
            {t(`tuning_modal.${option}`)}
          </button>
        );
      })}
    </div>
  );
};
