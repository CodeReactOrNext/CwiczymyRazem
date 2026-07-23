import { BlogCard } from "components/Blog/BlogCard";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import type { SerializedExercise } from "feature/exercises/lib/serializeExercise";
import { idToSlug } from "feature/exercises/lib/slugUtils";
import { CookieBanner } from "feature/landing/components/CookieBanner";
import { FinalCTASection } from "feature/landing/components/FinalCTASection";
import { Footer } from "feature/landing/components/Footer";
import { jakartaLanding } from "feature/landing/lib/fonts";
import { motion, useScroll, useSpring } from "framer-motion";
import type { BlogFrontmatter } from "lib/blog";
import {
  ArrowDown,
  ArrowRight,
  ChevronRight,
  Lightbulb,
  List,
  Sparkles,
} from "lucide-react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { collectExerciseIds } from "../lib/collectExerciseIds";
import { headingId } from "../lib/headingId";
import type {
  SeoLandingBlock,
  SeoLandingConfig,
  SeoLandingGuideLink,
  SeoLandingSongGuideLink,
} from "../types/seoLanding.types";
import { ExerciseShowcase } from "./ExerciseShowcase";
import { InlineText } from "./InlineText";
import { ScheduleTable } from "./ScheduleTable";

export interface SeoLandingPageProps {
  config: SeoLandingConfig;
  exercisesById: Record<string, SerializedExercise>;
  relatedGuides: SeoLandingGuideLink[];
  relatedBlogs: BlogFrontmatter[];
  relatedSongGuides: SeoLandingSongGuideLink[];
}

const FAQ_HEADING = "FAQ";

const Block = ({
  block,
  exercisesById,
  exercisePosition,
  exerciseTotal,
}: {
  block: SeoLandingBlock;
  exercisesById: Record<string, SerializedExercise>;
  /** 1-based position per exercise id, in page order. */
  exercisePosition: Record<string, number>;
  exerciseTotal: number;
}) => {
  switch (block.kind) {
    case "paragraph":
      return (
        <p className='leading-relaxed text-zinc-400'>
          <InlineText text={block.text} />
        </p>
      );
    case "list":
      return (
        <ul className='space-y-2'>
          {block.items.map((item, idx) => (
            <li key={idx} className='flex gap-3 text-zinc-400'>
              <span className='font-bold text-cyan-400'>•</span>
              <span className='leading-relaxed'>
                <InlineText text={item} />
              </span>
            </li>
          ))}
        </ul>
      );
    case "tip":
      return (
        <div className='flex gap-4 rounded-lg bg-amber-500/5 p-5'>
          <Lightbulb
            className='mt-0.5 h-5 w-5 shrink-0 text-amber-400'
            aria-hidden='true'
          />
          <div>
            <p className='mb-1 text-sm font-semibold text-amber-400'>
              {block.title ?? "Pro tip"}
            </p>
            <p className='text-sm leading-relaxed text-zinc-300'>
              <InlineText text={block.text} />
            </p>
          </div>
        </div>
      );
    case "cta":
      return (
        <div className='relative overflow-hidden rounded-lg bg-zinc-900/60 p-6 sm:p-10'>
          <div className='pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/15 blur-[100px]' />
          <div className='relative'>
            <p className='mb-3 text-2xl font-bold tracking-tight text-white sm:text-3xl'>
              {block.title}
            </p>
            <p className='mb-6 max-w-xl leading-relaxed text-zinc-400'>
              <InlineText text={block.text} />
            </p>
            <div className='flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
              <Link
                href='/signup'
                className='inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 text-sm font-bold text-zinc-950 transition-colors hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300'>
                Start free
                <ArrowRight className='h-4 w-4' aria-hidden='true' />
              </Link>
              <span className='text-xs font-medium text-zinc-400'>
                Free forever — no credit card
              </span>
            </div>
          </div>
        </div>
      );
    case "exercise": {
      const exercise = exercisesById[block.exerciseId];
      if (!exercise) return null;
      return (
        <ExerciseShowcase
          exercise={exercise}
          commentary={block.commentary}
          position={exercisePosition[block.exerciseId]}
          total={exerciseTotal}
        />
      );
    }
    case "schedule":
      return <ScheduleTable schedule={block.schedule} />;
    default:
      return null;
  }
};

export const SeoLandingPage = ({
  config,
  exercisesById,
  relatedGuides,
  relatedBlogs,
  relatedSongGuides,
}: SeoLandingPageProps) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  const [activeId, setActiveId] = useState("");

  const headings = [
    ...config.sections.map((section) => ({
      text: section.heading,
      id: headingId(section.heading),
    })),
    ...(config.faqs.length > 0
      ? [{ text: FAQ_HEADING, id: headingId(FAQ_HEADING) }]
      : []),
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-20% 0% -35% 0%" }
    );
    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.slug]);

  const canonical = `https://riff.quest/${config.slug}`;
  const exerciseIds = collectExerciseIds(config);
  const exercisePosition = Object.fromEntries(
    exerciseIds.map((id, index) => [id, index + 1])
  );
  const firstSectionId =
    config.sections.length > 0 ? headingId(config.sections[0].heading) : "";
  const pageTitle =
    config.metaTitle.length <= 47
      ? `${config.metaTitle} | Riff Quest`
      : config.metaTitle;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: config.title,
        description: config.metaDescription,
        image: "https://riff.quest/images/og-image.png",
        author: {
          "@type": "Organization",
          name: "Riff Quest",
          url: "https://riff.quest",
        },
        publisher: {
          "@type": "Organization",
          name: "Riff Quest",
          logo: {
            "@type": "ImageObject",
            url: "https://riff.quest/images/longlightlogo.svg",
          },
        },
        datePublished: config.publishedAt,
        dateModified: config.updatedAt,
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://riff.quest",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: config.title,
            item: canonical,
          },
        ],
      },
      exerciseIds.length > 0
        ? {
            "@type": "ItemList",
            name: config.title,
            itemListElement: exerciseIds.map((id, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: exercisesById[id]?.title ?? id,
              url: `${canonical}#${idToSlug(id)}`,
            })),
          }
        : null,
      config.faqs.length > 0
        ? {
            "@type": "FAQPage",
            mainEntity: config.faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: { "@type": "Answer", text: faq.answer },
            })),
          }
        : null,
    ].filter(Boolean),
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name='description' content={config.metaDescription} />
        <meta property='og:title' content={config.title} />
        <meta property='og:description' content={config.metaDescription} />
        <meta
          property='og:image'
          content='https://riff.quest/images/og-image.png'
        />
        <meta property='og:type' content='article' />
        <meta property='og:url' content={canonical} />
        <meta property='article:published_time' content={config.publishedAt} />
        <meta property='article:modified_time' content={config.updatedAt} />
        <link rel='canonical' href={canonical} />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <main
        className={`${jakartaLanding.variable} min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-300`}>
        <motion.div
          className='fixed left-0 right-0 top-0 z-[60] h-1 origin-left bg-cyan-500'
          style={{ scaleX }}
        />

        <nav className='fixed left-0 right-0 top-0 z-50 bg-zinc-950/90 backdrop-blur-sm'>
          <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-6'>
            <Link href='/' className='transition-opacity hover:opacity-70'>
              <Image
                src='/images/longlightlogo.svg'
                alt='Riff Quest'
                width={120}
                height={32}
                className='h-6 w-auto'
              />
            </Link>
            <div className='flex items-center gap-6'>
              <Link
                href='/login'
                className='text-sm text-zinc-400 transition-colors hover:text-white'>
                Login
              </Link>
              <Link
                href='/signup'
                className='rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-zinc-950 transition-colors hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300'>
                Start free
              </Link>
            </div>
          </div>
        </nav>

        <div className='relative overflow-hidden'>
          <div className='pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[140px]' />
          <GuitarPatternBackground opacity={0.02} />

          <div className='relative mx-auto max-w-7xl px-6 pt-24'>
            <div className='mb-8 flex items-center gap-2 text-xs tracking-widest text-zinc-500'>
              <Link href='/' className='transition-colors hover:text-zinc-300'>
                Home
              </Link>
              <ChevronRight className='h-3 w-3' aria-hidden='true' />
              <span className='max-w-[280px] truncate text-zinc-400'>
                {config.title}
              </span>
            </div>

            <header className='max-w-4xl pb-16'>
              <p className='mb-4 inline-flex items-center gap-2 rounded bg-cyan-500/10 px-3 py-1.5 text-sm font-semibold text-cyan-400'>
                <Sparkles className='h-4 w-4' aria-hidden='true' />
                Free practice guide
              </p>
              <h1 className='mb-6 text-balance font-landingHeading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl'>
                {config.title}
              </h1>
              <div className='space-y-4'>
                {config.intro.map((paragraph, idx) => (
                  <p key={idx} className='text-lg leading-relaxed text-zinc-400'>
                    <InlineText text={paragraph} />
                  </p>
                ))}
              </div>

              <div className='mt-8 flex flex-wrap items-center gap-3 text-sm'>
                {exerciseIds.length > 0 && (
                  <span className='rounded bg-cyan-500/10 px-3 py-1.5 font-semibold text-cyan-400'>
                    {exerciseIds.length} interactive exercises
                  </span>
                )}
                <span className='rounded bg-zinc-800/60 px-3 py-1.5 font-semibold text-zinc-300'>
                  100% free — no paywalls
                </span>
                <span className='rounded bg-zinc-800/60 px-3 py-1.5 font-semibold text-zinc-300'>
                  Updated {config.updatedAt}
                </span>
              </div>

              <div className='mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
                <Link
                  href='/signup'
                  className='inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 text-sm font-bold text-zinc-950 transition-colors hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300'>
                  Start practicing free
                  <ArrowRight className='h-4 w-4' aria-hidden='true' />
                </Link>
                {firstSectionId && (
                  <a
                    href={`#${firstSectionId}`}
                    className='inline-flex items-center gap-2 rounded-lg bg-zinc-800/60 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500'>
                    Jump to the drills
                    <ArrowDown className='h-4 w-4' aria-hidden='true' />
                  </a>
                )}
              </div>
            </header>
          </div>
        </div>

        <article className='mx-auto max-w-7xl px-6 pb-16'>
          <details className='mb-12 rounded-lg bg-zinc-900/40 p-5 lg:hidden'>
            <summary className='cursor-pointer text-sm font-bold text-white'>
              On this page
            </summary>
            <nav className='mt-4 flex flex-col gap-3'>
              {headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  className='text-sm text-zinc-400 transition-colors hover:text-cyan-400'>
                  {heading.text}
                </a>
              ))}
            </nav>
          </details>

          <div className='flex flex-col gap-12 lg:flex-row'>
            <aside className='sticky top-32 hidden max-h-[calc(100vh-200px)] w-64 shrink-0 overflow-y-auto lg:block'>
              <div className='mb-6 flex items-center gap-2 text-lg font-bold tracking-wide text-white'>
                <List className='h-5 w-5 text-cyan-500' aria-hidden='true' />
                On this page
              </div>
              <nav className='flex flex-col gap-3'>
                {headings.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className={`py-1 pl-4 text-sm transition-all duration-200 hover:text-cyan-400 ${
                      activeId === heading.id
                        ? "font-medium text-cyan-400"
                        : "text-zinc-500"
                    }`}>
                    {heading.text}
                  </a>
                ))}
              </nav>
            </aside>

            <div className='min-w-0 max-w-4xl flex-1'>
              <div className='space-y-20'>
                {config.sections.map((section, sectionIdx) => (
                  <section key={section.heading}>
                    <p className='mb-2 text-sm font-bold text-cyan-400'>
                      Part {String(sectionIdx + 1).padStart(2, "0")}
                    </p>
                    <h2
                      id={headingId(section.heading)}
                      className='mb-8 scroll-mt-28 text-balance text-3xl font-bold tracking-tight text-white'>
                      {section.heading}
                    </h2>
                    <div className='space-y-8'>
                      {section.blocks.map((block, idx) => (
                        <Block
                          key={idx}
                          block={block}
                          exercisesById={exercisesById}
                          exercisePosition={exercisePosition}
                          exerciseTotal={exerciseIds.length}
                        />
                      ))}
                    </div>
                  </section>
                ))}

                {config.faqs.length > 0 && (
                  <section>
                    <h2
                      id={headingId(FAQ_HEADING)}
                      className='mb-8 scroll-mt-28 text-3xl font-bold tracking-tight text-white'>
                      {FAQ_HEADING}
                    </h2>
                    <div className='space-y-4'>
                      {config.faqs.map((faq) => (
                        <div
                          key={faq.question}
                          className='rounded-lg bg-zinc-900/40 p-6'>
                          <h3 className='mb-2 text-lg font-semibold text-zinc-100'>
                            {faq.question}
                          </h3>
                          <p className='leading-relaxed text-zinc-400'>
                            <InlineText text={faq.answer} />
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </article>

        {relatedGuides.length > 0 && (
          <section className='mx-auto max-w-7xl px-6 py-16'>
            <h2 className='mb-8 text-2xl font-bold text-white'>
              More practice guides
            </h2>
            <div className='grid gap-6 sm:grid-cols-2'>
              {relatedGuides.map((guide) => (
                <Link key={guide.slug} href={`/${guide.slug}`}>
                  <div className='group h-full cursor-pointer rounded-lg bg-zinc-900/40 p-6 transition-colors hover:bg-zinc-900/60'>
                    <h3 className='mb-2 text-lg font-bold text-white transition-colors group-hover:text-cyan-400'>
                      {guide.title}
                    </h3>
                    <p className='mb-4 text-sm leading-relaxed text-zinc-400'>
                      {guide.description}
                    </p>
                    <span className='inline-flex items-center gap-1 text-xs font-semibold text-cyan-400'>
                      Read the guide
                      <ArrowRight className='h-3 w-3' aria-hidden='true' />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {relatedSongGuides.length > 0 && (
          <section className='mx-auto max-w-7xl px-6 py-16'>
            <h2 className='mb-8 text-2xl font-bold text-white'>
              See these exercises in a real song
            </h2>
            <div className='grid gap-6 sm:grid-cols-2'>
              {relatedSongGuides.map((guide) => (
                <Link key={guide.slug} href={`/song-library/${guide.slug}`}>
                  <div className='group h-full cursor-pointer rounded-lg bg-zinc-900/40 p-6 transition-colors hover:bg-zinc-900/60'>
                    <h3
                      translate='no'
                      className='mb-1 text-lg font-bold text-white transition-colors group-hover:text-cyan-400'>
                      {guide.title}
                    </h3>
                    <p translate='no' className='mb-3 text-sm text-zinc-500'>
                      {guide.artist}
                    </p>
                    <p className='mb-4 text-sm leading-relaxed text-zinc-400'>
                      {guide.description}
                    </p>
                    <span className='inline-flex items-center gap-1 text-xs font-semibold text-cyan-400'>
                      Read the guide
                      <ArrowRight className='h-3 w-3' aria-hidden='true' />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {relatedBlogs.length > 0 && (
          <section className='mx-auto max-w-7xl px-6 py-16'>
            <h2 className='mb-8 text-2xl font-bold text-white'>From the blog</h2>
            <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-3'>
              {relatedBlogs.map((blog) => (
                <BlogCard key={blog.slug} blog={blog} />
              ))}
            </div>
          </section>
        )}

        <FinalCTASection />
        <Footer />
        <CookieBanner />
      </main>
    </>
  );
};
