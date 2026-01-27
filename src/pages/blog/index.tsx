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
        <title>Blog | Riff Quest</title>
        <meta name="description" content="Learn more about guitar playing, learning and motivation." />
        <link rel='canonical' href='https://riff.quest/blog' />
      </Head>

      <main className="min-h-screen bg-zinc-950 text-zinc-300">
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-zinc-950/90 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
            <Link href="/" className="transition-opacity hover:opacity-70">
              <Image src='/images/longlightlogo.svg' alt='Riff Quest' width={120} height={32} className='h-6 w-auto' />
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">Login</Link>
              <Link href="/signup" className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors">Start Free →</Link>
            </div>
          </div>
        </nav>

        <div className="pt-32 pb-24 container mx-auto px-4">
          <div className="mb-16 text-center">
            <h1 className="mb-4 text-5xl font-bold text-white md:text-7xl font-teko uppercase tracking-tight">
              Knowledge and <span className="text-cyan-400">Inspiration</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-zinc-400">
              Discover articles that will help you become a better guitarist. From technique to practice psychology.
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
