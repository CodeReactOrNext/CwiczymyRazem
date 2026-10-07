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

/** What one member has put in: sessions first, hours under them. Nothing yet is said as nothing. */
const Effort = ({ row }: { row: RosterRow }) => {
  const { t } = useTranslation("guilds");
  if (row.sessions === 0) return null;

  return (
    <div className='shrink-0 text-right'>
      <p className='text-xs font-semibold tabular-nums text-zinc-300'>
        {row.sessions === 1
          ? t("members.sessions_one")
          : t("members.sessions", { count: row.sessions })}
      </p>
      {row.hours > 0 && (
        <p className='mt-0.5 text-[11px] tabular-nums text-zinc-500'>
          {t("members.hours", { hours: tenth(row.hours) })}
        </p>
      )}
    </div>
  );
};

/**
 * The member's honor: what they have earned by putting into the guild. The
 * earned total, not the balance — that is a shelf question, and this row is
 * the standing. A member who gave a lot and spent a lot has still given a
 * lot, which the balance alone would not say.
 */
const Honor = ({ honor }: { honor: GuildHonor | undefined }) => {
  const { t } = useTranslation("guilds");
  const earned = honor?.earned ?? 0;
  const balance = honor?.balance ?? 0;

  return (
    <div
      title={t("members.honor_title", {
        earned: earned.toLocaleString(),
        balance: balance.toLocaleString(),
      })}
      className='shrink-0 text-right'>
      <p
        className={cn(
          "flex items-center justify-end gap-1 text-sm font-bold tabular-nums",
          earned > 0 ? "text-purple-300" : "text-zinc-600",
        )}>
        <HonorMark size={18} className={earned > 0 ? "" : "opacity-40"} />
        {earned.toLocaleString()}
      </p>
    </div>
  );
};

const MemberRow = ({
  row,
  honor,
  isMe,
  showEffort,
}: {
  row: RosterRow;
  honor: GuildHonor | undefined;
  isMe: boolean;
  /** False when there is no board to measure anybody against. */
  showEffort: boolean;
}) => {
  const { t } = useTranslation("guilds");
  return (
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
              aria-label={t("members.founder")}
              className='shrink-0 text-amber-400'
            />
          )}
        </div>
        {isMe && (
          <p className='mt-0.5 text-xs text-zinc-500'>{t("members.you")}</p>
        )}
      </div>

      {showEffort && <Effort row={row} />}
      <Honor honor={honor} />
    </div>
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

  const free = Math.max(0, guild.memberLimit - guild.memberCount);
  const sessions = rows.reduce((sum, row) => sum + row.sessions, 0);
  const hours = rows.reduce((sum, row) => sum + row.hours, 0);
  const since = board ? sinceLine(board.since) : "";

  return (
    <div className='space-y-6'>
      {/* The guild's name, tag and crest are already at the top of the page —
          this says the one thing the page header does not: how much the guild
          has put in together, and how much room is left. */}
      <div className='flex flex-wrap items-center justify-between gap-4 rounded-lg bg-zinc-900/40 p-5'>
        <div className='space-y-1'>
          <h2 className='text-sm font-bold text-zinc-200'>
            {t("members.roster")}
          </h2>
          <p className='text-sm text-zinc-400'>
            {t("seats_taken", {
              count: guild.memberCount,
              limit: guild.memberLimit,
            })}
            {" · "}
            {free > 0
              ? t("members.room_for", { count: free })
              : t("members.room_full")}
          </p>
        </div>

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

      <p className='flex items-center gap-2 text-xs text-zinc-500'>
        <HonorMark size={18} />
        {t("members.honor_explainer")}
      </p>

      <div className='space-y-2'>
        {rows.map((row) => (
          <MemberRow
            key={row.member.uid}
            row={row}
            honor={guild.honor[row.member.uid]}
            isMe={row.member.uid === myUid}
            showEffort={board !== null}
          />
        ))}
      </div>
    </div>
  );
};
