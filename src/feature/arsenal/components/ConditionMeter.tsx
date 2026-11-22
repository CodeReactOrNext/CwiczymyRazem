import { Chip } from "assets/components/ui/chip";
import { cn } from "assets/lib/utils";
import {
  CONDITION_TIERS,
  getConditionGrade,
  getConditionTier,
} from "feature/arsenal/data/itemStats";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { readableText } from "lib/colorTheme/colorTheme";

interface ConditionMeterProps {
  condition: number;
  /** Hides the "Condition / grade" caption when the surrounding UI already says it. */
  showLabel?: boolean;
  /** Muted treatment for the "before" half of a before → after pair. */
  dimmed?: boolean;
  /**
   * The grade was reached in the workshop rather than at mint.
   *
   * It rides with the meter rather than living next to it, so every surface that
   * shows a condition shows this too — the marketplace above all, where a buyer
   * would otherwise have no way to tell a restored Museum grade from a minted one.
   */
  restored?: boolean;
  className?: string;
}

/**
 * The segmented condition bar from the item cards.
 *
 * Shared rather than copied so a repair preview reads as the same meter the
 * player will see on the card once the job is done.
 */
export const ConditionMeter = ({
  condition,
  showLabel = true,
  dimmed = false,
  restored = false,
  className,
}: ConditionMeterProps) => {
  const grade = getConditionGrade(condition);
  const labels = useArsenalLabels();
  const { t } = labels;
  const gradeLabel = labels.condition(grade);
  const tier = getConditionTier(condition);

  return (
    <div
      className={cn("flex flex-col gap-1", className)}
      title={
        restored
          ? t("condition.title_restored", { grade: gradeLabel })
          : t("condition.title", { grade: gradeLabel })
      }>
      {showLabel && (
        <div className='flex items-center justify-between gap-3'>
          <span className='text-xs font-medium text-zinc-400'>
            {t("condition.label")}
          </span>
          <span className='flex items-baseline gap-1.5'>
            {restored && (
              <Chip color='gray' size='sm'>
                {t("condition.restored")}
              </Chip>
            )}
            <span
              className='light-flat text-xs font-bold'
              style={{
                color: readableText(dimmed ? "#a1a1aa" : grade.color),
                textShadow: dimmed ? undefined : `0 0 8px ${grade.color}55`,
              }}>
              {gradeLabel}
            </span>
          </span>
        </div>
      )}

      <div className='flex items-center gap-1'>
        {Array.from({ length: CONDITION_TIERS }).map((_, i) => (
          <span
            key={i}
            className='h-1.5 flex-1 rounded-full transition-colors'
            style={{
              background: i < tier ? grade.color : "#27272a",
              opacity: dimmed && i < tier ? 0.5 : 1,
              boxShadow:
                !dimmed && i < tier ? `0 0 6px ${grade.color}70` : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
};
