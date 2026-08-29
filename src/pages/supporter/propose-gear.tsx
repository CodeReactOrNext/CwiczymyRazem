import MainContainer from "components/MainContainer";
import { ProposeGearView } from "feature/gearProposals/ProposeGearView";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const ProposeGearPage: NextPageWithLayout = () => (
  <MainContainer noBorder>
    <Head>
      <title>Propose gear | RiffQuest</title>
      <meta name='robots' content='noindex' />
    </Head>
    <ProposeGearView />
  </MainContainer>
);

ProposeGearPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout
      pageId={"supporter"}
      subtitle='Propose gear'
      variant='primary'
      wide>
      {page}
    </AppLayout>
  );
};

export default ProposeGearPage;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "profile", "toast"],
});
