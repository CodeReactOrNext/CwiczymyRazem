import { Field, useField } from "formik";
import { IconType } from "react-icons";

const Select = ({ name, Icon }: { name: string; Icon: IconType }) => {
  const [field] = useField(name);
  return (
    <label className='form-control max-w-xs'>
      <select {...field} className='select select-bordered w-full max-w-xs'>
        <option value='technique'>Technika</option>
        <option value='theory'>Teoria</option>
        <option value='hearing'>Słuch</option>
        <option value='creativity'>Kreatywność</option>
      </select>
      <div className='label'>
        <span className='label-text'>Wybierz Kategorie</span>
      </div>
    </label>
  );
};
export default Select;
