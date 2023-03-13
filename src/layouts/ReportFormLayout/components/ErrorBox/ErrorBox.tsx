import { FaTimesCircle } from "react-icons/fa";

const ErrorBox = () => (
  <div className='flex flex-row gap-3 text-xl'>
    <FaTimesCircle className="text-error-200" />
    <p>Wpisałeś niepoprawny czas</p>
  </div>
);

export default ErrorBox;
