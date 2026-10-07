import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "assets/components/ui/drawer";
import { cn } from "assets/lib/utils";
import {
  CHAT_REACTIONS,
  type ChatMessageType,
  type ChatReactionEmoji,
} from "feature/chat/types/chat.types";
import { findOwnReaction } from "feature/chat/utils/chatReactions";
import { useTranslation } from "hooks/useTranslation";
import { Copy, Reply } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60";

const ROW =
  "flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-base text-zinc-100 transition-colors hover:bg-white/5 active:bg-white/10";

/**
 * What a held finger (or the ⋯ beside a message) opens on a touch screen: the
 * reactions as big targets, then Reply and Copy — iMessage's long-press menu,
 * as a sheet from the bottom so it sits under the thumb.
 */
export const ChatMessageMenu = ({
  message: openFor,
  viewerId,
  onClose,
  onReact,
  onReply,
}: {
  /** The message the menu is for; `null` keeps it shut. */
  message: ChatMessageType | null;
  viewerId: string | null;
  onClose: () => void;
  onReact: (message: ChatMessageType, emoji: ChatReactionEmoji) => void;
  /** Left out for rows that can't be answered (server events). */
  onReply?: (message: ChatMessageType) => void;
}) => {
  const { t } = useTranslation("chat");
  // Holds on to the last message while the sheet slides away, so it doesn't
  // empty out mid-animation.
  const [message, setMessage] = useState(openFor);
  if (openFor && openFor !== message) setMessage(openFor);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("menu.copied"));
    } catch {
      toast.error(t("menu.copy_failed"));
    }
  };

  return (
    <Drawer
      open={!!openFor}
      onOpenChange={(open) => !open && onClose()}
      shouldScaleBackground={false}>
      <DrawerContent
        overlayClassName='z-[105] bg-black/60'
        className='z-[110] rounded-t-2xl border-0 bg-zinc-950 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 outline-none'>
        {message && (
          <div className='space-y-4 px-4 pt-4'>
            <div className='rounded-lg bg-zinc-900/60 px-4 py-3'>
              <DrawerTitle className='text-sm font-semibold text-zinc-300'>
                {message.username}
              </DrawerTitle>
              <DrawerDescription className='mt-1 line-clamp-3 text-base text-zinc-100'>
                {message.message}
              </DrawerDescription>
            </div>

            <div className='flex justify-between gap-1 rounded-xl bg-zinc-900/60 p-1'>
              {CHAT_REACTIONS.map((emoji) => {
                const mine =
                  !!viewerId && !!findOwnReaction(message.likes, viewerId, emoji);
                return (
                  <button
                    key={emoji}
                    type='button'
                    aria-label={t("reactions.react_with", { emoji })}
                    aria-pressed={mine}
                    onClick={() => {
                      onReact(message, emoji);
                      onClose();
                    }}
                    className={cn(
                      "flex h-12 flex-1 items-center justify-center rounded-lg text-2xl transition-colors",
                      mine ? "bg-cyan-500/20" : "hover:bg-white/5 active:bg-white/10",
                      FOCUS_RING,
                    )}>
                    {emoji}
                  </button>
                );
              })}
            </div>

            <div className='space-y-0.5 rounded-xl bg-zinc-900/60 p-1'>
              {onReply && (
                <button
                  type='button'
                  onClick={() => {
                    onReply(message);
                    onClose();
                  }}
                  className={cn(ROW, FOCUS_RING)}>
                  <Reply className='h-5 w-5 text-zinc-400' />
                  {t("reactions.reply")}
                </button>
              )}
              {message.message && (
                <button
                  type='button'
                  onClick={() => {
                    void copy(message.message);
                    onClose();
                  }}
                  className={cn(ROW, FOCUS_RING)}>
                  <Copy className='h-5 w-5 text-zinc-400' />
                  {t("menu.copy")}
                </button>
              )}
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};
