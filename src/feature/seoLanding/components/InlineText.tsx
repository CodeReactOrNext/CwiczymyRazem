import Link from "next/link";
import type { ReactNode } from "react";

const LINK_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)/g;
/** `**bold**` first, then `*italic*` — the intro paragraphs were showing their
 *  asterisks because only the bold form was ever handled. */
const EMPHASIS_PATTERN = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;

const renderEmphasis = (text: string, keyPrefix: string): ReactNode[] => {
  const parts: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  const pattern = new RegExp(EMPHASIS_PATTERN);
  while ((match = pattern.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      match[1] !== undefined ? (
        <strong
          key={`${keyPrefix}-b${match.index}`}
          className='font-semibold text-zinc-200'>
          {match[1]}
        </strong>
      ) : (
        <em key={`${keyPrefix}-i${match.index}`} className='italic'>
          {match[2]}
        </em>
      )
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
};

/**
 * Renders content strings with a minimal inline syntax: `[label](href)` links,
 * `**bold**` and `*italic*`. Keeps the content configs plain data while still allowing
 * internal linking inside paragraphs.
 */
export const InlineText = ({ text }: { text: string }) => {
  const parts: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  const pattern = new RegExp(LINK_PATTERN);
  while ((match = pattern.exec(text))) {
    if (match.index > last) {
      parts.push(...renderEmphasis(text.slice(last, match.index), `t${last}`));
    }
    const [, label, href] = match;
    parts.push(
      href.startsWith("/") ? (
        <Link
          key={`l${match.index}`}
          href={href}
          className='text-cyan-400 transition-colors hover:text-cyan-300'>
          {label}
        </Link>
      ) : (
        <a
          key={`l${match.index}`}
          href={href}
          className='text-cyan-400 transition-colors hover:text-cyan-300'
          rel='noopener noreferrer'
          target='_blank'>
          {label}
        </a>
      )
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push(...renderEmphasis(text.slice(last), `t${last}`));
  }
  return <>{parts}</>;
};
