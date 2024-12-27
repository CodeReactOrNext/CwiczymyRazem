import React from "react";

type Category = "new" | "bugfix" | "improvement";

export interface ChangelogEntry {
  date: string;
  category: Category;
  description: string;
}

interface ChangelogProps {
  entries: ChangelogEntry[];
}

const categoryStyles: Record<Category, string> = {
  new: "border-green-500/60 text-white",
  bugfix: "border-red-500/60 text-white",
  improvement: "border-blue-500/60 text-white",
};

const Changelog = ({ entries }: ChangelogProps) => {
  return (
    <div className='flex flex-col items-center py-10'>
      <div className='w-full  space-y-3'>
        {entries.map((entry, index) => (
          <div
            key={index}
            className='border border-second-400/60 bg-main-opposed-bg p-5 transition-transform radius-default '>
            <div className='mb-4 flex items-center justify-between'>
              <span
                className={cn(
                  "border-b px-3 py-1 text-[12px] font-medium",
                  categoryStyles[entry.category]
                )}>
                {entry.category.toUpperCase()}
              </span>
              <span className='text-sm text-gray-400'>{entry.date}</span>
            </div>
            <p className='p-2 text-gray-300 md:w-[90%]'>{entry.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Changelog;

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
