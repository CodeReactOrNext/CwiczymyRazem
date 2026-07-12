import { ActionCard } from 'components/Blog/ActionCard';
import { AppCard } from 'components/Blog/AppCard';
import { BlogAlert } from 'components/Blog/BlogAlert';
import { BlogCard } from 'components/Blog/BlogCard';
import { BlogHeader } from 'components/Blog/BlogHeader';
import { ExercisePromo } from 'components/Blog/ExercisePromo';
import { PracticeTable } from 'components/Blog/PracticeTable';
import { SongTierTable } from 'components/Blog/SongTierTable';
import { StepList } from 'components/Blog/StepList';
import { YouTube } from 'components/Blog/YouTube';
import { exercisesAgregat } from 'feature/exercisePlan/data/exercisesAgregat';
import { ExerciseCard } from 'feature/exercises/components/ExerciseCard/ExerciseCard';
import { serializeExercises } from 'feature/exercises/lib/serializeExercise';
import { idToSlug } from 'feature/exercises/lib/slugUtils';
import { Footer } from 'feature/landing/components/Footer';
import { motion, useScroll, useSpring } from 'framer-motion';
import type { BlogFrontmatter} from 'lib/blog';
import {getAllBlogs, getBlogBySlug } from 'lib/blog';
import type { PracticeLink } from 'lib/internalLinks';
import { CLUSTER_PRACTICE_LINK } from 'lib/internalLinks';
import { ChevronRight, List } from 'lucide-react';
import type { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { useEffect, useState } from 'react';
import remarkGfm from 'remark-gfm';



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
  mdxSource: MDXRemoteSerializeResult;
  relatedBlogs: BlogFrontmatter[];
  headings: { text: string; id: string }[];
  faqs: { question: string; answer: string }[];
  practiceLink: PracticeLink | null;
  practiceExercises: PracticeExercise[];
}

const components = {
  YouTube,
  BlogAlert,
  ActionCard,
  AppCard,
  ExercisePromo,
  PracticeTable,
  StepList,
  SongTierTable,
  // Mapping h2 to include IDs for ToC
  h2: (props: any) => (
    <h2
      id={props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}
      {...props}
    />
  ),
  // Content images live below the fold; lazy-load them to cut initial page weight
  img: (props: any) => <img loading='lazy' decoding='async' {...props} />,
  // GFM task-list checkboxes render as bare inputs; give them an accessible name
  input: (props: any) =>
    props.type === 'checkbox' ? (
      <input aria-label='Checklist item' {...props} />
    ) : (
      <input {...props} />
    ),
};

const BlogPost = ({ frontmatter, mdxSource, relatedBlogs = [], headings = [], faqs = [], practiceLink = null, practiceExercises = [] }: BlogPostProps) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0% -35% 0%' }
    );

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  // Frontmatter images are either site-relative paths or already-absolute CDN URLs.
  const absoluteImage = frontmatter.image?.startsWith('http')
    ? frontmatter.image
    : `https://riff.quest${frontmatter.image}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "headline": frontmatter.title,
        "description": frontmatter.description,
        "image": absoluteImage,
        "author": {
          "@type": "Person",
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

      <main className="min-h-screen bg-zinc-950 text-zinc-300 overflow-x-hidden">
        <motion.div
          className="fixed top-0 left-0 right-0 z-[60] h-1 bg-cyan-500 origin-left"
          style={{ scaleX }}
        />

        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-zinc-950/90 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <Link href="/" className="transition-opacity hover:opacity-70">
              <Image src='/images/longlightlogo.svg' alt='Riff Quest' width={120} height={32} className='h-6 w-auto' />
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">Login</Link>
              <Link href="/signup" className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors">Start Free →</Link>
            </div>
          </div>
        </nav>

        <div className="pt-24 px-6 mx-auto max-w-6xl overflow-hidden">
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-8 tracking-widest">
            <Link href="/" className="hover:text-zinc-300 transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/blog" className="hover:text-zinc-300 transition-colors">Blog</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-zinc-400 truncate max-w-[200px]">{frontmatter.title}</span>
          </div>
        </div>

        <BlogHeader
          title={frontmatter.title}
          description={frontmatter.description}
          date={frontmatter.date}
          image={frontmatter.image}
          author={frontmatter.author}
        />

        <article className="container mx-auto px-4 py-12 overflow-x-hidden min-w-0">
          <div className="mx-auto max-w-6xl flex flex-col lg:flex-row gap-12">
            {/* Sidebar ToC */}
            <aside className="hidden lg:block w-64 shrink-0 overflow-y-auto max-h-[calc(100vh-200px)] sticky top-32">
              <div className="flex items-center gap-2 mb-6 text-white font-bold text-lg tracking-wider">
                <List className="h-5 w-5 text-cyan-500" />
                Table of Contents
              </div>
              <nav className="flex flex-col gap-3">
                {headings.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className={`text-sm transition-all duration-200 border-l-2 pl-4 py-1 hover:text-cyan-400 ${
                      activeId === heading.id 
                        ? 'border-cyan-500 text-cyan-400 font-medium' 
                        : 'border-white/5 text-zinc-500'
                    }`}
                  >
                    {heading.text}
                  </a>
                ))}
              </nav>
            </aside>

            <div className="flex-1 min-w-0 max-w-full lg:max-w-2xl mx-auto lg:mx-0 overflow-hidden">
              <div className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-white prose-p:text-zinc-400 prose-p:leading-relaxed prose-a:text-cyan-400 hover:prose-a:text-cyan-300 prose-blockquote:border-l-4 prose-blockquote:border-cyan-500 prose-blockquote:bg-cyan-500/5 prose-blockquote:py-2 prose-blockquote:pr-6 prose-blockquote:font-normal prose-blockquote:italic prose-blockquote:text-zinc-200 before:prose-blockquote:content-none after:prose-blockquote:content-none prose-blockquote:before:hidden prose-blockquote:after:hidden">
                <MDXRemote {...mdxSource} components={components} />
              </div>
            </div>
          </div>
        </article>

        {practiceLink && (
          <section className="container mx-auto px-4 py-16 border-t border-white/5">
            <div className="mx-auto max-w-6xl">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <h2 className="text-2xl font-bold text-white">Put It Into Practice</h2>
                <Link
                  href={practiceLink.href}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {practiceLink.label} <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {practiceExercises.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {practiceExercises.map((exercise) => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      href={`/exercises/${idToSlug(exercise.id)}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {relatedBlogs.length > 0 && (
          <section className="container mx-auto px-4 py-16 border-t border-white/5">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-2xl font-bold text-white mb-8">
                Read Also
              </h2>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {relatedBlogs.map((blog) => (
                  <BlogCard key={blog.slug} blog={blog} />
                ))}
              </div>
            </div>
          </section>
        )}

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
  const mdxSource = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
    },
  });

  const headings = content.split('\n')
    .filter(line => line.startsWith('## '))
    .map(line => {
      const text = line.replace('## ', '').trim();
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      return { text, id };
    });

  // Extract FAQs
  const faqs: { question: string; answer: string }[] = [];
  const faqStartIndex = content.indexOf('## FAQs');
  if (faqStartIndex !== -1) {
    const faqSection = content.slice(faqStartIndex);
    const faqBlocks = faqSection.split('### ').slice(1);
    faqBlocks.forEach(block => {
      const lines = block.split('\n');
      const question = lines[0].trim();
      const answer = lines.slice(1).join(' ').replace(/\s+/g, ' ').trim();
      if (question && answer) {
        faqs.push({ question, answer });
      }
    });
  }

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
  const practiceLink = current?.cluster ? CLUSTER_PRACTICE_LINK[current.cluster] ?? null : null;
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
      mdxSource,
      relatedBlogs,
      headings,
      faqs,
      practiceLink,
      practiceExercises,
    },
  };
};

export default BlogPost;
