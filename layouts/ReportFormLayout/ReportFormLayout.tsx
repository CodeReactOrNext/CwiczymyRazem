import { Form } from "formik";

interface Props {
  children: React.ReactNode;
}

export default function ReportFormLayout({ children }: Props) {
  return (
    <Form className='flex flex-col items-center gap-10 text-mainText'>
      {children}
    </Form>
  );
}
