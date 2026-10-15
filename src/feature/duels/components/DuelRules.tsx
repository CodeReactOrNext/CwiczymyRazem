import { Card } from "assets/components/ui/card";
import { useTranslation } from "hooks/useTranslation";

const RULE_COUNT = 6;

/** The whole format in six numbered lines — what a first-time player needs before joining. */
export const DuelRules = () => {
  const { t } = useTranslation("duels");
  return (
    <Card className='p-5 sm:p-6'>
      <h2 className='text-base font-semibold text-zinc-100'>
        {t("rules.title")}
      </h2>
      <ol className='mt-4 space-y-3'>
        {Array.from({ length: RULE_COUNT }, (_, i) => (
          <li
            key={i}
            className='flex gap-3 text-sm leading-relaxed text-zinc-400'>
            <span className='w-5 shrink-0 pt-px text-xs font-semibold tabular-nums text-zinc-500'>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>{t(`rules.${i}`)}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
};
