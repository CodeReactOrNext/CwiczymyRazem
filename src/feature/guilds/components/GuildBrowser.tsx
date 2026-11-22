import { Button } from "assets/components/ui/button";
import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { EmptyState } from "components/EmptyState/EmptyState";
import { SectionHeader } from "components/SectionHeader/SectionHeader";
import Avatar from "components/UI/Avatar";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import { GuildBanner } from "feature/guilds/components/GuildBanner";
import { GuildCrest } from "feature/guilds/components/GuildCrest";
import { GuildTagBadge } from "feature/guilds/components/GuildTagBadge";
import { NewGuildDialog } from "feature/guilds/components/NewGuildDialog";
import { useGuildMutations } from "feature/guilds/hooks/useGuilds";
import type { Guild, GuildsState } from "feature/guilds/types/guild.types";
import { rankGuilds } from "feature/guilds/utils/guild.utils";
import {
  accentHex,
  equippedItem,
  motifIcons,
} from "feature/guilds/utils/guildCosmetics.utils";
import {
  isPodiumPlace,
  placeKeyClass,
  PODIUM_LIGHT,
} from "feature/leadboard/components/rankRowStyles";
import { useTranslation } from "hooks/useTranslation";
import { Check, Clock, Plus, Users, X } from "lucide-react";
import { useState } from "react";

/** Who is in it, as faces — names on hover, the roster tab reads them. */
const MemberFaces = ({ guild, max = 6 }: { guild: Guild; max?: number }) => {
  const shown = guild.members.slice(0, max);
  const more = guild.memberCount - shown.length;

  return (
    <div className='flex flex-wrap items-center gap-1.5'>
      {shown.map((member) => (
        <span key={member.uid} title={member.displayName} className='shrink-0'>
          <Avatar
            name={member.displayName}
            avatarURL={member.avatar ?? undefined}
            size='sm'
          />
        </span>
      ))}
      {more > 0 && (
        <span className='ml-1 text-sm font-semibold tabular-nums text-zinc-500'>
          +{more}
        </span>
      )}
    </div>
  );
};

/**
 * One guild, as one line of a ranking: place, crest, name, who is in it, level,
 * and the way in. The banner still shows — faded in behind the right half of the
 * row, clear of the name and the faces — so a guild's kit is not lost by folding
 * the card down to a line. The caller's own guild is the lighter row.
 *
 * On a phone a single line leaves the name no room at all, so the faces and the
 * button move to a row of their own under it.
 */
const GuildRankRow = ({
  guild,
  rank,
  isMine,
  blocked,
  application,
  busy,
  onApply,
  onWithdraw,
  onLeave,
}: {
  guild: Guild;
  /** 1-based place in the ranking. */
  rank: number;
  isMine: boolean;
  /** Already in a guild, or waiting on somebody else's answer. */
  blocked: boolean;
  application: "pending" | "rejected" | null;
  busy: boolean;
  onApply: () => void;
  onWithdraw: () => void;
  onLeave: () => void;
}) => {
  const { t } = useTranslation("guilds");
  const hex = accentHex(guild.cosmetics);
  const full = guild.memberCount >= guild.memberLimit;

  return (
    <li
      className={cn(
        "relative flex flex-wrap items-center gap-x-3 gap-y-3 overflow-hidden rounded-lg p-4 transition-background sm:flex-nowrap sm:gap-5 sm:px-6 sm:py-5",
        isMine ? "bg-zinc-800/60" : "bg-zinc-800/40 hover:bg-zinc-800/60",
        // The medal's light from the left, as on the player leaderboard.
        !isMine &&
          isPodiumPlace(rank) &&
          cn(
            "light-tint bg-gradient-to-r via-transparent to-transparent",
            PODIUM_LIGHT[rank],
          ),
      )}>
      {/* The banner, faded in from the right and gone before the text. */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-50'
        style={{
          maskImage: "linear-gradient(to left, black, transparent)",
          WebkitMaskImage: "linear-gradient(to left, black, transparent)",
        }}>
        <GuildBanner
          bannerId={equippedItem(guild.cosmetics, "banner").id}
          hex={hex}
          icons={motifIcons(guild.cosmetics)}
          className='h-full'
        />
      </div>

      <span
        aria-label={t("browser.rank", { rank })}
        className={cn(
          "relative h-7 w-8 text-xl sm:h-9 sm:w-10 sm:text-2xl",
          placeKeyClass(rank, isMine),
        )}>
        {rank}
      </span>

      <GuildCrest
        logo={guild.logo}
        tag={guild.tag}
        accentHex={hex}
        className='relative h-12 w-12 shrink-0 text-sm sm:h-16 sm:w-16 sm:text-base'
      />

      <div className='relative min-w-0 flex-1'>
        <p className='flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1'>
          <span className='max-w-full truncate text-base font-bold text-white sm:text-lg'>
            {guild.name}
          </span>
          {guild.logo && (
            <GuildTagBadge
              badge={{
                guildId: guild.id,
                tag: guild.tag,
                accent: guild.cosmetics.accent,
                frame: guild.cosmetics.frame,
                level: guild.level,
              }}
              size='sm'
              linked={false}
            />
          )}
        </p>
        <p className='mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-zinc-400'>
          {isMine && (
            <span className='font-semibold text-zinc-200'>
              {t("browser.yours")}
            </span>
          )}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 tabular-nums",
              full && "text-zinc-500",
            )}>
            <Users className='h-3.5 w-3.5' />
            {guild.memberCount}/{guild.memberLimit}
          </span>
          <span className='truncate text-zinc-500'>
            {t("browser.by", { name: guild.founderName })}
          </span>
        </p>
        {guild.description && (
          <p className='mt-1.5 line-clamp-2 max-w-2xl text-sm leading-relaxed text-zinc-400'>
            {guild.description}
          </p>
        )}
        {guild.members.length > 0 && (
          <div className='mt-3 hidden sm:block'>
            <MemberFaces guild={guild} />
          </div>
        )}
      </div>

      <div
        className='relative shrink-0 text-right'
        title={t("browser.level", { level: guild.level })}>
        <p className='text-xl font-bold tabular-nums leading-tight text-zinc-100'>
          {guild.level}
        </p>
        <p className='text-xs text-zinc-400'>{t("level")}</p>
      </div>

      <div className='relative flex w-full shrink-0 items-center justify-end gap-3 pl-9 sm:w-24 sm:pl-0'>
        {guild.members.length > 0 && (
          <div className='mr-auto sm:hidden'>
            <MemberFaces guild={guild} max={4} />
          </div>
        )}
        {isMine ? (
          <Button
            variant='ghost'
            disabled={busy}
            onClick={onLeave}
            className='text-zinc-400 hover:text-red-400'>
            {t("browser.leave")}
          </Button>
        ) : application ? (
          <div className='flex flex-col items-end gap-0.5'>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-semibold",
                application === "pending" ? "text-cyan-400" : "text-zinc-500",
              )}>
              <Clock size={12} />
              {application === "pending"
                ? t("browser.waiting")
                : t("browser.turned_down")}
            </span>
            <button
              type='button'
              disabled={busy}
              onClick={onWithdraw}
              className='text-xs text-zinc-500 transition-colors hover:text-zinc-200'>
              {application === "pending"
                ? t("browser.withdraw")
                : t("browser.clear")}
            </button>
          </div>
        ) : (
          <Button
            disabled={busy || blocked || full}
            onClick={onApply}
            title={
              full
                ? t("browser.no_seats")
                : blocked
                  ? t("browser.leave_first")
                  : undefined
            }>
            {full ? t("browser.full") : t("browser.join")}
          </Button>
        )}
      </div>
    </li>
  );
};

/**
 * The founder's inbox. Sits above the list because it is the one thing here
 * that somebody else is waiting on.
 */
const ApplicationQueue = ({
  applications,
  busy,
  onDecide,
}: {
  applications: GuildsState["applications"];
  busy: boolean;
  onDecide: (applicantUid: string, accept: boolean) => void;
}) => {
  const { t } = useTranslation("guilds");
  return (
    <section className='space-y-3'>
      <SectionHeader
        title={t("browser.asking")}
        count={applications.length}
        size='lg'
        className='mb-0'
      />

      {applications.map((application) => (
        <div
          key={application.uid}
          className='flex flex-wrap items-center gap-3 rounded-lg bg-zinc-800/40 p-4'>
          <Avatar
            name={application.displayName}
            avatarURL={application.avatar ?? undefined}
            size='sm'
            className='shrink-0'
          />

          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-bold text-zinc-100'>
              {application.displayName}
            </p>
            {application.message && (
              <p className='mt-1 text-sm text-zinc-400'>
                {application.message}
              </p>
            )}
            {application.status === "rejected" && (
              <p className='mt-1 text-xs text-zinc-500'>
                {t("browser.already_turned_down")}
              </p>
            )}
          </div>

          {application.status === "pending" && (
            <div className='flex shrink-0 items-center gap-2'>
              <Button
                size='sm'
                disabled={busy}
                onClick={() => onDecide(application.uid, true)}>
                <Check size={14} />
                {t("browser.accept")}
              </Button>
              <Button
                size='sm'
                variant='ghost'
                disabled={busy}
                onClick={() => onDecide(application.uid, false)}
                className='text-zinc-400 hover:text-red-400'>
                <X size={14} />
              </Button>
            </div>
          )}
        </div>
      ))}
    </section>
  );
};

/**
 * The list: every guild, whether the caller is in one, and the way in or out.
 * Founding is what the tokens buy; getting in is a request the founder answers.
 */
export const GuildBrowser = ({
  data,
  isLoading,
}: {
  data: GuildsState | undefined;
  isLoading: boolean;
}) => {
  const { t } = useTranslation("guilds");
  const [isFounding, setIsFounding] = useState(false);
  const { found, applyTo, withdraw, decide, leave } = useGuildMutations();

  if (isLoading || !data) {
    return (
      <div className='space-y-4' aria-busy='true'>
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} variant='block' className='h-28' />
        ))}
      </div>
    );
  }

  const busy =
    found.isPending ||
    applyTo.isPending ||
    withdraw.isPending ||
    decide.isPending ||
    leave.isPending;
  const tokensLeft = data.tokensLeft;

  const ranked = rankGuilds(data.guilds);

  return (
    <div className='space-y-8'>
      <section className='flex flex-wrap items-center justify-between gap-4'>
        <p className='text-sm text-zinc-400'>{t("browser.intro")}</p>
        <Button
          onClick={() => setIsFounding(true)}
          disabled={tokensLeft < data.foundingCost || !!data.myGuildId}
          title={
            data.myGuildId
              ? t("browser.leave_before_founding")
              : tokensLeft < data.foundingCost
                ? t("browser.not_enough_tokens")
                : t("browser.name_yours")
          }>
          <Plus size={16} />
          {t("browser.found")}
          <span className='ml-1 inline-flex items-center gap-1 rounded bg-zinc-900/10 px-1.5 py-0.5 text-sm font-bold tabular-nums'>
            <SupportToken size={16} />
            {data.foundingCost}
          </span>
        </Button>
      </section>

      {data.applications.length > 0 && (
        <ApplicationQueue
          applications={data.applications}
          busy={busy}
          onDecide={(applicantUid, accept) =>
            decide.mutate({
              guildId: data.myGuildId ?? "",
              applicantUid,
              accept,
            })
          }
        />
      )}

      {data.guilds.length === 0 ? (
        <EmptyState
          mood='wait'
          title={t("browser.empty_title")}
          description={t("browser.empty_body")}
        />
      ) : (
        <section className='space-y-4'>
          <SectionHeader
            title={t("browser.ranking")}
            count={data.guilds.length}
            size='lg'
            className='mb-0'
          />
          <ol className='space-y-3'>
            {ranked.map((guild, index) => (
              <GuildRankRow
                key={guild.id}
                guild={guild}
                rank={index + 1}
                isMine={guild.id === data.myGuildId}
                blocked={!!data.myGuildId || !!data.myApplication}
                application={
                  data.myApplication?.guildId === guild.id
                    ? data.myApplication.status
                    : null
                }
                busy={busy}
                onApply={() =>
                  applyTo.mutate({ guildId: guild.id, message: "" })
                }
                onWithdraw={() => withdraw.mutate(guild.id)}
                onLeave={() => leave.mutate()}
              />
            ))}
          </ol>
        </section>
      )}

      <NewGuildDialog
        open={isFounding}
        onOpenChange={setIsFounding}
        cost={data.foundingCost}
        tokensLeft={tokensLeft}
        busy={found.isPending}
        onSubmit={async (input) => {
          await found.mutateAsync(input);
        }}
      />
    </div>
  );
};
