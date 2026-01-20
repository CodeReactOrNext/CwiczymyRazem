import { BlogCard } from 'components/Blog/BlogCard';
import { BlogHeader } from 'components/Blog/BlogHeader';
import { YouTube } from 'components/Blog/YouTube';
import { Footer } from 'feature/landing/components/Footer';
import type { BlogFrontmatter} from 'lib/blog';
import {getAllBlogs, getBlogBySlug } from 'lib/blog';
import type { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import React from 'react';

import nextI18nextConfig from '../../../next-i18next.config';

interface BlogPostProps {
  frontmatter: BlogFrontmatter;
  mdxSource: MDXRemoteSerializeResult;
  relatedBlogs: BlogFrontmatter[];
}

const components = {
  YouTube,
};

const BlogPost = ({ frontmatter, mdxSource, relatedBlogs = [] }: BlogPostProps) => {
  return (
    <>
      <Head>
        <title>{frontmatter.title} | Riff Quest Blog</title>
        <meta name="description" content={frontmatter.description} />
        <meta property="og:title" content={frontmatter.title} />
        <meta property="og:description" content={frontmatter.description} />
        <meta property="og:image" content={frontmatter.image} />
        <meta property="og:type" content="article" />
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

        <BlogHeader
          title={frontmatter.title}
          description={frontmatter.description}
          date={frontmatter.date}
          image={frontmatter.image}
          author={frontmatter.author}
        />

        <article className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-2xl">
            <div className="prose prose-invert prose-lg max-w-none">
              <MDXRemote {...mdxSource} components={components} />
            </div>
          </div>
        </article>

        {relatedBlogs.length > 0 && (
          <section className="container mx-auto px-4 py-16 border-t border-white/5">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-3xl font-bold text-white font-teko uppercase mb-8">
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

export const getStaticProps: GetStaticProps = async ({ params, locale }) => {
  const slug = params?.slug as string;
  const { frontmatter, content } = await getBlogBySlug(slug);
  const mdxSource = await serialize(content);

  const allBlogs = getAllBlogs();
  const relatedBlogs = allBlogs
    .filter((blog) => blog.slug !== slug)
    .slice(0, 3);

  return {
    props: {
      frontmatter,
      mdxSource,
      relatedBlogs,
      ...(await serverSideTranslations(
        locale ?? "pl",
        ["common", "profile", "footer"],
        nextI18nextConfig
      )),
    },
  };
};

export default BlogPost;
