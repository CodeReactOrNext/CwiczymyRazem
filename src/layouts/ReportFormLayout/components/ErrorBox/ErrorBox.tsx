import { FaTimesCircle } from "react-icons/fa";
import { FormikErrors } from "formik";
import { ReportFormikInterface } from "feature/user/view/ReportView/ReportView.types";

interface ErrorBoxProps {
  errors: FormikErrors<ReportFormikInterface>;
}

const ErrorBox = ({ errors }: ErrorBoxProps) => {
  const hasTimeError = Object.keys(errors).some(key => 
    key.includes('Hours') || key.includes('Minutes')
  );
  const hasTitleError = !!errors.reportTitle;

  return (
    <div className='flex flex-col items-center gap-2'>
      <div className='flex flex-row items-center gap-3 text-red-400'>
        <FaTimesCircle className='text-xl' />
      </div>
      <div className="flex flex-col items-center gap-1 text-xs text-red-400/80">
        {hasTimeError && <p>Invalid time values entered</p>}
        {hasTitleError && <p>Session headlines is too long (max 60 characters)</p>}
        {!hasTimeError && !hasTitleError && <p>Please check all fields and try again</p>}
      </div>
    </div>
  );
};

export default ErrorBox;
