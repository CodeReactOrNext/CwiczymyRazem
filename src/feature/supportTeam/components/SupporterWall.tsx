import { cn } from "assets/lib/utils";
import { UserLink } from "components/UserLink/UserLink";
import { SupportBadge } from "feature/supportTeam/components/SupportBadge";
import { useSupporterWall } from "feature/supportTeam/hooks/useSupporterWall";
import type { SupportTeamMember } from "feature/supportTeam/types/supportTeam.types";
import { Heart } from "lucide-react";
import Link from "next/link";

/**
 * One supporter, honoured the way the app honours a player: their avatar in the
 * gold ring, their badge, and the level they have actually played to.
 */
const SupporterCard = ({ member }: { member: SupportTeamMember }) => (
  <div className='flex items-center gap-4 rounded-lg bg-zinc-900/40 p-5 transition-colors hover:bg-zinc-900/70 sm:p-6'>
    {/* Avatar only — the name sits below the badges, which the row form of
        UserLink has no place for. The ring and the hover card come along. */}
    <UserLink
      uid={member.uid}
      userName={member.displayName}
      avatarUrl={member.avatar}
      lvl={member.lvl ?? 0}
      showName={false}
    />

    <div className='flex min-w-0 flex-col gap-2'>
      <Link
        href={`/user/${member.uid}`}
        translate='no'
        className='truncate text-sm font-bold text-zinc-100 hover:underline'>
        {member.displayName}
      </Link>

      <div className='flex flex-wrap items-center gap-2'>
        <SupportBadge member={member} />
        {typeof member.lvl === "number" && (
          <span
            translate='no'
            className='rounded-full bg-zinc-800/60 px-2 py-0.5 text-[10px] font-bold leading-none text-zinc-400'>
            Lvl {member.lvl}
          </span>
        )}
      </div>
    </div>
  </div>
);

interface SupporterWallProps {
  className?: string;
}

/**
 * Everyone whose donation keeps riff.quest running, named out loud.
 *
 * Public on purpose — it is shown to supporters and to everybody else, because
 * a thank-you that only the thanked can read is not much of a thank-you, and
 * whoever is still reading the pitch gets to see who is already inside.
 */
export const SupporterWall = ({ className }: SupporterWallProps) => {
  const { members, isLoading } = useSupporterWall();

  return (
    <section className={cn("space-y-6", className)}>
      <div className='flex flex-col gap-2'>
        <h2 className='flex items-center gap-2 text-base font-bold text-zinc-100'>
          <Heart size={16} className='text-amber-400' fill='currentColor' />
          The people funding riff.quest
        </h2>
        <p className='max-w-2xl text-sm leading-relaxed text-zinc-400'>
          {members.length > 0
            ? `${members.length} ${members.length === 1 ? "player keeps" : "players keep"} this app being built. Every guitar, exercise and week the app plays for was paid for here.`
            : "Everyone who supports the project is listed here, with the level they play at."}
        </p>
      </div>

      {isLoading ? (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className='h-[86px] animate-pulse rounded-lg bg-zinc-900/40'
            />
          ))}
        </div>
      ) : members.length === 0 ? (
        <p className='rounded-lg bg-zinc-900/40 p-6 text-sm text-zinc-500'>
          Nobody on the wall yet — the first name here is still free.
        </p>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {members.map((member) => (
            <SupporterCard key={member.uid} member={member} />
          ))}
        </div>
      )}
    </section>
  );
};
