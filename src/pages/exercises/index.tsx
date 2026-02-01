import type { NextPage } from "next";
import { ExercisesHubView } from "feature/exercisePlan/views/ExercisesHub/ExercisesHubView";
import AppLayout from "layouts/AppLayout";
import { ReactElement } from "react";

const ExercisesHubPage: NextPage & { getLayout?: (page: ReactElement) => ReactElement } = () => {
  return <ExercisesHubView />;
};

ExercisesHubPage.getLayout = (page) => {
  return (
    <AppLayout pageId="exercises" isPublic={true}>
      {page}
    </AppLayout>
  );
};

export default ExercisesHubPage;
