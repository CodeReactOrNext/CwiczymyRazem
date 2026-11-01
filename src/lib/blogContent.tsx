import { evaluate } from '@mdx-js/mdx';
import { cn } from 'assets/lib/utils';
import { ActionCard } from 'components/Blog/ActionCard';
import { AppCard } from 'components/Blog/AppCard';
import { BlogAlert } from 'components/Blog/BlogAlert';
import { Checklist } from 'components/Blog/Checklist';
import { ChordShape } from 'components/Blog/ChordShape';
import { ExercisePromo } from 'components/Blog/ExercisePromo';
import { MajorScaleDiagram } from 'components/Blog/MajorScaleDiagram';
import { PhotoBlock } from 'components/Blog/PhotoBlock';
import { PhotoCompare } from 'components/Blog/PhotoCompare';
import { PracticeBlueprint } from 'components/Blog/PracticeBlueprint';
import { PracticePlanCard } from 'components/Blog/PracticePlanCard';
import { PracticeTable } from 'components/Blog/PracticeTable';
import { SessionLengthStat } from 'components/Blog/SessionLengthStat';
import { SessionTimeline } from 'components/Blog/SessionTimeline';
import { SongRanking } from 'components/Blog/SongRanking';
import { SongTierTable } from 'components/Blog/SongTierTable';
import { StatRow } from 'components/Blog/StatRow';
import { StepList } from 'components/Blog/StepList';
import { TierCards } from 'components/Blog/TierCards';
import { YouTube } from 'components/Blog/YouTube';
import { createHeadingIdFactory, headingText } from 'lib/headingId';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import remarkGfm from 'remark-gfm';

export interface BlogHeading {
  text: string;
  id: string;
  /** 2 for `##`, 3 for `###` — drives the indent in the table of contents. */
  level: 2 | 3;
}

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

/** Header cells in a markdown table's first row: how wide the table needs to be. */
const columnCount = (node: React.ReactNode): number => {
  let count = 0;
  const walk = (child: React.ReactNode): boolean => {
    if (!child || typeof child !== 'object') return false;
    if (Array.isArray(child)) return child.some(walk);
    const { props } = child as { props?: { children?: React.ReactNode } };
    const kids = ([] as React.ReactNode[]).concat(props?.children ?? []);
    if ((child as { type?: unknown }).type === 'tr') {
      count = kids.filter((kid) => kid && typeof kid === 'object').length;
      return true;
    }
    return walk(kids);
  };
  walk(node);
  return count;
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
  ChordShape,
  ExercisePromo,
  MajorScaleDiagram,
  PhotoBlock,
  PhotoCompare,
  PracticeBlueprint,
  PracticePlanCard,
  PracticeTable,
  SessionLengthStat,
  SessionTimeline,
  StatRow,
  StepList,
  SongRanking,
  SongTierTable,
  TierCards,
  // Headings carry the ids the table of contents links to. They sit flush with
  // the paragraphs: the old cyan dot / icon markers pushed some headings 14-38px
  // right of the body text and spent colour on decoration rather than meaning.
  h2: ({ children, ...rest }: any) => (
    <h2 {...rest} id={nextHeadingId(nodeText(children))} className='scroll-mt-24'>
      {children}
    </h2>
  ),
  h3: ({ children, ...rest }: any) => (
    <h3 {...rest} id={nextHeadingId(nodeText(children))} className='scroll-mt-24'>
      {children}
    </h3>
  ),
  // Content images live below the fold; lazy-load them to cut initial page weight
  img: (props: any) => <img loading='lazy' decoding='async' {...props} />,
  // Each table gets its own scroll container and a minimum width, so on a phone
  // the columns stay readable and swipeable instead of being squeezed. Tables of
  // four or more columns also step out past the 680px text column on desktop:
  // five columns in 680px wrap every cell into a narrow word stack.
  table: ({ children, ...rest }: any) => {
    const wide = columnCount(children) >= 4;
    return (
      <div
        className={cn('my-10 overflow-x-auto rounded-lg bg-zinc-50', wide && 'lg:-mx-20')}
        role='region'
        aria-label='Table, scrolls horizontally'
        tabIndex={0}>
        <table
          {...rest}
          className={cn('my-0 w-full text-[15px] leading-relaxed [&_tbody_tr]:border-0 [&_tbody_tr:nth-child(even)]:bg-zinc-100/70 [&_td:first-child]:pl-5 [&_td:first-child]:font-semibold [&_td:first-child]:text-zinc-900 [&_td:last-child]:pr-5 [&_td]:px-3 [&_td]:py-3.5 [&_td]:align-top [&_th:first-child]:pl-5 [&_th:last-child]:pr-5 [&_th]:bg-zinc-100 [&_th]:px-3 [&_th]:py-3.5 [&_th]:align-bottom [&_th]:text-sm [&_th]:font-semibold [&_thead]:border-0', wide ? 'min-w-[46rem]' : 'min-w-[34rem]')}>
          {children}
        </table>
      </div>
    );
  },
  // A quoted source reads as a pull quote: larger type between two short rules,
  // with no box around it, so it sets itself apart by size rather than by colour.
  blockquote: ({ children, ...rest }: any) => (
    <blockquote
      {...rest}
      className='relative my-12 border-0 py-7 pl-0 text-xl font-medium not-italic leading-relaxed text-zinc-900 before:absolute before:left-0 before:top-0 before:h-0.5 before:w-14 before:rounded-full before:bg-zinc-900 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-14 after:rounded-full after:bg-zinc-900 [&>p]:m-0 [&>p]:text-zinc-900 [&>p]:before:content-none [&>p]:after:content-none'>
      {children}
    </blockquote>
  ),
  // Source citations are written as `[\[5\]](url)`; render them as small,
  // superscript-style markers so they read as footnotes, not body links
  a: ({ children, ...rest }: any) => {
    const text = Array.isArray(children) ? children.join('') : (children?.toString() ?? '');
    const isCitation = /^\[\d+\]$/.test(text.trim());
    return (
      <a
        {...rest}
        className={isCitation ? 'relative -top-[0.4em] align-baseline text-xs font-normal leading-none text-zinc-500 no-underline hover:text-zinc-900' : undefined}
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
 * The heading that opens a post's question-and-answer block. English posts write
 * `## FAQs`; a translated post names the section in its own language, so the
 * Polish wordings are listed here as well — otherwise those posts would ship
 * without FAQPage schema.
 */
const FAQ_HEADING =
  /^## (?:FAQs?|Frequently Asked Questions|(?:Najczęstsze )?Pytania[^\n]*)$/m;

/**
 * The `### question` pairs under a post's FAQ heading, for the FAQPage schema.
 * Stops at the next `## ` so a section following the FAQ block — a conclusion,
 * say — is not swallowed into the last answer.
 */
export const extractFaqs = (
  content: string
): { question: string; answer: string }[] => {
  const heading = FAQ_HEADING.exec(content);
  if (!heading) return [];

  const afterHeading = content.slice(heading.index + heading[0].length);
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
