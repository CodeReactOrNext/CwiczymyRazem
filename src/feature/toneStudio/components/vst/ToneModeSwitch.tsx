import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Blocks, SlidersHorizontal } from "lucide-react";
import type { AmpParams } from "types/nativeAudio";

interface ToneModeSwitchProps {
  value: AmpParams["toneMode"];
  onChange: (mode: AmpParams["toneMode"]) => void;
}

/** Built-in chain ↔ VST rack, on the top rail. Neutral when active: this is a
 *  place you are, not a state that means something. */
export const ToneModeSwitch = ({ value, onChange }: ToneModeSwitchProps) => {
  const { t } = useTranslation("tone_studio");
  const options = [
    {
      mode: "builtin" as const,
      label: t("mode.builtin_short"),
      Icon: SlidersHorizontal,
    },
    { mode: "vst" as const, label: t("mode.vst_short"), Icon: Blocks },
  ];

  return (
    <div
      role='radiogroup'
      aria-label={t("mode.switch_label")}
      className='flex shrink-0 items-center gap-1 rounded-lg bg-zinc-950/60 p-1'>
      {options.map(({ mode, label, Icon }) => {
        const active = value === mode;
        return (
          <button
            key={mode}
            type='button'
            role='radio'
            aria-checked={active}
            onClick={() => onChange(mode)}
            className={cn(
              "flex items-center gap-2 rounded px-3 py-1.5 text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
              active
                ? "bg-zinc-700/70 text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200",
            )}>
            <Icon
              size={15}
              className={active ? "text-zinc-200" : "text-zinc-500"}
            />
            {label}
          </button>
        );
      })}
    </div>
  );
};
