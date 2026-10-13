import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { Footer } from "feature/landing/components/Footer";
import { WikiPublicNav } from "feature/wiki/components/WikiPublicNav";
import { wikiSectionIntro, wikiSectionLabel } from "feature/wiki/sectionLabel";
import WikiLayout from "feature/wiki/WikiLayout";
import { useTranslation } from "hooks/useTranslation";
import AppLayout from "layouts/AppLayout";
import { type AppLocale, SUPPORTED_LOCALES } from "lib/i18n/locales";
import { useActiveLocale } from "lib/i18n/LocalizedRegion";
import { getWikiSections, type WikiSection } from "lib/wiki";
import { ArrowRight, Search } from "lucide-react";
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { ReactElement } from "react";
import { useState } from "react";
import type { NextPageWithLayout } from "types/page";

const SITE_URL = "https://riff.quest";
const OG_IMAGE = `${SITE_URL}/images/og-image.png`;
const DESCRIPTION =
  "The Riff Quest Knowledge Base: how practice logging, points, Fame, streaks, songs, skills and the rest of the app actually work, explained in plain language.";

interface WikiIndexProps {
  /** The index in every language — the one shown follows the player's choice inside the app. */
  sections: Record<AppLocale, WikiSection[]>;
}

const WikiIndexPage: NextPageWithLayout<WikiIndexProps> = ({
  sections: sectionsByLocale,
}) => {
  const { status } = useSession();
  const isLogged = status === "authenticated";
  const locale = useActiveLocale();
  const sections = sectionsByLocale[locale];
  const { t } = useTranslation("wiki");

  const [query, setQuery] = useState("");

  // The first section is the "start here" block at the top: its first article
  // is the one action, the next one is offered as the follow-up. It isn't
  // repeated in the topic list below.
  const [startSection, ...topicSections] = sections;
  const firstPage = startSection?.pages[0];
  const nextPage = startSection?.pages[1];

  const q = query.trim().toLowerCase();
  const results = q
    ? sections.flatMap((s) =>
        s.pages
          .filter((p) =>
            `${p.title} ${p.description} ${wikiSectionLabel(t, s.section)}`
              .toLowerCase()
              .includes(q),
          )
          .map((p) => ({ ...p, section: s.section })),
      )
    : [];

  return (
    <>
      <Head>
        <title>Riff Quest Knowledge Base — How the Guitar App Works</title>
        <meta name='description' content={DESCRIPTION} />
        <link rel='canonical' href={`${SITE_URL}/wiki`} />
        <meta
          property='og:title'
          content='Riff Quest Knowledge Base — How the Guitar App Works'
        />
        <meta property='og:description' content={DESCRIPTION} />
        <meta property='og:url' content={`${SITE_URL}/wiki`} />
        <meta property='og:type' content='website' />
        <meta property='og:site_name' content='Riff Quest' />
        <meta property='og:image' content={OG_IMAGE} />
        <meta name='twitter:card' content='summary_large_image' />
        <meta
          name='twitter:title'
          content='Riff Quest Knowledge Base — How the Guitar App Works'
        />
        <meta name='twitter:description' content={DESCRIPTION} />
        <meta name='twitter:image' content={OG_IMAGE} />
      </Head>
      {!isLogged && <WikiPublicNav />}
      <div className='flex min-h-screen flex-col overflow-visible rounded-xl border-none bg-second-600 shadow-sm'>
        <HeroBanner
          title='Wiki'
          subtitle={t("hero_subtitle")}
          eyebrow={t("hero_eyebrow")}
          backgroundContent={<HeroPattern />}
          compact
          className='w-full !rounded-none !shadow-none'
        />
        <WikiLayout sections={sections}>
          <div className='flex flex-col gap-10 p-4 sm:p-6'>
            {sections.length === 0 && (
              <p className='text-sm text-zinc-500'>{t("no_articles")}</p>
            )}

            <div className='flex flex-col gap-4'>
              <p className='max-w-3xl text-base leading-relaxed text-zinc-300'>
                {t("intro")}
              </p>
              <div className='relative max-w-xl'>
                <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500' />
                <input
                  type='search'
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("search_placeholder")}
                  aria-label={t("search_label")}
                  className='h-11 w-full rounded-lg bg-zinc-900/60 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40'
                />
              </div>
            </div>

            {q ? (
              results.length === 0 ? (
                <p className='text-sm text-zinc-500'>
                  {t("no_match", { query: query.trim() })}
                </p>
              ) : (
                <div className='grid gap-4 md:grid-cols-2'>
                  {results.map((page) => (
                    <Link
                      key={page.slug}
                      href={`/wiki/${page.slug}`}
                      className='rounded-lg bg-zinc-900/40 p-5 transition-background hover:bg-zinc-800/60'>
                      <div className='text-xs font-semibold text-zinc-500'>
                        {wikiSectionLabel(t, page.section)}
                      </div>
                      <div className='mt-1 font-bold text-white'>
                        {page.title}
                      </div>
                      <p className='mt-2 text-sm leading-relaxed text-zinc-400'>
                        {page.description}
                      </p>
                    </Link>
                  ))}
                </div>
              )
            ) : (
              <>
                {firstPage && (
                  <div className='flex flex-col gap-3'>
                    <Link
                      href={`/wiki/${firstPage.slug}`}
                      className='flex flex-col gap-2 rounded-lg bg-zinc-900/40 p-6 transition-background hover:bg-zinc-800/60'>
                      <span className='text-xs font-bold text-cyan-400'>
                        {t("start_here")}
                      </span>
                      <span className='text-lg font-bold text-white'>
                        {firstPage.title}
                      </span>
                      <span className='text-sm leading-relaxed text-zinc-400'>
                        {firstPage.description}
                      </span>
                    </Link>
                    {nextPage && (
                      <Link
                        href={`/wiki/${nextPage.slug}`}
                        className='flex items-center gap-2 px-1 text-sm text-zinc-400 transition-colors hover:text-cyan-400'>
                        <span className='text-zinc-500'>{t("then")}</span>
                        <span className='font-semibold'>{nextPage.title}</span>
                        <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                )}
                {topicSections.map((section) => (
                  <div key={section.section}>
                    <h2 className='mb-2 text-base font-bold tracking-wide text-white'>
                      {wikiSectionLabel(t, section.section)}
                    </h2>
                    {wikiSectionIntro(t, section.section) && (
                      <p className='mb-5 max-w-3xl text-sm leading-relaxed text-zinc-400'>
                        {wikiSectionIntro(t, section.section)}
                      </p>
                    )}
                    <div className='grid gap-4 md:grid-cols-2'>
                      {section.pages.map((page) => (
                        <Link
                          key={page.slug}
                          href={`/wiki/${page.slug}`}
                          className='rounded-lg bg-zinc-900/40 p-5 transition-background hover:bg-zinc-800/60'>
                          <div className='font-bold text-white'>
                            {page.title}
                          </div>
                          <p className='mt-2 text-sm leading-relaxed text-zinc-400'>
                            {page.description}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}

            <div className='rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
              <h2 className='text-base font-bold tracking-wide text-white'>
                {t("not_finding_title")}
              </h2>
              <p className='mt-4 max-w-3xl text-sm leading-relaxed text-zinc-400'>
                {t("not_finding_body")}
              </p>
              <div className='mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm'>
                <Link
                  href='/faq'
                  className='text-cyan-400 transition-colors hover:text-cyan-300'>
                  {t("link_faq")}
                </Link>
                <Link
                  href='/blog'
                  className='text-cyan-400 transition-colors hover:text-cyan-300'>
                  {t("link_blog")}
                </Link>
                <Link
                  href='/contact'
                  className='text-cyan-400 transition-colors hover:text-cyan-300'>
                  {t("link_contact")}
                </Link>
              </div>
            </div>
          </div>
        </WikiLayout>
      </div>
      {!isLogged && <Footer />}
    </>
  );
};

WikiIndexPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId={"wiki"} subtitle='Wiki' variant='primary' isPublic>
      {page}
    </AppLayout>
  );
};

export default WikiIndexPage;

export const getStaticProps: GetStaticProps<WikiIndexProps> = async () => {
  return {
    props: {
      sections: Object.fromEntries(
        SUPPORTED_LOCALES.map(({ code }) => [code, getWikiSections(code)]),
      ) as Record<AppLocale, WikiSection[]>,
    },
  };
};
