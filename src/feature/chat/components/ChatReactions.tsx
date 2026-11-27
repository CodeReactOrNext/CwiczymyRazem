import { PRESSABLE } from "assets/components/ui/button";
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
import { m } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { Reply } from "lucide-react";
import { useState } from "react";
import { TOUCH_TARGET } from "utils/touchTarget";

/** The emoji jumps when you add yours: a quick overshoot, then it settles. */
const POP_FROM = { scale: 1.45, rotate: -8 };
const POP_TO = { scale: 1, rotate: 0 };
const POP_SPRING = { type: "spring", stiffness: 600, damping: 14 } as const;

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60";

/**
 * What a message has collected, one chip per emoji. Clicking a chip adds or takes back yours.
 * Each chip is a small key (face and lip, like every button); yours is green, the app's
 * "selected".
 */
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
  // The chip the viewer just added to, and a counter that remounts its emoji so the pop replays.
  const [popped, setPopped] = useState<{
    emoji: ChatReactionEmoji;
    count: number;
  } | null>(null);
  const groups = groupReactions(reactions, viewerId);
  if (groups.length === 0) return null;

  return (
    <div
      className={cn(
        "mt-2 flex flex-wrap gap-2",
        alignEnd && "justify-end",
      )}>
      {groups.map((group) => (
        <Tooltip key={group.emoji}>
          <TooltipTrigger asChild>
            <button
              type='button'
              aria-label={t("reactions.react_with", { emoji: group.emoji })}
              aria-pressed={group.mine}
              onClick={() => {
                if (!group.mine) {
                  setPopped((prev) => ({
                    emoji: group.emoji,
                    count: (prev?.count ?? 0) + 1,
                  }));
                }
                onToggle(group.emoji);
              }}
              className={cn(
                PRESSABLE,
                "flex min-h-[34px] items-center gap-1.5 rounded-[10px] px-3 text-sm tabular-nums transition-colors",
                TOUCH_TARGET,
                FOCUS_RING,
                group.mine
                  ? "border-b-emerald-950 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
                  : "border-b-black/40 bg-zinc-800 text-zinc-200 hover:bg-zinc-700/80",
              )}>
              {popped?.emoji === group.emoji ? (
                <m.span
                  key={popped.count}
                  initial={POP_FROM}
                  animate={POP_TO}
                  transition={POP_SPRING}
                  className='inline-block leading-none'>
                  {group.emoji}
                </m.span>
              ) : (
                <span className='leading-none'>{group.emoji}</span>
              )}
              <span className='font-semibold leading-none'>
                {group.reactors.length}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent
            side='top'
            className='max-w-xs'>
            <p className='text-xs'>
              {group.reactors.map((reactor) => reactor.username).join(", ")}
            </p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};

/**
 * The quick actions beside a message: the five reactions and Reply, revealed
 * on hover (or keyboard focus) inside a `group/msg`. Only where there is a
 * hover — a touch screen gets the same actions from a held finger or the ⋯
 * button, as a sheet (`ChatMessageMenu`).
 */
export const ChatMessageActions = ({
  onReact,
  onReply,
  className,
}: {
  className?: string;
  onReact: (emoji: ChatReactionEmoji) => void;
  onReply?: () => void;
}) => {
  const { t } = useTranslation("chat");
  return (
  <div
    className={cn(
      "pointer-events-none z-10 hidden shrink-0 items-center gap-0.5 rounded-full bg-zinc-800 p-1 opacity-0 transition-opacity [@media(hover:hover)]:flex",
      "group-focus-within/msg:pointer-events-auto group-focus-within/msg:opacity-100 group-hover/msg:pointer-events-auto group-hover/msg:opacity-100",
      className,
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
          "flex h-11 w-11 items-center justify-center rounded-full text-lg transition-colors hover:bg-white/10 active:click-behavior",
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
          "flex h-11 w-11 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100 active:click-behavior",
          FOCUS_RING,
        )}>
        <Reply className='h-5 w-5' />
      </button>
    )}
  </div>
  );
};
