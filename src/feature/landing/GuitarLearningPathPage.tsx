import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { MarketingNav } from "components/MarketingNav/MarketingNav";
import { FaqSection } from "feature/landing/components/FaqSection";
import { Reveal } from "feature/landing/components/Reveal";
import {
  LEARNING_PATH_FAQS,
  LEARNING_PATH_MAP_ANCHOR,
  LEARNING_PATH_META,
  LEARNING_PATH_MODULE_COPY,
  LEARNING_PATH_ROUTES,
  type LearningPathTarget,
} from "feature/landing/data/learningPath";
import { jakartaLanding } from "feature/landing/lib/fonts";
import type {
  GuitarLearningPathPageProps,
  LearningPathModule,
  LearningPathStep,
} from "feature/landing/lib/learningPathProps";
import type { SignupCtaLocation } from "lib/signupFunnel";
import { trackSignupCtaClicked } from "lib/signupFunnel";
import {
  ArrowDown,
  ArrowRight,
  ChevronRight,
  ListChecks,
  Mic,
  MousePointerClick,
  Music,
} from "lucide-react";
import dynamic from "next/dynamic";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";
import type { ReactNode } from "react";

export type { GuitarLearningPathPageProps } from "feature/landing/lib/learningPathProps";

// Below-the-fold chrome loads on its own chunk, same as the other public pages.
const Footer = dynamic(() =>
  import("feature/landing/components/Footer").then((m) => m.Footer),
);
const CookieBanner = dynamic(
  () =>
    import("feature/landing/components/CookieBanner").then(
      (m) => m.CookieBanner,
    ),
  { ssr: false },
);

const IMAGES = "/images/learning-path";

/** Pass mark and star thresholds, as `accuracyToStars` grades an exam. */
export const LEARNING_PATH_STAR_LADDER = [
  { accuracy: 80, label: "Pass, one star" },
  { accuracy: 90, label: "Two stars" },
  { accuracy: 95, label: "Three stars" },
] as const;

const primaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 text-sm font-bold text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300 hover:bg-cyan-400";
const secondaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-zinc-800/60 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 hover:bg-zinc-800";

const trackLearningPathCta = (
  target: LearningPathTarget | "map",
  location: SignupCtaLocation,
) => {
  posthog.capture("learning_path_cta_clicked", {
    learning_path_target: target,
    cta_location: location,
    from_path: typeof window === "undefined" ? "" : window.location.pathname,
  });
  if (target !== "map") {
    trackSignupCtaClicked(location, { learning_path_target: target });
  }
};

const ProductLink = ({
  target,
  location,
  className,
  children,
}: {
  target: LearningPathTarget;
  location: SignupCtaLocation;
  className: string;
  children: ReactNode;
}) => (
  <Link
    href={LEARNING_PATH_ROUTES[target]}
    onClick={() => trackLearningPathCta(target, location)}
    className={className}>
    {children}
  </Link>
);

/** A screenshot that opens at full size in a new tab, so a phone reader can
 *  zoom into the labels instead of squinting at a narrow panel. */
const Screenshot = ({
  src,
  alt,
  width,
  height,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  priority?: boolean;
}) => (
  <a
    href={src}
    target='_blank'
    rel='noopener'
    aria-label={`${alt} (opens full size)`}
    className='block rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300'>
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      className='h-auto w-full rounded-lg'
    />
  </a>
);

const SectionIntro = ({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) => (
  <Reveal className='mb-12 max-w-2xl'>
    <p className='mb-2 text-sm font-bold text-cyan-400'>{eyebrow}</p>
    <h2 className='mb-5 font-landingHeading text-3xl font-bold tracking-tight text-white sm:text-4xl'>
      {title}
    </h2>
    {children && (
      <p className='text-lg leading-relaxed text-zinc-400'>{children}</p>
    )}
  </Reveal>
);

const STEP_KIND: Record<
  "checklist" | "song" | "click" | "listen",
  { icon: typeof Mic; label: string; tone: string }
> = {
  listen: {
    icon: Mic,
    label: "Exam graded by listening",
    tone: "text-cyan-400",
  },
  click: {
    icon: MousePointerClick,
    label: "Exam answered by clicking",
    tone: "text-purple-400",
  },
  checklist: { icon: ListChecks, label: "Checklist", tone: "text-zinc-400" },
  song: { icon: Music, label: "Pick a song", tone: "text-amber-400" },
};

const stepKindKey = (step: LearningPathStep) =>
  step.kind === "exam" ? (step.listens ? "listen" : "click") : step.kind;

const StepKindIcon = ({ step }: { step: LearningPathStep }) => {
  const kind = STEP_KIND[stepKindKey(step)];
  const Icon = kind.icon;
  return (
    <Icon
      className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${kind.tone}`}
      aria-label={kind.label}
    />
  );
};

const StageMap = ({ module }: { module: LearningPathModule }) => (
  <div>
    <div className='mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2'>
      <h3 className='text-2xl font-bold text-white'>{module.title}</h3>
      <p className='text-sm text-zinc-500'>
        {module.stages.length} stages · {module.stepCount} steps ·{" "}
        {module.examCount} exams
      </p>
    </div>
    <ol className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
      {module.stages.map((stage, idx) => (
        <li key={stage.id} className='rounded-lg bg-zinc-900/40 p-5'>
          <div className='mb-4 flex items-baseline gap-3'>
            <span className='font-teko text-2xl leading-none text-cyan-400'>
              {String(idx + 1).padStart(2, "0")}
            </span>
            <span className='font-semibold text-white'>{stage.label}</span>
          </div>
          <ol className='space-y-2'>
            {stage.steps.map((step) => (
              <li
                key={step.id}
                className='flex items-start gap-2.5 text-sm text-zinc-300'>
                <StepKindIcon step={step} />
                <span>{step.title}</span>
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  </div>
);

export const GuitarLearningPathPage = ({
  modules,
  planned,
  firstLesson,
}: GuitarLearningPathPageProps) => {
  const meta = LEARNING_PATH_META;
  const canonical = `https://riff.quest/${meta.slug}`;
  const ogImage = `https://riff.quest${meta.ogImage}`;
  const mapHref = `#${LEARNING_PATH_MAP_ANCHOR}`;

  const totalSteps = modules.reduce((sum, m) => sum + m.stepCount, 0);
  const totalExams = modules.reduce((sum, m) => sum + m.examCount, 0);
  const listeningModules = modules.filter((m) => m.listeningExamCount > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": canonical,
        url: canonical,
        name: meta.metaTitle,
        description: meta.metaDescription,
        primaryImageOfPage: { "@type": "ImageObject", url: ogImage },
        datePublished: meta.publishedAt,
        dateModified: meta.updatedAt,
        isPartOf: {
          "@type": "WebSite",
          name: "Riff Quest",
          url: "https://riff.quest",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://riff.quest",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Guitar learning path",
            item: canonical,
          },
        ],
      },
    ],
  };

  return (
    <>
      <Head>
        <title>{meta.metaTitle}</title>
        <meta name='description' content={meta.metaDescription} />
        <link rel='canonical' href={canonical} />
        <meta property='og:title' content={meta.metaTitle} />
        <meta property='og:description' content={meta.metaDescription} />
        <meta property='og:image' content={ogImage} />
        <meta property='og:type' content='website' />
        <meta property='og:url' content={canonical} />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={meta.metaTitle} />
        <meta name='twitter:description' content={meta.metaDescription} />
        <meta name='twitter:image' content={ogImage} />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <main
        className={`${jakartaLanding.variable} min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-300`}>
        <MarketingNav />

        {/* ── Hero ── */}
        <section className='relative overflow-hidden'>
          <div className='pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[140px]' />
          <GuitarPatternBackground opacity={0.02} />

          <div className='relative mx-auto max-w-7xl px-6 pb-20 pt-24'>
            <div className='mb-8 flex items-center gap-2 text-xs tracking-widest text-zinc-500'>
              <Link href='/' className='transition-colors hover:text-zinc-300'>
                Home
              </Link>
              <ChevronRight className='h-3 w-3' aria-hidden='true' />
              <span className='text-zinc-400'>Guitar learning path</span>
            </div>

            <div className='grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-center'>
              <header>
                <p className='mb-3 text-sm font-bold text-cyan-400'>
                  {meta.eyebrow}
                </p>
                <h1 className='mb-6 text-balance font-landingHeading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl'>
                  {meta.title}
                </h1>
                <p className='max-w-xl text-lg leading-relaxed text-zinc-400'>
                  Pick a module and the app hands you one step at a time: what
                  to play, what to watch out for, and an exam that tells you
                  when it&apos;s done. Pass it and the next step opens.
                </p>

                <div className='mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
                  <ProductLink
                    target='firstStage'
                    location='feature_hero'
                    className={primaryButton}>
                    See the first stage
                    <ArrowRight className='h-4 w-4' aria-hidden='true' />
                  </ProductLink>
                  <a
                    href={mapHref}
                    onClick={() => trackLearningPathCta("map", "feature_hero")}
                    className={secondaryButton}>
                    Every stage, step by step
                    <ArrowDown className='h-4 w-4' aria-hidden='true' />
                  </a>
                </div>

                <dl className='mt-12 flex flex-wrap gap-x-12 gap-y-6'>
                  {[
                    { value: modules.length, label: "modules live" },
                    { value: totalSteps, label: "steps" },
                    { value: totalExams, label: "exams" },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <dt className='sr-only'>{stat.label}</dt>
                      <dd className='font-teko text-5xl leading-none text-white'>
                        {stat.value}
                      </dd>
                      <dd className='mt-1 text-sm text-zinc-500'>
                        {stat.label}
                      </dd>
                    </div>
                  ))}
                </dl>
              </header>

              <div className='mx-auto w-full max-w-md'>
                <div className='max-h-[640px] overflow-hidden rounded-lg p-1.5 glass-card [mask-image:linear-gradient(to_bottom,black_80%,transparent)]'>
                  <Image
                    src={`${IMAGES}/fundamentals-path.webp`}
                    alt='The Guitar Fundamentals path: Before You Begin, First Melody and Quarter Notes completed with stars, String Crossing open next, Vibrato and Eighth Notes still locked'
                    width={780}
                    height={1280}
                    priority
                    sizes='(min-width: 1024px) 450px, 100vw'
                    className='h-auto w-full rounded-lg'
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How a step closes ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro
              eyebrow='How it works'
              title='Practise as long as you like. The exam decides.'>
              Every step has two buttons. Practice runs the exercise with no
              pressure and no marks. Exam runs it once at a locked tempo and
              grades it, and only a passed exam completes the step.
            </SectionIntro>

            <Reveal delay={0.05}>
              <ol className='grid gap-3 md:grid-cols-3'>
                {[
                  {
                    title: "Steps open in order",
                    text: "The first step of each module is open from day one. Every next step unlocks when the one before it is complete, so there is never a question of what comes next.",
                  },
                  {
                    title: "Practice is free play",
                    text: "Read the goal and the tips, then run the exercise as often as you need. Practice sessions log like any other session but never close the step.",
                  },
                  {
                    title: "An exam closes it",
                    text: "The exam plays at the tempo the step sets and scores your accuracy. Fail it and nothing is lost: practise more and retake it whenever you're ready.",
                  },
                ].map((item, idx) => (
                  <li
                    key={item.title}
                    className='rounded-lg bg-zinc-900/40 p-6'>
                    <span className='font-teko text-3xl leading-none text-cyan-400'>
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <h3 className='mb-2 mt-3 font-semibold text-white'>
                      {item.title}
                    </h3>
                    <p className='text-sm leading-relaxed text-zinc-400'>
                      {item.text}
                    </p>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal delay={0.1} className='mt-12 grid gap-10 lg:grid-cols-2'>
              <div>
                <h3 className='mb-4 text-lg font-bold text-white'>
                  What a pass takes
                </h3>
                <ol className='space-y-2'>
                  {LEARNING_PATH_STAR_LADDER.map((rung, idx) => (
                    <li
                      key={rung.accuracy}
                      className='flex items-center justify-between rounded-lg bg-zinc-900/40 px-5 py-4'>
                      <span className='text-sm text-zinc-300'>
                        {rung.label}
                      </span>
                      <span className='flex items-baseline gap-3'>
                        <span className='text-amber-400' aria-hidden='true'>
                          {"★".repeat(idx + 1)}
                          <span className='text-zinc-700'>
                            {"★".repeat(2 - idx)}
                          </span>
                        </span>
                        <span className='font-teko text-2xl leading-none text-white'>
                          {rung.accuracy}%+
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
                <p className='mt-4 text-sm leading-relaxed text-zinc-500'>
                  Below 80% the step stays open. A passed exam can be retaken
                  whenever you like.
                </p>
              </div>
              <div>
                <h3 className='mb-4 text-lg font-bold text-white'>
                  Steps without an exam
                </h3>
                <p className='leading-relaxed text-zinc-400'>
                  A few steps are not played. Each module opens with{" "}
                  <strong className='font-semibold text-zinc-200'>
                    Before You Begin
                  </strong>
                  , a short read and a checklist you tick to confirm you have
                  the basics. Guitar Fundamentals ends by asking you to pick
                  your first song, which goes onto your list of songs to learn.
                </p>
                <div className='mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-400'>
                  {Object.values(STEP_KIND).map((kind) => (
                    <span
                      key={kind.label}
                      className='inline-flex items-center gap-2'>
                      <kind.icon
                        className={`h-4 w-4 ${kind.tone}`}
                        aria-hidden='true'
                      />
                      {kind.label}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Stage map ── */}
        <section
          id={LEARNING_PATH_MAP_ANCHOR}
          className='scroll-mt-24 bg-zinc-900/30 py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro eyebrow='The map' title='Every stage, in order'>
              This is the real path, step for step. The icon says how each step
              is closed: an exam that listens to your guitar, an exam you answer
              by clicking the fretboard, or a checklist.
            </SectionIntro>
            <div className='space-y-16'>
              {modules.map((module) => (
                <Reveal key={module.id}>
                  <StageMap module={module} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── First lesson ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <div className='grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start'>
              <Reveal>
                <p className='mb-2 text-sm font-bold text-cyan-400'>
                  First lesson
                </p>
                <h2 className='mb-5 font-landingHeading text-3xl font-bold tracking-tight text-white sm:text-4xl'>
                  {firstLesson.title}
                </h2>
                <p className='text-lg leading-relaxed text-zinc-400'>
                  The first played step of {firstLesson.moduleTitle}.{" "}
                  {firstLesson.shortDescription}
                </p>

                <div className='mt-8 rounded-lg bg-zinc-900/40 p-5'>
                  <p className='mb-1 text-sm font-semibold text-white'>
                    The exam
                  </p>
                  <p className='text-sm leading-relaxed text-zinc-400'>
                    {firstLesson.examGoal}
                  </p>
                  {firstLesson.examBpm && (
                    <p className='mt-3 text-sm text-zinc-500'>
                      Tempo locked at{" "}
                      <span className='font-teko text-xl leading-none text-white'>
                        {firstLesson.examBpm} BPM
                      </span>
                    </p>
                  )}
                </div>

                <ul className='mt-6 space-y-4'>
                  {firstLesson.tips.map((tip) => (
                    <li key={tip.label}>
                      <p className='text-sm font-semibold text-zinc-200'>
                        {tip.label}
                      </p>
                      <p className='mt-1 text-sm leading-relaxed text-zinc-400'>
                        {tip.body}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className='mt-10'>
                  <ProductLink
                    target='firstStage'
                    location='feature_demo'
                    className={primaryButton}>
                    See the first stage
                    <ArrowRight className='h-4 w-4' aria-hidden='true' />
                  </ProductLink>
                </div>
              </Reveal>

              <Reveal delay={0.1} className='mx-auto w-full max-w-lg'>
                <Screenshot
                  src={`${IMAGES}/first-lesson.webp`}
                  alt={LEARNING_PATH_MODULE_COPY.fundamentals.image.alt}
                  width={577}
                  height={760}
                  sizes='(min-width: 1024px) 512px, 100vw'
                />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Modules: who for, what it takes ── */}
        <section className='bg-zinc-900/30 py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro eyebrow='The modules' title='Who each module is for'>
              Both live modules are open from the start. Take one, or run them
              side by side.
            </SectionIntro>

            <div className='space-y-20'>
              {modules.map((module, idx) => {
                const copy = LEARNING_PATH_MODULE_COPY[module.id];
                const clickExams = module.examCount - module.listeningExamCount;
                return (
                  <Reveal
                    key={module.id}
                    className='grid gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-start'>
                    <div className={idx % 2 === 1 ? "lg:order-2" : ""}>
                      <h3 className='font-landingHeading text-3xl font-bold tracking-tight text-white'>
                        {module.title}
                      </h3>
                      <p className='mt-2 text-zinc-500'>{module.subtitle}</p>

                      <dl className='mt-8 space-y-6'>
                        <div>
                          <dt className='text-sm font-semibold text-white'>
                            Who it&apos;s for
                          </dt>
                          <dd className='mt-1 leading-relaxed text-zinc-400'>
                            {copy?.forWho}
                          </dd>
                        </div>
                        <div>
                          <dt className='text-sm font-semibold text-white'>
                            Where it takes you
                          </dt>
                          <dd className='mt-1 leading-relaxed text-zinc-400'>
                            {copy?.outcome}
                          </dd>
                        </div>
                        <div>
                          <dt className='text-sm font-semibold text-white'>
                            What you need on day one
                          </dt>
                          <dd>
                            <ul className='mt-2 space-y-1.5'>
                              {module.entryChecklist.map((item) => (
                                <li
                                  key={item}
                                  className='flex gap-2.5 text-sm text-zinc-400'>
                                  <ListChecks
                                    className='mt-0.5 h-4 w-4 shrink-0 text-emerald-400'
                                    aria-hidden='true'
                                  />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </dd>
                        </div>
                        <div>
                          <dt className='text-sm font-semibold text-white'>
                            Microphone
                          </dt>
                          <dd className='mt-1 leading-relaxed text-zinc-400'>
                            {module.listeningExamCount === module.examCount
                              ? `Needed for all ${module.examCount} exams: each one listens to you play.`
                              : `Not needed for ${clickExams} of the ${module.examCount} exams, which you answer by clicking the fretboard. The ${module.listeningExamCount} exams in ${module.listeningStages.join(", ")} listen to you play, so those need a microphone or an audio interface.`}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className='mx-auto w-full max-w-md'>
                      {copy && (
                        <div className='max-h-[620px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_85%,transparent)]'>
                          <Screenshot
                            src={copy.image.src}
                            alt={copy.image.alt}
                            width={copy.image.width}
                            height={copy.image.height}
                            sizes='(min-width: 1024px) 448px, 100vw'
                          />
                        </div>
                      )}
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Mic & detection ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro
              eyebrow='Requirements'
              title='When the app has to hear you'>
              Everywhere else in the app, detection is optional and you can skip
              the microphone prompt. Learning Path exams that grade your playing
              are the exception: the app can&apos;t mark what it can&apos;t
              hear, so they don&apos;t start without it.
            </SectionIntro>

            <Reveal delay={0.05} className='grid gap-10 lg:grid-cols-2'>
              <ul className='space-y-2'>
                {listeningModules.map((module) => (
                  <li
                    key={module.id}
                    className='flex items-start gap-4 rounded-lg bg-zinc-900/40 p-5'>
                    <Mic
                      className='mt-0.5 h-5 w-5 shrink-0 text-cyan-400'
                      aria-hidden='true'
                    />
                    <div>
                      <p className='font-semibold text-white'>{module.title}</p>
                      <p className='mt-1 text-sm leading-relaxed text-zinc-400'>
                        {module.listeningExamCount === module.examCount
                          ? `All ${module.examCount} exams listen.`
                          : `${module.listeningExamCount} of ${module.examCount} exams listen, all in ${module.listeningStages.join(", ")}.`}
                      </p>
                    </div>
                  </li>
                ))}
                <li className='flex items-start gap-4 rounded-lg bg-zinc-900/40 p-5'>
                  <MousePointerClick
                    className='mt-0.5 h-5 w-5 shrink-0 text-purple-400'
                    aria-hidden='true'
                  />
                  <div>
                    <p className='font-semibold text-white'>
                      Practice mode, checklists and click exams
                    </p>
                    <p className='mt-1 text-sm leading-relaxed text-zinc-400'>
                      No microphone needed. Practice runs with detection off if
                      you skip the prompt.
                    </p>
                  </div>
                </li>
              </ul>

              <div>
                <h3 className='mb-4 text-lg font-bold text-white'>
                  What detection needs
                </h3>
                <ol className='space-y-4'>
                  {[
                    {
                      title: "A microphone or an audio interface",
                      text: "A laptop microphone works for these drills. An interface is cleaner and quieter, and the desktop app is faster still.",
                    },
                    {
                      title: "Browser access to it",
                      text: "The browser asks once. Say yes, or nothing downstream works.",
                    },
                    {
                      title: "A one-time calibration",
                      text: "Set the input level, then play each of the six strings so the app learns how your guitar sits against concert pitch.",
                    },
                    {
                      title: "A tuned guitar and a quiet room",
                      text: "Detection compares what it hears with the note it expects. Headphones keep a backing track or amp out of the reading.",
                    },
                  ].map((item, idx) => (
                    <li key={item.title} className='flex gap-4'>
                      <span className='w-7 shrink-0 font-teko text-2xl leading-none text-zinc-600'>
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className='font-semibold text-zinc-200'>
                          {item.title}
                        </p>
                        <p className='mt-1 text-sm leading-relaxed text-zinc-400'>
                          {item.text}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
                <Link
                  href='/wiki/note-detection'
                  className='mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-cyan-400 transition-colors hover:text-cyan-300'>
                  Mic setup and calibration, step by step
                  <ArrowRight className='h-3.5 w-3.5' aria-hidden='true' />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Live vs planned, reward ── */}
        <section className='bg-zinc-900/30 py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro
              eyebrow='What exists today'
              title='Two modules live, three on the way'>
              The live modules are complete, start to finish. The planned ones
              are topics we&apos;re building next, and aren&apos;t playable yet.
            </SectionIntro>

            <Reveal delay={0.05} className='grid gap-10 lg:grid-cols-2'>
              <div className='space-y-8'>
                <div>
                  <h3 className='mb-3 text-sm font-semibold text-emerald-400'>
                    Live now
                  </h3>
                  <ul className='space-y-2'>
                    {modules.map((module) => (
                      <li
                        key={module.id}
                        className='flex items-center justify-between gap-4 rounded-lg bg-zinc-900/60 px-5 py-4'>
                        <div>
                          <p className='font-semibold text-white'>
                            {module.title}
                          </p>
                          <p className='text-sm text-zinc-500'>
                            {module.subtitle}
                          </p>
                        </div>
                        <span className='shrink-0 text-sm tabular-nums text-zinc-400'>
                          {module.stepCount} steps
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className='mb-3 text-sm font-semibold text-zinc-500'>
                    Planned
                  </h3>
                  <ul className='space-y-2'>
                    {planned.map((module) => (
                      <li
                        key={module.id}
                        className='rounded-lg bg-zinc-900/30 px-5 py-4'>
                        <p className='font-semibold text-zinc-400'>
                          {module.title}
                        </p>
                        <p className='text-sm text-zinc-600'>
                          {module.subtitle}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className='flex flex-col gap-8 sm:flex-row sm:items-start lg:flex-col xl:flex-row'>
                <div className='mx-auto w-full max-w-[280px] shrink-0'>
                  <Image
                    src={`${IMAGES}/module-reward.webp`}
                    alt='The reward at the end of Guitar Fundamentals: the RPS Osprey Custom guitar, a free case, 200 Fame and two Epic parts'
                    width={384}
                    height={455}
                    sizes='280px'
                    className='h-auto w-full rounded-lg'
                  />
                </div>
                <div>
                  <h3 className='mb-3 text-lg font-bold text-white'>
                    Finish a module, keep the guitar
                  </h3>
                  <p className='mb-5 leading-relaxed text-zinc-400'>
                    Complete every step and a reward waits at the end of the
                    path, headed by a trophy guitar for your collection. Open it
                    and claim it.
                  </p>
                  <ul className='space-y-3'>
                    {modules.map((module) => (
                      <li key={module.id} className='text-sm'>
                        <p className='font-semibold text-zinc-200'>
                          {module.title}
                        </p>
                        <p className='mt-0.5 text-zinc-400'>
                          {[
                            module.reward.guitar &&
                              `${module.reward.guitar} (${module.reward.guitarRarity})`,
                            `${module.reward.fame} Fame`,
                            module.reward.caseTokens > 0 &&
                              `${module.reward.caseTokens} free case`,
                            ...module.reward.parts.map(
                              (part) =>
                                `${part.qty} ${part.tier} part${part.qty > 1 ? "s" : ""}`,
                            ),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1} className='mt-12'>
              <Screenshot
                src={`${IMAGES}/modules.webp`}
                alt='The Learning path screen in Riff Quest: Guitar Fundamentals at 3 of 13 steps with Continue, Fretboard Mastery at 0 of 23, and a note that Rhythm, Scales & Modes and Improvisation are coming next'
                width={742}
                height={384}
                sizes='(min-width: 768px) 742px, 100vw'
              />
            </Reveal>
          </div>
        </section>

        <FaqSection
          questions={LEARNING_PATH_FAQS}
          moreLink={{
            intro:
              "Unlock rules, the Scale Map and what happens after a failed exam are covered in the knowledge base:",
            href: "/wiki/journey-and-scale-tree",
            label: "How the Learning Path works",
          }}
        />

        {/* ── Where next ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <Reveal>
              <h2 className='mb-8 text-2xl font-bold text-white'>
                Rather set your own order?
              </h2>
              <div className='grid gap-6 sm:grid-cols-3'>
                {[
                  {
                    href: "/guitar-practice-planner",
                    title: "Guitar practice planner",
                    text: "Ready-made routines, your own plan or Auto Plan, when you already know what you want to work on.",
                  },
                  {
                    href: "/interactive-guitar-practice",
                    title: "Interactive guitar practice",
                    text: "What an exam feels like from the inside: the tab scrolls and every note you hit is marked live.",
                  },
                  {
                    href: "/daily-guitar-practice-plan",
                    title: "Daily guitar practice plan guide",
                    text: "15, 30 and 60-minute routines with example exercises and advice on what to play each day.",
                  },
                ].map((card) => (
                  <Link key={card.href} href={card.href}>
                    <div className='group h-full cursor-pointer rounded-lg bg-zinc-900/40 p-6 transition-colors hover:bg-zinc-900/60'>
                      <h3 className='mb-2 text-lg font-bold text-white transition-colors group-hover:text-cyan-400'>
                        {card.title}
                      </h3>
                      <p className='mb-4 text-sm leading-relaxed text-zinc-400'>
                        {card.text}
                      </p>
                      <span className='inline-flex items-center gap-1 text-xs font-semibold text-cyan-400'>
                        Open
                        <ArrowRight className='h-3 w-3' aria-hidden='true' />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className='relative overflow-hidden bg-zinc-950 py-28'>
          <div className='absolute inset-0 z-0 overflow-hidden'>
            <GuitarPatternBackground opacity={0.02} />
          </div>
          <div className='relative z-10 mx-auto max-w-7xl px-6 lg:px-8'>
            <div className='flex flex-col items-center text-center'>
              <h2 className='mb-8 max-w-3xl font-landingHeading text-4xl font-extrabold leading-tight tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl'>
                Stop guessing what to practise.
              </h2>
              <div className='flex flex-col items-center gap-3 sm:flex-row'>
                <ProductLink
                  target='firstStage'
                  location='feature_final'
                  className={primaryButton}>
                  See the first stage
                  <ArrowRight className='h-4 w-4' aria-hidden='true' />
                </ProductLink>
                <ProductLink
                  target='fretboard'
                  location='feature_final'
                  className={secondaryButton}>
                  Start with the fretboard
                </ProductLink>
              </div>
              <p className='mt-6 text-sm text-zinc-500'>
                Free account, no card. Signed in already? The buttons take you
                straight to the path.
              </p>
            </div>
          </div>
        </section>

        <Footer />
        <CookieBanner />
      </main>
    </>
  );
};
