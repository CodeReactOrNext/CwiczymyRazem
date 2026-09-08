import { BlogCard } from 'components/Blog/BlogCard';
import { Footer } from 'feature/landing/components/Footer';
import type { BlogFrontmatter} from 'lib/blog';
import {getAllBlogs } from 'lib/blog';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';



interface BlogIndexProps {
  blogs: BlogFrontmatter[];
}

const BlogIndex = ({ blogs }: BlogIndexProps) => {
  return (
    <>
      <Head>
        <title>Guitar Practice Blog — Tips, Techniques & Guides | Riff Quest</title>
        <meta name="description" content="Discover expert guitar practice tips, learning techniques, and motivation strategies. Read articles that will help you become a better guitarist and stay inspired on your musical journey." />
        <link rel='canonical' href='https://riff.quest/blog' />
        <meta property="og:title" content="Guitar Practice Blog | Riff Quest" />
        <meta property="og:description" content="Discover expert guitar practice tips, learning techniques, and motivation strategies. Read articles that will help you become a better guitarist." />
        <meta property="og:url" content="https://riff.quest/blog" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://riff.quest/images/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Guitar Practice Blog | Riff Quest" />
        <meta name="twitter:description" content="Discover expert guitar practice tips, learning techniques, and motivation strategies." />
        <meta name="twitter:image" content="https://riff.quest/images/og-image.png" />
      </Head>

      <main className="min-h-screen bg-zinc-950 text-zinc-300 overflow-x-hidden">
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-zinc-950/90 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
            <Link href="/" className="transition-opacity hover:opacity-70">
              <Image src='/images/longlightlogo.svg' alt='Riff Quest' width={120} height={32} className='h-6 w-auto' priority />
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">Login</Link>
              <Link href="/signup" className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors">Start Free →</Link>
            </div>
          </div>
        </nav>

        <div className="pt-32 pb-24 container mx-auto px-4 overflow-x-hidden min-w-0">
          <div className="mb-16 text-center">
            <h1 className="mb-4 text-4xl font-bold text-white md:text-6xl tracking-tight leading-[1.1]">
              Knowledge and <span className="text-cyan-400">Inspiration</span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-zinc-400">
              Discover articles that will help you become a better guitarist. From technique to practice psychology.
            </p>

            <p className="mx-auto mt-6 max-w-2xl text-left text-base leading-relaxed text-zinc-400">
              Every guide here answers a question guitarists actually ask once they get past the first chords: how long a daily session should be, what belongs in a beginner routine, how to practise scales so they end up in your playing instead of your warm-up, which songs are genuinely playable at your level, and how to tell whether six months of practice moved anything. The answers lean on how thousands of logged practice sessions on Riff Quest actually look, rather than on the usual advice to just practise more.
            </p>
          </div>

          {blogs.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {blogs.map((blog) => (
                <BlogCard key={blog.slug} blog={blog} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-xl text-zinc-500">No articles yet. Check back soon!</p>
            </div>
          )}

          <div className="mx-auto mt-20 grid max-w-6xl gap-6 md:grid-cols-2">
            <section className="rounded-lg bg-zinc-900/40 p-6 sm:p-8">
              <h2 className="text-lg font-bold text-white">What these guides cover</h2>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                Roughly half of the articles are about structure: what a practice routine should contain, how to split an hour between technique, theory, ear training and playing music, and what a realistic daily minimum looks like when the week gets busy. The rest are about material and measurement, from picking songs that match your current level to keeping an honest record of what you played.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                They are written to be used at the guitar rather than read once. Where a guide gives a routine, it gives the timings too, and where it makes a claim about how quickly something improves, it says what that is based on.
              </p>
            </section>

            <section className="rounded-lg bg-zinc-900/40 p-6 sm:p-8">
              <h2 className="text-lg font-bold text-white">Where to go next</h2>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                Advice only becomes practice once something keeps score. Riff Quest turns a logged session into points, a streak and a growing picture of which of your skills are being neglected, and it is free to use.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                If you would rather read about the app than sign up for it, the{" "}
                <Link href="/wiki" className="text-cyan-400 hover:text-cyan-300">knowledge base</Link>{" "}
                explains every screen in plain language, the{" "}
                <Link href="/faq" className="text-cyan-400 hover:text-cyan-300">FAQ</Link>{" "}
                answers the short questions about scoring and setup, and the{" "}
                <Link href="/tools" className="text-cyan-400 hover:text-cyan-300">tools list</Link>{" "}
                covers the tabs, metronomes and backing-track apps worth using alongside it.
              </p>
            </section>

            <section className="rounded-lg bg-zinc-900/40 p-6 sm:p-8 md:col-span-2">
              <h2 className="text-lg font-bold text-white">Getting something out of a practice guide</h2>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-400">
                The failure mode with practice advice is collecting it. Reading five routines in an evening feels productive and changes nothing, because the thing that improves your playing is the same twenty minutes repeated on days when you do not feel like it. One guide, applied for a fortnight, beats a reading list every time.
              </p>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-400">
                So take one change from whichever article matches your current problem, and give it two weeks before judging it. If your sessions drift into whatever feels comfortable, fix the structure first. If you practise consistently but nothing seems to move, start writing sessions down, because progress on the guitar is slow enough to be invisible without a record of it. And if you are simply bored, learning a song you actually want to play is a legitimate practice plan.
              </p>
            </section>
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const blogs = getAllBlogs();

  return {
    props: {
      blogs,
    },
  };
};

export default BlogIndex;
