import { cn } from "assets/lib/utils";
import { FeatureLockedView } from "feature/levelGate/components/FeatureLockedView";
import type { LockedFeatureId } from "feature/levelGate/data/featureUnlocks";
import { FEATURE_UNLOCKS } from "feature/levelGate/data/featureUnlocks";
import {
  selectCurrentUserStats,
  selectUserInfo,
} from "feature/user/store/userSlice";
import type { ReactNode } from "react";
import { useAppSelector } from "store/hooks";

interface LevelGateProps {
  feature: LockedFeatureId;
  children: ReactNode;
  /** Page chrome that has to stay reachable while the feature is shut (a tab bar, say). */
  header?: ReactNode;
  /** Applied to the locked screen's wrapper only — the page keeps its own background. */
  className?: string;
}

/**
 * Renders `children` once the account is high enough level for the feature, and
 * the locked screen until then.
 *
 * The check is presentational: it keeps a page that would be empty or confusing
 * out of the way early on, and is not a security boundary. Anything that has to
 * hold — writes, API routes — is enforced server-side.
 */
export const LevelGate = ({
  feature,
  children,
  header,
  className,
}: LevelGateProps) => {
  const userStats = useAppSelector(selectCurrentUserStats);
  const userInfo = useAppSelector(selectUserInfo);

  // Stats land a tick after the page. Gating on the level-1 default in the
  // meantime would flash a lock at somebody who is well past it.
  if (!userStats) return null;

  const unlock = FEATURE_UNLOCKS[feature];
  // Admins keep every page reachable from a low-level test account.
  const isOpen =
    userInfo?.role === "admin" || userStats.lvl >= unlock.requiredLvl;

  if (isOpen) return <>{children}</>;

  return (
    <div className={cn("flex flex-col", className)}>
      {header}
      <FeatureLockedView
        feature={unlock}
        lvl={userStats.lvl}
        points={userStats.points}
      />
    </div>
  );
};
