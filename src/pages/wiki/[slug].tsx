import { evaluate } from "@mdx-js/mdx";
import { BlogAlert } from "components/Blog/BlogAlert";
import { Checklist } from "components/Blog/Checklist";
import { StatRow } from "components/Blog/StatRow";
import { StepList } from "components/Blog/StepList";
import {
  AppScreen,
  BoardPreview,
  ClickPath,
  FaqList,
  PlanComparison,
  ProgressLadder,
  QuestPreview,
  ReadNext,
  SessionLogPreview,
  TierScale,
} from "components/Wiki";
import WikiLayout from "feature/wiki/WikiLayout";
import AppLayout from "layouts/AppLayout";
import { getWikiPageBySlug, getWikiSections, type WikiFrontmatter, type WikiSection } from "lib/wiki";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import { getSession } from "next-auth/react";
import type { ReactElement } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import remarkGfm from "remark-gfm";
import type { NextPageWithLayout } from "types/page";

const components = {
  StepList,
  Checklist,
  StatRow,
  BlogAlert,
  AppScreen,
  BoardPreview,
  ClickPath,
  FaqList,
  PlanComparison,
  ProgressLadder,
  QuestPreview,
  ReadNext,
  SessionLogPreview,
  TierScale,
};

interface WikiArticleProps {
  frontmatter: WikiFrontmatter;
  contentHtml: string;
  sections: WikiSection[];
}

const WikiArticlePage: NextPageWithLayout<WikiArticleProps> = ({ frontmatter, contentHtml, sections }) => {
  return (
    <>
      <Head>
        <title>{frontmatter.title} | Wiki | Riff Quest</title>
        <meta name='robots' content='noindex' />
      </Head>
      <WikiLayout sections={sections}>
        <div className='p-4 sm:p-6'>
          <p className='mb-2 text-xs font-bold text-cyan-400'>{frontmatter.section}</p>
          <h1 className='text-2xl font-black tracking-tight text-white'>{frontmatter.title}</h1>
          <p className='mt-2 text-sm text-zinc-400'>{frontmatter.description}</p>
          <div
            className='prose prose-invert prose-lg max-w-none mt-8 prose-headings:font-extrabold prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-white prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-white prose-p:text-zinc-400 prose-p:leading-relaxed prose-p:my-5 prose-ul:my-5 prose-ol:my-5 prose-li:my-2 prose-a:text-cyan-400 hover:prose-a:text-cyan-300'
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>
      </WikiLayout>
    </>
  );
};

WikiArticlePage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId={"wiki"} subtitle='Wiki' variant='primary'>
      {page}
    </AppLayout>
  );
};

export default WikiArticlePage;

export const getServerSideProps: GetServerSideProps<WikiArticleProps> = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  const slug = context.params?.slug as string;

  let frontmatter: WikiFrontmatter;
  let content: string;
  try {
    ({ frontmatter, content } = await getWikiPageBySlug(slug));
  } catch {
    return { notFound: true };
  }

  // Compiled and rendered to static HTML here (server-side, per request) instead of
  // shipping compiled MDX for the client to `new Function()`-eval on hydration — the
  // browser's script-src CSP has no 'unsafe-eval' and blocks that. See blog/[slug].tsx.
  const { default: MDXContent } = await evaluate(content, {
    ...jsxRuntime,
    remarkPlugins: [remarkGfm],
  });
  const contentHtml = renderToStaticMarkup(<MDXContent components={components} />);

  return {
    props: {
      frontmatter,
      contentHtml,
      sections: getWikiSections(),
    },
  };
};
