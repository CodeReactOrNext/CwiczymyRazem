import { Formik } from "formik";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { IoMdHand } from "react-icons/io";
import { MdSchool } from "react-icons/md";
import { FaBrain, FaMusic, FaTimesCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

import { useTranslation } from "react-i18next";
import { i18n } from "next-i18next";

import RatingPopUpLayout from "layouts/RatingPopUpLayout";
import ReportFormLayout from "layouts/ReportFormLayout";
import { TimeInputBoxProps } from "layouts/ReportFormLayout/components/TimeInputBox/TimeInpuBox";
import { HealthHabbitsBoxProps } from "layouts/ReportFormLayout/components/HealthHabbitsBox/HealthHabbitsBox";
import {
  ErrorBox,
  InputTime,
  TimeInputBox,
  HealthHabbitsBox,
  AcceptExceedingPopUp,
  ReportCategoryWrapper,
} from "layouts/ReportFormLayout/components";

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

  const reportOnSubmit = async (inputData: ReportFormikInterface) => {
    const sumTime = getSumTime(inputData);
    const lastReportTimeExceded = isLastReportTimeExceeded(
      currentUserStats!.lastReportDate,
      sumTime
    );

    if (!userAuth) {
      toast.error(t("toast.not_logged"), {
        duration: 3000,
      });
      return;
    }

    if (sumTime === 0) {
      toast.error(t("toast.input_time"), {
        duration: 3000,
      });
      return;
    }

    if (sumTime >= 86400000) {
      toast.error(t("toast.24h_error"), {
        duration: 3000,
      });
      return;
    }

    if (lastReportTimeExceded && !acceptExceedingTime) {
      setAcceptPopUpVisible(true);
      setExceedingTime(lastReportTimeExceded);
      return;
    }

    try {
      await dispatch(updateUserStats({ inputData }));
      setAcceptPopUpVisible(false);
      setRatingSummaryVisible(true);
      toast.success(t("toast.report_success"), {
        duration: 3000,
      });
    } catch (error) {
      toast.error(t("toast.report_error"), {
        duration: 3000,
      });
    }
  };

  useEffect(() => {
    if (sumTime) {
      toast.info(t("toast.stoper_entered"), {
        duration: 3000,
      });
    }
  }, [sumTime, t]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}>
      <Formik
        initialValues={formikInitialValues}
        validationSchema={RaportSchema}
        validateOnBlur={false}
        onSubmit={reportOnSubmit}>
        {({ errors, handleSubmit, values }) => (
          <>
            <ReportFormLayout>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}>
                <ReportCategoryWrapper title={t("exercise_type_title")}>
                  <div className='my-5 mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 2xl:gap-12'>
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
                        <motion.div
                          key={index}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}>
                          <TimeInputBox
                            errors={errors}
                            title={title}
                            questionMarkProps={questionMarkProps}
                            Icon={Icon}
                            hoursName={hoursName}
                            minutesName={minutesName}
                          />
                        </motion.div>
                      )
                    )}
                  </div>
                </ReportCategoryWrapper>
              </motion.div>

              <div className='mt-10 flex flex-col gap-8 lg:flex-row lg:justify-between'>
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className='lg:w-1/2'>
                  <ReportCategoryWrapper title={t("healthy_habits_title")}>
                    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                      {healthHabbitsList.map(
                        ({ name, questionMarkProps, title }, index) => (
                          <motion.div
                            key={name + index}
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300 }}>
                            <HealthHabbitsBox
                              name={name}
                              questionMarkProps={questionMarkProps}
                              title={title}
                            />
                          </motion.div>
                        )
                      )}
                    </div>
                  </ReportCategoryWrapper>
                </motion.div>

                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className='lg:w-[45%]'>
                  <ReportCategoryWrapper title={t("additional_options")}>
                    <div className='rounded-lg bg-main-opposed-500/40 p-6 shadow-lg'>
                      <div className='space-y-4'>
                        <div>
                          <h3 className='text-lg font-semibold'>{t("sesion_title")}</h3>
                          <p className='text-sm text-tertiary'>{t("optional")}</p>
                          <Input
                            name='reportTitle'
                            className='mt-2 w-full rounded-md'
                          />
                          <p className='mt-1 text-sm text-gray-500'>
                            {t("description.sesion_title")}
                          </p>
                        </div>

                        <Divider className='my-4' />

                        <div>
                          <h3 className='text-center text-lg font-semibold'>
                            {t("date_back")}
                          </h3>
                          <div className='flex items-center justify-center gap-4'>
                            <InputTime
                              name={"countBackDays"}
                              description={t("days")}
                            />
                            <div className='text-sm'>
                              <p>{t("add_report_to_day")}</p>
                              <p
                                className={`font-medium ${
                                  errors.countBackDays
                                    ? "text-error-200"
                                    : "text-mainText"
                                }`}>
                                {getDateFromPast(
                                  values.countBackDays
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {errors.countBackDays && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className='mt-2 text-center text-sm text-error-200'>
                              <FaTimesCircle className='mr-1 inline' />
                              {t("max_days", { days: MAX_DAYS_BACK })}
                            </motion.p>
                          )}
                        </div>
                      </div>
                    </div>
                  </ReportCategoryWrapper>
                </motion.div>
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className='mt-8 flex flex-col items-center'>
                <AnimatePresence>
                  {Object.keys(errors).length !== 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className='mb-4'>
                      <ErrorBox />
                    </motion.div>
                  )}
                </AnimatePresence>

                <BeginnerMsg />

                <Button
                  type='submit'
                  disabled={Object.keys(errors).length !== 0}
                  loading={isFetching}
                  className='mt-4 min-w-[200px] transform transition-all hover:scale-105'>
                  {t("report_button")}
                </Button>
              </motion.div>
            </ReportFormLayout>

            <AnimatePresence>
              {acceptPopUpVisible && exceedingTime && (
                <Backdrop selector='overlays'>
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}>
                    <AcceptExceedingPopUp
                      exceedingTime={exceedingTime}
                      handleSubmit={handleSubmit}
                      isFetching={isFetching}
                      setAcceptExceedingTime={setAcceptExceedingTime}
                      setAcceptPopUpVisible={setAcceptPopUpVisible}
                    />
                  </motion.div>
                </Backdrop>
              )}

              {ratingSummaryVisible &&
                raitingData &&
                currentUserStats &&
                previousUserStats && (
                  <Backdrop selector='overlays'>
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}>
                      <RatingPopUpLayout
                        onClick={setRatingSummaryVisible}
                        ratingData={raitingData}
                        currentUserStats={currentUserStats}
                        previousUserStats={previousUserStats}
                      />
                    </motion.div>
                  </Backdrop>
                )}
            </AnimatePresence>
          </>
        )}
      </Formik>
    </motion.div>
  );
};

export default ReportView;
