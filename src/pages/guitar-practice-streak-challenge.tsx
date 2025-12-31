import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nextConfig from "../../next-i18next.config";
import { Footer } from "feature/landing/components/Footer";
import { ArrowRight } from "lucide-react";

const CTASection = () => (
  <div className="my-16 p-8 bg-cyan-500/5 border-l-4 border-cyan-500">
    <h3 className="text-xl font-bold text-white mb-2">Start your streak today</h3>
    <p className="text-zinc-400 mb-6">
      Track it automatically in Riff Quest—start a session, then finish & report, and your history builds itself.
    </p>
    <Link 
      href="/signup"
      className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-3 rounded transition-colors"
    >
      Join the Challenge <ArrowRight size={18} />
    </Link>
  </div>
);

export default function GuitarPracticeStreakChallengePage() {
  return (
    <>
      <Head>
        <title>30-Day Guitar Practice Streak Challenge | Free Tracker & XP Score</title>
        <meta 
          name="description" 
          content="A simple 30-day streak system designed to help you show up daily, build momentum, and actually see proof that you're improving." 
        />
        <link rel="canonical" href="https://riff.quest/guitar-practice-streak-challenge" />
        <meta property="og:title" content="30-Day Guitar Practice Streak Challenge (Free Tracker + XP Score)" />
        <meta property="og:description" content="Want to practice guitar consistently? Join the 30-day challenge focused on habit building." />
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

        <article className="mx-auto max-w-2xl px-6 pt-32 pb-24">
          <header className="mb-16">
            <p className="text-xs uppercase tracking-wider text-cyan-400 mb-4">Community Challenge</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              30-Day Guitar Practice Streak Challenge
            </h1>
            <p className="text-xl text-zinc-400 leading-relaxed">
              Want to practice guitar consistently without turning it into a second job? This system helps you show up daily and build momentum.
            </p>
          </header>

          <div className="prose prose-invert prose-lg max-w-none">
            <p>
              It's not a "learn this riff" plan. It's a habit loop you can repeat every day:
            </p>
            <p className="text-center font-mono text-sm bg-zinc-900 p-4 rounded border border-white/10 my-8">
              Timer/Auto → Finish & Report → XP → Streak → Activity/Progress
            </p>
            <p>
              If you've tried routines before and they didn't stick, this challenge is built for you.
            </p>

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">Who This Is For</h2>
            <div className="grid md:grid-cols-2 gap-8 my-8">
              <div>
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3">It's for:</h3>
                <ul className="text-sm space-y-2">
                  <li>Beginners wanting a daily system</li>
                  <li>Intermediate players resetting habits</li>
                  <li>People who love streaks & trackers</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3">It's NOT for:</h3>
                <ul className="text-sm space-y-2">
                  <li>People wanting a step-by-step course</li>
                  <li>Anyone wanting long daily sessions</li>
                  <li>Perfectionists (habit {'>'}perfection)</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">The Rules</h2>
            <p>The rules are intentionally boring. That's why they work.</p>
            <ul className="space-y-2 my-6">
              <li>Practice daily for 30 days</li>
              <li>10–20 minutes minimum (don't raise the minimum)</li>
              <li>No "catch-up" sessions</li>
              <li>Your only job is to start</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">Daily Structure: 3 Blocks</h2>
            <p>No tutorials here—just checklists. Keep it light.</p>

            <div className="my-12 space-y-8">
              <div className="border-l-2 border-purple-500/50 pl-6">
                <h3 className="text-lg font-bold text-white mb-2">1. Technique <span className="text-xs font-normal text-zinc-500">(4–8 minutes)</span></h3>
                <p className="text-sm mb-3">Pick one: chord changes, alternate picking, bending/vibrato, rhythm, legato.</p>
                <ul className="text-xs text-zinc-500 space-y-1">
                  <li>☐ choose one focus</li>
                  <li>☐ start slow</li>
                  <li>☐ aim for clean reps</li>
                </ul>
              </div>

              <div className="border-l-2 border-emerald-500/50 pl-6">
                <h3 className="text-lg font-bold text-white mb-2">2. Music <span className="text-xs font-normal text-zinc-500">(4–8 minutes)</span></h3>
                <p className="text-sm mb-3">Pick one: song section, riff you enjoy, chord progression.</p>
                <ul className="text-xs text-zinc-500 space-y-1">
                  <li>☐ choose short section</li>
                  <li>☐ repeat to improve</li>
                  <li>☐ end with "clean take"</li>
                </ul>
              </div>

              <div className="border-l-2 border-amber-500/50 pl-6">
                <h3 className="text-lg font-bold text-white mb-2">3. Fun <span className="text-xs font-normal text-zinc-500">(2–5 minutes)</span></h3>
                <p className="text-sm mb-3">Pick one: improv, noodle with constraint, play known song.</p>
                <ul className="text-xs text-zinc-500 space-y-1">
                  <li>☐ keep it easy</li>
                  <li>☐ end feeling good</li>
                </ul>
              </div>
            </div>

            <div className="border-l-4 border-cyan-500 pl-6 py-2 my-12">
              <h2 className="text-xl font-bold text-white mb-3">The "Finish & Report" Rule</h2>
              <p>
                Here's the one rule that turns this into a real system: <strong className="text-white">Every session must end with "Finish & Report."</strong>
              </p>
              <p className="text-sm text-zinc-400 mt-2">
                Why it works: closes the loop, makes streaks real, and turns practice into trackable history.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">XP Score System</h2>
            
            <div className="my-8 grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-bold text-cyan-400 uppercase mb-3">Intensity Scale</h3>
                <ul className="text-sm space-y-2">
                  <li><span className="font-mono text-white">1</span> = Easy (maintenance)</li>
                  <li><span className="font-mono text-white">2</span> = Solid (focused work)</li>
                  <li><span className="font-mono text-white">3</span> = Hard (pushed)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold text-cyan-400 uppercase mb-3">Streak Bonus</h3>
                <ul className="text-sm space-y-2">
                  <li>Day 1–7: <span className="text-yellow-400">+5 XP</span></li>
                  <li>Day 8–14: <span className="text-yellow-400">+10 XP</span></li>
                  <li>Day 22–30: <span className="text-yellow-400">+20 XP</span></li>
                </ul>
              </div>
            </div>

            <div className="bg-zinc-900 p-4 rounded border border-white/10 my-8">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 text-center">XP Formula</p>
              <p className="text-center font-mono text-white mb-2">(Minutes × Intensity) + Bonus</p>
              <p className="text-xs text-zinc-500 text-center">Example: 15 min × 2 + 10 bonus = <span className="text-white font-bold">40 XP</span></p>
            </div>

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">Free Tracker Template</h2>
            <div className="bg-zinc-900 p-6 rounded border border-dashed border-zinc-700 font-mono text-sm my-8">
              <p className="text-xs text-zinc-500 mb-4">30-Day Guitar Practice Streak Tracker</p>
              <div className="space-y-2 text-zinc-300">
                <p>Day __ / 30</p>
                <p>Minutes: __</p>
                <p>Technique focus: __</p>
                <p>Music (song/section): __</p>
                <p>Fun (what you did): __</p>
                <p>Intensity (1–3): __</p>
                <p>XP: __</p>
                <p>Streak: __ days</p>
                <p>One line win: __</p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 text-center">
                <p className="text-zinc-500 text-sm mb-2">Or automate it:</p>
                <Link href="/signup" className="text-cyan-400 hover:text-cyan-300 underline">Track automatically in Riff Quest →</Link>
              </div>
            </div>

            <CTASection />

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">Common Questions</h2>
            <dl className="space-y-6 my-8">
              <div>
                <dt className="font-bold text-white mb-1">Missed a day?</dt>
                <dd className="text-sm text-zinc-400">Strict mode: reset streak. Real-life mode: 1 reset token per 30 days. Point is consistency, not punishment.</dd>
              </div>
              <div>
                <dt className="font-bold text-white mb-1">Only 10 minutes... does it count?</dt>
                <dd className="text-sm text-zinc-400">Yes. Especially on busy days. Ten minutes keeps the habit alive.</dd>
              </div>
              <div>
                <dt className="font-bold text-white mb-1">Beginner vs Intermediate?</dt>
                <dd className="text-sm text-zinc-400">Same structure, different difficulty. Beginners focus on basics (chords), Intermediates on nuance (timing/bends).</dd>
              </div>
            </dl>

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">Join the 30-Day Streak</h2>
            <p>
              If you're tired of starting over, don't look for the perfect routine. Run the loop.
              <br/><span className="text-cyan-400 font-medium">Start → Finish & Report → Keep the streak alive.</span>
            </p>
          </div>

          <div className="mt-16">
            <CTASection />
          </div>
        </article>

        <Footer />
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "en",
        ["common"],
        nextI18nextConfig
      )),
    },
  };
};
