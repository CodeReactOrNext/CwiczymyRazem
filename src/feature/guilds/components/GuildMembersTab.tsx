import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import type { Guild, GuildChallenge } from "feature/guilds/types/guild.types";
import type { RosterRow } from "feature/guilds/utils/guildRoster.utils";
import { rankRoster } from "feature/guilds/utils/guildRoster.utils";
import { Crown } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { auth } from "utils/firebase/client/firebase.utils";

/**
 * Who is in the guild, and what each of them has put into the week.
 *
 * The browse tab shows everybody as a row of faces, which answers "is my friend
 * in this one" and nothing else. This is the view from inside: the roster
 * ordered by the goals the challenge is counting anyway, so the tab says who is
 * carrying the week rather than only who signed up for it.
 */

/**
 * What one member has done of their own share.
 *
 * The goals come first because they are what the week is decided on, and the
 * session count sits under them because it is the number people actually
 * recognise themselves by.
 */
const Share = ({ row }: { row: RosterRow }) => (
  <div className='shrink-0 text-right'>
    <p
      title={`${row.done} of the ${row.total} goals this week's rank asks of every member`}
      className={cn(
        "text-xs font-semibold tabular-nums",
        row.isShareDone ? "text-emerald-400" : "text-zinc-400",
      )}>
      {row.done} of {row.total} {row.total === 1 ? "goal" : "goals"}
    </p>
    <p className='mt-0.5 text-[11px] tabular-nums text-zinc-500'>
      {row.sessions === 0
        ? "nothing yet"
        : `${row.sessions} ${row.sessions === 1 ? "session" : "sessions"}`}
    </p>
  </div>
);

const MemberRow = ({
  row,
  isMe,
  showShare,
}: {
  row: RosterRow;
  isMe: boolean;
  /** False when there is no week to measure anybody against. */
  showShare: boolean;
}) => (
  <div
    className={cn(
      "flex items-center gap-3 rounded-lg px-4 py-3 transition-background",
      isMe ? "bg-cyan-500/[0.07]" : "bg-zinc-900/40 hover:bg-zinc-900/60",
    )}>
    <Avatar
      name={row.member.displayName}
      avatarURL={row.member.avatar ?? undefined}
      size='sm'
      className='shrink-0'
    />

    <div className='min-w-0 flex-1'>
      <div className='flex items-center gap-2'>
        <Link
          href={`/user/${row.member.uid}`}
          className='truncate text-sm font-bold text-zinc-100 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:text-cyan-300'>
          {row.member.displayName}
        </Link>
        {row.isFounder && (
          <Crown
            size={13}
            aria-label='Founder'
            className='shrink-0 text-amber-400'
          />
        )}
      </div>
      {isMe && <p className='mt-0.5 text-xs text-zinc-500'>That is you</p>}
    </div>

    {showShare && <Share row={row} />}
  </div>
);

export const GuildMembersTab = ({
  guild,
  challenge,
}: {
  guild: Guild;
  challenge: GuildChallenge | null;
}) => {
  // The caller's own uid never comes back from the API — see `GuildsState` —
  // so the row that is theirs is found the way the rest of the client finds
  // itself, off the signed-in user.
  const myUid = auth.currentUser?.uid ?? null;

  // What counts as "their share" moves with the rank the guild funded, so the
  // roster is measured against the same goals the challenge card shows.
  const goals = challenge?.objectives.length ?? 1;

  const rows = useMemo(
    () =>
      rankRoster(guild.members, challenge?.perMember, guild.founderUid, goals),
    [guild.members, guild.founderUid, challenge?.perMember, goals],
  );

  const free = Math.max(0, guild.memberLimit - guild.memberCount);
  const doneTheirShare = rows.filter((row) => row.isShareDone).length;

  return (
    <div className='space-y-6'>
      {/* The guild's name, tag and crest are already at the top of the page —
          this says the one thing the page header does not: how the week is
          going, and how much room is left. */}
      <div className='flex flex-wrap items-center justify-between gap-4 rounded-lg bg-zinc-900/40 p-5'>
        <div className='space-y-1'>
          <h2 className='text-sm font-bold text-zinc-200'>The roster</h2>
          <p className='text-sm text-zinc-400'>
            {guild.memberCount} of {guild.memberLimit} seats taken
            {free > 0
              ? ` · room for ${free} more`
              : " · the room is full, and more seats are bought from the Guilds tab"}
          </p>
        </div>

        {challenge && rows.length > 0 && (
          <p className='text-sm text-zinc-400'>
            <span
              className={cn(
                "font-bold tabular-nums",
                doneTheirShare === rows.length
                  ? "text-emerald-400"
                  : "text-zinc-200",
              )}>
              {doneTheirShare} of {rows.length}
            </span>{" "}
            have cleared every goal this week
          </p>
        )}
      </div>

      <div className='space-y-2'>
        {rows.map((row) => (
          <MemberRow
            key={row.member.uid}
            row={row}
            isMe={row.member.uid === myUid}
            showShare={challenge !== null}
          />
        ))}
      </div>
    </div>
  );
};
