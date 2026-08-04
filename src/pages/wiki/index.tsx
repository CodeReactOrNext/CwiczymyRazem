import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import WikiLayout from "feature/wiki/WikiLayout";
import AppLayout from "layouts/AppLayout";
import { getWikiSections, type WikiSection } from "lib/wiki";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { getSession } from "next-auth/react";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

interface WikiIndexProps {
  sections: WikiSection[];
}

const WikiIndexPage: NextPageWithLayout<WikiIndexProps> = ({ sections }) => {
  return (
    <>
      <Head>
        <title>Wiki | Riff Quest</title>
        <meta name='robots' content='noindex' />
      </Head>
      <div className='bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen'>
        <HeroBanner
          title='Wiki'
          subtitle='How riff.quest works, mechanic by mechanic'
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
            {sections.map((section) => (
              <div key={section.section}>
                <h2 className='text-base font-bold text-white tracking-wide mb-4'>
                  {section.section}
                </h2>
                <div className='grid gap-4 md:grid-cols-2'>
                  {section.pages.map((page) => (
                    <Link
                      key={page.slug}
                      href={`/wiki/${page.slug}`}
                      className='rounded-xl bg-zinc-900/40 p-5 hover:bg-zinc-900/70 transition-background'>
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
    </>
  );
};

WikiIndexPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId={"wiki"} subtitle='Wiki' variant='primary'>
      {page}
    </AppLayout>
  );
};

export default WikiIndexPage;

export const getServerSideProps: GetServerSideProps<WikiIndexProps> = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return {
    props: {
      sections: getWikiSections(),
    },
  };
};
