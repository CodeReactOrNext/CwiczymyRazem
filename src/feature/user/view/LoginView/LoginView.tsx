import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { selectIsFetching } from "feature/user/store/userSlice";
import {
  logInViaEmail,
  logInViaGoogle,
} from "feature/user/store/userSlice.asyncThunk";
import { loginSchema } from "feature/user/view/LoginView/Login.schemas";
import { Form, Formik } from "formik";
import { useTranslation } from "hooks/useTranslation";
import { ChevronRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { useAppDispatch, useAppSelector } from "store/hooks";

interface logInCredentials {
  email: string;
  password: string;
}

const LoginView = () => {
  const { t } = useTranslation(["common", "login"]);
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);

  const googleLogInHandler = () => {
    dispatch(logInViaGoogle());
  };

  const isFetching = useAppSelector(selectIsFetching) === "email";
  const isGoogleFetching = useAppSelector(selectIsFetching) === "google";

  function onSubmit(credentials: logInCredentials) {
    dispatch(logInViaEmail(credentials));
  }

  const formikInitialValues = {
    email: "",
    password: "",
  };

  return (
    <div className='relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-zinc-950 text-foreground'>
      {/* Premium Background */}
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute left-1/2 top-0 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-[100%] bg-cyan-500/5 blur-[120px]' />

        <GuitarPatternBackground />
      </div>

      <div className='relative z-10 mt-4 w-full max-w-md p-4 sm:mt-0 sm:p-6'>
        <div className='flex flex-col gap-4 sm:gap-6'>
          {/* Header Section */}
          <div className='text-center'>
            <div className='mb-2 flex justify-center sm:mb-6'>
              <Image
                src='/images/logolight.svg'
                alt='Logo'
                width={56}
                height={56}
                className='h-10 w-10 sm:h-14 sm:w-14'
                priority
              />
            </div>
            <h1 className='mb-1 text-2xl font-bold tracking-tight text-white sm:mb-2 sm:text-3xl'>
              {t("login:title")}
            </h1>
            <p className='text-xs text-zinc-400 sm:text-sm'>
              {t("login:subtitle")}
            </p>
          </div>

          {/* Card */}
          <div className='overflow-hidden rounded-lg border border-white/5 bg-zinc-900/80 shadow-2xl'>
            <div className='p-2'>
              {/* Tab Switcher */}
              <div className='mb-4 flex rounded-lg border border-white/5 bg-zinc-900/50 p-1'>
                <Link
                  href='/login'
                  className='flex-1 rounded-lg border border-white/5 bg-zinc-800/80 py-2.5 text-center text-sm font-bold text-white shadow-sm transition-all'>
                  {t("login:submit_button")}
                </Link>
                <Link
                  href='/signup'
                  className='flex-1 rounded-lg py-2.5 text-center text-sm font-bold text-zinc-500 transition-all hover:bg-white/5 hover:text-zinc-300'>
                  {t("login:signup_link")}
                </Link>
              </div>

              <div className='px-4 pb-4'>
                <Formik
                  initialValues={formikInitialValues}
                  validationSchema={loginSchema}
                  onSubmit={onSubmit}>
                  {({ values, errors, touched, handleChange, handleBlur }) => (
                    <Form className='space-y-3 sm:space-y-4'>
                      {/* Email Field */}
                      <div className='space-y-2'>
                        <Label
                          htmlFor='email'
                          className='text-xs font-semibold text-zinc-400'>
                          {t("login:email_label")}
                        </Label>
                        <div className='group relative'>
                          <Mail className='absolute left-3 top-2.5 h-5 w-5 text-zinc-500 transition-colors group-focus-within:text-cyan-400' />
                          <Input
                            id='email'
                            name='email'
                            type='email'
                            value={values.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder='name@example.com'
                            className='h-11 rounded-lg border-white/10 bg-black/40 pl-10 text-white transition-all duration-300 placeholder:text-zinc-500 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10'
                          />
                        </div>
                        {errors.email && touched.email && (
                          <p className='text-xs font-medium text-red-400'>
                            {errors.email}
                          </p>
                        )}
                      </div>

                      {/* Password Field */}
                      <div className='space-y-2'>
                        <div className='flex items-center justify-between'>
                          <Label
                            htmlFor='password'
                            className='text-xs font-semibold text-zinc-400'>
                            {t("login:password_label")}
                          </Label>
                          <Link
                            href='/forgot-password'
                            className='text-[10px] font-bold text-cyan-500 transition-colors hover:text-cyan-400'>
                            {t("login:forgot_password")}
                          </Link>
                        </div>

                        <div className='group relative'>
                          <Lock className='absolute left-3 top-2.5 h-5 w-5 text-zinc-500 transition-colors group-focus-within:text-cyan-400' />
                          <Input
                            id='password'
                            name='password'
                            type={showPassword ? "text" : "password"}
                            value={values.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder='••••••••'
                            className='h-11 rounded-lg border-white/10 bg-black/40 pl-10 pr-10 text-white transition-all duration-300 placeholder:text-zinc-500 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10'
                          />
                          <button
                            type='button'
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                            className='absolute right-3 top-2.5 text-zinc-500 transition-colors hover:text-zinc-300'>
                            {showPassword ? (
                              <EyeOff className='h-5 w-5' />
                            ) : (
                              <Eye className='h-5 w-5' />
                            )}
                          </button>
                        </div>
                        {errors.password && touched.password && (
                          <p className='text-xs font-medium text-red-400'>
                            {errors.password}
                          </p>
                        )}
                      </div>

                      {/* Login Button */}
                      <div className='pt-2'>
                        <Button
                          type='submit'
                          size='lg'
                          disabled={isFetching}
                          className='w-full'>
                          {isFetching ? (
                            <Loader2 className='h-5 w-5 animate-spin' />
                          ) : (
                            <span className='flex items-center gap-2'>
                              {t("login:submit_button")}{" "}
                              <ChevronRight className='h-4 w-4' />
                            </span>
                          )}
                        </Button>
                      </div>
                    </Form>
                  )}
                </Formik>

                <div className='relative my-4 sm:my-6'>
                  <div className='absolute inset-0 flex items-center'>
                    <div className='w-full border-t border-white/10'></div>
                  </div>
                  <div className='relative flex justify-center text-xs'>
                    <span className='bg-zinc-900 px-2 text-zinc-400'>
                      {t("login:or_continue_with")}
                    </span>
                  </div>
                </div>

                <Button
                  type='button'
                  onClick={googleLogInHandler}
                  disabled={isGoogleFetching}
                  variant='outline'
                  className='h-11 w-full rounded-lg border-white/5 bg-zinc-900/50 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white'>
                  <span className='flex items-center justify-center gap-2'>
                    {isGoogleFetching ? (
                      <Loader2 className='h-5 w-5 animate-spin' />
                    ) : (
                      <FcGoogle className='h-5 w-5' />
                    )}
                    {t("login:google_button")}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
