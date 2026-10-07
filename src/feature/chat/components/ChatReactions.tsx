import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import {
  CHAT_REACTIONS,
  type ChatReaction,
  type ChatReactionEmoji,
} from "feature/chat/types/chat.types";
import { groupReactions } from "feature/chat/utils/chatReactions";
import { useTranslation } from "hooks/useTranslation";
import { Reply } from "lucide-react";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60";

/** What a message has collected, one chip per emoji. Clicking a chip adds or takes back yours. */
export const ChatReactionChips = ({
  reactions,
  viewerId,
  onToggle,
  alignEnd,
}: {
  reactions: ChatReaction[] | undefined;
  viewerId: string | null;
  onToggle: (emoji: ChatReactionEmoji) => void;
  alignEnd?: boolean;
}) => {
  const { t } = useTranslation("chat");
  const groups = groupReactions(reactions, viewerId);
  if (groups.length === 0) return null;

  return (
    <div
      className={cn(
        "mt-1.5 flex flex-wrap gap-1.5",
        alignEnd && "justify-end",
      )}>
      {groups.map((group) => (
        <Tooltip key={group.emoji}>
          <TooltipTrigger asChild>
            <button
              type='button'
              aria-label={t("reactions.react_with", { emoji: group.emoji })}
              aria-pressed={group.mine}
              onClick={() => onToggle(group.emoji)}
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs tabular-nums transition-colors active:click-behavior",
                FOCUS_RING,
                group.mine
                  ? "bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30"
                  : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700",
              )}>
              <span className='leading-none'>{group.emoji}</span>
              <span className='font-semibold leading-none'>
                {group.reactors.length}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent
            side='top'
            className='max-w-xs border-none bg-zinc-900 text-white'>
            <p className='text-[11px] text-zinc-300'>
              {group.reactors.map((reactor) => reactor.username).join(", ")}
            </p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};

/**
 * The quick actions beside a message: the five reactions and Reply. Revealed on
 * hover on desktop, by tapping the message on touch screens.
 */
export const ChatMessageActions = ({
  visible,
  onReact,
  onReply,
  className,
}: {
  visible: boolean;
  className?: string;
  onReact: (emoji: ChatReactionEmoji) => void;
  onReply?: () => void;
}) => {
  const { t } = useTranslation("chat");
  return (
  <div
    className={cn(
      "z-10 flex shrink-0 items-center gap-0.5 rounded-full bg-zinc-800 p-0.5 transition-opacity",
      className,
      visible
        ? "opacity-100"
        : "pointer-events-none opacity-0 sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100",
    )}>
    {CHAT_REACTIONS.map((emoji) => (
      <button
        key={emoji}
        type='button'
        aria-label={t("reactions.react_with", { emoji })}
        onClick={(event) => {
          event.stopPropagation();
          onReact(emoji);
        }}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors hover:bg-white/10 active:click-behavior",
          FOCUS_RING,
        )}>
        {emoji}
      </button>
    ))}
    {onReply && (
      <button
        type='button'
        aria-label={t("reactions.reply")}
        onClick={(event) => {
          event.stopPropagation();
          onReply();
        }}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100 active:click-behavior",
          FOCUS_RING,
        )}>
        <Reply className='h-4 w-4' />
      </button>
    )}
  </div>
  );
};
