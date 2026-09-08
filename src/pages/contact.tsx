import { DISCORD_INVITE_URL } from "constants/community";
import { Footer } from "feature/landing/components/Footer";
import AppLayout from "layouts/AppLayout";
import { Mail } from "lucide-react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { ReactElement } from "react";
import { FaDiscord } from "react-icons/fa6";
import type { NextPageWithLayout } from "types/page";

const SUPPORT_EMAIL = "mjablonskidev@gmail.com";

const BUG_REPORT_ITEMS = [
  "Where it happened — the screen or exercise you were on, and what you clicked just before.",
  "What you expected to happen, and what happened instead.",
  "Whether it happens every time or only occasionally.",
  "Browser or desktop app, and the operating system you are on.",
  "For audio and note detection problems: the microphone or interface in use, and whether the input meter moves at all.",
];

const ContactPage: NextPageWithLayout = () => {
  const { status } = useSession();
  const isLogged = status === "authenticated";

  return (
    <>
      <Head>
        <title>Contact Riff Quest — Support, Bugs and Feature Requests</title>
        <meta
          name='description'
          content='Get in touch with the Riff Quest team. Have a question, bug report, or feature request? Reach out via Discord or email.'
        />
        <link rel='canonical' href='https://riff.quest/contact' />
        <meta
          property='og:title'
          content='Contact Riff Quest — Support, Bugs and Feature Requests'
        />
        <meta
          property='og:description'
          content='Get in touch with the Riff Quest team. Have a question, bug report, or feature request?'
        />
        <meta property='og:url' content='https://riff.quest/contact' />
        <meta property='og:type' content='website' />
        <meta
          property='og:image'
          content='https://riff.quest/images/og-image.png'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta
          name='twitter:title'
          content='Contact Riff Quest — Support, Bugs and Feature Requests'
        />
        <meta
          name='twitter:description'
          content='Get in touch with the Riff Quest team.'
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
              <Link href='/' className='flex items-center gap-2'>
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
                  className='text-sm font-medium text-zinc-400 transition-colors hover:text-white'>
                  Login
                </Link>
                <Link
                  href='/signup'
                  className='rounded-full bg-cyan-500 px-4 py-1.5 text-sm font-bold text-black transition-colors hover:bg-cyan-400'>
                  Start Free
                </Link>
              </div>
            </div>
          </nav>
        )}

        <div className='mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20'>
          <header className='max-w-2xl'>
            <h1 className='text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl'>
              Contact
            </h1>
            <p className='mt-6 text-lg leading-relaxed text-zinc-300'>
              A bug, an idea, or just a hello — all of it is welcome.
            </p>
            <p className='mt-4 text-base leading-relaxed text-zinc-400'>
              Riff Quest is built by a very small team, so there is no ticket
              queue and no support bot standing between you and the person who
              wrote the code. Every message lands with someone who can actually
              change the app, which is why a clear bug report can turn into a
              fix in one of the next releases rather than sitting in a backlog
              for a quarter.
            </p>
          </header>

          <div className='mt-12 grid gap-4 sm:grid-cols-2'>
            <Link
              href={DISCORD_INVITE_URL}
              target='_blank'
              rel='noopener noreferrer'
              className='group flex flex-col rounded-lg bg-zinc-900/40 p-6 transition-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 hover:bg-zinc-800/40 sm:p-8'>
              <span className='flex h-11 w-11 items-center justify-center rounded-lg bg-[#5865F2]/10'>
                <FaDiscord className='h-5 w-5 text-[#5865F2]' />
              </span>
              <h2 className='mt-5 text-lg font-bold text-zinc-100'>Discord</h2>
              <p className='mt-3 flex-grow text-sm leading-relaxed text-zinc-400'>
                The fastest route, and the right one for anything that needs
                back-and-forth: screenshots, clips and follow-up questions all
                stay in one thread. Bug reports and feature requests are read
                here every day.
              </p>
              <span className='mt-5 text-sm font-bold text-[#5865F2] transition-colors group-hover:text-[#7983f5]'>
                Join the server →
              </span>
            </Link>

            <Link
              href={`mailto:${SUPPORT_EMAIL}`}
              className='group flex flex-col rounded-lg bg-zinc-900/40 p-6 transition-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 hover:bg-zinc-800/40 sm:p-8'>
              <span className='flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-500/10'>
                <Mail className='h-5 w-5 text-cyan-400' />
              </span>
              <h2 className='mt-5 text-lg font-bold text-zinc-100'>Email</h2>
              <p className='mt-3 flex-grow text-sm leading-relaxed text-zinc-400'>
                Better for longer messages, anything you would rather not post
                in public, and partnership or press enquiries.
              </p>
              <span className='mt-5 break-all text-sm font-bold text-cyan-400 transition-colors group-hover:text-cyan-300'>
                {SUPPORT_EMAIL} →
              </span>
            </Link>
          </div>

          <div className='mt-4 space-y-4'>
            <section className='rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
              <h2 className='text-lg font-bold text-zinc-100'>
                What to include when something breaks
              </h2>
              <p className='mt-4 text-sm leading-relaxed text-zinc-400'>
                Most bugs in a practice app are situational: they depend on the
                browser, the audio device, the exercise you were in, or the
                state your session was in when things went sideways. The more of
                that context arrives with the report, the less time gets spent
                reproducing it. A single sentence plus a screenshot is usually
                enough.
              </p>
              <ul className='mt-6 space-y-3'>
                {BUG_REPORT_ITEMS.map((item) => (
                  <li
                    key={item}
                    className='flex gap-3 text-sm leading-relaxed text-zinc-400'>
                    <span
                      aria-hidden
                      className='mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-600'
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className='rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
              <h2 className='text-lg font-bold text-zinc-100'>
                What happens to a feature request
              </h2>
              <p className='mt-4 text-sm leading-relaxed text-zinc-400'>
                Ideas posted in Discord get read and discussed in the open, and
                the ones that keep coming up from different players tend to get
                built first. Plenty of what the app does today started as
                somebody complaining that practising a scale felt like homework,
                or that they could not tell whether a week of practice had
                actually gone anywhere. Telling us the problem you have is more
                useful than describing the feature you think would solve it,
                because the problem is the part we cannot guess.
              </p>
            </section>

            <section className='rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
              <h2 className='text-lg font-bold text-zinc-100'>
                Before you write
              </h2>
              <p className='mt-4 text-sm leading-relaxed text-zinc-400'>
                Questions about scoring, streaks, Fame, note detection setup or
                the desktop app usually have a written answer already. The
                frequently asked questions cover the short versions, the
                knowledge base explains every screen in detail with screenshots,
                and the practice guides deal with routines, session length and
                progress tracking rather than the app itself.
              </p>
              <div className='mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold'>
                <Link
                  href='/faq'
                  className='text-cyan-400 transition-colors hover:text-cyan-300'>
                  FAQ
                </Link>
                <Link
                  href='/wiki'
                  className='text-cyan-400 transition-colors hover:text-cyan-300'>
                  Knowledge base
                </Link>
                <Link
                  href='/blog'
                  className='text-cyan-400 transition-colors hover:text-cyan-300'>
                  Practice guides
                </Link>
              </div>
            </section>
          </div>
        </div>

        {!isLogged && <Footer />}
      </div>
    </>
  );
};

ContactPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId='contact' isPublic={true}>
      {page}
    </AppLayout>
  );
};

export default ContactPage;
