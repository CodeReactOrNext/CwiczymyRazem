import { useDispatch } from "react-redux";
import Button from "components/Button";
import Input from "components/Input";
import MainLayout from "layouts/MainLayout";
import {
  createUserDocumentFromAuth,
  signInWithGooglePopup,
} from "utils/firebase/firebase.utils";
import { addUserAuth, addUserName } from "../../store/userSlice";
import { FaUserAlt, FaLock } from "react-icons/fa";
import GoogleButton from "components/GoogleButton";
import FormLayout from "layouts/FormLayout";
import Link from "next/link";

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
      <FormLayout>
        <>
          <Input Icon={FaUserAlt} placeholder={"Login"} />
          <Input Icon={FaLock} placeholder={"Hasło"} />
          <div className='flex space-x-1 '>
            <Button>Loguj</Button>
            <Link href='/signup'>
              <Button variant='secondary'>Rejestracja</Button>
            </Link>
          </div>
          <GoogleButton onClick={logGoogleUser}>
            Zaloguj się z Google
          </GoogleButton>
        </>
      </FormLayout>
    </MainLayout>
  );
};

export default LoginView;
