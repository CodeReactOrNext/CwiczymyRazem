import FaqView from "feature/faq/FaqView";
import useAutoLogIn from "hooks/useAutoLogIn";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";



const FaqPage: NextPageWithLayout = () => {
  const {  } = useAutoLogIn({
    redirects: {
      loggedOut: "/faq",
    },
  });

  const siteUrl = "https://riff.quest/faq";

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
      </Head>
      <FaqView />
    </>
  );
};

FaqPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="faq" subtitle="FAQ" variant="secondary">
      {page}
    </AppLayout>
  );
};

export default FaqPage;


