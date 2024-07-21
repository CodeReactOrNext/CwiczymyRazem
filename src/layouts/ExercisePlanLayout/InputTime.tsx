import { useField } from "formik";
import { IconType } from "react-icons";

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
      <div className='label'>
        <span className='label-text'>Czas ćwiczenia w minuach</span>
      </div>
    </div>
  );
};
export default InputTime;
