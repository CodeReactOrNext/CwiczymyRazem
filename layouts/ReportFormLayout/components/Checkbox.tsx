import QuestionMark, { QuestionMarkProps } from "components/QuestionMark";
import { useField } from "formik";

interface CheckboxProps {
  title: string;
  name: string;
  questionMarkProps: QuestionMarkProps;
}

export default function Exercise({
  title,
  questionMarkProps,
  name,
}: CheckboxProps) {
  const [field] = useField("habbits");
  return (
    <div className={`grid grid-cols-[3fr_1fr] items-center gap-2`}>
      <div className='flex flex-row gap-2 justify-self-end'>
        <p className='text-lg'>{title} </p>
        <QuestionMark description={questionMarkProps.description} />
      </div>
      <input type='checkbox' className='h-8' {...field} value={name} />
    </div>
  );
}
