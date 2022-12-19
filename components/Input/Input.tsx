import { useField } from "formik";
import { useTranslation } from "react-i18next";
import { IconType } from "react-icons/lib";
import { TFuncKey } from "i18next";

export interface InputProps {
  Icon?: IconType;
  placeholder?: string;
  id?: string;
  name: string;
  type?: string;
}

function ErrorWrapper({ error }: { error: TFuncKey }) {
  const { t } = useTranslation();
  return <>{t(error)}</>;
}

const Input = ({ Icon, placeholder, id, name, type = "text" }: InputProps) => {
  const [field, meta] = useField(name);

  return (
    <div className='relative flex w-full max-w-sm flex-row items-center justify-center'>
      {Icon && (
        <div className='z-10 flex h-[50px] w-[50px] items-center justify-center bg-main-opposed xs:h-[60px] xs:w-[60px]'>
          <Icon size='24' />
        </div>
      )}
      <input
        id={id}
        className={`w-full bg-tertiary p-1 pl-3 text-xl text-main-opposed focus:outline-none focus:ring focus:ring-main-opposed xs:p-2 ${
          meta.touched && meta.error
            ? "ring ring-error-500 focus:ring focus:ring-error-500"
            : ""
        }`}
        type={type}
        placeholder={placeholder}
        {...field}
      />
      {meta.touched && meta.error ? (
        <div className='error absolute  right-0 -bottom-5 font-medium'>
          <ErrorWrapper error={meta.error as TFuncKey} />
        </div>
      ) : null}
    </div>
  );
};

export default Input;
