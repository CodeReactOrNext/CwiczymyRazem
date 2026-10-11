import Avatar from "components/UI/Avatar";
import { HeroBanner } from "components/UI/HeroBanner";
import { IMG_RANKS_NUMBER } from "constants/gameSettings";
import { achievementsMap } from "feature/achievements/data/achievementsData";
import { achievementsRarity } from "feature/achievements/data/achievementsRarity";
import { getRarityColor } from "feature/arsenal/components/RarityBadge";
import { getEquippedRarity } from "feature/arsenal/data/equippedGuitar";
import { guitarDefinitionByImageId } from "feature/arsenal/data/guitarDefinitions";
import { useEquippedGuitar } from "feature/arsenal/hooks/useUserArsenal";
import { getRankBadgeSrc, isGuitarImageId } from "feature/arsenal/utils/guitarImage";
import { GuildTagBadge } from "feature/guilds/components/GuildTagBadge";
import { getProfileBanner } from "feature/profile/data/profileBanners";
import { PROFILE_ACCENT_COLORS } from "feature/profile/data/profileSectionCatalog";
import { useProfileLabels } from "feature/profile/hooks/useProfileLabels";
import type { ProfileLayoutConfig } from "feature/profile/types/profileLayout.types";
import {
  formatDaysAgo,
  resolveAccent,
  resolveBanner,
  resolveEmblem,
  resolveTitle,
} from "feature/profile/utils/profileLayout";
import type { Song } from "feature/songs/types/songs.type";
import { useIntlLocale } from "lib/i18n/dateLocale";
import type { ReactNode } from "react";
import { FaFire, FaSoundcloud, FaYoutube } from "react-icons/fa";
import type { ProfileInterface } from "types/ProfileInterface";
import { getYearsOfPlaying } from "utils/converter";
import { getPointsToLvlUp } from "utils/gameLogic";

import { SongTierBadge } from "./SongTierBadge";

interface ProfileHeaderProps {
  userData: ProfileInterface;
  userAuth: string;
  layout: ProfileLayoutConfig;
  streak: number;
  learnedSongs: Song[] | undefined;
  isSongsLoading: boolean;
  isSongsError: boolean;
}

const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className='min-w-0'>
    <dt className='text-[11px] font-medium text-zinc-500'>{label}</dt>
    <dd className='mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-zinc-100'>
      {children}
    </dd>
  </div>
);

/**
 * Who the player is, at a glance: name, their own one-liner, a handful of
 * labelled facts (each one the player can switch off), and the level ring.
 * Every value carries its label — a bare "Sublunar / Free Return Trajectory"
 * next to the points read like a rank the app invented, when it is the band
 * the player typed in.
 */
export const ProfileHeader = ({
  userData,
  userAuth,
  layout,
  streak,
  learnedSongs,
  isSongsLoading,
  isSongsError,
}: ProfileHeaderProps) => {
  const {
    statistics,
    displayName,
    avatar,
    guildBadge,
    createdAt,
    band,
    soundCloudLink,
    youTubeLink,
    guitarStartDate,
    selectedGuitar,
  } = userData;
  const labels = useProfileLabels();
  const { t } = labels;
  const intlLocale = useIntlLocale();
  const facts = new Set(layout.facts);
  const badges = new Set(layout.badges);
  const earned = statistics.achievements ?? [];
  const accent = PROFILE_ACCENT_COLORS[resolveAccent(layout, earned)];
  const titleId = resolveTitle(layout, earned);
  const titleData = titleId ? achievementsMap.get(titleId) : undefined;
  const bannerLayers = getProfileBanner(resolveBanner(layout, earned)).layers;
  const emblemId = resolveEmblem(layout, earned);
  const emblemData = emblemId ? achievementsMap.get(emblemId) : undefined;

  const yearsOfPlaying = guitarStartDate
    ? getYearsOfPlaying(guitarStartDate.toDate())
    : null;
  const lastPractice = formatDaysAgo(new Date(statistics.lastReportDate), undefined, t);

  const lvlXpStart = getPointsToLvlUp(statistics.lvl - 1);
  const lvlXpEnd = getPointsToLvlUp(statistics.lvl);
  let effectivePts = statistics.points;
  if (statistics.points < lvlXpStart && statistics.lvl > 1)
    effectivePts += lvlXpStart;
  const ptsInLevel = Math.max(0, effectivePts - lvlXpStart);
  const lvlRange = Math.max(1, lvlXpEnd - lvlXpStart);
  const xpPercent = Math.min(Math.max((ptsInLevel / lvlRange) * 100, 0), 100);
  const arcR = 38;
  const arcC = 2 * Math.PI * arcR;
  const arcOffset = arcC * (1 - xpPercent / 100);

  const { item: equippedGuitar } = useEquippedGuitar(userAuth);
  const imgPath =
    selectedGuitar ??
    (statistics.lvl >= IMG_RANKS_NUMBER ? IMG_RANKS_NUMBER : statistics.lvl);
  const isSpecialGuitar = isGuitarImageId(imgPath);
  const specialGuitarDef = isSpecialGuitar
    ? guitarDefinitionByImageId(imgPath)
    : null;
  // The banner is lit by what the guitar is now, not by what it was at mint —
  // the workshop can promote it, and the promotion only exists on the item.
  const equippedRarity = getEquippedRarity(equippedGuitar, specialGuitarDef);
  const glowColor = equippedRarity
    ? getRarityColor(equippedRarity)
    : accent.base;

  const showLinks = facts.has("links") && (youTubeLink || soundCloudLink);
  const factItems: ReactNode[] = [];
  if (facts.has("last-practice")) {
    factItems.push(
      <Fact key='last' label={labels.fact("last-practice")}>
        {lastPractice ?? t("header.not_yet")}
      </Fact>,
    );
  }
  if (facts.has("streak") && streak > 0) {
    factItems.push(
      <Fact key='streak' label={labels.fact("streak")}>
        <FaFire className='text-orange-500' size={13} />
        <span className='tabular-nums'>
          {t(streak === 1 ? "header.days_one" : "header.days", { count: streak })}
        </span>
      </Fact>,
    );
  }
  if (facts.has("joined")) {
    factItems.push(
      <Fact key='joined' label={labels.fact("joined")}>
        {createdAt.toDate().toLocaleDateString(intlLocale, {
          month: "short",
          year: "numeric",
        })}
      </Fact>,
    );
  }
  if (
    facts.has("playing-for") &&
    yearsOfPlaying != null &&
    yearsOfPlaying > 0
  ) {
    factItems.push(
      <Fact key='playing' label={t("header.playing_guitar")}>
        {t(yearsOfPlaying === 1 ? "header.years_one" : "header.years", { count: yearsOfPlaying })}
      </Fact>,
    );
  }
  if (facts.has("guild") && guildBadge?.tag) {
    factItems.push(
      <Fact key='guild' label={labels.fact("guild")}>
        <GuildTagBadge badge={guildBadge} size='md' />
      </Fact>,
    );
  }
  if (facts.has("band") && band?.trim()) {
    factItems.push(
      <Fact key='band' label={labels.fact("band")}>
        <span translate='no' className='truncate'>
          {band}
        </span>
      </Fact>,
    );
  }

  const showLevel = badges.has("level");
  const showTier = badges.has("song-tier");

  return (
    <HeroBanner
      eyebrow={t("header.eyebrow")}
      // A worn title replaces the generic eyebrow: it sits right above the
      // name the way a nameplate in a game reads — name, the Wizard.
      eyebrowContent={
        titleId && titleData ? (
          <p
            className='flex items-center gap-2 text-sm font-semibold'
            title={t("header.title_from", { rarity: labels.rarity(titleData.rarity) })}>
            <titleData.Icon
              size={14}
              className={achievementsRarity[titleData.rarity].tailwindClass}
              aria-hidden
            />
            <span
              className={achievementsRarity[titleData.rarity].tailwindClass}>
              {labels.achievementTitle(titleId)}
            </span>
          </p>
        ) : undefined
      }
      title={displayName}
      subtitle={layout.tagline || undefined}
      className='w-full !rounded-none !shadow-none'
      backgroundContent={
        <>
          {bannerLayers && (
            <div
              aria-hidden
              className='absolute inset-0 rounded-none md:rounded-xl'
              style={{ background: bannerLayers }}
            />
          )}
          {emblemData && (
            // The emblem is a stamp in the scene, not a badge: huge, tilted,
            // barely there — it is noticed on the second look.
            <emblemData.Icon
              aria-hidden
              className={`pointer-events-none absolute right-[4%] top-1/2 h-40 w-40 -translate-y-1/2 -rotate-12 opacity-[0.12] md:right-[24%] md:h-64 md:w-64 ${achievementsRarity[emblemData.rarity].tailwindClass}`}
            />
          )}
          {isSpecialGuitar ? (
            <div className='absolute inset-0 z-0 overflow-hidden rounded-none md:rounded-xl'>
              <div
                className='pointer-events-none absolute left-[0%] top-[-10%] opacity-25 blur-[80px] md:left-[5%] md:top-[-15%] md:opacity-30'
                style={{
                  backgroundColor: glowColor,
                  width: "350px",
                  height: "350px",
                  borderRadius: "50%",
                }}
              />
              <img
                src={getRankBadgeSrc(imgPath, "large")}
                className='pointer-events-none absolute left-[0%] top-[-15%] h-[300px] max-w-none -rotate-[90deg] opacity-[0.75] md:left-[8%] md:top-[-35%] md:h-[480px] md:-rotate-[15deg]'
                style={{
                  filter: `drop-shadow(0 15px 40px rgba(0,0,0,0.9)) drop-shadow(0 0 20px ${glowColor}30)`,
                  WebkitMaskImage:
                    "linear-gradient(to right, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 95%)",
                  maskImage:
                    "linear-gradient(to right, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 95%)",
                }}
                alt=''
                aria-hidden
              />
            </div>
          ) : null}
        </>
      }
      rightContent={
        showLevel || showTier ? (
          <div className='relative flex select-none items-center gap-4 pr-2'>
            {showTier && (
              <SongTierBadge
                learnedSongs={learnedSongs}
                isLoading={isSongsLoading}
                isError={isSongsError}
              />
            )}
            {showLevel && (
              <div className='relative flex flex-col items-center gap-1'>
                <svg
                  width='120'
                  height='120'
                  viewBox='0 0 100 100'
                  className='relative shrink-0'>
                  <defs>
                    <linearGradient
                      id='lvlArcGrad'
                      x1='0%'
                      y1='0%'
                      x2='100%'
                      y2='100%'>
                      <stop offset='0%' stopColor={accent.light} />
                      <stop offset='100%' stopColor={accent.base} />
                    </linearGradient>
                  </defs>
                  <circle cx='50' cy='50' r='46' fill='rgba(0,0,0,0.45)' />
                  <circle
                    cx='50'
                    cy='50'
                    r={arcR}
                    fill='none'
                    stroke='rgba(255,255,255,0.1)'
                    strokeWidth='6'
                  />
                  <circle
                    cx='50'
                    cy='50'
                    r={arcR}
                    fill='none'
                    stroke='url(#lvlArcGrad)'
                    strokeWidth='6'
                    strokeLinecap='round'
                    strokeDasharray={arcC}
                    strokeDashoffset={arcOffset}
                    transform='rotate(-90 50 50)'
                  />
                  <text
                    x='50'
                    y='54'
                    textAnchor='middle'
                    fill='white'
                    fontSize='24'
                    fontWeight='900'
                    style={{ fontFamily: "system-ui, sans-serif" }}>
                    {statistics.lvl}
                  </text>
                  <text
                    x='50'
                    y='67'
                    textAnchor='middle'
                    fill={accent.light}
                    fontSize='9'
                    fontWeight='700'
                    letterSpacing='3'
                    style={{ fontFamily: "system-ui, sans-serif" }}>
                    LVL
                  </text>
                </svg>
                <span className='text-xs font-semibold tabular-nums text-zinc-200'>
                  {statistics.points.toLocaleString()} points
                </span>
                <span className='text-[11px] tabular-nums text-zinc-500'>
                  {ptsInLevel.toLocaleString()} / {lvlRange.toLocaleString()} to
                  level {statistics.lvl + 1}
                </span>
              </div>
            )}
          </div>
        ) : undefined
      }
      leftContent={
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5'>
          <div className='shrink-0'>
            <Avatar
              name={displayName}
              avatarURL={avatar}
              lvl={statistics.lvl}
              selectedGuitar={selectedGuitar}
              userId={userAuth}
            />
          </div>

          {(factItems.length > 0 || showLinks) && (
            <div className='space-y-3 rounded-xl bg-zinc-950/60 px-4 py-3 backdrop-blur-md'>
              {factItems.length > 0 && (
                <dl className='grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap'>
                  {factItems}
                </dl>
              )}
              {showLinks && (
                <div className='flex flex-wrap gap-2'>
                  {youTubeLink && (
                    <a
                      target='_blank'
                      rel='noreferrer'
                      href={youTubeLink}
                      className='flex items-center gap-1.5 rounded-lg bg-red-500/15 px-2.5 py-1.5 text-xs font-semibold text-zinc-100 transition-colors hover:bg-red-500/30'>
                      <FaYoutube size={13} className='text-red-400' /> YouTube
                    </a>
                  )}
                  {soundCloudLink && (
                    <a
                      target='_blank'
                      rel='noreferrer'
                      href={soundCloudLink}
                      className='flex items-center gap-1.5 rounded-lg bg-orange-500/15 px-2.5 py-1.5 text-xs font-semibold text-zinc-100 transition-colors hover:bg-orange-500/30'>
                      <FaSoundcloud size={13} className='text-orange-400' />{" "}
                      SoundCloud
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      }
    />
  );
};
