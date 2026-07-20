import Link from "next/link";
import type { ReactNode } from "react";

const LINK_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const BOLD_PATTERN = /\*\*([^*]+)\*\*/g;

const renderBold = (text: string, keyPrefix: string): ReactNode[] => {
  const parts: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  const pattern = new RegExp(BOLD_PATTERN);
  while ((match = pattern.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <strong
        key={`${keyPrefix}-b${match.index}`}
        className='font-semibold text-zinc-200'>
        {match[1]}
      </strong>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
};

/**
 * Renders content strings with a minimal inline syntax: `[label](href)` links
 * and `**bold**`. Keeps the content configs plain data while still allowing
 * internal linking inside paragraphs.
 */
export const InlineText = ({ text }: { text: string }) => {
  const parts: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  const pattern = new RegExp(LINK_PATTERN);
  while ((match = pattern.exec(text))) {
    if (match.index > last) {
      parts.push(...renderBold(text.slice(last, match.index), `t${last}`));
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
    parts.push(...renderBold(text.slice(last), `t${last}`));
  }
  return <>{parts}</>;
};
