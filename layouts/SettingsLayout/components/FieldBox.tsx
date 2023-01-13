import Button from "components/Button";
import Input from "components/Input";
import { useTranslation } from "react-i18next";

export interface FieldBoxProps {
  title: string;
  value: string | undefined | null;
  inputName: string;
  isFetching: boolean;
  submitHandler: () => void;
  values: any;
  errors: any;
}

const FieldBox = ({
  value,
  title,
  inputName,
  isFetching,
  submitHandler,
  values,
  errors,
}: FieldBoxProps) => {
  const { t } = useTranslation(["common", "settings", "toast"]);
  return (
    <div className='flex flex-col p-4 '>
      <p className='text-2xl text-tertiary'>{title}</p>
      <div className='flex flex-row items-center gap-2 text-xl '></div>

      <div className='flex h-full w-full gap-2 pb-5'>
        <Input placeholder={value!} name={inputName} />
        <Button
          variant='small'
          loading={isFetching}
          disabled={Boolean(!values[inputName] || errors[inputName])}
          onClick={submitHandler}
          type='submit'>
          {t("settings:save")}
        </Button>
      </div>
    </div>
  );
};

export default FieldBox;
