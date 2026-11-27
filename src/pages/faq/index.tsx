import { MarketingNav } from "components/MarketingNav/MarketingNav";
import FaqView, { useFaqQuestions } from "feature/faq/FaqView";
import { Footer } from "feature/landing/components/Footer";
import { jakartaLanding } from "feature/landing/lib/fonts";
import useAutoLogIn from "hooks/useAutoLogIn";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
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
      <div className={!isLogged ? `${jakartaLanding.variable} min-h-screen bg-zinc-950 text-zinc-100` : ""}>
        {!isLogged && (
          <MarketingNav spacer />
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
