import type { NextPage } from "next";
import { selectUserAuth } from "../../feature/user/store/userSlice";
import LoginView from "../../feature/user/view/LoginView/LoginView";
import LogoutView from "../../feature/user/view/LogoutView/LogoutView";
import { useAppSelector } from "../../store/hooks";

const LoginPage: NextPage = () => {
  const isLoggedIn = useAppSelector(selectUserAuth);
  return (
    <div>
      <h1>LoginPage</h1>
      {isLoggedIn ? <LogoutView /> : <LoginView />}
    </div>
  );
};

export default LoginPage;
