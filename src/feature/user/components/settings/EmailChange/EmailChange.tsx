import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import React, { useEffect, useState } from "react";
import { Form, Formik, FormikErrors, useFormikContext } from "formik";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { UserInfo } from "firebase-admin/lib/auth/user-record";

import ReauthForm from "../ReauthForm";
import FieldBox from "layouts/SettingsLayout/components/FieldBox";

import { updateCredsSchema } from "feature/user/view/SettingsView/Settings.schemas";

import { selectIsFetching } from "feature/user/store/userSlice";
import {
  getUserProvider,
  updateUserEmail,
} from "feature/user/store/userSlice.asyncThunk";
import { updateUserInterface as UpdatedUserCredentials } from "types/api.types";

const EmailChange = () => {
  const { t } = useTranslation(["common", "toast"]);
  const [newEmail, setNewEmail] = useState("");
  const [reauthFormVisible, setReauthFormVisible] = useState(false);
  const [userProviderData, setUserProviderData] = useState<UserInfo>();

  const formikInitialValues = {
    email: "",
  };

  const isFetching = useAppSelector(selectIsFetching) === "updateData";
  const dispatch = useAppDispatch();

  const emailChangeHandler = ({
    values,
    errors,
  }: {
    values: {
      email: string;
    };
    errors: FormikErrors<{
      email: string;
    }>;
  }) => {
    if (values.email && !errors.email) {
      setNewEmail(values.email);
      toast.info(t("toast:info.log_in_again"));
      setReauthFormVisible(true);
    }
  };
  const changeCredentialsHandler = async (data: UpdatedUserCredentials) => {
    const updateData = {
      ...data,
      newEmail,
    };
    if (updateData.newEmail) {
      await dispatch(updateUserEmail(updateData)).then(() => {
        setNewEmail("");
        setReauthFormVisible(false);
      });
    }
  };
  useEffect(() => {
    dispatch(getUserProvider()).then((data) => {
      setUserProviderData(data.payload as UserInfo);
    });
  }, [dispatch, newEmail]);

  return (
    <>
      <Formik
        initialValues={formikInitialValues}
        validationSchema={updateCredsSchema}
        onSubmit={() => {}}>
        {({ values, errors }) => (
          <FieldBox
            title={"Email"}
            submitHandler={() => emailChangeHandler({ values, errors })}
            errors={errors}
            values={values}
            inputName={"email"}
            isFetching={isFetching}
            value={userProviderData?.email}
          />
        )}
      </Formik>

      {reauthFormVisible && (
        <ReauthForm
          closeBackdrop={() => setReauthFormVisible(false)}
          changeCredentialsHandler={changeCredentialsHandler}
        />
      )}
    </>
  );
};

export default EmailChange;
