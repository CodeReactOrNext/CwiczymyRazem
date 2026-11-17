import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import {
  ImprovFace,
  type ImprovPlayer,
} from "feature/improv/components/ImprovFaces";
import { useTranslation } from "hooks/useTranslation";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { FaDiscord } from "react-icons/fa6";

/** Where the talking happens — the round's own thread, or the server until the bot has opened one. */
export const ImprovDiscordCard = ({
  discordUrl,
  hasThread,
  adminIssue = null,
}: {
  discordUrl: string;
  hasThread: boolean;
  /** Shown to admins only — why the bot hasn't opened the thread. */
  adminIssue?: string | null;
}) => {
  const { t } = useTranslation("improv");
  return (
    <Card className='flex flex-col gap-4 p-5'>
      <div className='flex items-start gap-3'>
        <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300'>
          <FaDiscord size={20} />
        </span>
        <div className='min-w-0'>
          <h2 className='text-base font-semibold text-zinc-100'>
            {t("side.discord_title")}
          </h2>
          <p className='mt-1 text-sm leading-relaxed text-zinc-400'>
            {hasThread
              ? t("side.discord_body")
              : t("side.discord_body_no_thread")}
          </p>
        </div>
      </div>
      {adminIssue && (
        <p className='font-mono break-words rounded-lg bg-red-500/10 px-3 py-2 text-xs leading-relaxed text-red-300'>
          Admin · bot: {adminIssue}
        </p>
      )}
      <Button asChild variant='ghost' className='h-10'>
        <a href={discordUrl} target='_blank' rel='noreferrer'>
          {hasThread ? t("side.open_thread") : t("hero.discord_join")}
          <ArrowUpRight />
        </a>
      </Button>
    </Card>
  );
};

export const ImprovPlayersCard = ({ players }: { players: ImprovPlayer[] }) => {
  const { t } = useTranslation("improv");
  if (players.length === 0) return null;
  return (
    <Card className='p-5'>
      <h2 className='text-base font-semibold text-zinc-100'>
        {t("side.players_title")}
      </h2>
      <ul className='mt-4 space-y-3'>
        {players.map((player) => (
          <li key={player.userId} className='flex items-center gap-3'>
            <ImprovFace name={player.userName} avatar={player.userAvatar} />
            <Link
              href={`/user/${player.userId}`}
              className='min-w-0 flex-1 truncate text-sm text-zinc-200 hover:text-white'>
              {player.userName}
            </Link>
            <span className='shrink-0 text-sm tabular-nums text-zinc-400'>
              {t("side.takes", { count: player.takeCount })}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
};
