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

/** One line of context per section, so the index reads as a guide rather than a list of links. */
const SECTION_INTROS: Record<string, string> = {
  "Start Here":
    "The two articles worth reading on day one: what the app actually does, the ten minutes that get you from signing up to a logged session, and the Home screen you land on every day afterwards with its three daily quests.",
  "Scoring & Progress":
    "Where points come from and why you can never spend them, how the streak multiplier grows everything you log, what Fame buys and why it never touches your level, and why technique, theory, hearing and creative work are all worth exactly the same per minute.",
  Practice:
    "Every way of practising, from the free timer and the manual log through routines, Auto Plan and your own Guitar Pro files, plus how note detection listens to your playing and what the desktop app adds once you plug a guitar into an interface.",
  "Songs & Library":
    "The song board you drag a piece along as it becomes playable, what the difficulty tiers mean, what finishing a song pays, and how playlists get built and shared.",
  "Skill Development":
    "The guided routes through the app: the Learning Path and the Scale Map that unlock step by step, the individual guitar skills that grow out of whatever you tag your sessions with, and the personal Mastery Roadmap the app can write for you.",
  Community:
    "The parts of the app with other people in them: the five community-voted songs of each monthly challenge, the recordings wall, and every other way other players end up paying you Fame.",
  Competition:
    "The three rankings and what each one measures, how the monthly season resets so a new player is never permanently behind, and the Arsenal, the collecting game that is the only thing Fame is for.",
};

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
        <title>Riff Quest Knowledge Base — How the Guitar App Works</title>
        <meta name='description' content={DESCRIPTION} />
        <link rel='canonical' href={`${SITE_URL}/wiki`} />
        <meta property='og:title' content='Riff Quest Knowledge Base — How the Guitar App Works' />
        <meta property='og:description' content={DESCRIPTION} />
        <meta property='og:url' content={`${SITE_URL}/wiki`} />
        <meta property='og:type' content='website' />
        <meta property='og:site_name' content='Riff Quest' />
        <meta property='og:image' content={OG_IMAGE} />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content='Riff Quest Knowledge Base — How the Guitar App Works' />
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

            <div className='rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
              <p className='max-w-3xl text-base leading-relaxed text-zinc-300'>
                This is the manual for riff.quest, written for the person playing
                the guitar rather than for the person who built the app. No URLs,
                no field names, no formulas to decode: each article takes one part
                of the app, explains what it does, what it is worth in points or
                Fame, and shows the screen it is describing.
              </p>
              <p className='mt-4 max-w-3xl text-sm leading-relaxed text-zinc-400'>
                Most people read Getting Started once, start logging sessions, and
                come back later with something specific: why the streak reset, what
                the Arsenal is for, how the app decides a song is hard, or why note
                detection is hearing nothing. Nothing here is required reading. The
                app works if you only ever type in your minutes.
              </p>
            </div>
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
                <h2 className='mb-2 text-base font-bold tracking-wide text-white'>
                  {section.section}
                </h2>
                {SECTION_INTROS[section.section] && (
                  <p className='mb-5 max-w-3xl text-sm leading-relaxed text-zinc-400'>
                    {SECTION_INTROS[section.section]}
                  </p>
                )}
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

            <div className='rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
              <h2 className='text-base font-bold tracking-wide text-white'>
                Not finding it here?
              </h2>
              <p className='mt-4 max-w-3xl text-sm leading-relaxed text-zinc-400'>
                Short questions about pricing, accounts, equipment and how the
                scoring behaves are answered on the frequently asked questions
                page. Practice advice that has nothing to do with this app in
                particular, such as how long to practise or how to drill a scale
                so it survives contact with a real song, lives on the blog. For
                anything that looks like a bug, or a question no page answers,
                the Discord server is the fastest way to reach a human.
              </p>
              <div className='mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm'>
                <Link
                  href='/faq'
                  className='text-cyan-400 transition-colors hover:text-cyan-300'>
                  Frequently asked questions
                </Link>
                <Link
                  href='/blog'
                  className='text-cyan-400 transition-colors hover:text-cyan-300'>
                  Practice guides
                </Link>
                <Link
                  href='/contact'
                  className='text-cyan-400 transition-colors hover:text-cyan-300'>
                  Contact
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
      sections: getWikiSections(),
    },
  };
};
