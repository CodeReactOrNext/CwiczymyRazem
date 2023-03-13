import { Formik } from "formik";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { IoMdHand } from "react-icons/io";
import { MdSchool } from "react-icons/md";
import { FaBrain, FaMusic, FaTimesCircle } from "react-icons/fa";

import { useTranslation } from "react-i18next";
import { i18n } from "next-i18next";

import RatingPopUpLayout from "layouts/RatingPopUpLayout";
import ReportFormLayout from "layouts/ReportFormLayout";
import ErrorBox from "layouts/ReportFormLayout/components/ErrorBox";
import InputTime from "layouts/ReportFormLayout/components/InputTime";
import TimeInputBox from "layouts/ReportFormLayout/components/TimeInputBox";
import HealthHabbitsBox from "layouts/ReportFormLayout/components/HealthHabbitsBox";
import AcceptExceedingPopUp from "layouts/ReportFormLayout/components/AcceptExceedingPopUp";
import ReportCategoryWrapper from "layouts/ReportFormLayout/components/ReportCategoryWrapper";
import { TimeInputBoxProps } from "layouts/ReportFormLayout/components/TimeInputBox/TimeInpuBox";
import { HealthHabbitsBoxProps } from "layouts/ReportFormLayout/components/HealthHabbitsBox/HealthHabbitsBox";

import { Input, Button, Divider } from "components/UI";
import Backdrop from "components/Backdrop";
import BeginnerMsg from "components/BeginnerMsg";

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
import { isLastReportTimeExceeded } from "./helpers/isLastReportTimeExceeded";
import {
  getDateFromPast,
  convertMsToHMObject,
  inputTimeConverter,
} from "utils/converter";

import { MAX_DAYS_BACK } from "constants/gameSettings";

type TimeInputProps = Omit<TimeInputBoxProps, "errors">;

const ReportView = () => {
  const [ratingSummaryVisible, setRatingSummaryVisible] = useState(false);
  const [acceptPopUpVisible, setAcceptPopUpVisible] = useState(false);
  const [exceedingTime, setExceedingTime] = useState<number | null>(null);
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
    countBackDays: 0,
    reportTitle: "",
  };

  const timeInputList: TimeInputProps[] = [
    {
      title: i18n?.t("report:technique"),
      questionMarkProps: {
        description: i18n?.t("report:description.technique"),
      },
      Icon: IoMdHand,
      hoursName: "techniqueHours",
      minutesName: "techniqueMinutes",
    },
    {
      title: i18n?.t("report:theory"),
      questionMarkProps: {
        description: i18n?.t("report:description.theory"),
      },
      Icon: MdSchool,
      hoursName: "theoryHours",
      minutesName: "theoryMinutes",
    },
    {
      title: i18n?.t("report:hearing"),
      questionMarkProps: {
        description: i18n?.t("report:description.hearing"),
      },
      Icon: FaMusic,
      hoursName: "hearingHours",
      minutesName: "hearingMinutes",
    },
    {
      title: i18n?.t("report:creativity"),
      questionMarkProps: {
        description: i18n?.t("report:description.creative"),
      },
      Icon: FaBrain,
      hoursName: "creativityHours",
      minutesName: "creativityMinutes",
    },
  ];

  const healthHabbitsList: HealthHabbitsBoxProps[] = [
    {
      name: "exercise_plan",
      questionMarkProps: {
        description: i18n?.t("report:habits.exercise_plan.description"),
      },
      title: i18n?.t("report:habits.exercise_plan.title"),
    },
    {
      name: "new_things",
      questionMarkProps: {
        description: i18n?.t("report:habits.new_things.description"),
      },
      title: i18n?.t("report:habits.new_things.title"),
    },
    {
      name: "warmup",
      questionMarkProps: {
        description: i18n?.t("report:habits.warmup.description"),
      },
      title: i18n?.t("report:habits.warmup.title"),
    },
    {
      name: "metronome",
      questionMarkProps: {
        description: i18n?.t("report:habits.metronome.description"),
      },
      title: i18n?.t("report:habits.metronome.title"),
    },
    {
      name: "recording",
      questionMarkProps: {
        description: i18n?.t("report:habits.recording.description"),
      },
      title: i18n?.t("report:habits.recording.title"),
    },
  ];

  const getSumTime = (formikValues: ReportFormikInterface) => {
    const { sumTime } = inputTimeConverter(formikValues);
    return sumTime;
  };

  const reportOnSubmit = (inputData: ReportFormikInterface) => {
    const sumTime = getSumTime(inputData);
    const lastReportTimeExceded = isLastReportTimeExceeded(
      currentUserStats!.lastReportDate,
      sumTime
    );

    if (lastReportTimeExceded && !acceptExceedingTime) {
      setAcceptPopUpVisible(true);
      setExceedingTime(lastReportTimeExceded);
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
      setAcceptPopUpVisible(false);
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
        {({ errors, handleSubmit, values }) => (
          <>
            <ReportFormLayout>
              <ReportCategoryWrapper title={t("exercise_type_title")}>
                <div className='my-5 mt-14 flex flex-row flex-wrap justify-center gap-10 2xl:gap-20 '>
                  {timeInputList.map(
                    (
                      {
                        title,
                        questionMarkProps,
                        Icon,
                        hoursName,
                        minutesName,
                      },
                      index
                    ) => (
                      <TimeInputBox
                        key={index}
                        errors={errors}
                        title={title}
                        questionMarkProps={questionMarkProps}
                        Icon={Icon}
                        hoursName={hoursName}
                        minutesName={minutesName}
                      />
                    )
                  )}
                </div>
              </ReportCategoryWrapper>
              <div className='flex flex-row justify-evenly '>
                <ReportCategoryWrapper title={t("healthy_habits_title")}>
                  {healthHabbitsList.map(
                    ({ name, questionMarkProps, title }, index) => (
                      <HealthHabbitsBox
                        key={name + index}
                        name={name}
                        questionMarkProps={questionMarkProps}
                        title={title}
                      />
                    )
                  )}
                </ReportCategoryWrapper>
                <div className='max-w-[30%]'>
                  <ReportCategoryWrapper title={"Dodatkowe opcje"}>
                    <div className='flex flex-col gap-2 bg-main-opposed-500/40 p-4'>
                      <div className='flex flex-col gap-2'>
                        <p>{t("sesion_title")}</p>
                        <p className='font-openSans text-xs text-tertiary'>
                          {t("optional")}
                        </p>
                      </div>

                      <Input name='reportTitle' />
                      <p className='font-openSans text-xs'>
                        {t("description.sesion_title")}
                      </p>
                      <Divider />
                      <div className='text-center'>
                        <p>{t("date_back")}</p>
                        <p
                          className={`flex flex-row justify-center gap-2 font-openSans text-xs
                        ${
                          errors.hasOwnProperty("countBackDays")
                            ? "font-extrabold text-error-200"
                            : "text-mainText"
                        }`}>
                          {errors.hasOwnProperty("countBackDays") && (
                            <FaTimesCircle className='text-error-200' />
                          )}
                          {t("max_days", { days: MAX_DAYS_BACK })}
                        </p>
                      </div>
                      <div className='flex flex-row items-center justify-center gap-5'>
                        <InputTime
                          name={"countBackDays"}
                          description={t("days")}
                        />
                        <p className='font-openSans text-sm'>
                          {t("add_report_to_day")} <br />
                          <span
                            className={`${
                              errors.hasOwnProperty("countBackDays")
                                ? "font-extrabold text-error-200"
                                : "text-mainText"
                            }`}>
                            {getDateFromPast(
                              values.countBackDays
                            ).toLocaleDateString()}
                          </span>
                        </p>
                      </div>
                      <p className='font-openSans text-xs'>
                        {t("description.max_days", { days: MAX_DAYS_BACK })}
                      </p>
                    </div>
                  </ReportCategoryWrapper>
                </div>
              </div>
              <div className='flex flex-col items-center justify-self-center md:col-span-2 lg:col-span-1 xl:col-span-2'>
                <div className='m-2 h-6'>
                  {Object.keys(errors).length !== 0 && <ErrorBox />}
                </div>
                <BeginnerMsg />
                <Button
                  type='submit'
                  disabled={Object.keys(errors).length !== 0}
                  loading={isFetching}>
                  {t("report_button")}
                </Button>
              </div>
            </ReportFormLayout>
            {acceptPopUpVisible && exceedingTime && (
              <Backdrop selector='overlays'>
                <AcceptExceedingPopUp
                  exceedingTime={exceedingTime}
                  handleSubmit={handleSubmit}
                  isFetching={isFetching}
                  setAcceptExceedingTime={setAcceptExceedingTime}
                  setAcceptPopUpVisible={setAcceptPopUpVisible}
                />
              </Backdrop>
            )}
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
