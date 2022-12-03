import Backdrop from "components/Backdrop";
import Button from "components/Button";
import RatingPopUp from "components/RatingPopUp";
import MainLayout from "layouts/MainLayout";
import ReportFormLayout from "layouts/ReportFormLayout";
import ReportCategoryLayout from "layouts/ReportFormLayout/components/ReportCategoryWrapper";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaBrain, FaMusic } from "react-icons/fa";
import { MdSchool } from "react-icons/md";
import { IoMdHand } from "react-icons/io";
import { Checkbox, TimeInputBox } from "layouts/ReportFormLayout/components";

const ReportView = () => {
  const [ratingSummaryVisible, setRatingSummaryVisible] = useState(true);
  const { t } = useTranslation("report");

  return (
    <>
      <MainLayout subtitle={t("subtitlebar_text")} variant='primary'>
        <ReportFormLayout>
          <ReportCategoryLayout title={t("exercise_type_title")}>
            <div className='m-5 flex flex-col gap-14 sm:flex-row sm:gap-10  2xl:gap-20'>
              <TimeInputBox title={t("technique")} Icon={IoMdHand} />
              <TimeInputBox title={t("theory")} Icon={MdSchool} />
              <TimeInputBox title={t("hearing")} Icon={FaMusic} />
              <TimeInputBox title={t("creative")} Icon={FaBrain} />
            </div>
          </ReportCategoryLayout>
          <ReportCategoryLayout title={t("healthy_habits_title")}>
            <Checkbox inputId='exercise_plan' title={t("exercise_plan")} />
            <Checkbox inputId='new_things' title={t("new_things")} />
            <Checkbox inputId='warmup' title={t("warmup")} />
            <Checkbox inputId='metronome' title={t("metronome")} />
            <Checkbox inputId='recording' title={t("recording")} />
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
