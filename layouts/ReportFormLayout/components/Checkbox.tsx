import QuestionMark, { QuestionMarkProps } from "components/QuestionMark";

interface CheckboxProps {
  title: string;
  inputId: string;
  questionMarkProps: QuestionMarkProps;
}

export default function Exercise({ title, questionMarkProps }: CheckboxProps) {
  return (
    <div className={`grid grid-cols-[3fr_1fr] items-center gap-2`}>
      <div className='flex flex-row gap-2 justify-self-end'>
        <p className='text-lg'>{title} </p>
        <QuestionMark description={questionMarkProps.description} />
      </div>
      <input type='checkbox' className='h-8' />
    </div>
  );
}
