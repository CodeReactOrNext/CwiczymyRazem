import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import { selectIsFetching } from "feature/user/store/userSlice";
import {
  getUserProvider,
  updateUserEmail,
} from "feature/user/store/userSlice.asyncThunk";
import { updateCredsSchema } from "feature/user/view/SettingsView/Settings.schemas";
import type { UserInfo } from "firebase-admin/lib/auth/user-record";
import { Formik } from "formik";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { updateUserInterface as UpdatedUserCredentials } from "types/api.types";
import ReauthForm from "../ReauthForm";

const EmailChange = () => {
  const { t } = useTranslation(["common", "settings", "toast"]);
  const [newEmail, setNewEmail] = useState("");
  const [reauthFormVisible, setReauthFormVisible] = useState(false);
  const [userProviderData, setUserProviderData] = useState<UserInfo>();

  const isFetching = useAppSelector(selectIsFetching) === "updateData";
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getUserProvider()).then((data) => {
      setUserProviderData(data.payload as UserInfo);
    });
  }, [dispatch, newEmail]);

  return (
    <div className='space-y-4'>
      <Formik
        initialValues={{ email: "" }}
        validationSchema={updateCredsSchema}
        onSubmit={(values) => {
          if (values.email) {
            setNewEmail(values.email);
            toast.info(t("toast:info.log_in_again"));
            setReauthFormVisible(true);
          }
        }}>
        {({ values, errors, handleChange, handleBlur, handleSubmit }) => (
          <form onSubmit={handleSubmit} className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <div className='flex space-x-2'>
              <Input
                id='email'
                name='email'
                type='email'
                placeholder={userProviderData?.email || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.email}
                className='flex-1'
              />
              <Button
                type='submit'
                disabled={isFetching || !values.email || !!errors.email}>
                {t("settings:save")}
              </Button>
            </div>
            {errors.email && (
              <p className='text-sm text-destructive'>{errors.email}</p>
            )}
          </form>
        )}
      </Formik>

      {reauthFormVisible && (
        <ReauthForm
          closeBackdrop={() => setReauthFormVisible(false)}
          changeCredentialsHandler={async (data) => {
            const updateData = { ...data, newEmail };
            if (updateData.newEmail) {
              await dispatch(updateUserEmail(updateData)).then(() => {
                setNewEmail("");
                setReauthFormVisible(false);
              });
            }
          }}
        />
      )}
    </div>
  );
};

export default EmailChange;
