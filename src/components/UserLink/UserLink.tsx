import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { UserTooltip } from "components/UserTooltip/UserTooltip";
import { SupportAvatarRing } from "feature/supportTeam/components/SupportAvatarRing";
import { useSupportTeam } from "feature/supportTeam/hooks/useSupportTeam";
import Link from "next/link";

interface UserLinkProps {
  uid: string | undefined;
  userName: string;
  avatarUrl?: string | null;
  lvl?: number;
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
      </Link>
    </UserTooltip>
  );
};
