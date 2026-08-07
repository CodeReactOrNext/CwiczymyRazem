import MainContainer from "components/MainContainer";
import { ChallengesView } from "feature/challenges/ChallengesView";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const ChallengesPage: NextPageWithLayout = () => (
  <MainContainer noBorder>
    <Head>
      <title>Challenges | RiffQuest</title>
      <meta
        name='description'
        content='Five community-voted songs every month. Record them, earn points and fame, and see how everyone else played them.'
      />
      <link rel='canonical' href='https://riff.quest/challenges' />
    </Head>
    <ChallengesView />
  </MainContainer>
);

ChallengesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout
      pageId={"challenges"}
      subtitle='Challenges'
      variant='primary'
      wide>
      {page}
    </AppLayout>
  );
};

export default ChallengesPage;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "songs", "profile", "achievements", "toast"],
});
