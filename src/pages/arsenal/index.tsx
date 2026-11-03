import { ArsenalView } from "feature/arsenal/ArsenalView";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

const ArsenalPage: NextPageWithLayout = () => {
  // AppLayout renders the page only once the player is signed in and redirects
  // otherwise, so the view needs no gate (or placeholder) of its own.
  return (
    <>
      <Head>
        <title>Guitar Arsenal | Riff Quest</title>
        <meta name="description" content="Collect and equip guitars with your Fame Points." />
        <meta name='robots' content='noindex' />
      </Head>
      <ArsenalView />
    </>
  );
};

ArsenalPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="arsenal" subtitle="Guitar Arsenal" variant="secondary">
      {page}
    </AppLayout>
  );
};

export default ArsenalPage;
