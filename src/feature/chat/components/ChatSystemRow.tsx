import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { UserTooltip } from "components/UserTooltip/UserTooltip";
import type { ChatMessageType } from "feature/chat/types/chat.types";
import { welcomeGoalPhrase } from "feature/chat/utils/systemMessages";
import { Hand, Shield } from "lucide-react";
import type { ReactNode } from "react";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60";

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

/** How many greeters are named before the rest become "and 3 others". */
const NAMED_GREETERS = 2;

/** Their faces, then "Ania and Bob said hi" — names bright enough to read at a glance. */
const Greeters = ({ greeters }: { greeters: ChatMessageType[] }) => {
  const named = greeters.slice(0, NAMED_GREETERS);
  const rest = greeters.length - named.length;

  return (
    <div className='flex min-w-0 items-center gap-2.5'>
      <div className='flex shrink-0 -space-x-2'>
        {greeters.slice(0, 3).map((greeter) => (
          <UserTooltip key={greeter.userId} userId={greeter.userId}>
            <div className='cursor-pointer rounded-full ring-2 ring-zinc-900'>
              <Avatar
                size='xs'
                name={greeter.username}
                avatarURL={greeter.userPhotoURL}
              />
            </div>
          </UserTooltip>
        ))}
      </div>
      <p className='min-w-0 text-sm text-zinc-500'>
        {named.map((greeter, index) => (
          <span key={greeter.userId}>
            {index > 0 && (rest > 0 ? ", " : " and ")}
            <span className='font-semibold text-zinc-200'>
              {greeter.username}
            </span>
          </span>
        ))}
        {rest > 0 && ` and ${rest} other${rest === 1 ? "" : "s"}`} said hi
      </p>
    </div>
  );
};

/**
 * Someone arriving, drawn where a message of theirs would be: their avatar and
 * name, one line of what brought them, and the greetings beneath.
 */
const JoinRow = ({
  message,
  text,
  onSayHi,
  greeters,
}: {
  message: ChatMessageType;
  text: string;
  onSayHi?: () => void;
  greeters: ChatMessageType[];
}) => (
  <div className='flex min-w-0 max-w-[90%] gap-3'>
    <div className='flex w-10 flex-shrink-0 justify-center'>
      <UserTooltip userId={message.userId}>
        <div className='mt-0.5 cursor-pointer'>
          <Avatar
            size='sm'
            name={message.username}
            avatarURL={message.userPhotoURL}
            lvl={message.lvl}
          />
        </div>
      </UserTooltip>
    </div>
    <div className='flex min-w-0 flex-col items-start'>
      <UserTooltip userId={message.userId}>
        <span className='mb-1 cursor-pointer px-1 text-xs font-semibold text-zinc-400'>
          {message.username}
        </span>
      </UserTooltip>
      <p className='rounded-lg rounded-tl bg-white/5 px-3 py-2 text-sm text-zinc-300 sm:px-4'>
        {text}
      </p>
      {(onSayHi || greeters.length > 0) && (
        <div className='mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2'>
          {onSayHi && (
            <button
              type='button'
              onClick={onSayHi}
              className={cn(
                "flex items-center gap-2 rounded-lg bg-cyan-500/15 px-3.5 py-1.5 text-sm font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/25 active:click-behavior",
                FOCUS_RING,
              )}>
              <Hand className='h-4 w-4' />
              Say hi
            </button>
          )}
          {greeters.length > 0 && <Greeters greeters={greeters} />}
        </div>
      )}
    </div>
  </div>
);

/** Rows drawn like someone speaking, on the left, rather than as a line across the room. */
export const isJoinRow = (message: ChatMessageType) =>
  message.type === "welcome" ||
  (message.type === "system" && message.system?.kind === "member_joined");

/**
 * Rows the room writes itself: a new player arriving, and in a guild the
 * level-ups and new members. They keep a room from looking
 * empty when nobody is typing — and each one is something to answer.
 */
export const ChatSystemRow = ({
  message,
  onSayHi,
  greeters = [],
}: {
  message: ChatMessageType;
  /** Missing for the viewer's own rows, and once they have already said hi. */
  onSayHi?: () => void;
  /** Stock greetings answering this row, named in one line instead of a bubble each. */
  greeters?: ChatMessageType[];
}) => {
  if (message.type === "welcome") {
    const phrase = welcomeGoalPhrase(
      message.welcome?.goal,
      message.welcome?.planTitle,
    );

    return (
      <JoinRow
        message={message}
        text={phrase ? `Joined Riff Quest, ${phrase}` : "Joined Riff Quest"}
        onSayHi={onSayHi}
        greeters={greeters}
      />
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
        <JoinRow
          message={message}
          text='Joined the guild'
          onSayHi={onSayHi}
          greeters={greeters}
        />
      );
  }
};
