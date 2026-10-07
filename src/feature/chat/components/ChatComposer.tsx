import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import type {
  ChatAttachment,
  ChatMention,
  ChatReplyTo,
} from "feature/chat/types/chat.types";
import {
  activeMentionQuery,
  insertMention,
} from "feature/chat/utils/chatMentions";
import { useTranslation } from "hooks/useTranslation";
import { Paperclip, Reply, SendHorizontal, X } from "lucide-react";
import { type FormEvent, type RefObject, useState } from "react";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60";

/** How many names the @ list shows at once. */
const MAX_SUGGESTIONS = 6;

const attachmentLabel = (attachment: ChatAttachment): string =>
  attachment.kind === "item"
    ? `${attachment.itemBrand} ${attachment.itemName}`
    : attachment.title;

/** A strip above the input — what is being answered, or what is about to be shared. */
const ComposerStrip = ({
  icon,
  label,
  text,
  onClear,
  clearLabel,
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  text: string;
  onClear: () => void;
  clearLabel: string;
}) => (
  <div className='flex items-center gap-3 rounded-lg bg-zinc-950/60 px-3 py-2'>
    <span className='shrink-0 text-cyan-400'>{icon}</span>
    <span className='min-w-0 flex-1 text-xs'>
      <span className='block text-zinc-400'>{label}</span>
      <span className='block truncate text-zinc-300'>{text}</span>
    </span>
    <button
      type='button'
      aria-label={clearLabel}
      onClick={onClear}
      className={cn(
        "rounded-full p-1 text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-200",
        FOCUS_RING,
      )}>
      <X className='h-4 w-4' />
    </button>
  </div>
);

export const ChatComposer = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  inputRef,
  replyTo,
  onCancelReply,
  attachment,
  onClearAttachment,
  onOpenPicker,
  mentionCandidates,
  onMention,
  onTyping,
  typingText,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  placeholder: string;
  inputRef: RefObject<HTMLInputElement | null>;
  replyTo: ChatReplyTo | null;
  onCancelReply: () => void;
  attachment: ChatAttachment | null;
  onClearAttachment: () => void;
  onOpenPicker: () => void;
  mentionCandidates: ChatMention[];
  onMention: (mention: ChatMention) => void;
  onTyping: () => void;
  typingText: string | null;
  error: string | null;
}) => {
  const { t } = useTranslation("chat");
  const [mentionQuery, setMentionQuery] = useState<{
    start: number;
    query: string;
  } | null>(null);
  const [highlighted, setHighlighted] = useState(0);

  const suggestions = mentionQuery
    ? mentionCandidates
        .filter((candidate) =>
          candidate.username
            .toLowerCase()
            .includes(mentionQuery.query.toLowerCase()),
        )
        .slice(0, MAX_SUGGESTIONS)
    : [];
  const showSuggestions = suggestions.length > 0;

  const readCaret = (text: string, caret: number | null) => {
    setMentionQuery(activeMentionQuery(text, caret ?? text.length));
    setHighlighted(0);
  };

  const pick = (mention: ChatMention) => {
    if (!mentionQuery) return;
    const input = inputRef.current;
    const caret = input?.selectionStart ?? value.length;
    const next = insertMention(value, mentionQuery.start, caret, mention.username);

    onChange(next.text);
    onMention(mention);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(next.caret, next.caret);
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setHighlighted(
        (index) => (index + step + suggestions.length) % suggestions.length,
      );
    } else if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      pick(suggestions[Math.min(highlighted, suggestions.length - 1)]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setMentionQuery(null);
    }
  };

  return (
    <div className='flex flex-col gap-2 pt-3 sm:bg-zinc-900/60 sm:p-4'>
      {replyTo && (
        <ComposerStrip
          icon={<Reply className='h-4 w-4' />}
          label={
            <>
              {t("composer.replying_to")}{" "}
              <span className='font-semibold text-zinc-200'>
                {replyTo.username}
              </span>
            </>
          }
          text={replyTo.message}
          onClear={onCancelReply}
          clearLabel={t("composer.cancel_reply")}
        />
      )}
      {attachment && (
        <ComposerStrip
          icon={<Paperclip className='h-4 w-4' />}
          label={t("composer.sharing")}
          text={attachmentLabel(attachment)}
          onClear={onClearAttachment}
          clearLabel={t("composer.remove_attachment")}
        />
      )}

      <form
        onSubmit={onSubmit}
        className='relative mx-auto flex w-full max-w-4xl items-center gap-2'>
        {showSuggestions && (
          <div
            role='listbox'
            aria-label={t("composer.mention")}
            className='absolute bottom-full left-0 z-20 mb-2 w-64 max-w-full overflow-hidden rounded-lg bg-zinc-800 p-1'>
            {suggestions.map((candidate, index) => (
              <button
                key={candidate.id}
                type='button'
                role='option'
                aria-selected={index === highlighted}
                // Keeps the input focused, so picking doesn't close the list first.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(candidate)}
                className={cn(
                  "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  index === highlighted
                    ? "bg-cyan-500/20 text-cyan-50"
                    : "text-zinc-300 hover:bg-white/5",
                )}>
                @{candidate.username}
              </button>
            ))}
          </div>
        )}

        <button
          type='button'
          aria-label={t("composer.share")}
          onClick={onOpenPicker}
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-950/50 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100",
            FOCUS_RING,
          )}>
          <Paperclip className='h-5 w-5' />
        </button>
        <Input
          ref={inputRef}
          type='text'
          value={value}
          placeholder={placeholder}
          autoComplete='off'
          className='h-12 flex-1 rounded-lg border-none bg-zinc-950/50 transition-colors focus-visible:ring-cyan-500/50'
          onChange={(event) => {
            onChange(event.target.value);
            readCaret(event.target.value, event.target.selectionStart);
            onTyping();
          }}
          onKeyDown={handleKeyDown}
          onClick={(event) =>
            readCaret(event.currentTarget.value, event.currentTarget.selectionStart)
          }
          onBlur={() => setMentionQuery(null)}
        />
        <Button
          type='submit'
          size='icon'
          aria-label={t("composer.send")}
          className='h-12 w-12 shrink-0 rounded-lg bg-white font-bold text-black transition-colors hover:bg-zinc-200 active:click-behavior'>
          <SendHorizontal className='h-5 w-5' />
        </Button>
      </form>

      <div className='flex min-h-4 items-center justify-between gap-3 px-1'>
        <p aria-live='polite' className='truncate text-xs text-zinc-500'>
          {typingText}
        </p>
        {error && (
          <p className='text-xs font-medium text-red-400'>{error}</p>
        )}
      </div>
    </div>
  );
};
