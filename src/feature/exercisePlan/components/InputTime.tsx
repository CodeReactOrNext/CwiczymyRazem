import { useField } from "formik";
import type { IconType } from "react-icons";

const InputTime = ({ name, Icon }: { Icon: IconType; name: string }) => {
  const [fieldHours, meta] = useField(name);
  return (
    <div>
      <label
        className={`input input-bordered flex w-full items-center gap-2
  ${meta.error ? "border border-error" : ""}`}>
        <Icon />
        <input type='text' className='w-full' {...fieldHours}></input>
      </label>
    </div>
  );
};
export default InputTime;
