import { evaluate } from "@mdx-js/mdx";
import { BlogAlert } from "components/Blog/BlogAlert";
import { Checklist } from "components/Blog/Checklist";
import { SongTierTable } from "components/Blog/SongTierTable";
import { StatRow } from "components/Blog/StatRow";
import { StepList } from "components/Blog/StepList";
import { YouTube } from "components/Blog/YouTube";
import { currencyProseComponents } from "components/CurrencyIcons/withCurrencyIcons";
import {
  AppScreen,
  BoardPreview,
  ClickPath,
  FaqList,
  ProgressLadder,
  QuestPreview,
  ReadNext,
  Screenshot,
  SessionLogPreview,
  TierScale,
} from "components/Wiki";
import { Footer } from "feature/landing/components/Footer";
import { WikiPublicNav } from "feature/wiki/components/WikiPublicNav";
import { wikiSectionLabel } from "feature/wiki/sectionLabel";
import WikiLayout from "feature/wiki/WikiLayout";
import { useTranslation } from "hooks/useTranslation";
import AppLayout from "layouts/AppLayout";
import { type AppLocale, SUPPORTED_LOCALES } from "lib/i18n/locales";
import { useActiveLocale } from "lib/i18n/LocalizedRegion";
import {
  getAllWikiPages,
  getWikiPageBySlug,
  getWikiSections,
  hasWikiTranslation,
  type WikiFrontmatter,
  type WikiSection,
} from "lib/wiki";
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import { useSession } from "next-auth/react";
import type { ReactElement } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import remarkGfm from "remark-gfm";
import type { NextPageWithLayout } from "types/page";

const components = {
  ...currencyProseComponents,
  StepList,
  Checklist,
  StatRow,
  SongTierTable,
  BlogAlert,
  AppScreen,
  BoardPreview,
  ClickPath,
  FaqList,
  ProgressLadder,
  QuestPreview,
  ReadNext,
  Screenshot,
  SessionLogPreview,
  TierScale,
  YouTube,
};

const SITE_URL = "https://riff.quest";
const OG_IMAGE = `${SITE_URL}/images/og-image.png`;

interface WikiArticle {
  frontmatter: WikiFrontmatter;
  contentHtml: string;
}

/**
 * Every language the article exists in. The page is built once, so the reader's
 * language can only be picked on the client — and only inside the app: a visitor
 * who is not signed in always gets the English article that search engines index.
 */
interface WikiArticleProps {
  articles: Partial<Record<AppLocale, WikiArticle>> & { en: WikiArticle };
  /** The sidebar in every language, so it reads in the player's language even beside an article not translated yet. */
  sections: Record<AppLocale, WikiSection[]>;
}

const WikiArticlePage: NextPageWithLayout<WikiArticleProps> = ({
  articles,
  sections: sectionsByLocale,
}) => {
  const { status } = useSession();
  const isLogged = status === "authenticated";
  const locale = useActiveLocale();
  const { t } = useTranslation("wiki");
  const { frontmatter, contentHtml } = articles[locale] ?? articles.en;
  const sections = sectionsByLocale[locale];

  const url = `${SITE_URL}/wiki/${frontmatter.slug}`;
  // Google truncates around 60 chars, so only append the brand when it fits.
  const pageTitle =
    frontmatter.title.length <= 44
      ? `${frontmatter.title} | Riff Quest Knowledge Base`
      : frontmatter.title;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name='description' content={frontmatter.description} />
        <link rel='canonical' href={url} />
        <meta property='og:title' content={frontmatter.title} />
        <meta property='og:description' content={frontmatter.description} />
        <meta property='og:url' content={url} />
        <meta property='og:type' content='article' />
        <meta property='og:site_name' content='Riff Quest' />
        <meta property='og:image' content={OG_IMAGE} />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={frontmatter.title} />
        <meta name='twitter:description' content={frontmatter.description} />
        <meta name='twitter:image' content={OG_IMAGE} />
      </Head>

      <div
        className={!isLogged ? "min-h-screen bg-zinc-950 text-zinc-100" : ""}>
        {!isLogged && <WikiPublicNav />}

        <WikiLayout sections={sections}>
          <div className='p-4 sm:p-6'>
            <p className='mb-2 text-xs font-bold text-cyan-400'>
              {wikiSectionLabel(t, frontmatter.section)}
            </p>
            <h1 className='text-2xl font-black tracking-tight text-white'>
              {frontmatter.title}
            </h1>
            <p className='mt-2 text-sm text-zinc-400'>
              {frontmatter.description}
            </p>
            <div
              className='prose prose-lg prose-invert mt-8 max-w-none prose-headings:font-extrabold prose-headings:tracking-tight prose-h2:mb-4 prose-h2:mt-12 prose-h2:text-2xl prose-h2:text-white prose-h3:mb-3 prose-h3:mt-8 prose-h3:text-xl prose-h3:text-white prose-p:my-5 prose-p:leading-relaxed prose-p:text-zinc-400 prose-a:text-cyan-400 hover:prose-a:text-cyan-300 prose-ol:my-5 prose-ul:my-5 prose-li:my-2'
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>
        </WikiLayout>

        {!isLogged && <Footer />}
      </div>
    </>
  );
};

WikiArticlePage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId={"wiki"} subtitle='Wiki' variant='primary' isPublic>
      {page}
    </AppLayout>
  );
};

export default WikiArticlePage;

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getAllWikiPages().map((page) => ({ params: { slug: page.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<WikiArticleProps> = async (
  context,
) => {
  const slug = context.params?.slug as string;

  const render = async (locale: AppLocale): Promise<WikiArticle> => {
    const { frontmatter, content } = await getWikiPageBySlug(slug, locale);

    // Compiled and rendered to static HTML at build time instead of shipping
    // compiled MDX for the client to `new Function()`-eval on hydration — the
    // browser's script-src CSP has no 'unsafe-eval' and blocks that. See blog/[slug].tsx.
    const { default: MDXContent } = await evaluate(content, {
      ...jsxRuntime,
      remarkPlugins: [remarkGfm],
    });
    const contentHtml = renderToStaticMarkup(
      <MDXContent components={components} />,
    );

    return { frontmatter, contentHtml };
  };

  try {
    const english = await render("en");
    const articles: WikiArticleProps["articles"] = { en: english };

    // A language only ships when its article has been translated, so a page
    // that is still English-only does not carry the same HTML again.
    for (const { code } of SUPPORTED_LOCALES) {
      if (code !== "en" && hasWikiTranslation(slug, code)) {
        articles[code] = await render(code);
      }
    }

    const sections = Object.fromEntries(
      SUPPORTED_LOCALES.map(({ code }) => [code, getWikiSections(code)]),
    ) as Record<AppLocale, WikiSection[]>;

    return { props: { articles, sections } };
  } catch {
    return { notFound: true };
  }
};
