import { PracticeModeSelector } from "feature/practice/components/PracticeModeSelector/PracticeModeSelector";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const Timer: NextPageWithLayout = () => {
  return (
    <div className="flex flex-col w-full h-full">
      <PracticeModeSelector />
    </div>
  );
};

Timer.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId={"exercise"} subtitle='Timer' variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default Timer;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["timer", "toast", "exercises"],
});
