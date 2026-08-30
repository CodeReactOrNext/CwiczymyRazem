import type { GoalIcon as GoalIconName } from "feature/communityGoal/types/communityGoal.types";
import {
  BookOpen,
  CalendarClock,
  Ear,
  Flame,
  Guitar,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";

/**
 * A goal's own glyph.
 *
 * The card that shows the running challenge and the ballot that picks the next
 * one draw the same six goals, so they draw them from one table — two copies is
 * how a candidate ends up wearing a different icon depending on which screen
 * you met it on.
 */
const ICONS: Record<GoalIconName, typeof Users> = {
  sessions: Users,
  hours: Timer,
  technique: Guitar,
  theory: BookOpen,
  hearing: Ear,
  creativity: Sparkles,
  // Retired candidates, still carried by goal documents written before the
  // practice categories existed.
  marathon: Flame,
  spread: CalendarClock,
};

export const GoalIcon = ({
  icon,
  size = 18,
}: {
  icon: GoalIconName;
  size?: number;
}) => {
  const Icon = ICONS[icon] ?? Users;
  return <Icon size={size} />;
};
