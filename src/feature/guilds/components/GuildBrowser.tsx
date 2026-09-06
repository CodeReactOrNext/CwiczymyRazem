import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import { GuildCover } from "feature/guilds/components/GuildCover";
import { NewGuildDialog } from "feature/guilds/components/NewGuildDialog";
import { useGuildMutations } from "feature/guilds/hooks/useGuilds";
import type { Guild, GuildsState } from "feature/guilds/types/guild.types";
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
  <div className='flex flex-wrap items-center gap-2'>
    {guild.members.slice(0, 12).map((member) => (
      <span key={member.uid} title={member.displayName} className='shrink-0'>
        <Avatar
          name={member.displayName}
          avatarURL={member.avatar ?? undefined}
          size='sm'
        />
      </span>
    ))}
    {guild.members.length > 12 && (
      <span className='inline-flex h-10 items-center px-1 text-xs font-semibold tabular-nums text-zinc-500'>
        +{guild.members.length - 12}
      </span>
    )}
  </div>
);

/** The three numbers a card is scanned for, under the name. */
const CardMeta = ({ guild }: { guild: Guild }) => (
  <span className='inline-flex flex-wrap items-center gap-x-3 gap-y-1'>
    <span className='inline-flex items-center gap-1.5 tabular-nums'>
      <Users size={13} />
      {guild.memberCount} of {guild.memberLimit} seats
    </span>
    <span>founded by {guild.founderName}</span>
  </span>
);

const GuildCard = ({
  guild,
  isMine,
  blocked,
  application,
  busy,
  onApply,
  onWithdraw,
  onLeave,
}: {
  guild: Guild;
  isMine: boolean;
  /** Already in a guild, or waiting on somebody else's answer. */
  blocked: boolean;
  application: "pending" | "rejected" | null;
  busy: boolean;
  onApply: () => void;
  onWithdraw: () => void;
  onLeave: () => void;
}) => (
  <article
    className={cn(
      "overflow-hidden rounded-lg transition-background",
      isMine ? "bg-cyan-500/[0.07]" : "bg-zinc-900/40 hover:bg-zinc-900/60",
    )}>
    <GuildCover
      guild={guild}
      meta={<CardMeta guild={guild} />}
      actions={
        isMine ? (
          <Button
            variant='ghost'
            disabled={busy}
            onClick={onLeave}
            className='h-9 text-zinc-400 hover:text-red-400'>
            Leave
          </Button>
        ) : application ? (
          <>
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
          </>
        ) : (
          <Button
            disabled={busy || blocked || guild.memberCount >= guild.memberLimit}
            onClick={onApply}
            className='h-9'>
            {guild.memberCount >= guild.memberLimit ? "Full" : "Ask to join"}
          </Button>
        )
      }
    />

    {(guild.description || guild.members.length > 0) && (
      <div className='space-y-5 px-5 pb-5 pt-5'>
        {guild.description && (
          <p className='max-w-3xl text-sm leading-relaxed text-zinc-400'>
            {guild.description}
          </p>
        )}

        {guild.members.length > 0 && <MemberStack guild={guild} />}
      </div>
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
      <section className='flex flex-wrap items-center justify-between gap-5 rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
        <div className='min-w-0 flex-1 space-y-1.5'>
          <h2 className='text-base font-bold text-zinc-100'>
            Your own corner of the community
          </h2>
          <p className='max-w-2xl text-sm leading-relaxed text-zinc-400'>
            Founding one costs{" "}
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
        <div className='space-y-4'>
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
              onApply={() => applyTo.mutate({ guildId: guild.id, message: "" })}
              onWithdraw={() => withdraw.mutate(guild.id)}
              onLeave={() => leave.mutate()}
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
