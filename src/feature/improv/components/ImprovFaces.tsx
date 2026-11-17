import { cn } from "assets/lib/utils";
import type { ImprovTake } from "feature/improv/types/improv.types";

export interface ImprovPlayer {
  userId: string;
  userName: string;
  userAvatar: string;
  takeCount: number;
}

/** Everyone with a take on the round, in the order they joined. */
export const improvPlayers = (takes: ImprovTake[]): ImprovPlayer[] => {
  const players = new Map<string, ImprovPlayer>();
  for (const take of [...takes].sort((a, b) => a.createdAt - b.createdAt)) {
    const player = players.get(take.userId);
    if (player) player.takeCount += 1;
    else {
      players.set(take.userId, {
        userId: take.userId,
        userName: take.userName,
        userAvatar: take.userAvatar,
        takeCount: 1,
      });
    }
  }
  return [...players.values()];
};

export const ImprovFace = ({
  name,
  avatar,
  className,
}: {
  name: string;
  avatar: string;
  className?: string;
}) => (
  <span
    title={name}
    className={cn(
      "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-xs font-bold text-zinc-300",
      className,
    )}>
    {avatar ? (
      <img src={avatar} alt='' className='h-full w-full object-cover' />
    ) : (
      (name || "?").charAt(0).toUpperCase()
    )}
  </span>
);

/** Overlapping faces of the round's players, the rest folded into "+N". */
export const ImprovFaceStack = ({
  players,
  max = 5,
}: {
  players: ImprovPlayer[];
  max?: number;
}) => {
  if (players.length === 0) return null;
  const shown = players.slice(0, max);
  const overflow = players.length - shown.length;
  return (
    <div className='flex items-center -space-x-2'>
      {shown.map((player) => (
        <ImprovFace
          key={player.userId}
          name={player.userName}
          avatar={player.userAvatar}
          className='ring-2 ring-zinc-950'
        />
      ))}
      {overflow > 0 && (
        <span className='flex h-8 items-center rounded-full bg-zinc-800 px-2.5 text-xs font-bold text-zinc-400 ring-2 ring-zinc-950'>
          +{overflow}
        </span>
      )}
    </div>
  );
};
