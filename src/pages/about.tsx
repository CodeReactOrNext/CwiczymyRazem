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
        <meta name="description" content="Learn about Riff Quest, the intelligent guitar practice assistant built by guitarists for guitarists. Track progress, compete with friends, and see visible improvement." />
        <link rel='canonical' href='https://riff.quest/about' />
        <meta property="og:title" content="About Riff Quest - Built by Guitarists" />
        <meta property="og:description" content="Learn about Riff Quest, the intelligent guitar practice assistant built by guitarists for guitarists. Track progress, compete with friends, and see visible improvement." />
        <meta property="og:url" content="https://riff.quest/about" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://riff.quest/images/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About Riff Quest - Built by Guitarists" />
        <meta name="twitter:description" content="Learn about Riff Quest, the intelligent guitar practice assistant built by guitarists for guitarists." />
        <meta name="twitter:image" content="https://riff.quest/images/og-image.png" />
      </Head>

      <div className={!isLogged ? "min-h-screen bg-zinc-950 text-zinc-100" : ""}>
        {!isLogged && (
          <nav className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
               <Link href="/" className="flex items-center gap-2">
                  <Image
                    src='/images/longlightlogo.svg'
                    alt='Riff Quest'
                    width={120}
                    height={32}
                    className='h-6 w-auto'
                    priority
                  />
               </Link>
               <div className="flex items-center gap-4">
                 <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                   Login
                 </Link>
                 <Link href="/signup" className="rounded-full bg-cyan-500 px-4 py-1.5 text-sm font-bold text-black hover:bg-cyan-400 transition-colors">
                   Start Free
                 </Link>
               </div>
            </div>
          </nav>
        )}

        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="mb-12">
            <p className="text-xs font-black uppercase tracking-[0.4em] text-cyan-500 mb-4">About</p>
            <h1 className="text-4xl font-black text-white mb-6">Built by a guitarist,<br />for guitarists.</h1>
            <p className="text-lg text-zinc-400 leading-relaxed">
              Riff Quest was born from a simple frustration: <span className="text-white font-semibold">&ldquo;Am I actually getting better?&rdquo;</span> We built the tool we always wished existed.
            </p>
          </div>

          <div className="space-y-10 text-zinc-400">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white">The Mission</h2>
              <p className="leading-relaxed">
                As guitarists, we spend hours practicing — but progress happens in tiny increments over months and it&apos;s easy to lose sight of how far you&apos;ve come. Most apps are either too rigid or too simple. Riff Quest is built to be your intelligent companion: tracking the work you do, celebrating your milestones, and giving you a clear picture of your journey.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Community at the Core</h2>
              <p className="leading-relaxed">
                The best way to know how hard a song really is? Ask the people who&apos;ve learned it. That&apos;s why Riff Quest uses community-rated difficulties — so a &ldquo;Level 5&rdquo; song is a Level 5 based on real player experience, not one expert&apos;s guess.
              </p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
                <h3 className="text-lg font-bold text-white mb-2">Free to Start</h3>
                <p className="text-sm leading-relaxed">
                  Core practice tracking, song management, and progress stats are free to use. No credit card required — just sign up and start playing.
                </p>
              </div>
              <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/5 p-6">
                <h3 className="text-lg font-bold text-white mb-2">Premium Features</h3>
                <p className="text-sm leading-relaxed">
                  Unlock advanced tools — AI coaching, smart practice plans, detailed analytics and more — with a premium plan built for serious players.
                </p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
                <h3 className="text-lg font-bold text-white mb-2">Open & Feedback-Driven</h3>
                <p className="text-sm leading-relaxed">
                  We ship improvements based on what you need. Join our Discord and help shape the future of the app.
                </p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
                <h3 className="text-lg font-bold text-white mb-2">Made with Care</h3>
                <p className="text-sm leading-relaxed">
                  Riff Quest is a passion project — every feature is designed by someone who actually practices guitar and knows what matters.
                </p>
              </div>
            </section>

            <section className="text-center pt-8">
              <h2 className="text-2xl font-bold text-white mb-4">Ready to level up?</h2>
              <p className="text-zinc-500 mb-8">Join thousands of guitarists tracking their progress on Riff Quest.</p>
              <Link href="/signup" className="inline-block rounded-xl bg-cyan-500 px-8 py-3 text-lg font-black text-black hover:bg-cyan-400 transition-all hover:scale-105">
                Start for free
              </Link>
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
    <AppLayout pageId="about" isPublic={true}>
      {page}
    </AppLayout>
  );
};

export default AboutPage;
