import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import { selectIsFetching } from "feature/user/store/userSlice";
import { loginSchema } from "feature/user/view/LoginView/Login.schemas";
import { Form, Formik } from "formik";
import { useTranslation } from "hooks/useTranslation";
import { Loader2 } from "lucide-react";
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
    <Dialog open onOpenChange={(open) => !open && closeBackdrop()}>
      <DialogContent className='gap-6 sm:max-w-sm'>
        <DialogHeader className='space-y-2 pr-10 text-left'>
          <DialogTitle className='text-lg font-bold text-white'>
            {t("settings:reauth_title")}
          </DialogTitle>
          <DialogDescription className='text-sm text-zinc-400'>
            {t("settings:reauth_description")}
          </DialogDescription>
        </DialogHeader>
        <Formik
          initialValues={{
            email: "",
            password: "",
            login: "",
            emailConsent: false,
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

              <Button type='submit' size='lg' className='w-full' disabled={isFetching}>
                {isFetching && (
                  <Loader2 className='animate-spin' />
                )}
                {t("common:button.sign_in")}
              </Button>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default ReauthForm;
