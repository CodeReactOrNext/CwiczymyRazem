interface Props {
  children: React.ReactNode;
}

export default function ReportFormLayout({ children }: Props) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
      }}
      action=''
      className='flex flex-col items-center gap-10 text-mainText'>
      {children}
    </form>
  );
}
