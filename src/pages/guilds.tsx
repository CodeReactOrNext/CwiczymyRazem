import MainContainer from "components/MainContainer";
import { GuildsView } from "feature/guilds/GuildsView";
import { LevelGate } from "feature/levelGate/components/LevelGate";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const GuildsPage: NextPageWithLayout = () => (
  <MainContainer noBorder>
    <Head>
      <title>Guilds | RiffQuest</title>
      <meta
        name='description'
        content='Practise alongside other guitarists. Join a guild, chat, and clear a weekly challenge together.'
      />
      <link rel='canonical' href='https://riff.quest/guilds' />
    </Head>
    <LevelGate feature='guilds'>
      <GuildsView />
    </LevelGate>
  </MainContainer>
);

GuildsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId={"guilds"} subtitle='Guilds' variant='primary' wide>
      {page}
    </AppLayout>
  );
};

export default GuildsPage;

GuildsPage.getInitialProps = withAuthInitialProps();
