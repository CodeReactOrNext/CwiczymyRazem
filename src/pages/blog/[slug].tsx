import { AuthorBio } from 'components/Blog/AuthorBio';
import { BlogCard } from 'components/Blog/BlogCard';
import { BlogHeader } from 'components/Blog/BlogHeader';
import { ZoomableImages } from 'components/Blog/ZoomableImages';
import { exercisesAgregat } from 'feature/exercisePlan/data/exercisesAgregat';
import { ExerciseCard } from 'feature/exercises/components/ExerciseCard/ExerciseCard';
import { serializeExercises } from 'feature/exercises/lib/serializeExercise';
import { Footer } from 'feature/landing/components/Footer';
import { motion, useScroll, useSpring } from 'framer-motion';
import { getAuthorProfile } from 'lib/authors';
import type { BlogFrontmatter} from 'lib/blog';
import {getAllBlogs, getBlogBySlug } from 'lib/blog';
import type { BlogHeading } from 'lib/blogContent';
import { extractFaqs, renderBlogContent } from 'lib/blogContent';
import { getExerciseLandingHref } from 'lib/exerciseLandingLink';
import type { PracticeLink } from 'lib/internalLinks';
import { getPracticeLink } from 'lib/internalLinks';
import { ChevronRight } from 'lucide-react';
import type { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';



interface PracticeExercise {
  id: string;
  title: string;
  difficulty: 'beginner' | 'easy' | 'medium' | 'hard';
  category: string;
  description: string;
  timeInMinutes: number;
  premium?: boolean;
}

interface BlogPostProps {
  frontmatter: BlogFrontmatter;
  contentHtml: string;
  relatedBlogs: BlogFrontmatter[];
  headings: BlogHeading[];
  readingMinutes: number;
  faqs: { question: string; answer: string }[];
  practiceLink: PracticeLink | null;
  practiceExercises: PracticeExercise[];
}


const BlogPost = ({ frontmatter, contentHtml, relatedBlogs = [], headings = [], faqs = [], practiceLink = null, practiceExercises = [], readingMinutes = 1 }: BlogPostProps) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Frontmatter images are either site-relative paths or already-absolute CDN URLs.
  const absoluteImage = frontmatter.image?.startsWith('http')
    ? frontmatter.image
    : `https://riff.quest${frontmatter.image}`;

  const authorProfile = getAuthorProfile(frontmatter.author);

  // Posts are English unless the frontmatter says otherwise. The <html> element
  // is always lang='en', so a translated post declares its own language on the
  // article markup and in the metadata instead.
  const lang = frontmatter.lang || 'en';
  const ogLocale = lang === 'pl' ? 'pl_PL' : 'en_US';

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "headline": frontmatter.title,
        "description": frontmatter.description,
        "image": absoluteImage,
        "author": authorProfile ? {
          "@type": "Person",
          "name": authorProfile.name,
          "description": authorProfile.bio,
          "image": `https://riff.quest${authorProfile.image}`
        } : {
          "@type": "Organization",
          "name": frontmatter.author || "Riff Quest",
          "url": "https://riff.quest"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Riff Quest",
          "logo": {
            "@type": "ImageObject",
            "url": "https://riff.quest/images/longlightlogo.svg"
          }
        },
        "inLanguage": lang,
        "datePublished": frontmatter.date,
        "dateModified": frontmatter.updatedAt || frontmatter.date,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `https://riff.quest/blog/${frontmatter.slug}`
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://riff.quest"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Blog",
            "item": "https://riff.quest/blog"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": frontmatter.title,
            "item": `https://riff.quest/blog/${frontmatter.slug}`
          }
        ]
      },
      frontmatter.listItems && frontmatter.listItems.length > 0 ? {
        "@type": "ItemList",
        "name": frontmatter.title,
        "itemListElement": frontmatter.listItems.map((name, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": name,
        })),
      } : null,
      faqs.length > 0 ? {
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      } : null
    ].filter(Boolean)
  };

  // SEO <title>: prefer an explicit metaTitle, fall back to the (often longer) H1 title.
  // Append the brand only when the result still fits within Google's ~60-char SERP limit.
  const seoBase = frontmatter.metaTitle || frontmatter.title;
  const pageTitle = seoBase.length <= 47 ? `${seoBase} | Riff Quest` : seoBase;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={frontmatter.description} />
        <meta property="og:title" content={frontmatter.title} />
        <meta property="og:description" content={frontmatter.description} />
        <meta property="og:image" content={absoluteImage} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://riff.quest/blog/${frontmatter.slug}`} />
        <meta property="og:locale" content={ogLocale} />
        <meta property="article:published_time" content={frontmatter.date} />
        <meta property="article:modified_time" content={frontmatter.updatedAt || frontmatter.date} />
        <meta property="article:author" content={frontmatter.author || "Riff Quest"} />
        <link rel='canonical' href={`https://riff.quest/blog/${frontmatter.slug}`} />
        {frontmatter.image && (
          <link rel='preload' as='image' href={frontmatter.image} fetchPriority='high' />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <main className="min-h-screen bg-zinc-950">
        <motion.div
          className="fixed top-0 left-0 right-0 z-[60] h-1 bg-cyan-500 origin-left"
          style={{ scaleX }}
        />

        <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="transition-opacity hover:opacity-70">
              <Image src='/images/longlightlogo.svg' alt='Riff Quest' width={120} height={32} className='h-6 w-auto' />
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">Login</Link>
              <Link href="/signup" className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors">Start Free →</Link>
            </div>
          </div>
        </nav>

        {/* The reading page is white: long-form text reads more easily dark on
            light. `light` switches the shared MDX components and cards to
            their light look; only the nav and the footer stay dark. */}
        <div className="light bg-white px-4 pb-20 pt-28 text-zinc-700 sm:px-6 sm:pt-32">
          <div className="mx-auto max-w-[680px]">
            <div className="mb-8 flex items-center gap-2 text-xs text-zinc-500">
              <Link href="/" className="transition-colors hover:text-zinc-900">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/blog" className="transition-colors hover:text-zinc-900">Blog</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="max-w-[200px] truncate text-zinc-700">{frontmatter.title}</span>
            </div>

            <BlogHeader
              title={frontmatter.title}
              description={frontmatter.heroSubtitle || frontmatter.description}
              date={frontmatter.date}
              updatedAt={frontmatter.updatedAt}
              readTime={`${readingMinutes} min`}
              image={frontmatter.image}
              author={frontmatter.author}
              authorImage={authorProfile?.image}
              lang={lang}
            />

            <article lang={lang} className="mt-12">
              {/* Collapsed by default so the article itself, not a 25-item
                  list, is what follows the header. */}
              {headings.length > 0 && (
                <details className="mb-12 rounded-lg bg-zinc-100 p-5">
                  <summary className="cursor-pointer text-sm font-bold text-zinc-900">
                    On this page
                  </summary>
                  <nav className="mt-4 flex flex-col gap-3">
                    {headings.map((heading) => (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        className={`text-sm text-zinc-600 transition-colors hover:text-cyan-700 ${
                          heading.level === 3 ? 'pl-4' : ''
                        }`}
                      >
                        {heading.text}
                      </a>
                    ))}
                  </nav>
                </details>
              )}

              <ZoomableImages>
                <div
                  className="prose prose-zinc prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-balance prose-headings:text-zinc-900 prose-h2:text-[1.75rem] prose-h2:leading-tight prose-h2:mt-16 prose-h2:mb-5 prose-h3:text-xl prose-h3:font-bold prose-h3:mt-10 prose-h3:mb-3 prose-p:text-zinc-700 prose-p:leading-[1.75] prose-strong:text-zinc-900 prose-li:my-2 prose-li:text-zinc-700 prose-li:leading-[1.75] prose-a:font-semibold prose-a:text-cyan-700 prose-a:decoration-cyan-700/30 prose-a:underline-offset-4 hover:prose-a:decoration-cyan-700 prose-hr:my-12 prose-hr:border-0 prose-th:text-zinc-900 prose-td:text-zinc-700"
                  dangerouslySetInnerHTML={{ __html: contentHtml }}
                />
              </ZoomableImages>

              {authorProfile && (
                <div className="mt-16">
                  <AuthorBio
                    name={authorProfile.name}
                    image={authorProfile.image}
                    role={authorProfile.role}
                    bio={authorProfile.bio}
                  />
                </div>
              )}
            </article>
          </div>

          {practiceLink && (
            <section className="mx-auto mt-24 max-w-5xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Put It Into Practice</h2>
                <Link
                  href={practiceLink.href}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-700 transition-colors hover:text-cyan-800"
                >
                  {practiceLink.label} <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {practiceExercises.length > 0 && (
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {practiceExercises.map((exercise) => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      href={getExerciseLandingHref(exercise.id, exercise)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {relatedBlogs.length > 0 && (
            <section className="mx-auto mt-24 max-w-5xl">
              <h2 className="mb-8 text-2xl font-bold tracking-tight text-zinc-900">
                Read Also
              </h2>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {relatedBlogs.map((blog) => (
                  <BlogCard key={blog.slug} blog={blog} />
                ))}
              </div>
            </section>
          )}
        </div>

        <Footer />
      </main>
    </>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const blogs = getAllBlogs();
  const paths = blogs.map((blog) => ({
    params: { slug: blog.slug },
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const { frontmatter, content } = await getBlogBySlug(slug);

  const { contentHtml, headings, readingMinutes } = await renderBlogContent(content);

  const faqs = extractFaqs(content);

  // Hub-and-spoke related posts: surface same-cluster posts first (pillar leading),
  // then top up with the most recent posts so every article still shows three.
  const allBlogs = getAllBlogs();
  const current = allBlogs.find((blog) => blog.slug === slug);
  const others = allBlogs.filter((blog) => blog.slug !== slug);

  const sameCluster = current?.cluster
    ? others
        .filter((blog) => blog.cluster === current.cluster)
        .sort((a, b) => Number(b.pillar ?? false) - Number(a.pillar ?? false))
    : [];

  // Rotate the fill deterministically per slug so incoming links spread across
  // the whole catalog instead of always pointing at the newest posts.
  const fill = others.filter((blog) => !sameCluster.includes(blog));
  const offset = fill.length
    ? [...slug].reduce((sum, char) => sum + char.charCodeAt(0), 0) % fill.length
    : 0;
  const rotatedFill = [...fill.slice(offset), ...fill.slice(0, offset)];
  const relatedBlogs = [...sameCluster, ...rotatedFill].slice(0, 3);

  // Cross-link to the app: point the reader at the exercise category (or app
  // page) the post's cluster is about, with a few sample exercises to start.
  const practiceLink = getPracticeLink(slug, current?.cluster);
  const practiceExercises = practiceLink?.exerciseCategory
    ? serializeExercises(exercisesAgregat)
        .filter(
          (ex) =>
            ex.category === practiceLink.exerciseCategory &&
            !ex.isHiddenFromLibrary &&
            !ex.isHiddenFromLanding &&
            !ex.isPlayalong &&
            !ex.premium
        )
        .slice(0, 3)
        .map((ex) => ({
          id: ex.id,
          title: ex.title,
          difficulty: ex.difficulty,
          category: ex.category,
          description: ex.description,
          timeInMinutes: ex.timeInMinutes,
          premium: ex.premium,
        }))
    : [];

  return {
    props: {
      frontmatter,
      contentHtml,
      relatedBlogs,
      headings,
      readingMinutes,
      faqs,
      practiceLink,
      practiceExercises,
    },
  };
};

export default BlogPost;
