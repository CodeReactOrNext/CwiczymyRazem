import { useField } from "formik";
import QuestionMark, { QuestionMarkProps } from "components/QuestionMark";

interface HealthHabbitsBoxProps {
  title: string;
  name: string;
  questionMarkProps: QuestionMarkProps;
}

const HealthHabbitsBox = ({
  title,
  questionMarkProps,
  name,
}: HealthHabbitsBoxProps) => {
  const [field] = useField("habbits");

  return (
    <div className={`grid grid-cols-[3fr_1fr] items-center gap-2`}>
      <div className='flex flex-row gap-2 justify-self-end '>
        <p className='float-right text-end font-openSans text-base font-bold'>
          {title}
        </p>
        <QuestionMark description={questionMarkProps.description} />
      </div>
      <input type='checkbox' className='h-8' {...field} value={name} />
    </div>
  );
};
export default HealthHabbitsBox;
