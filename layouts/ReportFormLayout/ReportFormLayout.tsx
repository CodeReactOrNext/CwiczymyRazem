import React from "react";

interface Props {
  children: React.ReactNode;
}

export default function ReportFormLayout({ children }: Props) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        console.log("here should be onSubmit");
      }}
      action=''
      className='grid max-w-4xl grid-cols-1 grid-rows-[3fr_3fr_1fr] items-end justify-center gap-3 justify-self-center pb-3 md:grid-cols-2 md:grid-rows-[5fr_2fr] md:gap-y-4 lg:grid-cols-1 lg:grid-rows-[3fr_3fr_1fr] xl:grid-cols-2 xl:grid-rows-[5fr_2fr]'>
      {children}
    </form>
  );
}
