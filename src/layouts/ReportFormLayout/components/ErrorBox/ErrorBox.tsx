import { FaTimesCircle } from "react-icons/fa";

const ErrorBox = () => (
  <div className='flex flex-row gap-3 text-xl text-red-400'>
    <FaTimesCircle className='text-red-400' />
    <p>Wpisałeś niepoprawny czas</p>
  </div>
);

export default ErrorBox;
