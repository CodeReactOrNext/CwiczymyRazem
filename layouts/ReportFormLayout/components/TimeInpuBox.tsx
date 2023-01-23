import { FormikErrors } from "formik";
import { IconType } from "react-icons/lib";

import InputTime from "./InputTime";
import QuestionMark, { QuestionMarkProps } from "components/QuestionMark";

import { ReportFormikInterface } from "feature/user/view/ReportView/ReportView.types";

interface TimeInputBoxProps {
  title: string;
  Icon: IconType;
  questionMarkProps: QuestionMarkProps;
  hoursName: string;
  minutesName: string;
  errors: FormikErrors<ReportFormikInterface>;
}

const TimeInputBox = ({
  title,
  Icon,
  questionMarkProps,
  hoursName,
  minutesName,
  errors,
}: TimeInputBoxProps) => {
  const error =
    errors.hasOwnProperty(hoursName) || errors.hasOwnProperty(minutesName);
  return (
    <div
      className={`grid-row-[3fr_4fr] relative grid  min-w-[150px] items-center border-4  border-tertiary bg-main-opposed  p-3 radius-default sm:basis-[30%] md:gap-2 xl:min-w-[170px] xl:basis-auto 2xl:min-w-[200px]
      ${error ? "border-error-300" : ""}`}>
      <Icon className='absolute left-[-1.5rem] top-[-2rem] z-30 text-5xl text-tertiary-300  xl:left-[-2rem] xl:top-[-2.5rem] xl:text-6xl' />
      <label className='z-30 flex flex-row gap-2 justify-self-center text-xl xl:text-2xl'>
        {title}
        <QuestionMark description={questionMarkProps.description} />
      </label>
      <div className='xL:gap-3 flex items-center justify-center gap-2 text-xl'>
        <InputTime name={hoursName} description={"HH"} />
        <p className='text-3xl'>:</p>
        <InputTime name={minutesName} description={"MM"} />
      </div>
    </div>
  );
};

export default TimeInputBox;
