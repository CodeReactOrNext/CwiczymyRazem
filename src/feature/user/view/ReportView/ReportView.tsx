import { Formik } from "formik";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { IoMdHand } from "react-icons/io";
import { MdSchool } from "react-icons/md";
import { FaBrain, FaMusic } from "react-icons/fa";

import { useTranslation } from "react-i18next";
import { i18n } from "next-i18next";

import RatingPopUpLayout from "layouts/RatingPopUpLayout";
import ReportFormLayout from "layouts/ReportFormLayout";
import ErrorBox from "layouts/ReportFormLayout/components/ErrorBox";
import TimeInputBox from "layouts/ReportFormLayout/components/TimeInputBox";
import HealthHabbitsBox from "layouts/ReportFormLayout/components/HealthHabbitsBox";
import ReportCategoryWrapper from "layouts/ReportFormLayout/components/ReportCategoryWrapper";

import Button from "components/UI/Button";
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
import { inputTimeConverter } from "utils/converter/InputTimeConverter";
import { isLastReportTimeExceeded } from "./helpers/isLastReportTimeExceeded";
import {
  convertMsToHM,
  convertMsToHMObject,
} from "utils/converter/timeConverter";
import Input from "components/UI/Input";
import { TimeInputBoxProps } from "layouts/ReportFormLayout/components/TimeInputBox/TimeInpuBox";
import { HealthHabbitsBoxProps } from "layouts/ReportFormLayout/components/HealthHabbitsBox/HealthHabbitsBox";
import Divider from "components/UI/Divider";
import InputTime from "layouts/ReportFormLayout/components/InputTime";

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
    reportTitle: '',
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
        {({ errors, handleSubmit }) => (
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
                        <p>Cele tej sesji ćwiczeń:</p>
                        <p className='font-openSans text-xs text-tertiary'>
                          Opcjonalne
                        </p>
                      </div>

                      <Input name='reportTitle' />
                      <p className='font-openSans text-xs'>
                        Zatytułuj swoją sesję. Będzie ona widoczna w Twoim
                        Kalendarzu pod tą nazwą.
                      </p>
                      <Divider />
                      <div className='text-center'>
                        <p>Data Wstecz</p>
                        <p className='font-openSans text-xs'>Maks. 7 dni</p>
                      </div>

                      <div className='flex flex-row items-center justify-center gap-5'>
                        <InputTime name={"countBackDays"} description={"Dni"} />
                        <p className='font-openSans text-sm'>
                          Dodasz raport do dnia: <br />
                          04.03.2023
                        </p>
                      </div>
                      <p className='font-openSans text-xs'>
                        Jeżeli zapomniałeś możesz dodać do 7 dni wstecz swój
                        raport. Nie będzie on jednak wliczony do dni pod rząd
                        oraz będzie wyszczególniony w kalendarzu.
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
                <Button type='submit' loading={isFetching}>
                  {t("report_button")}
                </Button>
              </div>
            </ReportFormLayout>
            {acceptPopUpVisible && exceedingTime && (
              <Backdrop selector='overlays'>
                <div className=' m-auto mx-2 flex h-1/4 min-h-[300px] flex-col items-center justify-center gap-4 border-2 border-second-400 bg-second p-6 radius-default'>
                  <p className='font-openSans text-base'>
                    {t("toast.exceeding_time") + convertMsToHM(exceedingTime)}
                  </p>
                  <p className=' font-openSans text-sm'>
                    {t("exceeding_time")}
                  </p>
                  <div className=' flex gap-4'>
                    <Button
                      type='button'
                      variant='small'
                      onClick={() => {
                        setAcceptExceedingTime(true);
                        handleSubmit();
                      }}
                      loading={isFetching}>
                      {t("report_button")}
                    </Button>
                    <Button
                      type='button'
                      variant='small'
                      onClick={() => setAcceptPopUpVisible(false)}>
                      {t("rating_popup.back")}
                    </Button>
                  </div>
                </div>
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
