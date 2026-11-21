import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { HonorMark } from "feature/guilds/components/HonorMark";
import type {
  Guild,
  GuildHonor,
  GuildQuestBoard,
} from "feature/guilds/types/guild.types";
import type { RosterRow } from "feature/guilds/utils/guildRoster.utils";
import { rankRoster } from "feature/guilds/utils/guildRoster.utils";
import { useTranslation } from "hooks/useTranslation";
import { Interpolate } from "lib/i18n/Interpolate";
import { Crown } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { auth } from "utils/firebase/client/firebase.utils";

/**
 * Who is in the guild, and what each of them has put in since it was founded.
 *
 * The browse tab shows everybody as a row of faces, which answers "is my friend
 * in this one" and nothing else. This is the view from inside: the roster
 * ordered by the sessions and hours the quests are counted out of anyway, so
 * the tab says who is carrying the guild rather than only who signed up for it.
 */

const tenth = (value: number): string =>
  (Math.round((Number.isFinite(value) ? value : 0) * 10) / 10).toString();

const sinceLine = (since: string): string => {
  const date = new Date(since);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return "";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/** What one member has put in, as one quiet line under the name. Nothing yet is said as nothing. */
const Effort = ({ row }: { row: RosterRow }) => {
  const { t } = useTranslation("guilds");
  if (row.sessions === 0) return null;

  return (
    <p className='mt-0.5 truncate text-sm tabular-nums text-zinc-400'>
      {row.sessions === 1
        ? t("members.sessions_one")
        : t("members.sessions", { count: row.sessions })}
      {row.hours > 0 && ` · ${t("members.hours", { hours: tenth(row.hours) })}`}
    </p>
  );
};

/**
 * The member's honor: what they have earned by putting into the guild. The
 * earned total, not the balance — that is a shelf question, and this row is
 * the standing. A member who gave a lot and spent a lot has still given a
 * lot, which the balance alone would not say.
 *
 * The one figure on the right of the row, so it is set at the size of a score.
 */
const Honor = ({ honor }: { honor: GuildHonor | undefined }) => {
  const { t } = useTranslation("guilds");
  const earned = honor?.earned ?? 0;
  const balance = honor?.balance ?? 0;

  return (
    <p
      title={t("members.honor_title", {
        earned: earned.toLocaleString(),
        balance: balance.toLocaleString(),
      })}
      className={cn(
        "flex shrink-0 items-center gap-1.5 text-base font-bold tabular-nums",
        earned > 0 ? "text-zinc-100" : "text-zinc-600",
      )}>
      <HonorMark size={18} className={earned > 0 ? "" : "opacity-40"} />
      {earned.toLocaleString()}
    </p>
  );
};

const MemberRow = ({
  row,
  place,
  honor,
  isMe,
  showEffort,
}: {
  row: RosterRow;
  /** 1-based place on the roster. */
  place: number;
  honor: GuildHonor | undefined;
  isMe: boolean;
  /** False when there is no board to measure anybody against. */
  showEffort: boolean;
}) => {
  const { t } = useTranslation("guilds");
  return (
    <li
      className={cn(
        "flex items-center gap-4 rounded-lg px-4 py-4 transition-background sm:px-5",
        isMe ? "bg-zinc-800/60" : "bg-zinc-900/40 hover:bg-zinc-900/60",
      )}>
      <span
        className={cn(
          "w-5 shrink-0 text-center text-base font-bold tabular-nums",
          isMe ? "text-zinc-100" : "text-zinc-500",
        )}>
        {place}
      </span>

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
            className='truncate text-base font-bold text-zinc-100 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:text-white'>
            {row.member.displayName}
          </Link>
          {row.isFounder && (
            <Crown
              size={14}
              aria-label={t("members.founder")}
              className='shrink-0 text-amber-400'
            />
          )}
        </div>
        {showEffort && <Effort row={row} />}
      </div>

      <Honor honor={honor} />
    </li>
  );
};

export const GuildMembersTab = ({
  guild,
  board,
}: {
  guild: Guild;
  board: GuildQuestBoard | null;
}) => {
  const { t } = useTranslation("guilds");
  // The caller's own uid never comes back from the API — see `GuildsState` —
  // so the row that is theirs is found the way the rest of the client finds
  // itself, off the signed-in user.
  const myUid = auth.currentUser?.uid ?? null;

  const rows = useMemo(
    () => rankRoster(guild.members, board?.perMember, guild.founderUid),
    [guild.members, guild.founderUid, board?.perMember],
  );

  const sessions = rows.reduce((sum, row) => sum + row.sessions, 0);
  const hours = rows.reduce((sum, row) => sum + row.hours, 0);
  const since = board ? sinceLine(board.since) : "";

  return (
    <section className='space-y-4'>
      {/* The guild's name, crest, level and seats are already at the top of the
          page — the heading adds only what the guild has put in together. */}
      <div className='flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1'>
        <h2 className='flex items-center gap-2.5 text-lg font-bold text-white'>
          {t("tabs.members")}
          <span
            title={t("seats_taken", {
              count: guild.memberCount,
              limit: guild.memberLimit,
            })}
            className='rounded bg-zinc-800/60 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-400'>
            {guild.memberCount}/{guild.memberLimit}
          </span>
        </h2>

        {board && rows.length > 0 && (
          <p className='text-sm text-zinc-400'>
            <Interpolate
              text={
                since
                  ? t("members.together_since", { since })
                  : t("members.together")
              }
              values={{
                sessions: (
                  <span className='font-bold tabular-nums text-zinc-200'>
                    {sessions.toLocaleString()}
                  </span>
                ),
                hours: (
                  <span className='font-bold tabular-nums text-zinc-200'>
                    {tenth(hours)}h
                  </span>
                ),
              }}
            />
          </p>
        )}
      </div>

      <ol className='space-y-2'>
        {rows.map((row, index) => (
          <MemberRow
            key={row.member.uid}
            row={row}
            place={index + 1}
            honor={guild.honor[row.member.uid]}
            isMe={row.member.uid === myUid}
            showEffort={board !== null}
          />
        ))}
      </ol>
    </section>
  );
};
