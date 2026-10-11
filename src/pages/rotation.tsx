import { RotationView } from "feature/rotation/components/RotationView";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const RotationPage: NextPageWithLayout = () => <RotationView />;

RotationPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId='rotation' variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default RotationPage;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
});
