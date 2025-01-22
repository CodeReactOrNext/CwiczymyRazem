import { useField } from "formik";
import type { IconType } from "react-icons";

const Input = ({
  name,
  placeholder,
  Icon,
}: {
  name: string;
  placeholder: string;
  Icon: IconType;
}) => {
  const [field, meta] = useField(name);
  return (
    <label
      className={`input input-bordered flex w-full items-center gap-2
    ${meta.error ? "border border-error" : ""}`}>
      <Icon />

      <input
        type='text'
        className='w-full'
        placeholder={placeholder}
        {...field}></input>
    </label>
  );
};
export default Input;
