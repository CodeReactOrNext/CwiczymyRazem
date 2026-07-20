import { BlogCard } from "components/Blog/BlogCard";
import type { SerializedExercise } from "feature/exercises/lib/serializeExercise";
import { idToSlug } from "feature/exercises/lib/slugUtils";
import { FinalCTASection } from "feature/landing/components/FinalCTASection";
import { Footer } from "feature/landing/components/Footer";
import { motion, useScroll, useSpring } from "framer-motion";
import type { BlogFrontmatter } from "lib/blog";
import { ArrowRight, ChevronRight, List } from "lucide-react";
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
}: {
  block: SeoLandingBlock;
  exercisesById: Record<string, SerializedExercise>;
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
        <div className='rounded-lg bg-cyan-500/5 p-5'>
          <p className='mb-1 text-sm font-semibold text-cyan-400'>
            {block.title ?? "Pro tip"}
          </p>
          <p className='text-sm leading-relaxed text-zinc-300'>
            <InlineText text={block.text} />
          </p>
        </div>
      );
    case "cta":
      return (
        <div className='rounded-lg bg-gradient-to-br from-cyan-500/10 via-zinc-900 to-zinc-950 p-6 sm:p-8'>
          <p className='mb-2 text-xl font-bold text-white'>{block.title}</p>
          <p className='mb-5 leading-relaxed text-zinc-400'>
            <InlineText text={block.text} />
          </p>
          <Link
            href='/signup'
            className='inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300'>
            Start free
            <ArrowRight className='h-4 w-4' aria-hidden='true' />
          </Link>
        </div>
      );
    case "exercise": {
      const exercise = exercisesById[block.exerciseId];
      if (!exercise) return null;
      return (
        <ExerciseShowcase exercise={exercise} commentary={block.commentary} />
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

      <main className='min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-300'>
        <motion.div
          className='fixed left-0 right-0 top-0 z-[60] h-1 origin-left bg-cyan-500'
          style={{ scaleX }}
        />

        <nav className='fixed left-0 right-0 top-0 z-50 bg-zinc-950/90 backdrop-blur-sm'>
          <div className='mx-auto flex h-16 max-w-6xl items-center justify-between px-6'>
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
                className='text-sm font-medium text-cyan-400 transition-colors hover:text-cyan-300'>
                Start Free →
              </Link>
            </div>
          </div>
        </nav>

        <div className='mx-auto max-w-6xl px-6 pt-24'>
          <div className='mb-8 flex items-center gap-2 text-xs tracking-widest text-zinc-500'>
            <Link href='/' className='transition-colors hover:text-zinc-300'>
              Home
            </Link>
            <ChevronRight className='h-3 w-3' aria-hidden='true' />
            <span className='max-w-[280px] truncate text-zinc-400'>
              {config.title}
            </span>
          </div>

          <header className='max-w-3xl pb-14'>
            <h1 className='mb-6 text-4xl font-bold leading-tight tracking-tighter text-white sm:text-5xl'>
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
          </header>
        </div>

        <article className='mx-auto max-w-6xl px-6 pb-16'>
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

            <div className='min-w-0 max-w-3xl flex-1'>
              <div className='space-y-16'>
                {config.sections.map((section) => (
                  <section key={section.heading}>
                    <h2
                      id={headingId(section.heading)}
                      className='mb-6 scroll-mt-28 text-3xl font-bold tracking-tight text-white'>
                      {section.heading}
                    </h2>
                    <div className='space-y-6'>
                      {section.blocks.map((block, idx) => (
                        <Block
                          key={idx}
                          block={block}
                          exercisesById={exercisesById}
                        />
                      ))}
                    </div>
                  </section>
                ))}

                {config.faqs.length > 0 && (
                  <section>
                    <h2
                      id={headingId(FAQ_HEADING)}
                      className='mb-6 scroll-mt-28 text-3xl font-bold tracking-tight text-white'>
                      {FAQ_HEADING}
                    </h2>
                    <div className='space-y-8'>
                      {config.faqs.map((faq) => (
                        <div key={faq.question}>
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
          <section className='mx-auto max-w-6xl px-6 py-16'>
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
          <section className='mx-auto max-w-6xl px-6 py-16'>
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
          <section className='mx-auto max-w-6xl px-6 py-16'>
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
      </main>
    </>
  );
};
