import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import {
  getGatedSkillPower,
  MIN_LEARNED_SONGS_FOR_TIER,
} from "feature/songs/utils/difficulty.utils";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { useTranslation } from "hooks/useTranslation";
import { Lock } from "lucide-react";

interface SongTierBadgeProps {
  /** Learned songs of the profile owner. Undefined once the fetch has failed. */
  learnedSongs: { avgDifficulty?: number }[] | undefined;
  isLoading?: boolean;
  /** The fetch failed — say so instead of passing it off as an unrated player. */
  isError?: boolean;
  /** Second person on your own dashboard, third person on someone's profile. */
  isOwnProfile?: boolean;
  onClick?: () => void;
}

const HOW_IT_WORKS =
  "A tier is a weighted average of the hardest mastered songs, capped by the difficulty of the hardest one — so a single hard song won't jump anyone to a high tier.";

const UNRATED_COLOR = "#A1A1AA";

/**
 * The "Song tier" badge, shared by the dashboard and the profile page.
 *
 * An unrated player used to render as a bare "?", which reads the same whether
 * the songs are still loading, the fetch died, or the player simply hasn't
 * learned five songs yet. The badge now says which of those it is.
 */
export const SongTierBadge = ({
  learnedSongs,
  isLoading = false,
  isError = false,
  isOwnProfile = false,
  onClick,
}: SongTierBadgeProps) => {
  const { t } = useTranslation("profile");
  const learned = learnedSongs ?? [];
  const skillPower = getGatedSkillPower(learned);
  const tier = getSongTier(skillPower > 0 ? skillPower : "?");
  const songsToUnlock = Math.max(
    MIN_LEARNED_SONGS_FOR_TIER - learned.length,
    0,
  );
  const hasTier = skillPower > 0;

  // A failed fetch has no repertoire to judge, so it is answered before the
  // "not enough songs yet" wording — otherwise an outage reads as an empty
  // song board.
  const moreSongs = (key: "more" | "learn_own" | "learn_other") =>
    t(`tier_badge.${key}${songsToUnlock === 1 ? "_one" : ""}`, {
      count: songsToUnlock,
    });
  const howItWorks = t("tier_badge.how_it_works", HOW_IT_WORKS);

  const subLabel = isError
    ? t("tier_badge.unavailable")
    : hasTier
      ? tier.label
      : songsToUnlock > 0
        ? moreSongs("more")
        : t("tier_badge.no_rated");

  const tooltip = isLoading
    ? t("tier_badge.loading")
    : isError
      ? t("tier_badge.error")
      : hasTier
        ? `${howItWorks}${isOwnProfile ? ` ${t("tier_badge.click_board")}` : ""}`
        : songsToUnlock > 0
          ? `${isOwnProfile ? moreSongs("learn_own") : moreSongs("learn_other")} ${howItWorks}`
          : `${
              isOwnProfile
                ? t("tier_badge.none_rated_own")
                : t("tier_badge.none_rated_other")
            } ${howItWorks}`;

  const content = (
    <>
      <span className='text-xs font-semibold tracking-widest text-zinc-400'>
        {t("tier_badge.label")}
      </span>
      {isLoading ? (
        <div className='h-14 w-14 shrink-0 animate-pulse rounded-xl bg-zinc-800/60' />
      ) : (
        <div
          className='flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 text-2xl font-black shadow-lg'
          style={{
            color: tier.color,
            backgroundColor: "rgba(10,10,10,0.9)",
            borderColor: `${tier.color}40`,
          }}>
          {hasTier || isError ? (
            tier.tier
          ) : (
            <Lock className='h-5 w-5 text-zinc-500' aria-hidden />
          )}
        </div>
      )}
      {isLoading ? (
        <div className='h-3 w-16 animate-pulse rounded bg-zinc-800/60' />
      ) : (
        <span
          className='text-[11px] font-medium'
          style={{ color: hasTier ? tier.color : UNRATED_COLOR }}>
          {subLabel}
        </span>
      )}
    </>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {onClick ? (
            <button
              type='button'
              onClick={onClick}
              className='relative flex flex-col items-center gap-1.5 rounded-lg p-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-white/5'>
              {content}
            </button>
          ) : (
            <div className='relative flex flex-col items-center gap-1.5 p-1'>
              {content}
            </div>
          )}
        </TooltipTrigger>
        <TooltipContent
          side='bottom'
          className='max-w-[240px] text-center leading-relaxed text-zinc-800'>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
