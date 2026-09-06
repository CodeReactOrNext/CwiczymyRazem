import { Button } from "assets/components/ui/button";
import { Footer } from "feature/landing/components/Footer";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

const AboutPage: NextPageWithLayout = () => {
  const { status } = useSession();
  const isLogged = status === "authenticated";

  return (
    <>
      <Head>
        <title>About Riff Quest - Built by Guitarists</title>
        <meta
          name='description'
          content='Learn about Riff Quest, the intelligent guitar practice assistant built by guitarists for guitarists. Track progress, compete with friends, and see visible improvement.'
        />
        <link rel='canonical' href='https://riff.quest/about' />
        <meta
          property='og:title'
          content='About Riff Quest - Built by Guitarists'
        />
        <meta
          property='og:description'
          content='Learn about Riff Quest, the intelligent guitar practice assistant built by guitarists for guitarists. Track progress, compete with friends, and see visible improvement.'
        />
        <meta property='og:url' content='https://riff.quest/about' />
        <meta property='og:type' content='website' />
        <meta
          property='og:image'
          content='https://riff.quest/images/og-image.png'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta
          name='twitter:title'
          content='About Riff Quest - Built by Guitarists'
        />
        <meta
          name='twitter:description'
          content='Learn about Riff Quest, the intelligent guitar practice assistant built by guitarists for guitarists.'
        />
        <meta
          name='twitter:image'
          content='https://riff.quest/images/og-image.png'
        />
      </Head>

      <div
        className={!isLogged ? "min-h-screen bg-zinc-950 text-zinc-100" : ""}>
        {!isLogged && (
          <nav className='bg-zinc-950/50 backdrop-blur-xl'>
            <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8'>
              <Link
                href='/'
                className='flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500'>
                <Image
                  src='/images/longlightlogo.svg'
                  alt='Riff Quest'
                  width={120}
                  height={32}
                  className='h-6 w-auto'
                  priority
                />
              </Link>
              <div className='flex items-center gap-4'>
                <Link
                  href='/login'
                  className='rounded text-sm font-medium text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 hover:text-white'>
                  Login
                </Link>
                <Button
                  asChild
                  size='sm'
                  className='rounded-full bg-cyan-500 text-black hover:bg-cyan-400'>
                  <Link href='/signup'>Start Free</Link>
                </Button>
              </div>
            </div>
          </nav>
        )}

        <div className='mx-auto max-w-3xl px-6 py-20'>
          <div className='mb-12'>
            <p className='mb-4 text-xs font-black tracking-[0.4em] text-cyan-500'>
              About
            </p>
            <h1 className='mb-6 text-4xl font-black text-white'>
              Built by a guitarist,
              <br />
              for guitarists.
            </h1>
            <p className='text-lg leading-relaxed text-zinc-400'>
              Riff Quest was born from a simple frustration:{" "}
              <span className='font-semibold text-white'>
                &ldquo;Am I actually getting better?&rdquo;
              </span>{" "}
              We built the tool we always wished existed.
            </p>
          </div>

          <div className='space-y-10 text-zinc-400'>
            <section className='space-y-4'>
              <h2 className='text-2xl font-bold text-white'>The Mission</h2>
              <p className='leading-relaxed'>
                As guitarists, we spend hours practicing — but progress happens
                in tiny increments over months and it&apos;s easy to lose sight
                of how far you&apos;ve come. Most apps are either too rigid or
                too simple. Riff Quest is built to be your intelligent
                companion: tracking the work you do, celebrating your
                milestones, and giving you a clear picture of your journey.
              </p>
            </section>

            <section className='space-y-4'>
              <h2 className='text-2xl font-bold text-white'>
                Community at the Core
              </h2>
              <p className='leading-relaxed'>
                The best way to know how hard a song really is? Ask the people
                who&apos;ve learned it. That&apos;s why Riff Quest uses
                community-rated difficulties — so a &ldquo;Level 5&rdquo; song
                is a Level 5 based on real player experience, not one
                expert&apos;s guess.
              </p>
            </section>

            <section className='grid grid-cols-1 gap-6 pt-4 md:grid-cols-2'>
              <div className='rounded-lg bg-cyan-500/10 p-6'>
                <h3 className='mb-2 text-lg font-bold text-cyan-400'>
                  Completely Free
                </h3>
                <p className='text-sm leading-relaxed'>
                  Every feature — practice tracking, plans, scoring,
                  leaderboards, songs — is free, forever. No credit card, no
                  premium tier, no paywalls.
                </p>
              </div>
              <div className='rounded-lg bg-amber-500/10 p-6'>
                <h3 className='mb-2 text-lg font-bold text-amber-400'>
                  Fueled by Coffee
                </h3>
                <p className='text-sm leading-relaxed'>
                  There&apos;s no subscription behind the scenes — Riff Quest
                  runs on{" "}
                  <Link
                    href='https://buymeacoffee.com/riffquest'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='font-semibold text-amber-400 underline underline-offset-2 hover:text-amber-300'>
                    Buy Me a Coffee
                  </Link>
                  . If it helps your playing, chip in to keep it growing.
                </p>
              </div>
              <div className='rounded-lg bg-zinc-900/40 p-6'>
                <h3 className='mb-2 text-lg font-bold text-white'>
                  Open & Feedback-Driven
                </h3>
                <p className='text-sm leading-relaxed'>
                  We ship improvements based on what you need. Join our Discord
                  and help shape the future of the app.
                </p>
              </div>
              <div className='rounded-lg bg-zinc-900/40 p-6'>
                <h3 className='mb-2 text-lg font-bold text-white'>
                  Made with Care
                </h3>
                <p className='text-sm leading-relaxed'>
                  Riff Quest is a passion project — every feature is designed by
                  someone who actually practices guitar and knows what matters.
                </p>
              </div>
            </section>

            <section className='pt-8 text-center'>
              <h2 className='mb-4 text-2xl font-bold text-white'>
                Ready to level up?
              </h2>
              <p className='mb-8 text-zinc-500'>
                Join thousands of guitarists tracking their progress on Riff
                Quest.
              </p>
              <div className='flex flex-col items-center'>
                <Button
                  asChild
                  className='h-14 rounded-lg bg-white px-10 text-base font-bold text-black transition-colors hover:bg-zinc-50 active:scale-[0.98]'>
                  <Link href='/signup'>Start for free</Link>
                </Button>
                <span className='mt-3 text-xs font-medium text-zinc-500'>
                  Free forever, no paywalls
                </span>
              </div>
            </section>
          </div>
        </div>

        {!isLogged && <Footer />}
      </div>
    </>
  );
};

AboutPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId='about' isPublic={true}>
      {page}
    </AppLayout>
  );
};

export default AboutPage;
