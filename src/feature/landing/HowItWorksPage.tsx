"use client";

import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { Footer } from "feature/landing/components/Footer";
import { m } from "framer-motion";
import { useInView } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

/* ─────────────────────────────────────────────
   Data
───────────────────────────────────────────── */
const steps = [
  {
    number: "01",
    title: "Practice your way —\ntrack it all in one place",
    desc: "Use Riff Quest's built-in tools to structure your session, or just play with your own material and log it afterwards. Either way, your progress is tracked.",
    features: [
      { label: "Practice report", sub: "log session time after the fact — no timer needed" },
      { label: "Single exercises", sub: "exercises categorized by skill", count: exercisesAgregat.length },
      { label: "Configurable exercises", sub: "scales, chords, strumming patterns — adjusted to your level" },
      { label: "Ready-made training plans", sub: "structured programs you can follow from day one", count: defaultPlans.length },
      { label: "Auto-planner", sub: "not sure what to practice? Riff Quest picks what's next" },
      { label: "Guitar Pro import", sub: "attach your own tabs to songs or plans" },
      { label: "Create your own plan", sub: "pick exercises, upload GP files, attach videos or photos to any step" },
    ],
    screenshot: "/images/how-it-works/step-1.png",
    screenshotAlt: "Riff Quest – song library screen",
    color: "text-cyan-400",
    line: "bg-cyan-500",
  },
  {
    number: "02",
    title: "Play.\nThe app tracks everything.",
    desc: "Start a session and focus on playing. Riff Quest measures your time, scores your performance, and logs every detail — no manual note-taking.",
    features: [
      { label: "Timer with category split", sub: "see where your time goes — technique, theory, ear training" },
      { label: "Song timer", sub: "track time spent on a specific song" },
      { label: "Live performance scoring", sub: "play into your mic, get scored in real time — like Guitar Hero, but for real guitar" },
      { label: "Built-in metronome", sub: "keep perfect time with an adjustable click track" },
      { label: "BPM progress tracker", sub: "mark BPM milestones as you push your speed further" },
      { label: "Interactive tab player", sub: "animated Guitar Pro tabs that scroll in sync with your session" },
    ],
    screenshot: "/images/how-it-works/step-2.png",
    screenshotAlt: "Riff Quest – active practice session",
    color: "text-emerald-400",
    line: "bg-emerald-500",
  },
  {
    number: "03",
    title: "See how\nyou're improving",
    desc: "Your progress is always visible. Every session adds up — XP, levels, achievements, and a full activity history that shows exactly how far you've come.",
    features: [
      { label: "Time, XP & level per category", sub: "technique, theory, ear training, and creativity — tracked separately" },
      { label: "Achievements", sub: "unlock badges as you hit milestones — consistency, speed, repertoire" },
      { label: "Leaderboard", sub: "see how you rank against other guitarists globally" },
      { label: "Activity charts", sub: "heatmaps and graphs showing your practice patterns over time" },
      { label: "Guitar Arsenal", sub: "collect virtual guitars as you level up" },
      { label: "Fame Points shop", sub: "spend Fame Points to unlock rare guitars and cosmetics" },
    ],
    screenshot: "/images/how-it-works/step-3.png",
    screenshotAlt: "Riff Quest – progress report screen",
    color: "text-violet-400",
    line: "bg-violet-500",
  },
];

/* ─────────────────────────────────────────────
   Step Section
───────────────────────────────────────────── */
function StepSection({
  step,
  index,
}: {
  step: (typeof steps)[0];
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const isEven = index % 2 === 0;

  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Divider line */}
      <div className="flex items-center gap-4 mb-16">
        <div className={`h-px flex-1 ${step.line} opacity-20`} />
        <span className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.3em]">
          Step {step.number}
        </span>
        <div className="h-px w-8 bg-white/5" />
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start`}>
        {/* ── Text column ── */}
        <div className={`flex flex-col ${!isEven ? "lg:order-2" : ""}`}>
          {/* Giant number — decorative anchor */}
          <div
            className={`text-[clamp(5rem,15vw,10rem)] font-black leading-none ${step.color} opacity-10 select-none mb-2 -ml-1`}
            aria-hidden
          >
            {step.number}
          </div>

          <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold text-white leading-[1.1] tracking-tight whitespace-pre-line mb-5">
            {step.title}
          </h2>

          <p className="text-base text-zinc-400 leading-relaxed mb-10 max-w-md">
            {step.desc}
          </p>

          {/* Feature grid — 2 columns, no icon boxes */}
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            {step.features.map((f) => (
              <li key={f.label} className="flex flex-col gap-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-white leading-snug">
                    {f.label}
                  </span>
                  {"count" in f && f.count != null && (
                    <span className={`text-[10px] font-black tabular-nums ${step.color}`}>
                      {f.count}
                    </span>
                  )}
                </div>
                <span className="text-xs text-zinc-600 leading-relaxed">
                  {f.sub}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Image column ── */}
        <div className={`${!isEven ? "lg:order-1" : ""}`}>
          <Image
            src={step.screenshot}
            alt={step.screenshotAlt}
            width={900}
            height={600}
            className="w-full h-auto"
          />
        </div>
      </div>
    </m.div>
  );
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export const HowItWorksPage = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-cyan-500/20 overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link href="/">
            <Image
              src="/images/longlightlogo.svg"
              alt="Riff Quest"
              width={120}
              height={32}
              className="h-6 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1 text-sm text-zinc-500 hover:text-white transition-colors"
            >
              <ChevronRight className="w-3 h-3 rotate-180" /> Back to home
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-white px-4 py-1.5 text-sm font-bold text-zinc-950 hover:bg-zinc-200 transition-colors"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-16 pb-16 px-6 lg:px-10 border-b border-white/5">
        <div className="mx-auto max-w-7xl">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8"
          >
            <div>
              <p className="text-xs font-black text-zinc-600 uppercase tracking-[0.35em] mb-4">
                How it works
              </p>
              <h1 className="text-[clamp(2rem,5vw,3.75rem)] font-bold text-white leading-[1.0] tracking-tight">
                Three steps.
                <br />
                <span className="text-zinc-500">Everything you need to know.</span>
              </h1>
            </div>

            <div className="flex flex-col gap-3 lg:items-end lg:pb-1">
              {[
                { n: "01", label: "Choose what to practice" },
                { n: "02", label: "Play & track automatically" },
                { n: "03", label: "See your progress" },
              ].map((item) => (
                <div key={item.n} className="flex items-center gap-3 text-sm">
                  <span className="text-[10px] font-black text-zinc-700 tabular-nums">{item.n}</span>
                  <span className="text-zinc-400">{item.label}</span>
                </div>
              ))}
            </div>
          </m.div>
        </div>
      </section>

      {/* ── Steps ── */}
      <section className="pb-32 px-6 lg:px-10">
        <div className="mx-auto max-w-7xl flex flex-col gap-28">
          {steps.map((step, i) => (
            <StepSection key={step.number} step={step} index={i} />
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="border-t border-white/5 py-28 px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <m.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10"
          >
            <div>
              <p className="text-xs font-black text-zinc-600 uppercase tracking-[0.35em] mb-6">
                Ready?
              </p>
              <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-bold text-white leading-[0.95] tracking-tight">
                Start tracking
                <br />
                <span className="text-zinc-500">your practice today.</span>
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 lg:pb-2">
              <Link
                href="/signup"
                className="flex items-center justify-center gap-2 rounded-md bg-white px-8 py-4 text-base font-bold text-zinc-950 hover:bg-zinc-200 transition-colors"
              >
                Try for free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/signup"
                className="flex items-center justify-center gap-2 rounded-md border border-white/10 px-8 py-4 text-base font-bold text-zinc-300 hover:text-white hover:border-white/20 transition-colors"
              >
                Start practicing
              </Link>
            </div>
          </m.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
