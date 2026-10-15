import MainContainer from "components/MainContainer";
import { DuelsView } from "feature/duels/DuelsView";
import { LevelGate } from "feature/levelGate/components/LevelGate";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const DuelsPage: NextPageWithLayout = () => (
  <MainContainer noBorder>
    <Head>
      <title>Duels | RiffQuest</title>
      <meta name='robots' content='noindex, nofollow' />
    </Head>
    <LevelGate feature='duels'>
      <DuelsView />
    </LevelGate>
  </MainContainer>
);

DuelsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId={"duels"} subtitle='Duels' variant='primary' wide>
      {page}
    </AppLayout>
  );
};

export default DuelsPage;

DuelsPage.getInitialProps = withAuthInitialProps();
