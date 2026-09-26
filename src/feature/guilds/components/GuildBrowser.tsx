import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import { GuildBanner } from "feature/guilds/components/GuildBanner";
import { GuildCrest } from "feature/guilds/components/GuildCrest";
import { GuildLevelRing } from "feature/guilds/components/GuildLevelRing";
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
import { Check, Clock, Plus, Search, Shield, Users, X } from "lucide-react";
import { useState } from "react";

/** Who is in it, as faces — names on hover, the roster tab reads them. */
const MemberFaces = ({ guild }: { guild: Guild }) => {
  const shown = guild.members.slice(0, 6);
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
 * and the way in. The banner still shows — faded in behind the right of the row
 * — so a guild's kit is not lost by folding the card down to a line.
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
  const hex = accentHex(guild.cosmetics);
  const full = guild.memberCount >= guild.memberLimit;

  return (
    <li
      className={cn(
        "relative flex items-center gap-4 overflow-hidden rounded-lg p-4 transition-background sm:gap-6 sm:p-6",
        isMine ? "bg-cyan-500/[0.08]" : "bg-zinc-900/40 hover:bg-zinc-900/60",
      )}>
      {/* The banner, faded in from the right and out under the text. */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-y-0 right-0 w-3/4 opacity-50'
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
        aria-label={`Rank ${rank}`}
        className={cn(
          "relative w-8 shrink-0 text-center text-3xl font-bold tabular-nums",
          rank <= 3 ? "text-zinc-200" : "text-zinc-600",
        )}>
        {rank}
      </span>

      <GuildCrest
        logo={guild.logo}
        tag={guild.tag}
        accentHex={hex}
        className='relative h-16 w-16 shrink-0 text-base sm:h-20 sm:w-20 sm:text-lg'
      />

      <div className='relative min-w-0 flex-1'>
        <p className='flex min-w-0 items-center gap-2'>
          <span className='truncate text-lg font-bold text-white'>
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
          {isMine && (
            <span className='shrink-0 rounded bg-cyan-500/15 px-1.5 py-0.5 text-xs font-semibold text-cyan-300'>
              Yours
            </span>
          )}
        </p>
        <p className='mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-zinc-400'>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 tabular-nums",
              full && "text-zinc-500",
            )}>
            <Users size={13} />
            {guild.memberCount}/{guild.memberLimit}
          </span>
          <span className='truncate text-zinc-500'>by {guild.founderName}</span>
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

      <div className='relative shrink-0' title={`Level ${guild.level}`}>
        <GuildLevelRing level={guild.level} size={56} />
      </div>

      <div className='relative flex w-24 shrink-0 justify-end'>
        {isMine ? (
          <Button
            variant='ghost'
            disabled={busy}
            onClick={onLeave}
            className='h-9 text-zinc-400 hover:text-red-400'>
            Leave
          </Button>
        ) : application ? (
          <div className='flex flex-col items-end gap-0.5'>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-semibold",
                application === "pending" ? "text-cyan-400" : "text-zinc-500",
              )}>
              <Clock size={12} />
              {application === "pending" ? "Waiting" : "Turned down"}
            </span>
            <button
              type='button'
              disabled={busy}
              onClick={onWithdraw}
              className='text-xs text-zinc-500 transition-colors hover:text-zinc-200'>
              {application === "pending" ? "Withdraw" : "Clear"}
            </button>
          </div>
        ) : (
          <Button
            disabled={busy || blocked || full}
            onClick={onApply}
            title={
              full
                ? "No free seats"
                : blocked
                  ? "Leave your guild before asking to join another"
                  : undefined
            }
            className='h-9'>
            {full ? "Full" : "Join"}
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
}) => (
  <section className='space-y-3'>
    <h2 className='text-sm font-bold text-zinc-200'>
      Asking to join{" "}
      <span className='font-medium text-zinc-500'>{applications.length}</span>
    </h2>

    {applications.map((application) => (
      <div
        key={application.uid}
        className='flex flex-wrap items-center gap-3 rounded-lg bg-zinc-900/40 p-4'>
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
            <p className='mt-1 text-sm text-zinc-400'>{application.message}</p>
          )}
          {application.status === "rejected" && (
            <p className='mt-1 text-xs text-zinc-500'>
              Already turned down — they can still withdraw it.
            </p>
          )}
        </div>

        {application.status === "pending" && (
          <div className='flex shrink-0 items-center gap-2'>
            <Button
              size='sm'
              disabled={busy}
              onClick={() => onDecide(application.uid, true)}>
              <span className='flex items-center gap-1.5'>
                <Check size={14} />
                Accept
              </span>
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
  const [isFounding, setIsFounding] = useState(false);
  const [search, setSearch] = useState("");
  const { found, applyTo, withdraw, decide, leave } = useGuildMutations();

  if (isLoading || !data) {
    return (
      <div className='space-y-4'>
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className='h-52 animate-pulse rounded-lg bg-zinc-900/40'
          />
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

  // Name, tag and the blurb all read as "which guild is this", so one box
  // covers the three rather than making anyone guess what it matches on.
  const ranked = rankGuilds(data.guilds);
  const ranks = new Map(ranked.map((guild, index) => [guild.id, index + 1]));
  const needle = search.trim().toLowerCase();
  const matches = needle
    ? ranked.filter((guild) =>
        [guild.name, guild.tag, guild.description]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
    : ranked;

  return (
    <div className='space-y-8'>
      <section className='flex flex-wrap items-center justify-between gap-4'>
        <p className='text-sm text-zinc-400'>
          Guilds climb by clearing quests together. Joining one is free.
        </p>
        <Button
          onClick={() => setIsFounding(true)}
          disabled={tokensLeft < data.foundingCost || !!data.myGuildId}
          title={
            data.myGuildId
              ? "Leave your guild before founding one"
              : tokensLeft < data.foundingCost
                ? "Not enough tokens left"
                : "The name is yours for good"
          }>
          <span className='flex items-center gap-2'>
            <Plus size={16} />
            Found a guild
            <span className='ml-1 inline-flex items-center gap-1 rounded bg-zinc-900/10 px-1.5 py-0.5 text-sm font-bold tabular-nums'>
              <SupportToken size={16} />
              {data.foundingCost}
            </span>
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

      {data.guilds.length > 0 && (
        <div className='relative'>
          <Search
            size={15}
            className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500'
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder='Search guilds by name, tag or description…'
            className='h-11 bg-white/5 pl-10 font-medium'
          />
        </div>
      )}

      {data.guilds.length === 0 ? (
        <div className='flex flex-col items-center rounded-lg bg-zinc-900/40 px-6 py-20 text-center'>
          <span className='mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-400'>
            <Shield size={26} />
          </span>
          <h3 className='mb-2 text-lg font-bold text-zinc-100'>
            No guilds yet
          </h3>
          <p className='max-w-sm text-sm text-zinc-400'>
            Nobody has taken a name. The first one is still there.
          </p>
        </div>
      ) : matches.length === 0 ? (
        <p className='rounded-lg bg-zinc-900/40 px-6 py-14 text-center text-sm text-zinc-500'>
          No guild matches “{search}”
        </p>
      ) : (
        <section className='space-y-4'>
          <h2 className='flex items-center gap-2.5 text-lg font-bold text-white'>
            Guild ranking
            <span className='rounded bg-zinc-800/60 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-400'>
              {data.guilds.length}
            </span>
          </h2>
          <ol className='space-y-3'>
            {matches.map((guild) => (
              <GuildRankRow
                key={guild.id}
                guild={guild}
                rank={ranks.get(guild.id) ?? 0}
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
