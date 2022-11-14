import { useDispatch } from "react-redux";
import Button from "components/Button";
import Input from "components/Input";
import MainLayout from "\layouts/MainLayout";
import { FaUserAlt, FaLock, FaAt } from "react-icons/fa";
import FormLayout from "layouts/FormLayout";

const SingupView = () => {
  return (
    <MainLayout subtitle='Ćwicz, raportuj, zdobywaj punkty!' variant='primary'>
      <FormLayout>
        <>
          <Input Icon={FaUserAlt} placeholder={"Nick"} />
          <Input Icon={FaAt} placeholder={"Email"} />
          <Input Icon={FaLock} placeholder={"Hasło"} />
          <Input Icon={FaLock} placeholder={"Powtórz hasło"} />
          <div className='flex space-x-1 '>
            <Button>Zarejestruj się</Button>
          </div>
        </>
      </FormLayout>
    </MainLayout>
  );
};

export default SingupView;
