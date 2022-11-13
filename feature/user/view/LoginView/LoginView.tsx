import { useDispatch } from "react-redux";
import Button from "../../../../components/Button";
import Input from "../../../../components/Input";
import MainLayout from "../../../../layouts/MainLayout";
import {
  createUserDocumentFromAuth,
  signInWithGooglePopup,
} from "../../../../utils/firebase/firebase.utils";
import { addUserAuth, addUserName } from "../../store/userSlice";
import { FaUserAlt, FaLock } from "react-icons/fa";
import GoogleButton from "../../../../components/GoogleButton";
import LoginLayout from "../../../../layouts/LoginLayout";

const LoginView = () => {
  const dispatch = useDispatch();
  const logGoogleUser = async () => {
    const { user } = await signInWithGooglePopup();
    dispatch(addUserName(user.displayName));
    const userAuth = await createUserDocumentFromAuth(user);
    dispatch(addUserAuth(userAuth));
  };

  return (
    <MainLayout subtitle='Ćwicz, raportuj, zdobywaj punkty!' variant='primary'>
      <LoginLayout>
        <>
          <Input Icon={FaUserAlt} placeholder={"Login"} />
          <Input Icon={FaLock} placeholder={"Hasło"} />
          <div className='flex space-x-1 '>
            <Button>Loguj</Button>
            <Button variant='secondary'>Rejestracja</Button>
          </div>
          <GoogleButton onClick={logGoogleUser}>
            Zaloguj się z Google
          </GoogleButton>
        </>
      </LoginLayout>
    </MainLayout>
  );
};

export default LoginView;
