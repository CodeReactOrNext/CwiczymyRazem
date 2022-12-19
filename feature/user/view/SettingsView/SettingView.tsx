import Avatar from "components/Avatar";
import Button from "components/Button";
import Input from "components/Input";
import {
  selectUserAuth,
  selectUserData,
  updateAccount,
} from "feature/user/store/userSlice";
import { Form, Formik } from "formik";
import FormLayout from "layouts/FormLayout";
import MainLayout from "layouts/MainLayout";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaUserAlt } from "react-icons/fa";
import { changeDataSchema } from "schemas/changeData";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { signUpCredentials } from "../SingupView/SingupView";

const SettingsView = () => {
  const { t } = useTranslation(["common", "settings"]);
  const [nameInputVisible, setNameInputVisible] = useState(false);

  const dispatch = useAppDispatch();

  const changeNameHandler = (data: signUpCredentials) => {
    console.log(data);
    dispatch(updateAccount(data));
  };

  const showNameInputHandler = () => {
    setNameInputVisible(true);
  };

  const formikInitialValues = {
    login: "",
    email: "",
    password: "",
    repeat_password: "",
  };

  return (
    <MainLayout subtitle='Edytuj Profil' variant='primary'>
      <div className='flex max-w-[800px] flex-col p-6'>
        <div className='flex flex-row gap-2 p-4  text-2xl'>
          <Avatar name='Dummy name' lvl={28} />
          <button className='text-lg text-main'>Edytuj</button>
        </div>
        <hr className='border-main-opposed-400' />
        <Formik
          initialValues={formikInitialValues}
          validationSchema={changeDataSchema}
          onSubmit={changeNameHandler}>
          <Form>
            <>
              <div className='flex flex-col'>
                <div className='flex flex-row gap-2 p-4 text-2xl'>
                  <p className='text-tertiary'>Nick:</p>
                  <p>NazwaUżytwkonika</p>
                  {!nameInputVisible && (
                    <button
                      type='button'
                      onClick={showNameInputHandler}
                      className='text-lg text-main'>
                      Edytuj
                    </button>
                  )}
                </div>
                {nameInputVisible && (
                  <div className='flex h-full w-full gap-2 pb-5'>
                    <Input
                      Icon={FaUserAlt}
                      placeholder={"Nowy nick"}
                      name={"login"}
                    />
                    <Button type='submit'>Zapisz</Button>
                  </div>
                )}
              </div>
              <hr className='border-main-opposed-400' />
              <div className='flex flex-row gap-2 p-4 text-2xl'>
                <p className='text-tertiary'>E-mail:</p>
                <p>mail@mail.pl</p>
                <button type='button' className='items-end text-lg text-main'>
                  Edytuj
                </button>
              </div>
              <hr className='border-main-opposed-400' />
              <div className='flex  flex-row gap-2 p-4 text-2xl'>
                <p className='text-tertiary'>Hasło</p>
                <button type='button' className='text-lg text-main'>
                  Edytuj
                </button>
              </div>
            </>
          </Form>
        </Formik>
        <hr className='border-main-opposed-400' />

        <div className='flex flex-col gap-2  p-4 text-2xl'>
          <p className='text-tertiary'>Restart Statystyk</p>
          <p className='text-lg'>
            Uwaga. Wciśnięcie tego spowoduje restart wszystkich twoich
            statystyk.
          </p>
          <button className='text-lg text-main'>Restartuj</button>
        </div>
        <hr className='border-main-opposed-400' />
        <div className='flex flex-col gap-2 p-4 text-2xl'>
          <p className='text-tertiary'>Anonimowość </p>
          <p className='text-lg'>
            Czy chcesz aby twój nick pozostał anonimowy w ledbordzie?
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default SettingsView;
