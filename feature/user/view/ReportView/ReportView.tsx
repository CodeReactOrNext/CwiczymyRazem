import { Formik } from "formik";
import { toast } from "react-toastify";
import { MdSchool } from "react-icons/md";
import { IoMdHand } from "react-icons/io";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaBrain, FaMusic } from "react-icons/fa";

import RatingPopUpLayout from "layouts/RatingPopUpLayout";
import ReportFormLayout from "layouts/ReportFormLayout";
import ErrorBox from "layouts/ReportFormLayout/components/ErrorBox";
import ReportCategoryWrapper from "layouts/ReportFormLayout/components/ReportCategoryWrapper";
import {
  HealthHabbitsBox,
  TimeInputBox,
} from "layouts/ReportFormLayout/components";

import Button from "components/Button";
import Backdrop from "components/Backdrop";
import QuestionMark from "components/QuestionMark";

import { useAppDispatch, useAppSelector } from "store/hooks";
import { updateUserStats } from "feature/user/store/userSlice.asyncThunk";
import {
  selectIsFetching,
  selectUserAuth,
  selectCurrentUserStats,
  selectPreviousUserStats,
  selectRaitingData,
  selectTimerData,
} from "feature/user/store/userSlice";

import { RaportSchema } from "./helpers/RaportShcema";
import { ReportFormikInterface } from "./ReportView.types";
import { inputTimeConverter } from "utils/converter/InputTimeConverter";
import { checkIsPracticeToday } from "utils/gameLogic/checkIsPracticeToday";
import { isLastReportTimeExceeded } from "./helpers/isLastReportTimeExceeded";
import {
  convertMsToHM,
  convertMsToHMObject,
} from "utils/converter/timeConverter";

const ReportView = () => {
  const [ratingSummaryVisible, setRatingSummaryVisible] = useState(false);
  const [acceptExceedingTime, setAcceptExceedingTime] = useState(false);

  const { t } = useTranslation("report");
  const dispatch = useAppDispatch();
  const currentUserStats = useAppSelector(selectCurrentUserStats);
  const previousUserStats = useAppSelector(selectPreviousUserStats);
  const raitingData = useAppSelector(selectRaitingData);
  const userAuth = useAppSelector(selectUserAuth);
  const timerData = useAppSelector(selectTimerData);
  const isFetching = useAppSelector(selectIsFetching) === "updateData";
  const sumTime =
    timerData.creativity +
    timerData.hearing +
    timerData.theory +
    timerData.technique;

  const techniqueTime = convertMsToHMObject(timerData.technique);
  const theoryTime = convertMsToHMObject(timerData.theory);
  const hearingTime = convertMsToHMObject(timerData.hearing);
  const creativityTime = convertMsToHMObject(timerData.creativity);
  const isPracticeToday = checkIsPracticeToday(
    new Date(currentUserStats!.lastReportDate)
  );

  const formikInitialValues: ReportFormikInterface = {
    techniqueHours: techniqueTime.hours,
    techniqueMinutes: techniqueTime.minutes,
    theoryHours: theoryTime.hours,
    theoryMinutes: theoryTime.minutes,
    hearingHours: hearingTime.hours,
    hearingMinutes: hearingTime.minutes,
    creativityHours: creativityTime.hours,
    creativityMinutes: creativityTime.minutes,
    habbits: [],
  };

  const reportOnSubmit = (inputData: ReportFormikInterface) => {
    const { sumTime } = inputTimeConverter(inputData);
    const lastReportTimeExceded = isLastReportTimeExceeded(
      currentUserStats!.lastReportDate,
      sumTime
    );

    if (lastReportTimeExceded && !acceptExceedingTime) {
      toast.error(
        t("toast.exceeding_time") + convertMsToHM(lastReportTimeExceded)
      );
      return;
    }
    if (sumTime >= 86400000) {
      toast.error(t("toast.24h_error"));
      return;
    }
    if (sumTime === 0) {
      toast.error(t("toast.input_time"));
      return;
    }

    if (!userAuth) {
      toast.error(t("toast.not_logged"));
      return;
    }

    dispatch(updateUserStats({ inputData })).then(() => {
      setRatingSummaryVisible(true);
    });
  };

  useEffect(() => {
    if (sumTime) {
      toast.info(t("toast.stoper_entered"));
    }
  }, [sumTime, t]);

  return (
    <>
      <Formik
        initialValues={formikInitialValues}
        validationSchema={RaportSchema}
        validateOnBlur={false}
        onSubmit={reportOnSubmit}>
        {({ errors }) => (
          <>
            <ReportFormLayout>
              <ReportCategoryWrapper title={t("exercise_type_title")}>
                <div className='\ my-5 flex flex-row flex-wrap justify-center gap-14 2xl:gap-20'>
                  <TimeInputBox
                    errors={errors}
                    title={t("technique")}
                    questionMarkProps={{
                      description: t("description.technique"),
                    }}
                    Icon={IoMdHand}
                    hoursName={"techniqueHours"}
                    minutesName={"techniqueMinutes"}
                  />
                  <TimeInputBox
                    errors={errors}
                    title={t("theory")}
                    questionMarkProps={{
                      description: t("description.theory"),
                    }}
                    Icon={MdSchool}
                    hoursName={"theoryHours"}
                    minutesName={"theoryMinutes"}
                  />
                  <TimeInputBox
                    errors={errors}
                    title={t("hearing")}
                    questionMarkProps={{
                      description: t("description.hearing"),
                    }}
                    Icon={FaMusic}
                    hoursName={"hearingHours"}
                    minutesName={"hearingMinutes"}
                  />
                  <TimeInputBox
                    errors={errors}
                    title={t("creativity")}
                    questionMarkProps={{
                      description: t("description.creative"),
                    }}
                    Icon={FaBrain}
                    hoursName={"creativityHours"}
                    minutesName={"creativityMinutes"}
                  />
                </div>
              </ReportCategoryWrapper>
              {isPracticeToday && (
                <div className='flex flex-row gap-2 p-2 font-openSans text-lg'>
                  <p className='text-end'>{t("exceeding_time")}</p>
                  <QuestionMark description={t("description.exceeding_time")} />
                  <input
                    type='checkbox'
                    className='w-10'
                    onClick={() => {
                      setAcceptExceedingTime((prev) => !prev);
                    }}
                  />
                </div>
              )}
              <ReportCategoryWrapper title={t("healthy_habits_title")}>
                <HealthHabbitsBox
                  name='exercise_plan'
                  questionMarkProps={{
                    description: t("habits.exercise_plan.description"),
                  }}
                  title={t("habits.exercise_plan.title")}
                />
                <HealthHabbitsBox
                  name='new_things'
                  questionMarkProps={{
                    description: t("habits.new_things.description"),
                  }}
                  title={t("habits.new_things.title")}
                />
                <HealthHabbitsBox
                  name='warmup'
                  questionMarkProps={{
                    description: t("habits.warmup.description"),
                  }}
                  title={t("habits.warmup.title")}
                />
                <HealthHabbitsBox
                  name='metronome'
                  questionMarkProps={{
                    description: t("habits.metronome.description"),
                  }}
                  title={t("habits.metronome.title")}
                />
                <HealthHabbitsBox
                  name='recording'
                  questionMarkProps={{
                    description: t("habits.recording.description"),
                  }}
                  title={t("habits.recording.title")}
                />
              </ReportCategoryWrapper>
              <div className='flex flex-col items-center justify-self-center md:col-span-2 lg:col-span-1 xl:col-span-2'>
                <div className='m-2 h-6'>
                  {Object.keys(errors).length !== 0 && <ErrorBox />}
                </div>
                <Button type='submit' loading={isFetching}>
                  {t("report_button")}
                </Button>
              </div>
            </ReportFormLayout>
          </>
        )}
      </Formik>
      {ratingSummaryVisible &&
        raitingData &&
        currentUserStats &&
        previousUserStats && (
          <Backdrop selector='overlays'>
            <RatingPopUpLayout
              onClick={setRatingSummaryVisible}
              ratingData={raitingData}
              currentUserStats={currentUserStats}
              previousUserStats={previousUserStats}
            />
          </Backdrop>
        )}
    </>
  );
};

export default ReportView;
