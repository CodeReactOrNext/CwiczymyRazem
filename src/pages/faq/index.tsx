import FaqView, { useFaqQuestions } from "feature/faq/FaqView";
import { Footer } from "feature/landing/components/Footer";
import useAutoLogIn from "hooks/useAutoLogIn";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

const FaqPage: NextPageWithLayout = () => {
  const {  } = useAutoLogIn({
    redirects: {
      loggedOut: "/faq",
    },
  });
  const { status } = useSession();
  const isLogged = status === "authenticated";

  const siteUrl = "https://riff.quest/faq";
  const faqQuestions = useFaqQuestions();

  return (
    <>
      <Head>
        <title>Guitar Practice FAQ — Questions Answered | Riff Quest</title>
        <meta name="description" content="Answers to the most common Riff Quest questions — how it works, practice tracking, song library, pricing, and more." />
        <link rel='canonical' href={siteUrl} />
        <meta property="og:title" content="Guitar Practice FAQ | Riff Quest" />
        <meta property="og:description" content="Answers to the most common questions about Riff Quest guitar practice app." />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://riff.quest/images/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Guitar Practice FAQ | Riff Quest" />
        <meta name="twitter:description" content="Answers to the most common questions about Riff Quest guitar practice app." />
        <meta name="twitter:image" content="https://riff.quest/images/og-image.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": faqQuestions.map((q) => ({
                "@type": "Question",
                "name": q.title,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": q.message,
                },
              })),
            }),
          }}
        />
      </Head>
      <div className={!isLogged ? "min-h-screen bg-zinc-950 text-zinc-100" : ""}>
        {!isLogged && (
          <nav className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/images/longlightlogo.svg"
                  alt="Riff Quest"
                  width={120}
                  height={32}
                  className="h-6 w-auto"
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
        <FaqView />
        {!isLogged && <Footer />}
      </div>
    </>
  );
};

FaqPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="faq" subtitle="FAQ" variant="secondary" isPublic={true}>
      {page}
    </AppLayout>
  );
};

export default FaqPage;
