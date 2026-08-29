import { cn } from "assets/lib/utils";
import type { GuildMetric } from "feature/guilds/data/guildMetrics";
import { BookOpen, Ear, Guitar, Sparkles, Users } from "lucide-react";

/**
 * The face a weekly goal wears.
 *
 * Deliberately the same icons the community goal card uses for the same
 * metrics: a guitar always means technique and an ear always means ear
 * training, wherever in the app the week is being talked about.
 */
const ICONS: Record<GuildMetric, typeof Users> = {
  sessions: Users,
  technique: Guitar,
  theory: BookOpen,
  hearing: Ear,
  creativity: Sparkles,
};

export const GoalIcon = ({
  metric,
  size = 15,
  className,
}: {
  metric: GuildMetric;
  size?: number;
  className?: string;
}) => {
  const Icon = ICONS[metric] ?? Users;
  return (
    <Icon
      size={size}
      aria-hidden
      className={cn("shrink-0 text-zinc-400", className)}
    />
  );
};
