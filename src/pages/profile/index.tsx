import LogsBoxView from "feature/logsBox/view/LogsBoxView";
import { NavigationCards } from "feature/profile/components/NavigationCards/NavigationCards";
import { ExerciseLayout } from "feature/exercisePlan/components/ExerciseLayout";
import AppLayout from "layouts/AppLayout";
import { BarChart2 } from "lucide-react";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

const ProfileOverviewPage: NextPageWithLayout = () => {
  return (
    <ExerciseLayout title="Statistics" subtitle="Your practice history and progress overview" icon={<BarChart2 size={18} />}>
      <NavigationCards />
      <div className="mt-8">
        <LogsBoxView />
      </div>
    </ExerciseLayout>
  );
};

ProfileOverviewPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout
      pageId={"profile"}
      subtitle="Profile"
      variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default ProfileOverviewPage;
