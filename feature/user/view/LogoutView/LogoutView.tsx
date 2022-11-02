import { useDispatch } from "react-redux";
import { logOut } from "../../store/userSlice";

const LogoutView = () => {
  const dispatch = useDispatch();
  return (
    <button
      onClick={() => {
        dispatch(logOut());
      }}>
      Log Out
    </button>
  );
};

export default LogoutView;
