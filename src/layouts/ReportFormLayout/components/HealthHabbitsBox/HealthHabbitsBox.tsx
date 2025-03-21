import type { QuestionMarkProps } from "components/UI/QuestionMark";
import QuestionMark from "components/UI/QuestionMark";
import { useField } from "formik";

export interface HealthHabbitsBoxProps {
  title?: string;
  name: string;
  questionMarkProps: QuestionMarkProps;
}

const HealthHabbitsBox = ({
  title,
  questionMarkProps,
  name,
}: HealthHabbitsBoxProps) => {
  const [field] = useField("habbits");
  const isActive = field.value.includes(name);

  return (
    <label
      className={`
        group
      relative flex cursor-pointer items-center gap-4 rounded-lg p-4 font-openSans
      transition-all duration-200 ease-in-out
      ${
        isActive
          ? "bg-second-300 shadow-lg ring ring-tertiary-100/50"
          : "bg-second hover:bg-main-opposed-500/60"
      }
    `}>
      <input type='checkbox' {...field} value={name} className='peer hidden' />

      <div
        className={`
        flex h-6 w-6 items-center justify-center rounded-md border
        transition-all duration-200
        ${
          isActive
            ? "border-tertiary-100 bg-tertiary-100/20"
            : "border-tertiary-100/50 bg-transparent"
        }
      `}>
        <svg
          className={`h-4 w-4 transition-opacity ${
            isActive ? "opacity-100" : "opacity-0"
          }`}
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M5 13l4 4L19 7'
          />
        </svg>
      </div>

      <div className='flex items-center gap-2'>
        <p className='text-sm  sm:text-base'>{title}</p>
        <QuestionMark description={questionMarkProps.description} />
      </div>
    </label>
  );
};

export default HealthHabbitsBox;
