import { evaluate } from '@mdx-js/mdx';
import { ActionCard } from 'components/Blog/ActionCard';
import { AppCard } from 'components/Blog/AppCard';
import { BlogAlert } from 'components/Blog/BlogAlert';
import { Checklist } from 'components/Blog/Checklist';
import { ExercisePromo } from 'components/Blog/ExercisePromo';
import { MajorScaleDiagram } from 'components/Blog/MajorScaleDiagram';
import { PatternBackground } from 'components/Blog/PatternBackground';
import { PhotoBlock } from 'components/Blog/PhotoBlock';
import { PracticePlanCard } from 'components/Blog/PracticePlanCard';
import { PracticeTable } from 'components/Blog/PracticeTable';
import { SessionLengthChart } from 'components/Blog/SessionLengthChart';
import { SessionTimeline } from 'components/Blog/SessionTimeline';
import { SongTierTable } from 'components/Blog/SongTierTable';
import { StatRow } from 'components/Blog/StatRow';
import { StepList } from 'components/Blog/StepList';
import { TierCards } from 'components/Blog/TierCards';
import { YouTube } from 'components/Blog/YouTube';
import { createHeadingIdFactory, headingText } from 'lib/headingId';
import { CheckCircle2, Clock, Flame, HelpCircle, Sprout, Target, Trophy } from 'lucide-react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import remarkGfm from 'remark-gfm';

export interface BlogHeading {
  text: string;
  id: string;
  /** 2 for `##`, 3 for `###` — drives the indent in the table of contents. */
  level: 2 | 3;
}

// Keyword -> icon for H2 section markers. Falls back to a plain dot when no
// keyword matches, so existing posts without these headings render unchanged.
const H2_ICONS: [RegExp, React.ElementType][] = [
  [/beginner/i, Sprout],
  [/intermediate/i, Flame],
  [/advanced/i, Trophy],
  [/efficien/i, Target],
  [/faq/i, HelpCircle],
  [/conclusion/i, CheckCircle2],
  [/^how long/i, Clock],
];

const getH2Icon = (text: string): React.ElementType | null => {
  const match = H2_ICONS.find(([pattern]) => pattern.test(text));
  return match ? match[1] : null;
};

/** Flattens rendered children back to plain text so a heading containing a link
 *  or bold run slugs to the same string its markdown source does. */
const nodeText = (node: React.ReactNode): string => {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join('');
  if (typeof node === 'object' && 'props' in node) {
    return nodeText((node as { props?: { children?: React.ReactNode } }).props?.children);
  }
  return '';
};

/**
 * The heading ids have to match the table of contents exactly, so both sides
 * run the same slug factory over the document in reading order. A fresh factory
 * per render keeps the repeat counters from leaking between posts.
 */
const createComponents = (nextHeadingId: (text: string) => string) => ({
  YouTube,
  BlogAlert,
  ActionCard,
  AppCard,
  Checklist,
  ExercisePromo,
  MajorScaleDiagram,
  PhotoBlock,
  PracticePlanCard,
  PracticeTable,
  SessionLengthChart,
  SessionTimeline,
  StatRow,
  StepList,
  SongTierTable,
  TierCards,
  // Mapping h2 to include IDs for ToC, plus an accent marker for section scanning
  h2: ({ children, ...rest }: any) => {
    const text = nodeText(children);
    const Icon = getH2Icon(text);
    return (
      <h2 {...rest} id={nextHeadingId(text)} className="scroll-mt-24 flex items-center gap-3.5">
        {Icon ? (
          <Icon className="h-6 w-6 shrink-0 text-cyan-400" aria-hidden="true" />
        ) : (
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-400" aria-hidden="true" />
        )}
        <span>{children}</span>
      </h2>
    );
  },
  // h3 gets a small marker to echo h2's language at a subtler scale, so
  // sub-sections read as part of the same heading system, not plain bold text.
  // It carries an id too — the ToC links to sub-sections, not just top ones.
  h3: ({ children, ...rest }: any) => (
    <h3 {...rest} id={nextHeadingId(nodeText(children))} className="scroll-mt-24 flex items-center gap-3">
      <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-500/60" aria-hidden="true" />
      <span>{children}</span>
    </h3>
  ),
  // Content images live below the fold; lazy-load them to cut initial page weight
  img: (props: any) => <img loading='lazy' decoding='async' {...props} />,
  // The article column is `overflow-hidden`, so a wide comparison table used to
  // get clipped on a phone rather than scrolled. Give each table its own scroll
  // container and a minimum width, so the columns stay readable and swipeable.
  table: ({ children, ...rest }: any) => (
    <div className='my-8 overflow-x-auto' role='region' aria-label='Table, scrolls horizontally' tabIndex={0}>
      <table {...rest} className='my-0 min-w-[34rem]'>{children}</table>
    </div>
  ),
  // Expert-quote blockquotes get the same repeating-icon treatment as BlogAlert,
  // just smaller/tighter so the box doesn't dominate the page
  blockquote: ({ children, ...rest }: any) => (
    <div className='relative my-10 overflow-hidden rounded-lg bg-zinc-800/40 px-6 py-8 sm:px-10'>
      <PatternBackground
        icon={
          <g>
            <path d='M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z' />
            <path d='M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z' />
          </g>
        }
        strokeClass='stroke-cyan-400'
      />
      <blockquote
        {...rest}
        className='relative m-0 border-0 text-center text-base italic leading-relaxed text-zinc-200 [&>p]:m-0 [&>p]:before:content-none [&>p]:after:content-none'
      >
        {children}
      </blockquote>
    </div>
  ),
  // Source citations are written as `[\[5\]](url)`; render them as small,
  // superscript-style markers so they read as footnotes, not body links
  a: ({ children, ...rest }: any) => {
    const text = Array.isArray(children) ? children.join('') : (children?.toString() ?? '');
    const isCitation = /^\[\d+\]$/.test(text.trim());
    return (
      <a
        {...rest}
        className={isCitation ? 'align-super text-[0.65em] text-zinc-500 no-underline hover:text-zinc-300' : undefined}
      >
        {children}
      </a>
    );
  },
  // GFM task-list checkboxes render as bare inputs; give them an accessible name
  input: (props: any) =>
    props.type === 'checkbox' ? (
      <input aria-label='Checklist item' {...props} />
    ) : (
      <input {...props} />
    ),
});

/**
 * Reading time from the article's own words, at 225 wpm. The header used to
 * show a hard-coded "5 min read" on every post, including a 5 000-word ranking.
 * Component tags, link targets and table pipes are dropped first so the count
 * reflects prose rather than markup.
 */
const readingMinutes = (content: string): number => {
  const prose = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\]\([^)]*\)/g, "] ")
    .replace(/[|#*_>`[\]]/g, " ");
  const words = prose.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 225));
};

/**
 * The `### question` pairs under a post's `## FAQs` heading, for the FAQPage
 * schema. Stops at the next `## ` so a section following the FAQ block — a
 * conclusion, say — is not swallowed into the last answer.
 */
export const extractFaqs = (
  content: string
): { question: string; answer: string }[] => {
  const start = content.indexOf('## FAQs');
  if (start === -1) return [];

  const afterHeading = content.slice(start + '## FAQs'.length);
  const nextSection = afterHeading.search(/\n## /);
  const section =
    nextSection === -1 ? afterHeading : afterHeading.slice(0, nextSection);

  return section
    .split('### ')
    .slice(1)
    .map((block) => {
      const lines = block.split('\n');
      return {
        question: lines[0].trim(),
        answer: lines.slice(1).join(' ').replace(/\s+/g, ' ').trim(),
      };
    })
    .filter((faq) => faq.question && faq.answer);
};

/**
 * Compiles a post's MDX to static HTML and returns the headings it contains.
 *
 * Rendering happens at build time (Node has no CSP) instead of shipping compiled
 * MDX for the client to `new Function()`-eval on hydration — the browser's
 * script-src CSP has no 'unsafe-eval' and blocks that. None of the MDX
 * components are interactive, so static markup is lossless.
 *
 * The headings and the ids in the HTML come from two passes of the same slug
 * factory over the same document, which is what keeps every table-of-contents
 * anchor pointing at a heading that actually carries that id.
 */
export const renderBlogContent = async (
  content: string
): Promise<{
  contentHtml: string;
  headings: BlogHeading[];
  readingMinutes: number;
}> => {
  const { default: MDXContent } = await evaluate(content, {
    ...jsxRuntime,
    remarkPlugins: [remarkGfm],
  });
  const contentHtml = renderToStaticMarkup(
    <MDXContent components={createComponents(createHeadingIdFactory())} />
  );

  const nextId = createHeadingIdFactory();
  let inCodeFence = false;
  const headings: BlogHeading[] = [];
  for (const line of content.split('\n')) {
    if (line.startsWith('```')) inCodeFence = !inCodeFence;
    if (inCodeFence) continue;
    const match = /^(#{2,3})\s+(.*)$/.exec(line);
    if (!match) continue;
    const text = headingText(match[2]);
    headings.push({ text, id: nextId(text), level: match[1].length as 2 | 3 });
  }

  return { contentHtml, headings, readingMinutes: readingMinutes(content) };
};
