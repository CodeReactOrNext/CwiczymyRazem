import { useField } from "formik";
import { useTranslation } from "hooks/useTranslation";
import type { IconType } from "react-icons/lib";

export interface InputProps {
  Icon?: IconType;
  placeholder?: string;
  id?: string;
  name: string;
  type?: string;
}


const ErrorWrapper = ({ error }: { error: string }) => {
  const { t } = useTranslation();
  return <>{t(error)}</>;
};

const Input = ({ Icon, placeholder, id, name, type = "text" }: InputProps) => {
  const [field, meta] = useField(name);

  return (
    <div className='relative flex w-full max-w-sm flex-row items-center justify-center '>
      {Icon && (
        <div className='z-10 flex h-[50px] w-[50px] items-center justify-center bg-surface-elevated rounded-xl xs:h-[60px] xs:w-[60px]'>
          <Icon size='24' />
        </div>
      )}
      <input
        id={id}
        className={`w-full bg-surface-base p-1 pl-3 text-xl text-dark-50 focus:outline-none focus:ring focus:ring-cyan-400 xs:p-2 ${
          meta.touched && meta.error
            ? "ring ring-state-error focus:ring focus:ring-state-error"
            : ""
        }`}
        type={type}
        placeholder={placeholder}
        {...field}
      />
      {meta.touched && meta.error ? (
        <div className='error absolute  right-0 -bottom-6 font-medium'>
          <ErrorWrapper error={meta.error as string} />
        </div>
      ) : null}
    </div>
  );
};

export default Input;
