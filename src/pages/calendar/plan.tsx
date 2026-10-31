import { AutoPlanView } from "feature/practiceCalendar/components/AutoPlan/AutoPlanView";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const CalendarPlanPage: NextPageWithLayout = () => <AutoPlanView />;

CalendarPlanPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId='calendar' variant='secondary' wide>
      {page}
    </AppLayout>
  );
};

export default CalendarPlanPage;

CalendarPlanPage.getInitialProps = withAuthInitialProps();
