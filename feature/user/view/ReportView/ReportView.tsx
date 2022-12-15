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
import { Form, Formik } from "formik";
import { HABBITS_POINTS_VALUE, TIME_POINTS_VALUE } from "constants/ratingValue";
import { convertMsToHM } from "helpers/timeConverter";

const ReportView = () => {
  const [ratingSummaryVisible, setRatingSummaryVisible] = useState(false);
  const [ratingSummaryData, setRatingSummaryData] = useState({
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
        timePoints: 4,
      },
    ],
  });

  const { t } = useTranslation("report");

  interface formikInitialValuesType {
    techniqueHours: string;
    techniqueMinutes: string;
    theoryHours: string;
    theoryMinutes: string;
    hearingHours: string;
    hearingMinutes: string;
    creativeHours: string;
    creativeMinutes: string;
    habbits: string[];
    raportData: Date;
  }

  const formikInitialValues: formikInitialValuesType = {
    techniqueHours: "",
    techniqueMinutes: "",
    theoryHours: "",
    theoryMinutes: "",
    hearingHours: "",
    hearingMinutes: "",
    creativeHours: "",
    creativeMinutes: "",
    habbits: [],
    raportData: new Date(),
  };

  const makeRatingData = (data: formikInitialValuesType) => {
    const sumMinute =
      (+data.techniqueMinutes +
        +data.theoryMinutes +
        +data.hearingMinutes +
        +data.creativeMinutes) *
      60000;
    const sumHours =
      (+data.techniqueHours +
        +data.theoryHours +
        +data.hearingHours +
        +data.creativeHours) *
      3600000;
    60000;
    const sumTotalTime = sumMinute + sumHours;
    const timePoints = Math.floor(sumTotalTime * TIME_POINTS_VALUE);
    const totalTime = convertMsToHM(sumTotalTime);
    const habbitsCount = data.habbits.length;
    const additionalPoints = Math.floor(habbitsCount * HABBITS_POINTS_VALUE);
    const basePoints = additionalPoints + timePoints;
    return {
      basePoints: basePoints,
      currentLevel: 20,
      bonusPoints: [
        {
          streak: 4,
          multiplier: 4,
        },
        {
          habitsCount: habbitsCount,
          additionalPoints: additionalPoints,
        },
        {
          time: totalTime,
          timePoints: timePoints,
        },
      ],
    };
  };

  const onSubmit = (event: formikInitialValuesType) => {
    setRatingSummaryVisible(true);
    setRatingSummaryData(makeRatingData(event));
  };

  return (
    <>
      <MainLayout subtitle={t("subtitlebar_text")} variant='primary'>
        <Formik initialValues={formikInitialValues} onSubmit={onSubmit}>
          <ReportFormLayout>
            <ReportCategoryLayout title={t("exercise_type_title")}>
              <div className='m-5 flex flex-row flex-wrap justify-center gap-14  2xl:gap-20'>
                <TimeInputBox
                  title={t("technique")}
                  questionMarkProps={{
                    description: "Technika",
                  }}
                  Icon={IoMdHand}
                  hours={"techniqueHours"}
                  minutes={"techniqueMinutes"}
                />
                <TimeInputBox
                  title={t("theory")}
                  questionMarkProps={{
                    description: "Teoria",
                  }}
                  Icon={MdSchool}
                  hours={"theoryHours"}
                  minutes={"theoryMinutes"}
                />
                <TimeInputBox
                  title={t("hearing")}
                  questionMarkProps={{ description: "Słuch" }}
                  Icon={FaMusic}
                  hours={"hearingHours"}
                  minutes={"hearingMinutes"}
                />
                <TimeInputBox
                  title={t("creative")}
                  questionMarkProps={{ description: "Kreatywność" }}
                  Icon={FaBrain}
                  hours={"creativeHours"}
                  minutes={"creativeMinutes"}
                />
              </div>
            </ReportCategoryLayout>
            <ReportCategoryLayout title={t("healthy_habits_title")}>
              <Checkbox
                name='exercise_plan'
                questionMarkProps={{
                  description: "...",
                }}
                title={t("exercise_plan")}
              />
              <Checkbox
                name='new_things'
                questionMarkProps={{
                  description: "...",
                }}
                title={t("new_things")}
              />
              <Checkbox
                name='warmup'
                questionMarkProps={{
                  description: "...",
                }}
                title={t("warmup")}
              />
              <Checkbox
                name='metronome'
                questionMarkProps={{
                  description: "...",
                }}
                title={t("metronome")}
              />
              <Checkbox
                name='recording'
                questionMarkProps={{
                  description: "...",
                }}
                title={t("recording")}
              />
            </ReportCategoryLayout>
            <div className='justify-self-center md:col-span-2 lg:col-span-1 xl:col-span-2'>
              <Button type='submit'>{t("report_button")}</Button>
            </div>
          </ReportFormLayout>
        </Formik>
      </MainLayout>
      {ratingSummaryVisible && (
        <Backdrop selector='overlays'>
          <RatingPopUp
            onClick={setRatingSummaryVisible}
            ratingData={ratingSummaryData}
          />
        </Backdrop>
      )}
    </>
  );
};

export default ReportView;
