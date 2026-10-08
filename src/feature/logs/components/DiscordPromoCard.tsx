import { cn } from "assets/lib/utils";
import { HeroPattern } from "components/UI/HeroBanner";
import { DISCORD_INVITE_URL } from "constants/community";
import { getDiscordPromoCopy } from "feature/logs/content/discordPromoVariants";
import type { FirebaseLogsDiscordPromoInterface } from "feature/logs/types/logs.type";
import { useTranslation } from "hooks/useTranslation";
import { FaDiscord } from "react-icons/fa6";
import { addZeroToTime } from "utils/converter";

/**
 * The occasional "come hang out on Discord" card. Built like the support ask —
 * a tiled icon pattern under a soft glow — but mirrored to the right edge and
 * in Discord's blurple, so the two never read as the same card.
 */
export const DiscordPromoCard = ({
  log,
  isNew,
}: {
  log: FirebaseLogsDiscordPromoInterface;
  isNew: boolean;
}) => {
  const { t } = useTranslation("feed");
  const copy = getDiscordPromoCopy(log.variant, t);
  const date = new Date(log.data);

  return (
    <div
      className={cn(
        "relative my-3 overflow-hidden rounded-xl transition-colors duration-300",
        isNew ? "bg-zinc-800/70" : "bg-zinc-900/60",
      )}>
      <HeroPattern
        variant='community'
        className='opacity-[0.1]'
        maskImage='linear-gradient(to left, black 0%, transparent 60%)'
      />
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-l from-indigo-500/15 via-transparent to-transparent' />

      <div className='relative z-10 flex flex-col items-start gap-2 px-4 py-5 sm:max-w-[70%] sm:px-6'>
        <p className='flex items-center gap-2 text-xs font-semibold text-indigo-300'>
          {t("discord_promo.eyebrow")}
          <span className='font-normal text-zinc-500'>
            {addZeroToTime(date.getHours())}:{addZeroToTime(date.getMinutes())}
          </span>
        </p>
        <h3 className='text-base font-bold leading-snug text-white sm:text-lg'>
          {copy.headline}
        </h3>
        <p className='text-sm text-zinc-400'>{copy.body}</p>
        <a
          href={DISCORD_INVITE_URL}
          target='_blank'
          rel='noopener noreferrer'
          className='mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400'>
          <FaDiscord size={22} />
          {t("discord_promo.join")}
        </a>
      </div>
    </div>
  );
};
