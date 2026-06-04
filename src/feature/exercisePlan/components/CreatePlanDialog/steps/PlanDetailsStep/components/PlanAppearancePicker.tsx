import { cn } from "assets/lib/utils";
import {
  getPlanColor,
  PLAN_COLORS,
  PLAN_ICONS,
} from "feature/exercisePlan/data/planAppearance";
import { Check } from "lucide-react";

interface PlanAppearancePickerProps {
  icon?: string;
  color?: string;
  onIconChange: (id: string | undefined) => void;
  onColorChange: (id: string | undefined) => void;
}

export const PlanAppearancePicker = ({
  icon,
  color,
  onIconChange,
  onColorChange,
}: PlanAppearancePickerProps) => {
  const accent = getPlanColor(color);

  return (
    <div className="space-y-4">
      {/* Icon */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold tracking-wider text-zinc-500">Icon</p>
          {icon && (
            <button
              type="button"
              onClick={() => onIconChange(undefined)}
              className="text-[11px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded px-1"
            >
              Reset to auto
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {PLAN_ICONS.map(({ id, label, Icon }) => {
            const isSelected = icon === id;
            return (
              <button
                key={id}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={isSelected}
                onClick={() => onIconChange(isSelected ? undefined : id)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  isSelected
                    ? accent
                      ? accent.iconTile
                      : "bg-white/10 text-white"
                    : "bg-zinc-900/50 text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Color */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold tracking-wider text-zinc-500">Color</p>
          {color && (
            <button
              type="button"
              onClick={() => onColorChange(undefined)}
              className="text-[11px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded px-1"
            >
              Reset to auto
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2.5">
          {PLAN_COLORS.map((c) => {
            const isSelected = color === c.id;
            return (
              <button
                key={c.id}
                type="button"
                title={c.label}
                aria-label={c.label}
                aria-pressed={isSelected}
                onClick={() => onColorChange(isSelected ? undefined : c.id)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  c.swatch,
                  isSelected && "ring-2 ring-white/70 ring-offset-2 ring-offset-zinc-950"
                )}
              >
                {isSelected && <Check className="h-4 w-4 text-zinc-950" />}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-zinc-600">
        Leave unselected to use the automatic style based on your exercises.
      </p>
    </div>
  );
};
