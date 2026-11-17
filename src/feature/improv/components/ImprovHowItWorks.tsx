import { Card } from "assets/components/ui/card";
import { IMPROV_ROUND_DAYS } from "feature/improv/types/improv.types";
import { useTranslation } from "hooks/useTranslation";
import { FaDiscord } from "react-icons/fa6";

const STEPS = ["listen", "record", "link", "discord"] as const;
const RULE_COUNT = 5;

/**
 * The whole format in four pictures, for somebody who has never seen it: play
 * over the track, film it, link it, talk about it on Discord. The line under
 * the steps says the part people don't expect — that the Discord side is not a
 * link in a footer but where the round actually lives.
 */
export const ImprovHowItWorks = () => {
  const { t } = useTranslation("improv");
  return (
    <Card className='p-5 sm:p-6'>
      <h2 className='text-base font-semibold text-zinc-100'>
        {t("how.title")}
      </h2>
      <p className='mt-1 max-w-2xl text-sm leading-relaxed text-zinc-400'>
        {t("how.intro", { days: IMPROV_ROUND_DAYS })}
      </p>

      <ol className='mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-4'>
        {STEPS.map((step, index) => (
          <li key={step} className='flex gap-4 xl:flex-col xl:gap-3'>
            <img
              src={`/images/improv/step-${step}.webp`}
              alt=''
              className='h-16 w-16 shrink-0 object-contain'
            />
            <div className='min-w-0'>
              <p className='text-sm font-semibold text-zinc-100'>
                <span className='mr-2 text-xs tabular-nums text-zinc-500'>
                  {String(index + 1).padStart(2, "0")}
                </span>
                {t(`how.steps.${step}.title`)}
              </p>
              <p className='mt-1 text-sm leading-relaxed text-zinc-400'>
                {t(`how.steps.${step}.body`)}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className='mt-8 flex gap-3 rounded-lg bg-indigo-500/10 px-4 py-3'>
        <FaDiscord className='mt-0.5 shrink-0 text-indigo-300' size={18} />
        <p className='text-sm leading-relaxed text-zinc-300'>
          <span className='font-semibold text-zinc-100'>
            {t("how.discord_title")}
          </span>{" "}
          {t("how.discord_body")}
        </p>
      </div>
    </Card>
  );
};

/** The house rules, numbered — short enough to read before the first take. */
export const ImprovRules = () => {
  const { t } = useTranslation("improv");
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
