import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { UserTooltip } from "components/UserTooltip/UserTooltip";
import { GuildTagBadge } from "feature/guilds/components/GuildTagBadge";
import type { GuildBadge } from "feature/guilds/types/guild.types";
import { SupportAvatarRing } from "feature/supportTeam/components/SupportAvatarRing";
import { useSupportTeam } from "feature/supportTeam/hooks/useSupportTeam";
import Link from "next/link";

interface UserLinkProps {
  uid: string | undefined;
  userName: string;
  avatarUrl?: string | null;
  lvl?: number;
  /**
   * The guild kit this player wears, where the surface already has it — rows
   * that denormalise the author (recordings, chat) pass it, the rest leave it
   * out and the badge simply does not draw. Never fetched just for this: a list
   * of twenty names is not worth twenty extra reads for a tag.
   */
  guildBadge?: GuildBadge | null;
  /** "xs" (32px) is for dense rows like cards; "sm" (40px) for the activity log. */
  size?: "xs" | "sm";
  /** Avatar-only, for rows that print the name elsewhere (e.g. a comment bubble). */
  showName?: boolean;
  className?: string;
  nameClassName?: string;
  avatarClassName?: string;
}

/**
 * Avatar + name that links to the profile and opens the shared stats hover card.
 * Supporters get the gold avatar ring here, so every surface showing a user gets
 * the same treatment without repeating the support-team lookup.
 */
export const UserLink = ({
  uid,
  userName,
  avatarUrl,
  lvl,
  guildBadge,
  size = "sm",
  showName = true,
  className,
  nameClassName,
  avatarClassName,
}: UserLinkProps) => {
  const { getSupportMember } = useSupportTeam();

  if (!uid) return <span className={nameClassName}>{userName}</span>;

  const supportMember = getSupportMember(uid);

  const avatar = (
    <Avatar
      size={size}
      name={userName}
      avatarURL={avatarUrl || undefined}
      lvl={lvl}
    />
  );

  return (
    <UserTooltip userId={uid}>
      <Link
        className={cn(
          "flex min-w-0 items-center gap-2 text-white hover:underline",
          className,
        )}
        href={`/user/${uid}`}>
        <div className={cn("shrink-0", avatarClassName)}>
          {supportMember ? (
            <SupportAvatarRing>{avatar}</SupportAvatarRing>
          ) : (
            avatar
          )}
        </div>
        {showName && (
          <span className={cn("truncate", nameClassName)}>{userName}</span>
        )}
        {/* Not a link of its own: this whole row already is one, and an anchor
            inside an anchor is markup the browser silently rearranges. */}
        <GuildTagBadge badge={guildBadge} linked={false} />
      </Link>
    </UserTooltip>
  );
};
