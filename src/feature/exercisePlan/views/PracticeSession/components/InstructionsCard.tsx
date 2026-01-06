import { Card } from "assets/components/ui/card";

interface InstructionsCardProps {
  instructions: Array<string>;
  title: string;
}

export const InstructionsCard = ({
  instructions,
  title,
}: InstructionsCardProps) => {
  return (
    <Card className='border-zinc-700/50 bg-zinc-900/50 backdrop-blur-sm'>
      {/* PRIMARY: Enhanced header with visual hierarchy */}
      <div className='border-b border-zinc-700/30 bg-gradient-to-r from-blue-500/5 to-transparent p-4'>
        <div className='flex items-center gap-2'>
          <div className='h-2 w-2 rounded-full bg-blue-400'></div>
          <h3 className='text-lg font-semibold text-white'>{title}</h3>
          <div className='ml-auto'>
            <span className='rounded-full border border-blue-500/30 bg-blue-500/15 px-2 py-1 text-xs font-medium text-blue-300'>
              {instructions.length} kroków
            </span>
          </div>
        </div>
      </div>

      <div className='p-4'>
        {/* SECONDARY: Enhanced instruction list with better hierarchy */}
        <div className='space-y-4'>
          {instructions.map((instruction, index) => (
            <div key={index} className='group flex items-start gap-4'>
              <div className='mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-blue-500/40 bg-gradient-to-br from-blue-500/20 to-blue-600/30 text-xs font-semibold text-blue-300 transition-all duration-200 group-hover:from-blue-500/30 group-hover:to-blue-600/40'>
                {index + 1}
              </div>
              <div className='flex-1'>
                <p className='text-sm leading-relaxed text-zinc-200 transition-colors duration-200 group-hover:text-white [&>strong]:font-semibold [&>strong]:text-white'>
                  {instruction}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* TERTIARY: Progress indicator */}
        <div className='mt-5 border-t border-zinc-800/50 pt-3'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-medium text-zinc-400'>
              Postęp instrukcji
            </span>
            <div className='flex gap-1'>
              {instructions.map((_, idx) => (
                <div
                  key={idx}
                  className='h-1.5 w-3 rounded-full bg-blue-500/30 transition-all duration-300 hover:bg-blue-400/50'
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
