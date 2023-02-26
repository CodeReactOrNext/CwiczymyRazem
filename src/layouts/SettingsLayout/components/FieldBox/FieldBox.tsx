import Button from "components/UI/Button";
import Input from "components/UI/Input";
import { useTranslation } from "react-i18next";
import { IconType } from "react-icons";

export interface FieldBoxProps {
  title: string;
  Icon?: IconType;
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
  Icon,
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
      <div className='flex h-full w-full items-center gap-2'>
        {Icon && <Icon size={35} />}
        <Input placeholder={value!} name={inputName} />
        <Button
          variant='small'
          loading={isFetching}
          disabled={Boolean(!values[inputName] || errors[inputName])}
          onClick={submitHandler}
          type='button'>
          {t("settings:save")}
        </Button>
      </div>
    </div>
  );
};

export default FieldBox;
