import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import { selectIsFetching } from "feature/user/store/userSlice";
import { updateUserPassword } from "feature/user/store/userSlice.asyncThunk";
import { updateCredsSchema } from "feature/user/view/SettingsView/Settings.schemas";
import { Form, Formik } from "formik";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { updateUserInterface as UpdatedUserCredentials } from "types/api.types";
import ReauthForm from "../ReauthForm";

const PasswordChange = () => {
  const { t } = useTranslation(["common", "toast", "settings"]);
  const [newPassword, setNewPassword] = useState("");
  const [reauthFormVisible, setReauthFormVisible] = useState(false);
  const isFetching = useAppSelector(selectIsFetching) === "updateData";
  const dispatch = useAppDispatch();

  return (
    <>
      <Formik
        initialValues={{
          password: "",
          repeat_password: "",
        }}
        validationSchema={updateCredsSchema}
        onSubmit={(values) => {
          if (values.password && values.repeat_password) {
            setNewPassword(values.password);
            toast.info(t("toast:info.log_in_again"));
            setReauthFormVisible(true);
          }
        }}>
        {({ values, errors, handleChange, handleBlur }) => (
          <Form className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='password'>{t("settings:new_password")}</Label>
              <Input
                id='password'
                name='password'
                type='password'
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.password}
              />
              {errors.password && (
                <p className='text-sm text-destructive'>{errors.password}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='repeat_password'>
                {t("settings:repeat_new_password")}
              </Label>
              <Input
                id='repeat_password'
                name='repeat_password'
                type='password'
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.repeat_password}
              />
              {errors.repeat_password && (
                <p className='text-sm text-destructive'>
                  {errors.repeat_password}
                </p>
              )}
            </div>

            <Button
              type='submit'
              disabled={
                !values.password ||
                !values.repeat_password ||
                !!errors.password ||
                !!errors.repeat_password ||
                isFetching
              }>
              {isFetching && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {t("settings:save")}
            </Button>
          </Form>
        )}
      </Formik>

      {reauthFormVisible && (
        <ReauthForm
          closeBackdrop={() => setReauthFormVisible(false)}
          changeCredentialsHandler={async (data) => {
            const updateData = { ...data, newPassword };
            if (updateData.newPassword) {
              await dispatch(updateUserPassword(updateData)).then(() => {
                setNewPassword("");
                setReauthFormVisible(false);
              });
            }
          }}
        />
      )}
    </>
  );
};

export default PasswordChange;
