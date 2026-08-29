import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import { GuildCrest } from "feature/guilds/components/GuildCrest";
import { GuildFundBar } from "feature/guilds/components/GuildFundBar";
import { GuildTagBadge } from "feature/guilds/components/GuildTagBadge";
import { NewGuildDialog } from "feature/guilds/components/NewGuildDialog";
import { useGuildMutations } from "feature/guilds/hooks/useGuilds";
import type { Guild, GuildsState } from "feature/guilds/types/guild.types";
import { bannerStyle } from "feature/guilds/utils/guildCosmetics.style";
import {
  accentHex,
  equippedItem,
} from "feature/guilds/utils/guildCosmetics.utils";
import { GUILD_MAX_SEATS } from "feature/guilds/utils/guildUpgrades.utils";
import { GUILD_SEATS_PER_UPGRADE } from "feature/supporterPanel/constants/supporterPanel.constants";
import { Flame } from "lucide-react";
import { Check, Clock, Plus, Search, Shield, Users, X } from "lucide-react";
import { useState } from "react";

/**
 * Who is in it, as faces rather than as a paragraph of names.
 *
 * A card in a list is scanned, not read: a row of avatars says "this one has
 * people in it" at a glance and still answers "is my friend here" on hover,
 * where twelve name-chips said the same thing in twelve lines of grey text.
 * The roster tab is where the names are read properly.
 */
const MemberStack = ({ guild }: { guild: Guild }) => (
  <div className='flex flex-wrap items-center gap-1.5'>
    {guild.members.slice(0, 14).map((member) => (
      <span key={member.uid} title={member.displayName} className='shrink-0'>
        <Avatar
          name={member.displayName}
          avatarURL={member.avatar ?? undefined}
          size='xs'
        />
      </span>
    ))}
    {guild.members.length > 14 && (
      <span className='inline-flex h-8 items-center px-1 text-xs font-semibold tabular-nums text-zinc-500'>
        +{guild.members.length - 14}
      </span>
    )}
  </div>
);

/**
 * What the guild's own members see under the roster: how much room is left, and
 * the pot for three more seats. Anyone inside may put into it — an allowance
 * goes further split across a guild than saved up by its founder.
 */
const SeatBar = ({
  guild,
  tokensLeft,
  busy,
  onFund,
}: {
  guild: Guild;
  tokensLeft: number;
  busy: boolean;
  onFund: (tokens: number) => void;
}) => {
  const free = Math.max(0, guild.memberLimit - guild.memberCount);

  return (
    <GuildFundBar
      fund={guild.funds.seats}
      standing={free === 0 ? "Every seat is taken" : `Room for ${free} more`}
      buys={`${GUILD_SEATS_PER_UPGRADE} more seats`}
      maxed={`a guild tops out at ${GUILD_MAX_SEATS} seats`}
      members={guild.members}
      tokensLeft={tokensLeft}
      busy={busy}
      onPledge={onFund}
      // Already inside the guild's own card: a second panel here would be a
      // card inside a card, so the pot is separated by the gap instead.
      className='bg-transparent px-0 pb-0 pt-2'
    />
  );
};

const GuildCard = ({
  guild,
  isMine,
  blocked,
  application,
  busy,
  tokensLeft,
  onApply,
  onWithdraw,
  onLeave,
  onFundSeats,
}: {
  guild: Guild;
  isMine: boolean;
  /** Already in a guild, or waiting on somebody else's answer. */
  blocked: boolean;
  application: "pending" | "rejected" | null;
  busy: boolean;
  tokensLeft: number;
  onApply: () => void;
  onWithdraw: () => void;
  onLeave: () => void;
  onFundSeats: (tokens: number) => void;
}) => (
  <article
    // The banner sits on top of the card colour rather than replacing it, so a
    // guild that has bought nothing looks exactly as it did before.
    style={bannerStyle(
      equippedItem(guild.cosmetics, "banner").id,
      accentHex(guild.cosmetics),
    )}
    className={cn(
      "space-y-4 overflow-hidden rounded-lg p-5 transition-background",
      isMine ? "bg-cyan-500/[0.07]" : "bg-zinc-900/40 hover:bg-zinc-900/60",
    )}>
    <div className='flex flex-wrap items-start justify-between gap-3'>
      <div className='flex items-start gap-3'>
        <GuildCrest
          logo={guild.logo}
          tag={guild.tag}
          accentHex={accentHex(guild.cosmetics)}
          isMine={isMine}
        />
        <div className='min-w-0'>
          <h3 className='flex items-center gap-2 text-base font-bold text-zinc-100'>
            {guild.name}
            {/* The crest has taken the tag's square, so it says itself here —
                drawn by the same badge the leaderboard uses, so a guild sees
                exactly what everyone else sees next to its members' names. */}
            {guild.logo && (
              <GuildTagBadge
                badge={{
                  guildId: guild.id,
                  tag: guild.tag,
                  accent: guild.cosmetics.accent,
                  frame: guild.cosmetics.frame,
                }}
                linked={false}
              />
            )}
          </h3>
          <p className='mt-0.5 inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500'>
            <span className='inline-flex items-center gap-1.5'>
              <Users size={12} />
              {guild.memberCount} of {guild.memberLimit} seats
            </span>
            {guild.challengeStreak > 0 && (
              <span className='inline-flex items-center gap-1 text-orange-400'>
                <Flame size={12} />
                {guild.challengeStreak}
                {guild.challengeStreak === 1 ? " week" : " weeks"}
              </span>
            )}
            <span>· founded by {guild.founderName}</span>
          </p>
        </div>
      </div>

      {isMine ? (
        <Button
          variant='ghost'
          disabled={busy}
          onClick={onLeave}
          className='h-9 text-zinc-400 hover:text-red-400'>
          Leave
        </Button>
      ) : application ? (
        <div className='flex items-center gap-2'>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-semibold",
              application === "pending" ? "text-cyan-400" : "text-zinc-500",
            )}>
            <Clock size={13} />
            {application === "pending" ? "Waiting on them" : "Turned down"}
          </span>
          <Button
            variant='ghost'
            disabled={busy}
            onClick={onWithdraw}
            className='h-9 text-zinc-500 hover:text-zinc-200'>
            {application === "pending" ? "Withdraw" : "Clear"}
          </Button>
        </div>
      ) : (
        <Button
          disabled={busy || blocked || guild.memberCount >= guild.memberLimit}
          onClick={onApply}
          className='h-9'>
          {guild.memberCount >= guild.memberLimit ? "Full" : "Ask to join"}
        </Button>
      )}
    </div>

    {guild.description && (
      <p className='text-sm leading-relaxed text-zinc-400'>
        {guild.description}
      </p>
    )}

    {guild.members.length > 0 && <MemberStack guild={guild} />}

    {isMine && (
      <SeatBar
        guild={guild}
        tokensLeft={tokensLeft}
        busy={busy}
        onFund={onFundSeats}
      />
    )}
  </article>
);

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
  const { found, applyTo, withdraw, decide, leave, fund } = useGuildMutations();

  if (isLoading || !data) {
    return (
      <div className='space-y-3'>
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className='h-32 animate-pulse rounded-lg bg-zinc-900/40'
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
    leave.isPending ||
    fund.isPending;
  const tokensLeft = data.tokensLeft;

  // Name, tag and the blurb all read as "which guild is this", so one box
  // covers the three rather than making anyone guess what it matches on.
  const needle = search.trim().toLowerCase();
  const matches = needle
    ? data.guilds.filter((guild) =>
        [guild.name, guild.tag, guild.description]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
    : data.guilds;

  return (
    <div className='space-y-8'>
      <section className='flex flex-wrap items-center justify-between gap-4 rounded-lg bg-zinc-900/40 p-5'>
        <div className='min-w-0 flex-1 space-y-1'>
          <p className='text-sm text-zinc-400'>
            Your own corner of the community. Founding one costs{" "}
            <SupportToken size={18} className='inline-block align-middle' />{" "}
            {data.foundingCost} and takes the name for good — getting into
            somebody else&apos;s is free, and theirs to say yes to.
          </p>
          {data.myGuildId && (
            <p className='text-xs text-zinc-500'>
              You are in a guild — leave it before founding or asking to join
              another.
            </p>
          )}
        </div>
        <Button
          onClick={() => setIsFounding(true)}
          disabled={tokensLeft < data.foundingCost || !!data.myGuildId}>
          <span className='flex items-center gap-2'>
            <Plus size={16} />
            Found a guild
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
            placeholder={`Search ${data.guilds.length} guilds by name, tag or what they do…`}
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
        <div className='space-y-3'>
          {matches.map((guild) => (
            <GuildCard
              key={guild.id}
              guild={guild}
              isMine={guild.id === data.myGuildId}
              blocked={!!data.myGuildId || !!data.myApplication}
              application={
                data.myApplication?.guildId === guild.id
                  ? data.myApplication.status
                  : null
              }
              busy={busy}
              tokensLeft={tokensLeft}
              onApply={() => applyTo.mutate({ guildId: guild.id, message: "" })}
              onWithdraw={() => withdraw.mutate(guild.id)}
              onLeave={() => leave.mutate()}
              onFundSeats={(tokens) => fund.mutate({ track: "seats", tokens })}
            />
          ))}
        </div>
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
