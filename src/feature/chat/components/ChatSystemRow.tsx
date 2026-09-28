import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { UserTooltip } from "components/UserTooltip/UserTooltip";
import type { ChatMessageType } from "feature/chat/types/chat.types";
import { welcomeGoalPhrase } from "feature/chat/utils/systemMessages";
import { Shield, UserPlus } from "lucide-react";
import type { ReactNode } from "react";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60";

const SayHiButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type='button'
    onClick={onClick}
    className={cn(
      "shrink-0 rounded-lg bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/25 active:click-behavior",
      FOCUS_RING,
    )}>
    Say hi 👋
  </button>
);

const Name = ({ message }: { message: ChatMessageType }) => (
  <UserTooltip userId={message.userId}>
    <span className='cursor-pointer font-semibold text-zinc-100'>
      {message.username}
    </span>
  </UserTooltip>
);

/** A quiet line in the middle of the room: an icon, what happened, sometimes a button. */
const EventLine = ({
  icon,
  children,
  action,
  tone = "text-zinc-400",
}: {
  icon: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  tone?: string;
}) => (
  <div className='mx-auto flex w-full max-w-md items-center gap-3 rounded-lg bg-zinc-900/40 px-4 py-3'>
    <span className={cn("shrink-0", tone)}>{icon}</span>
    <p className='min-w-0 flex-1 text-sm leading-snug text-zinc-400'>
      {children}
    </p>
    {action}
  </div>
);

/**
 * Rows the room writes itself: a new player's welcome card, and in a guild the
 * level-ups and new members. They keep a room from looking
 * empty when nobody is typing — and each one is something to answer.
 */
export const ChatSystemRow = ({
  message,
  onSayHi,
}: {
  message: ChatMessageType;
  /** Missing for the viewer's own rows — nobody greets themselves. */
  onSayHi?: () => void;
}) => {
  if (message.type === "welcome") {
    const phrase = welcomeGoalPhrase(
      message.welcome?.goal,
      message.welcome?.planTitle,
    );

    return (
      <div className='mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-lg bg-zinc-900/60 px-5 py-5 text-center'>
        <UserTooltip userId={message.userId}>
          <div className='cursor-pointer'>
            <Avatar
              size='sm'
              name={message.username}
              avatarURL={message.userPhotoURL}
              lvl={message.lvl}
            />
          </div>
        </UserTooltip>
        <p className='text-sm leading-relaxed text-zinc-400'>
          <span aria-hidden>🎸 </span>
          <Name message={message} /> just joined
          {phrase ? `, ${phrase}` : " Riff Quest"}
        </p>
        {onSayHi && <SayHiButton onClick={onSayHi} />}
      </div>
    );
  }

  const event = message.system;
  if (!event) return null;

  switch (event.kind) {
    case "level_up":
      return (
        <EventLine icon={<Shield className='h-5 w-5' />} tone='text-amber-400'>
          <span className='font-semibold text-zinc-100'>{event.guildName}</span>{" "}
          reached level{" "}
          <span className='font-semibold text-amber-300'>{event.level}</span>
          {event.quests.length > 0 && (
            <span className='mt-0.5 block text-xs text-zinc-500'>
              Cleared: {event.quests.join(", ")}
            </span>
          )}
        </EventLine>
      );
    case "member_joined":
      return (
        <EventLine
          icon={<UserPlus className='h-5 w-5' />}
          tone='text-emerald-400'
          action={onSayHi && <SayHiButton onClick={onSayHi} />}>
          <Name message={message} /> joined the guild
        </EventLine>
      );
  }
};
