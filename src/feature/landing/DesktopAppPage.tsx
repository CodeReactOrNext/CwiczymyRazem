import { cn } from "assets/lib/utils";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { MarketingNav } from "components/MarketingNav/MarketingNav";
import { AppWindow } from "feature/landing/components/desktopApp/AppWindow";
import { LatencyRace } from "feature/landing/components/desktopApp/LatencyRace";
import { VstRackDemo } from "feature/landing/components/desktopApp/VstRackDemo";
import { FaqSection } from "feature/landing/components/FaqSection";
import { FeatureList } from "feature/landing/components/FeatureList";
import { Reveal } from "feature/landing/components/Reveal";
import {
  DESKTOP_APP_DOWNLOAD_ANCHOR,
  DESKTOP_APP_DROPOUT_BENCH,
  DESKTOP_APP_EXTRAS,
  DESKTOP_APP_FAQS,
  DESKTOP_APP_FIT,
  DESKTOP_APP_INPUT_PARTS,
  DESKTOP_APP_LATENCY,
  DESKTOP_APP_META,
  DESKTOP_APP_ROUTES,
} from "feature/landing/data/desktopApp";
import type {
  DesktopAppPageProps,
  DesktopDownload,
} from "feature/landing/lib/desktopAppProps";
import { jakartaLanding } from "feature/landing/lib/fonts";
import { AUTHORS } from "lib/authors";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronRight,
  Minus,
} from "lucide-react";
import dynamic from "next/dynamic";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";
import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
import type { IconType } from "react-icons";
import { FaApple, FaLinux, FaWindows } from "react-icons/fa6";
import type { DesktopPlatform } from "utils/desktopRelease";

export type { DesktopAppPageProps } from "feature/landing/lib/desktopAppProps";

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

const IMAGES = "/images/desktop-app";

export const DESKTOP_APP_AUTHOR = AUTHORS["Michael Apfel"];

export const PLATFORM_COPY: Record<
  DesktopPlatform,
  { name: string; build: string; file: string }
> = {
  win32: { name: "Windows", build: "64-bit", file: "Installer (.exe)" },
  darwin: {
    name: "macOS",
    build: "Apple Silicon (M1 and newer)",
    file: "Disk image (.dmg)",
  },
  linux: { name: "Linux", build: "64-bit", file: "AppImage" },
};

/** The systems' own marks, so a download reads at a glance. */
const PLATFORM_ICON: Record<DesktopPlatform, IconType> = {
  win32: FaWindows,
  darwin: FaApple,
  linux: FaLinux,
};

const PlatformIcon = ({
  platform,
  className,
}: {
  platform: DesktopPlatform;
  className?: string;
}) => {
  const Icon = PLATFORM_ICON[platform];
  return <Icon className={className} aria-hidden='true' />;
};

const primaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-200";
const secondaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-zinc-800/60 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 hover:bg-zinc-800";

/** The visitor's system, from the user agent; null on the server and on phones. */
const readPlatform = (): DesktopPlatform | null => {
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return null;
  if (/Windows/i.test(ua)) return "win32";
  if (/Macintosh|Mac OS X/i.test(ua)) return "darwin";
  if (/Linux/i.test(ua)) return "linux";
  return null;
};
const noSubscribe = () => () => undefined;
const useVisitorPlatform = () =>
  useSyncExternalStore(noSubscribe, readPlatform, () => null);

const trackDownload = (platform: DesktopPlatform, location: string) => {
  posthog.capture("desktop_app_download_clicked", {
    platform,
    cta_location: location,
    from_path: typeof window === "undefined" ? "" : window.location.pathname,
  });
};

/** The hero's main button: straight to the right installer once we know the system. */
const DownloadButton = ({
  downloads,
  location,
}: {
  downloads: DesktopDownload[];
  location: string;
}) => {
  const platform = useVisitorPlatform();
  const match = downloads.find((entry) => entry.platform === platform);

  if (!match) {
    return (
      <a href={`#${DESKTOP_APP_DOWNLOAD_ANCHOR}`} className={primaryButton}>
        Download the app
        <ArrowDown className='h-4 w-4' aria-hidden='true' />
      </a>
    );
  }
  return (
    <a
      href={match.url}
      onClick={() => trackDownload(match.platform, location)}
      className={primaryButton}>
      <PlatformIcon platform={match.platform} className='h-4 w-4' />
      Download for {PLATFORM_COPY[match.platform].name}
      <ArrowDown className='h-4 w-4' aria-hidden='true' />
    </a>
  );
};

const DownloadCard = ({ download }: { download: DesktopDownload }) => {
  const platform = useVisitorPlatform();
  const copy = PLATFORM_COPY[download.platform];
  const isVisitor = platform === download.platform;
  const meta = [
    download.version && `v${download.version}`,
    download.sizeMb && `${download.sizeMb} MB`,
    download.releaseDate,
  ].filter(Boolean);

  return (
    <li
      className={cn(
        "flex flex-col gap-6 rounded-lg p-6 transition-colors",
        isVisitor ? "bg-zinc-800/60" : "bg-zinc-900/40",
      )}>
      <div>
        <div className='flex items-baseline justify-between gap-3'>
          <h3 className='flex items-center gap-3 text-xl font-bold text-white'>
            <PlatformIcon
              platform={download.platform}
              className={cn(
                "h-6 w-6",
                isVisitor ? "text-white" : "text-zinc-400",
              )}
            />
            {copy.name}
          </h3>
          {isVisitor && (
            <span className='text-xs font-semibold text-cyan-400'>
              Your system
            </span>
          )}
        </div>
        <p className='mt-1 text-sm text-zinc-400'>{copy.build}</p>
        <p className='mt-4 text-sm text-zinc-500'>
          {copy.file}
          {meta.length > 0 && (
            <span className='tabular-nums'> · {meta.join(" · ")}</span>
          )}
        </p>
      </div>
      <a
        href={download.url}
        onClick={() => trackDownload(download.platform, "feature_downloads")}
        className={cn(
          "mt-auto",
          isVisitor ? primaryButton : secondaryButton,
          "justify-center",
        )}>
        {download.version ? "Download" : "Open the releases page"}
        <ArrowDown className='h-4 w-4' aria-hidden='true' />
      </a>
    </li>
  );
};

const SectionIntro = ({
  eyebrow,
  title,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  className?: string;
}) => (
  <Reveal className={cn("mb-12 max-w-2xl", className)}>
    <p className='mb-2 text-sm font-bold text-cyan-400'>{eyebrow}</p>
    <h2 className='mb-5 font-landingHeading text-3xl font-bold tracking-tight text-white sm:text-4xl'>
      {title}
    </h2>
    {children && (
      <p className='text-lg leading-relaxed text-zinc-400'>{children}</p>
    )}
  </Reveal>
);

export const DesktopAppPage = ({ downloads }: DesktopAppPageProps) => {
  const meta = DESKTOP_APP_META;
  const author = DESKTOP_APP_AUTHOR;
  const canonical = `https://riff.quest/${meta.slug}`;
  const ogImage = `https://riff.quest${meta.ogImage}`;
  const version = downloads.find((entry) => entry.version)?.version;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Riff Quest",
        applicationCategory: "MusicApplication",
        operatingSystem: "Windows, macOS (Apple Silicon), Linux",
        ...(version ? { softwareVersion: version } : {}),
        downloadUrl: `${canonical}#${DESKTOP_APP_DOWNLOAD_ANCHOR}`,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        image: ogImage,
        url: canonical,
      },
      {
        "@type": "WebPage",
        "@id": canonical,
        url: canonical,
        name: meta.metaTitle,
        description: meta.metaDescription,
        primaryImageOfPage: { "@type": "ImageObject", url: ogImage },
        datePublished: meta.publishedAt,
        dateModified: meta.updatedAt,
        author: {
          "@type": "Person",
          name: author.name,
          description: author.bio,
          image: `https://riff.quest${author.image}`,
        },
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
            name: "Desktop app",
            item: canonical,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: DESKTOP_APP_FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.title,
          acceptedAnswer: { "@type": "Answer", text: faq.message },
        })),
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
        className={`${jakartaLanding.variable} min-h-screen overflow-x-clip bg-zinc-950 text-zinc-300`}>
        <MarketingNav />

        {/* ── Hero ── */}
        <section className='relative overflow-hidden'>
          <GuitarPatternBackground opacity={0.02} />

          <div className='relative mx-auto max-w-7xl px-6 pb-20 pt-24'>
            <div className='mb-8 flex items-center gap-2 text-xs tracking-widest text-zinc-500'>
              <Link href='/' className='transition-colors hover:text-zinc-300'>
                Home
              </Link>
              <ChevronRight className='h-3 w-3' aria-hidden='true' />
              <span className='text-zinc-400'>Desktop app</span>
            </div>

            <div className='grid gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center'>
              <header>
                <p className='mb-3 text-sm font-bold text-cyan-400'>
                  {meta.eyebrow}
                </p>
                <h1 className='mb-6 text-balance font-landingHeading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl'>
                  {meta.title}
                </h1>
                <p className='max-w-xl text-lg leading-relaxed text-zinc-400'>
                  Riff Quest for Windows, macOS and Linux reads your audio
                  interface through its own driver instead of the browser&apos;s
                  microphone. Notes register sooner, the input stays steady, and
                  you can practise through an amp, your NAM captures and your
                  plugins.
                </p>

                <div className='mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
                  <DownloadButton
                    downloads={downloads}
                    location='feature_hero'
                  />
                  <a
                    href={`#${DESKTOP_APP_DOWNLOAD_ANCHOR}`}
                    className={secondaryButton}>
                    Every system
                  </a>
                </div>
                <ul
                  className='mt-6 flex items-center gap-5 text-zinc-500'
                  aria-label='Available for Windows, macOS and Linux'>
                  {(["win32", "darwin", "linux"] as const).map((platform) => (
                    <li
                      key={platform}
                      className='flex items-center gap-2 text-sm'>
                      <PlatformIcon platform={platform} className='h-4 w-4' />
                      {PLATFORM_COPY[platform].name}
                    </li>
                  ))}
                </ul>
                <p className='mt-4 max-w-md text-sm text-zinc-500'>
                  Free with your Riff Quest account
                  {version && (
                    <span className='tabular-nums'> · v{version}</span>
                  )}
                  . Same progress as the browser.
                </p>
              </header>

              <AppWindow
                src={`${IMAGES}/tone-studio.webp`}
                alt='Tone Studio in the Riff Quest desktop app: the Crunch Rock preset loaded, the signal chain Gate, Overdrive, Amp, Cabinet and Delay along the top, and the classic amp head with preamp, bass, mid, treble and drive knobs'
                width={1600}
                height={1206}
              />
            </div>
          </div>
        </section>

        {/* ── Input ── */}
        <section className='py-20'>
          <div className='mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-start lg:gap-16'>
            <div>
              <SectionIntro
                eyebrow='Guitar input'
                title='A browser is a bad place to plug a guitar into'>
                In a tab, your guitar reaches Riff Quest through the system
                mixer and the browser&apos;s microphone code, which were built
                for video calls. The desktop app skips all of it.
              </SectionIntro>
              <Reveal delay={0.05}>
                <FeatureList features={[...DESKTOP_APP_INPUT_PARTS]} />
                <p className='mt-8 text-sm leading-relaxed text-zinc-500'>
                  These latency figures were measured on one Windows computer
                  with an audio interface on its ASIO driver. Yours depend on
                  the interface and the buffer you pick.
                </p>
              </Reveal>
            </div>
            <Reveal delay={0.1} className='lg:pt-24'>
              <LatencyRace
                desktop={{
                  label: "Desktop app",
                  ms: DESKTOP_APP_LATENCY.desktopMs,
                  stops: DESKTOP_APP_ROUTES.desktop,
                }}
                browser={{
                  label: "Browser",
                  ms: DESKTOP_APP_LATENCY.browserMs,
                  stops: DESKTOP_APP_ROUTES.browser,
                }}
              />
            </Reveal>
          </div>
        </section>

        {/* ── Steadiness ── */}
        <section className='bg-zinc-900/30 py-20'>
          <div className='mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-center lg:gap-16'>
            <SectionIntro
              className='mb-0'
              eyebrow='Steady input'
              title='Sound that does not wait for the screen'>
              The audio engine runs in a process of its own. Whatever the window
              is doing, drawing a long tab or loading the next exercise, the
              sound is handled first.
            </SectionIntro>
            <Reveal delay={0.05}>
              <p className='mb-4 text-sm text-zinc-400'>
                Dropouts in ten seconds of audio at{" "}
                {DESKTOP_APP_DROPOUT_BENCH.bufferFrames} samples, with the app
                deliberately kept busy:
              </p>
              <div className='grid grid-cols-2 gap-3'>
                <div className='rounded-lg bg-zinc-900/60 p-5'>
                  <p className='font-teko text-5xl tabular-nums leading-none text-zinc-400'>
                    {DESKTOP_APP_DROPOUT_BENCH.sharedProcess}
                  </p>
                  <p className='mt-2 text-sm text-zinc-500'>
                    Audio sharing a process with the window
                  </p>
                </div>
                <div className='rounded-lg bg-zinc-900/60 p-5'>
                  <p className='font-teko text-5xl tabular-nums leading-none text-white'>
                    {DESKTOP_APP_DROPOUT_BENCH.ownProcess}
                  </p>
                  <p className='mt-2 text-sm text-zinc-500'>
                    Audio in its own process, as the app ships
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Tone Studio ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro
              eyebrow='Tone Studio'
              title='Practise through an amp, not a dry signal'>
              Plug straight into the interface and hear yourself through an amp,
              a cabinet and a couple of pedals while the exercise runs. Tone
              Studio exists only in the desktop app, because only the desktop
              app can play your guitar back without a noticeable delay.
            </SectionIntro>

            <div className='grid gap-12 lg:grid-cols-2 lg:gap-16'>
              <Reveal>
                <h3 className='mb-3 text-xl font-bold text-white'>
                  Your captures, your cabinets
                </h3>
                <p className='leading-relaxed text-zinc-400'>
                  The amp has two engines. Classic is a preamp, tone stack and
                  power section you dial in with five knobs. Neural capture
                  loads a NAM file, a model of a real amp made with the open
                  source Neural Amp Modeler, and plays it with the same core
                  that project uses. Swap the built-in cabinet for any impulse
                  response you own, and save the whole chain as a preset.
                </p>
              </Reveal>
              <Reveal delay={0.05}>
                <h3 className='mb-3 text-xl font-bold text-white'>
                  Or bring your plugins
                </h3>
                <p className='mb-6 leading-relaxed text-zinc-400'>
                  Switch Tone Studio to its VST mode and build a rack from the
                  VST3 plugins you already own: any order, the same plugin twice
                  if you like, each opening its own window. On Windows and Apple
                  Silicon Macs.
                </p>
                <VstRackDemo />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Extras ── */}
        <section className='bg-zinc-900/30 py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro
              eyebrow='The small things'
              title='Built for an hour with a guitar in your hands'
            />
            <Reveal delay={0.05}>
              <FeatureList features={[...DESKTOP_APP_EXTRAS]} layout='row' />
            </Reveal>
          </div>
        </section>

        {/* ── Is it for you ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro eyebrow='Honestly' title='Do you need it?'>
              Riff Quest runs fine in a browser, and nothing about practising,
              logging or ranking needs the app.
            </SectionIntro>
            <Reveal delay={0.05}>
              <ul className='grid gap-3 md:grid-cols-2'>
                {DESKTOP_APP_FIT.map((row) => (
                  <li
                    key={row.who}
                    className='flex items-start gap-4 rounded-lg bg-zinc-900/40 p-5'>
                    {row.fits ? (
                      <Check
                        className='mt-0.5 h-5 w-5 shrink-0 text-emerald-400'
                        aria-label='Worth it'
                      />
                    ) : (
                      <Minus
                        className='mt-0.5 h-5 w-5 shrink-0 text-zinc-500'
                        aria-label='Not needed'
                      />
                    )}
                    <div>
                      <p className='font-semibold text-white'>{row.who}</p>
                      <p className='mt-1 text-sm text-zinc-400'>
                        {row.verdict}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* ── Downloads ── */}
        <section
          id={DESKTOP_APP_DOWNLOAD_ANCHOR}
          className='scroll-mt-16 bg-zinc-900/30 py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro eyebrow='Download' title='Pick your system'>
              One file each, from the latest release. Sign in with your Riff
              Quest account once it opens.
            </SectionIntro>
            <Reveal delay={0.05}>
              <ul className='grid gap-4 md:grid-cols-3'>
                {downloads.map((download) => (
                  <DownloadCard key={download.platform} download={download} />
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.1} className='mt-10 grid gap-8 md:grid-cols-2'>
              <div>
                <h3 className='mb-2 font-semibold text-white'>
                  The first launch asks once
                </h3>
                <p className='text-sm leading-relaxed text-zinc-400'>
                  The builds are not signed with a paid certificate yet. On
                  Windows, SmartScreen stops the installer: choose More info,
                  then Run anyway. On a Mac, right-click the app and choose
                  Open, then allow the microphone when asked, or the app hears
                  nothing.
                </p>
              </div>
              <div>
                <h3 className='mb-2 font-semibold text-white'>
                  After that, it updates itself
                </h3>
                <p className='text-sm leading-relaxed text-zinc-400'>
                  New versions download in the background and you restart into
                  them when it suits you. There is no Intel Mac build; on an
                  Intel Mac, Riff Quest in the browser does everything except
                  Tone Studio.
                </p>
                <Link
                  href='/wiki/desktop-app'
                  className='mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-cyan-400 transition-colors hover:text-cyan-300'>
                  Install and set up, step by step
                  <ArrowRight className='h-3.5 w-3.5' aria-hidden='true' />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Why I built it ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-3xl px-6'>
            <Reveal>
              <p className='mb-2 text-sm font-bold text-cyan-400'>
                Why it exists
              </p>
              <h2 className='mb-8 font-landingHeading text-3xl font-bold tracking-tight text-white sm:text-4xl'>
                I could feel the gap
              </h2>
              <div className='space-y-5 text-lg leading-relaxed text-zinc-400'>
                <p>
                  I practise with the guitar plugged into an audio interface,
                  and in the browser I could feel it: the note on screen lit up
                  a moment after my fingers had already moved on. Calibration
                  takes the offset out of the scoring, but it cannot make the
                  app feel immediate.
                </p>
                <p>
                  So the desktop app goes around the browser. It opens the
                  interface through its driver, the way recording software does,
                  and keeps the audio in a process of its own so nothing on
                  screen can interrupt it. Once the sound was in there, an amp
                  to practise through was the obvious next step, and then the
                  plugins I already owned.
                </p>
                <p>
                  It is still the same Riff Quest. If you play an acoustic into
                  a laptop, the browser is honestly fine, and I would rather
                  tell you that than have you install something you do not need.
                </p>
              </div>
              <div className='mt-10 flex items-center gap-4'>
                <Image
                  src={author.image}
                  alt={author.name}
                  width={56}
                  height={56}
                  className='h-14 w-14 shrink-0 rounded-full object-cover'
                />
                <div>
                  <p className='font-semibold text-white'>{author.name}</p>
                  <p className='text-sm text-zinc-500'>{author.role}</p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <FaqSection
          questions={DESKTOP_APP_FAQS}
          moreLink={{
            intro:
              "Which file to pick, the first-launch warnings and the input settings are covered in the knowledge base:",
            href: "/wiki/desktop-app",
            label: "The desktop app, step by step",
          }}
        />

        {/* ── Where next ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <Reveal>
              <h2 className='mb-8 text-2xl font-bold text-white'>
                What the app is listening for
              </h2>
              <div className='grid gap-6 sm:grid-cols-3'>
                {[
                  {
                    href: "/interactive-guitar-practice",
                    title: "Interactive guitar practice",
                    text: "The tab scrolls and every note you hit is marked live. The desktop app is where this feels quickest.",
                  },
                  {
                    href: "/features/guitar-learning-path",
                    title: "Guitar learning path",
                    text: "Step-by-step modules whose exams listen to you play, from first melody to the whole fretboard.",
                  },
                  {
                    href: "/features/guitar-roadmap",
                    title: "Guitar roadmap for your goal",
                    text: "Phases and steps written around the player you want to be, each with something to play.",
                  },
                ].map((card) => (
                  <Link
                    key={card.href}
                    href={card.href}
                    className='group h-full rounded-lg bg-zinc-900/40 p-6 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 hover:bg-zinc-900/60'>
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
                Plug in. Play. It hears you.
              </h2>
              <DownloadButton downloads={downloads} location='feature_final' />
              <p className='mt-6 max-w-md text-sm text-zinc-500'>
                No account yet?{" "}
                <Link
                  href='/signup'
                  className='font-semibold text-zinc-300 transition-colors hover:text-white'>
                  Create one free
                </Link>
                , then sign in inside the app.
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
