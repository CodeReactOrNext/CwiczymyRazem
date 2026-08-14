import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { Footer } from "feature/landing/components/Footer";
import { WikiPublicNav } from "feature/wiki/components/WikiPublicNav";
import WikiLayout from "feature/wiki/WikiLayout";
import AppLayout from "layouts/AppLayout";
import { getWikiSections, type WikiSection } from "lib/wiki";
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

const SITE_URL = "https://riff.quest";
const OG_IMAGE = `${SITE_URL}/images/og-image.png`;
const DESCRIPTION =
  "The Riff Quest Knowledge Base: how practice logging, points, Fame, streaks, songs, skills and the rest of the app actually work, explained in plain language.";

interface WikiIndexProps {
  sections: WikiSection[];
}

const WikiIndexPage: NextPageWithLayout<WikiIndexProps> = ({ sections }) => {
  const { status } = useSession();
  const isLogged = status === "authenticated";

  // The very first article in reading order doubles as the "start here" card.
  const firstPage = sections[0]?.pages[0];

  return (
    <>
      <Head>
        <title>Riff Quest Knowledge Base</title>
        <meta name='description' content={DESCRIPTION} />
        <link rel='canonical' href={`${SITE_URL}/wiki`} />
        <meta property='og:title' content='Riff Quest Knowledge Base' />
        <meta property='og:description' content={DESCRIPTION} />
        <meta property='og:url' content={`${SITE_URL}/wiki`} />
        <meta property='og:type' content='website' />
        <meta property='og:site_name' content='Riff Quest' />
        <meta property='og:image' content={OG_IMAGE} />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content='Riff Quest Knowledge Base' />
        <meta name='twitter:description' content={DESCRIPTION} />
        <meta name='twitter:image' content={OG_IMAGE} />
      </Head>
      {!isLogged && <WikiPublicNav />}
      <div className='bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen'>
        <HeroBanner
          title='Wiki'
          subtitle='Everything riff.quest does, explained in plain language'
          eyebrow='Guides'
          backgroundContent={<HeroPattern />}
          compact
          className='w-full !rounded-none !shadow-none'
        />
        <WikiLayout sections={sections}>
          <div className='flex flex-col gap-10 p-4 sm:p-6'>
            {sections.length === 0 && (
              <p className='text-sm text-zinc-500'>No wiki articles yet.</p>
            )}
            {firstPage && (
              <Link
                href={`/wiki/${firstPage.slug}`}
                className='flex flex-col gap-2 rounded-lg bg-zinc-900/40 p-6 transition-background hover:bg-zinc-800/60'>
                <span className='text-xs font-bold text-cyan-400'>New here?</span>
                <span className='text-lg font-bold text-white'>{firstPage.title}</span>
                <span className='text-sm leading-relaxed text-zinc-400'>
                  {firstPage.description}
                </span>
              </Link>
            )}
            {sections.map((section) => (
              <div key={section.section}>
                <h2 className='mb-4 text-base font-bold tracking-wide text-white'>
                  {section.section}
                </h2>
                <div className='grid gap-4 md:grid-cols-2'>
                  {section.pages.map((page) => (
                    <Link
                      key={page.slug}
                      href={`/wiki/${page.slug}`}
                      className='rounded-lg bg-zinc-900/40 p-5 transition-background hover:bg-zinc-800/60'>
                      <div className='font-bold text-white'>{page.title}</div>
                      <p className='mt-2 text-sm leading-relaxed text-zinc-400'>
                        {page.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
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
      sections: getWikiSections(),
    },
  };
};
