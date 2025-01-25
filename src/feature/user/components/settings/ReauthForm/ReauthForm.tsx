import { Button } from "assets/components/ui/button";
import { Card, CardContent } from "assets/components/ui/card";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import Backdrop from "components/Backdrop";
import { selectIsFetching } from "feature/user/store/userSlice";
import { loginSchema } from "feature/user/view/LoginView/Login.schemas";
import { Form, Formik } from "formik";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "store/hooks";
import type { updateUserInterface as UpdatedUserCredentials } from "types/api.types";

interface ReauthFormInterface {
  changeCredentialsHandler: (data: UpdatedUserCredentials) => Promise<void>;
  closeBackdrop: () => void;
}

const ReauthForm = ({
  changeCredentialsHandler,
  closeBackdrop,
}: ReauthFormInterface) => {
  const { t } = useTranslation(["common", "toast", "settings"]);
  const isFetching = useAppSelector(selectIsFetching) === "updateData";

  return (
    <Backdrop onClick={closeBackdrop} selector='overlays'>
      <Card className='w-[400px]'>
        <CardContent>
          <Formik
            initialValues={{
              email: "",
              password: "",
              login: "",
              repeat_password: "",
            }}
            validationSchema={loginSchema}
            onSubmit={changeCredentialsHandler}>
            {({ errors, touched, handleChange, handleBlur }) => (
              <Form className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='email'>{t("common:input.email")}</Label>
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {touched.email && errors.email && (
                    <p className='text-sm text-destructive'>{errors.email}</p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='password'>{t("common:input.password")}</Label>
                  <Input
                    id='password'
                    name='password'
                    type='password'
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {touched.password && errors.password && (
                    <p className='text-sm text-destructive'>
                      {errors.password}
                    </p>
                  )}
                </div>

                <Button type='submit' disabled={isFetching}>
                  {isFetching && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  {t("common:button.sign_in")}
                </Button>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </Backdrop>
  );
};

export default ReauthForm;
