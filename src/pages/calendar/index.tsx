import { CalendarView } from "feature/practiceCalendar/components/CalendarView";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const CalendarPage: NextPageWithLayout = () => <CalendarView />;

CalendarPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId='calendar' variant='secondary' wide>
      {page}
    </AppLayout>
  );
};

export default CalendarPage;

CalendarPage.getInitialProps = withAuthInitialProps();
