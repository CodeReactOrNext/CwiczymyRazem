import Backdrop from "components/Backdrop";
import Button from "components/Button";
import RatingPopUp from "components/RatingPopUp";
import MainLayout from "layouts/MainLayout";
import ReportFormLayout from "layouts/ReportFormLayout";
import ReportCategoryLayout from "layouts/ReportFormLayout/components/ReportCategoryLayout";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Exercise from "./components/Exercise";

const ReportView = () => {
  const [ratingSummaryVisible, setRatingSummaryVisible] = useState(true);
  const { t } = useTranslation("report");

  return (
    <>
      <MainLayout subtitle={t("subtitlebar_text")} variant='primary'>
        <ReportFormLayout>
          <ReportCategoryLayout title={t("exercise_type_title")}>
            <Exercise inputId='technic' title={t("technique")} />
            <Exercise inputId='theory' title={t("theory")} />
            <Exercise inputId='hearing' title={t("hearing")} />
            <Exercise inputId='creative' title={t("creative")} />
          </ReportCategoryLayout>
          <ReportCategoryLayout title={t("healthy_habits_title")}>
            <Exercise
              isCheckbox
              inputId='exercise_plan'
              title={t("exercise_plan")}
            />
            <Exercise isCheckbox inputId='new_things' title={t("new_things")} />
            <Exercise isCheckbox inputId='warmup' title={t("warmup")} />
            <Exercise isCheckbox inputId='metronome' title={t("metronome")} />
            <Exercise isCheckbox inputId='recording' title={t("recording")} />
          </ReportCategoryLayout>
          <div className='justify-self-center md:col-span-2 lg:col-span-1 xl:col-span-2'>
            <Button>{t("report_button")}</Button>
          </div>
        </ReportFormLayout>
      </MainLayout>
      {ratingSummaryVisible && (
        <Backdrop selector='overlays'>
          <RatingPopUp
            onClick={setRatingSummaryVisible}
            ratingData={{
              basePoints: 34,
              currentLevel: 20,
              bonusPoints: [
                {
                  streak: 4,
                  multiplier: 4,
                },
                {
                  habitsCount: 7,
                  additionalPoints: 5,
                },
                {
                  time: "4h:30m",
                  multiplier: 4,
                },
              ],
            }}
          />
        </Backdrop>
      )}
    </>
  );
};

export default ReportView;
