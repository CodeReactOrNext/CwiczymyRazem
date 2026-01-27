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
        <meta name="description" content="Learn about Riff Quest, the ultimate guitar practice tracker built to help you see visible progress." />
        <link rel='canonical' href='https://riff.quest/about' />
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
          <h1 className="text-4xl font-black text-white mb-8">About Riff Quest</h1>
          <div className="prose prose-invert prose-cyan max-w-none space-y-10 text-zinc-400">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white">The Mission</h2>
              <p className="text-lg leading-relaxed">
                Riff Quest was born out of a simple frustration: **"Am I actually getting better?"** 
              </p>
              <p>
                As guitarists, we spend hours practicing, but it's hard to see progress when it happens in tiny increments over months. Most apps are too complicated or force rigid plans that don't fit real life. Riff Quest is built to be your companion—tracking the work you do, celebrating your milestones, and giving you a bird's-eye view of your journey.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Built for the Community</h2>
              <p>
                We believe that the best way to determine song difficulty is through the collective experience of players. That's why Riff Quest features community-rated difficulties—so you know a "Level 5" song is actually a Level 5, not just one expert's opinion.
              </p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
              <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
                <h3 className="text-lg font-bold text-white mb-2">100% Free</h3>
                <p className="text-sm">No subscriptions, no hidden fees. Riff Quest is a passion project built to help guitarists everywhere stay motivated.</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
                <h3 className="text-lg font-bold text-white mb-2">Open & Feedback-Driven</h3>
                <p className="text-sm">We're constantly improving based on what you need. Join our Discord to help shape the future of the app.</p>
              </div>
            </section>

            <section className="text-center pt-12">
              <h2 className="text-2xl font-bold text-white mb-4">Ready to level up?</h2>
              <Link href="/signup" className="inline-block rounded-xl bg-cyan-500 px-8 py-3 text-lg font-black text-black hover:bg-cyan-400 transition-all hover:scale-105">
                Start your practice quest
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
