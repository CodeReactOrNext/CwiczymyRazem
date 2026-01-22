import { ExercisePlan } from "feature/exercisePlan/components/ExercisePlan";
import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import { useAppSelector } from "store/hooks";
import type { NextPageWithLayout } from "types/page";



const ProfileExercisesPage: NextPageWithLayout = () => {

  return (
    <div className='w-full'>
      <ExercisePlan />
    </div>
  );
};

ProfileExercisesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout
      pageId={"profile"}
      subtitle="Exercises"
      variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default ProfileExercisesPage;


