import { cn } from "assets/lib/utils";
import { Footer } from "feature/landing/components/Footer";
import { TunerPanel } from "feature/tuner/components/TunerPanel";
import {
  DEFAULT_INSTRUMENT_ID,
  DEFAULT_TUNING_ID,
  getInstrument,
  getTuning,
} from "feature/tuner/instruments";
import { ChevronRight } from "lucide-react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

const siteUrl = "https://riff.quest/tools/tuner";

const TITLE = "Online Guitar Tuner — Free Mic Tuner for Guitar, Bass & Ukulele";
const DESCRIPTION =
  "Free online guitar tuner that listens through your microphone. Standard, Drop D, Open G, DADGAD and half step down, plus bass, ukulele, mandolin and banjo tunings, with the needle reading in cents.";

const STEPS = [
  {
    name: "Pick your instrument and tuning",
    text: "Choose electric or acoustic guitar, bass, ukulele, mandolin or banjo, then the tuning you want — Standard, Drop D, Open G, DADGAD or half step down. The tuner targets the open strings of that tuning, so a Drop D player tunes the 6th string to D2 rather than to a very flat E2.",
  },
  {
    name: "Turn on the microphone",
    text: "Press the microphone button and allow access when the browser asks. Nothing is recorded or uploaded — the pitch is worked out in the page and thrown away.",
  },
  {
    name: "Play one open string",
    text: "Start with the thickest string and play it on its own, without fretting anything. The tuner picks the open string your note is closest to and names it.",
  },
  {
    name: "Read the needle",
    text: "The needle left of centre means the string is flat and has to come up; right of centre means it is sharp and has to come down. The number underneath is the distance in cents — a hundredth of a semitone.",
  },
  {
    name: "Turn the peg slowly",
    text: "Small movements. If the string is sharp, drop below the note and come back up into it: finishing on a rising turn takes the slack out of the peg and holds the tuning longer.",
  },
  {
    name: "Hold it, then move on",
    text: "Keep the note inside the green zone for about a second and the string is marked green. Work through every string, then play the first one again — tightening the others will have pulled it flat.",
  },
];

const FAQ = [
  {
    question: "How do I tune a guitar with this tuner?",
    answer:
      "Pick your tuning, turn on the microphone, and play one open string at a time. The tuner names the string it hears and shows how far off it is in cents: needle left means flat and needs tightening, needle right means sharp and needs loosening. Hold the note in the green zone for a second and that string is done, then move to the next one.",
  },
  {
    question: "Is an online tuner accurate enough?",
    answer:
      "Yes for everyday playing. Pitch is measured against the equal-tempered reference of A4 = 440 Hz and read out in cents, and the green zone is ±10 cents — tighter than most players can hear on a single string. The limit is the microphone and the room, not the maths: a noisy room or a laptop microphone two metres away will make the reading jump around.",
  },
  {
    question: "Do I need an audio interface, or will my laptop microphone do?",
    answer:
      "A built-in laptop or phone microphone is fine for an acoustic guitar, and fine for an electric played unplugged. If you have an audio interface, plugging the guitar straight in gives a much steadier reading because the tuner hears the string instead of the room.",
  },
  {
    question: "Why does the tuner show the wrong note?",
    answer:
      "Two usual causes. The string is so far out that it is genuinely closer to a different open string — check you are playing the string you think you are. Or the microphone is picking up the string's harmonics rather than its fundamental, which happens most on the low E and B strings; play the note nearer the bridge, a little softer, and let it settle before reading the needle.",
  },
  {
    question: "How do I get into Drop D?",
    answer:
      "Select Drop D above, then lower only the thickest string until the tuner reads D2 — every other string stays at standard pitch. A quick check by ear: the open 6th string should now sound an octave below the open 4th (D) string.",
  },
  {
    question: "Does this work for bass and ukulele?",
    answer:
      "It does. Bass in four and five strings, ukulele in standard re-entrant, low G, baritone and D tuning, plus mandolin and 5-string banjo. Pick the instrument first and the tuning list changes with it.",
  },
  {
    question: "Can I tune without a microphone?",
    answer:
      "Yes — tap any string name under the needle and it plays that pitch, so you can tune by ear against the reference tone. Useful in a loud room, or on a device where microphone access is blocked.",
  },
  {
    question: "Is my audio recorded or sent anywhere?",
    answer:
      "No. The microphone stream is analysed inside your browser and never leaves the page: nothing is recorded, stored or uploaded. Closing the tab or pressing stop releases the microphone.",
  },
  {
    question: "How often should I retune?",
    answer:
      "Every time you pick the instrument up, and again after ten minutes of hard playing. New strings drift for their first few hours, and so does any guitar that has been moved between a cold car and a warm room.",
  },
];

const TunerPage = () => {
  const router = useRouter();

  // The selection lives in the URL rather than in component state, so a link can
  // point straight at "bass, drop D" and the page opens on it.
  const instrumentId =
    typeof router.query.instrument === "string" ? router.query.instrument : DEFAULT_INSTRUMENT_ID;
  const tuningId =
    typeof router.query.tuning === "string" ? router.query.tuning : DEFAULT_TUNING_ID;

  const instrument = getInstrument(instrumentId);
  const tuning = getTuning(instrument, tuningId);

  const select = (nextInstrumentId: string, nextTuningId: string) => {
    void router.replace(
      { pathname: "/tools/tuner", query: { instrument: nextInstrumentId, tuning: nextTuningId } },
      undefined,
      { shallow: true, scroll: false },
    );
  };

  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name='description' content={DESCRIPTION} />
        <link rel='canonical' href={siteUrl} />
        <meta property='og:title' content={TITLE} />
        <meta property='og:description' content={DESCRIPTION} />
        <meta property='og:url' content={siteUrl} />
        <meta property='og:type' content='website' />
        <meta property='og:image' content='https://riff.quest/images/og-image.png' />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={TITLE} />
        <meta name='twitter:description' content={DESCRIPTION} />
        <meta name='twitter:image' content='https://riff.quest/images/og-image.png' />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebApplication",
                name: "Riff Quest Online Guitar Tuner",
                url: siteUrl,
                applicationCategory: "MultimediaApplication",
                operatingSystem: "Any browser",
                description: DESCRIPTION,
                offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
                featureList: [
                  "Microphone pitch detection in cents",
                  "Guitar, bass, ukulele, mandolin and banjo tunings",
                  "Standard, Drop D, Drop C, Open G, Open D, DADGAD and half step down",
                  "Reference tones for tuning by ear",
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "HowTo",
                name: "How to tune a guitar with an online tuner",
                description:
                  "Tune a guitar, bass or ukulele in the browser using a microphone tuner that reads pitch in cents.",
                totalTime: "PT2M",
                tool: [
                  { "@type": "HowToTool", name: "A guitar, bass or ukulele" },
                  { "@type": "HowToTool", name: "A device with a microphone" },
                ],
                step: STEPS.map((step, index) => ({
                  "@type": "HowToStep",
                  position: index + 1,
                  name: step.name,
                  text: step.text,
                  url: `${siteUrl}#step-${index + 1}`,
                })),
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: FAQ.map((item) => ({
                  "@type": "Question",
                  name: item.question,
                  acceptedAnswer: { "@type": "Answer", text: item.answer },
                })),
              },
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Tools", item: "https://riff.quest/tools" },
                  { "@type": "ListItem", position: 2, name: "Guitar tuner", item: siteUrl },
                ],
              },
            ]),
          }}
        />
      </Head>

      <main className='min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-300'>
        <nav className='fixed left-0 right-0 top-0 z-50 bg-zinc-950/90 backdrop-blur-sm'>
          <div className='mx-auto flex h-16 max-w-4xl items-center justify-between px-6'>
            <Link href='/' className='transition-opacity hover:opacity-70'>
              <Image
                src='/images/longlightlogo.svg'
                alt='Riff Quest'
                width={120}
                height={32}
                className='h-6 w-auto'
                priority
              />
            </Link>
            <div className='flex items-center gap-6'>
              <Link href='/tools' className='text-sm text-zinc-400 transition-colors hover:text-white'>
                Tools
              </Link>
              <Link
                href='/signup'
                className='text-sm font-medium text-cyan-400 transition-colors hover:text-cyan-300'>
                Start Free →
              </Link>
            </div>
          </div>
        </nav>

        <div className='mx-auto max-w-3xl px-6 pb-24 pt-28'>
          {/* Nothing but a title above the tuner: the point of the page is to be
              in tune within a few seconds, so every word of context sits below it. */}
          <div className='mb-6 flex items-center gap-1.5 text-xs text-zinc-600'>
            <Link href='/tools' className='transition-colors hover:text-zinc-400'>
              Tools
            </Link>
            <ChevronRight className='h-3 w-3' />
            <span className='text-zinc-500'>Tuner</span>
          </div>

          <h1 className='text-4xl font-black text-white'>Online guitar tuner</h1>
          <p className='mt-3 text-zinc-400'>
            Tune by microphone, in cents. Guitar, bass, ukulele and more — Standard,
            Drop D, Open G, DADGAD and a dozen other tunings.
          </p>

          <div className='mt-8'>
            <TunerPanel
              instrument={instrument}
              tuning={tuning}
              onInstrumentChange={(nextId) => {
                const next = getInstrument(nextId);
                // The tuning list changes with the instrument, so carry the current
                // tuning over only when the new instrument actually has it.
                select(next.id, getTuning(next, tuning.id).id);
              }}
              onTuningChange={(nextTuningId) => select(instrument.id, nextTuningId)}
            />
          </div>

          <section className='mt-24' id='how-to-tune'>
            <h2 className='text-2xl font-black text-white'>
              How to tune your guitar with this tuner
            </h2>
            <ol className='mt-8 space-y-6'>
              {STEPS.map((step, index) => (
                <li key={step.name} id={`step-${index + 1}`} className='flex gap-5'>
                  <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-sm font-black text-cyan-400'>
                    {index + 1}
                  </span>
                  <div className='space-y-1.5'>
                    <h3 className='font-bold text-white'>{step.name}</h3>
                    <p className='text-sm leading-relaxed text-zinc-400'>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>


          <section className='mt-24' id='faq'>
            <h2 className='text-2xl font-black text-white'>Tuning questions</h2>
            <div className='mt-8 space-y-8'>
              {FAQ.map((item) => (
                <div key={item.question} className='space-y-2'>
                  <h3 className='font-bold text-white'>{item.question}</h3>
                  <p className='text-sm leading-relaxed text-zinc-400'>{item.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <section className='mt-24 rounded-2xl bg-cyan-500/10 p-8'>
            <h2 className='text-2xl font-black text-white'>
              In tune. Now make the practice count.
            </h2>
            <p className='mt-3 max-w-xl text-sm leading-relaxed text-zinc-300'>
              Riff Quest is the practice tracker this tuner comes from: the same
              pitch detection listens while you play, scores what you actually hit,
              and turns your sessions into a record of how you are improving. It is
              free — no subscription, no paywall.
            </p>
            <div className='mt-6 flex flex-wrap items-center gap-3'>
              <Link
                href='/signup'
                className={cn(
                  "rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-bold text-zinc-950",
                  "transition-background hover:bg-cyan-400",
                )}>
                Start practising free
              </Link>
              <Link
                href='/how-it-works'
                className='rounded-lg bg-zinc-900/60 px-5 py-2.5 text-sm font-bold text-zinc-300 transition-background hover:bg-zinc-800'>
                See how it works
              </Link>
              <Link
                href='/tools'
                className='rounded-lg px-2 py-2.5 text-sm font-bold text-zinc-400 transition-colors hover:text-white'>
                All guitar tools →
              </Link>
            </div>
          </section>
        </div>

        <Footer />
      </main>
    </>
  );
};

export default TunerPage;
