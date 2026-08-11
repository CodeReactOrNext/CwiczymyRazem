import { parsePairs } from "./parseProps";

interface FaqListProps {
  /** Pipe-separated `"Question::Answer"` pairs. */
  items: string;
}

/** Short answers to the questions an article tends to leave behind. */
export const FaqList = ({ items }: FaqListProps) => {
  const questions = parsePairs(items);

  return (
    <div className='not-prose my-10 flex flex-col gap-3'>
      {questions.map((item) => (
        <div key={item.title} className='rounded-lg bg-zinc-900/40 p-5'>
          <p className='font-bold text-white'>{item.title}</p>
          {item.description && (
            <p className='mt-2 text-sm leading-relaxed text-zinc-400'>
              {item.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};
