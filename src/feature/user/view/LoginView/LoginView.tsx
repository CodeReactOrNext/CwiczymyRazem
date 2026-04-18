import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import { selectIsFetching } from "feature/user/store/userSlice";
import {
  logInViaEmail,
  logInViaGoogle,
} from "feature/user/store/userSlice.asyncThunk";
import { loginSchema } from "feature/user/view/LoginView/Login.schemas";
import { Form, Formik } from "formik";
import { useTranslation } from "hooks/useTranslation";
import {
  ChevronRight,
  Eye,
  EyeOff,
  Guitar,
  Headphones,
  Loader2,
  Lock,
  Mail,
  Music,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { TbGuitarPick } from "react-icons/tb";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { firebaseSendPasswordResetEmail } from "utils/firebase/client/firebase.utils";


export interface logInCredentials {
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

  const handleForgotPassword = async (email: string) => {
    if (!email) {
      toast.error(t("login:enter_email_error"));
      return;
    }

    try {
      await firebaseSendPasswordResetEmail(email);
      toast.success(t("login:reset_password_success"));
    } catch  {
      toast.error(t("login:reset_password_error"));
    }
  };


  const formikInitialValues = {
    email: "",
    password: "",
  };

  return (
    <div className='relative min-h-screen w-full overflow-hidden bg-zinc-950 text-foreground flex items-center justify-center'>
      {/* Premium Background */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[60vh] w-[80vw] bg-cyan-500/5 blur-[120px] rounded-[100%]' />
        
        {/* Tiled Pattern Background */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
          <defs>
            <pattern id="auth-bg-pattern" x="0" y="0" width="160" height="160" patternUnits="userSpaceOnUse" patternTransform="rotate(-15)">
              <g transform="translate(20, 20) scale(1)">
                 <Guitar size={32} className="text-white" strokeWidth={1.5} />
              </g>
              <g transform="translate(100, 40) scale(1)">
                 <Music size={28} className="text-white" strokeWidth={1.5} />
              </g>
              <g transform="translate(40, 100) scale(1)">
                 <TbGuitarPick size={30} className="text-white" strokeWidth={1.5} />
              </g>
              <g transform="translate(110, 110) scale(1)">
                 <Headphones size={32} className="text-white" strokeWidth={1.5} />
              </g>
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#auth-bg-pattern)" />
        </svg>
      </div>

      <div className='relative z-10 w-full max-w-md p-4 sm:p-6 mt-4 sm:mt-0'>
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* Header Section */}
          <div className="text-center">
             <div className="flex justify-center mb-2 sm:mb-6">
                <Image
                  src='/images/logolight.svg'
                  alt='Logo'
                  width={56}
                  height={56}
                  className='h-10 w-10 sm:h-14 sm:w-14' priority
                />
             </div>
             <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1 sm:mb-2">
               {t("login:title")}
             </h1>
             <p className="text-zinc-400 text-xs sm:text-sm">
               {t("login:subtitle")}
             </p>
          </div>

          {/* Card */}
          <div className="rounded-lg glass-card overflow-hidden shadow-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-xl">
            <div className="p-2">
              {/* Tab Switcher */}
              <div className="flex p-1 bg-zinc-900/50 rounded-lg mb-4 border border-white/5">
                <Link 
                  href="/login" 
                  className="flex-1 py-2.5 text-center text-sm font-bold transition-all bg-zinc-800/80 text-white rounded-lg shadow-sm border border-white/5"
                >
                  {t("login:submit_button")}
                </Link>
                <Link 
                  href="/signup" 
                  className="flex-1 py-2.5 text-center text-sm font-bold transition-all text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-white/5"
                >
                  {t("login:signup_link")}
                </Link>
              </div>

            <div className="px-4 pb-4">
            <Formik
              initialValues={formikInitialValues}
              validationSchema={loginSchema}
              onSubmit={onSubmit}>
              {({ values, errors, touched, handleChange, handleBlur }) => (
                <Form className='space-y-3 sm:space-y-4'>
                  {/* Email Field */}
                    <div className="space-y-2">
                        <Label
                          htmlFor='email'
                          className='text-xs font-semibold text-zinc-400'>
                          {t("login:email_label")}
                        </Label>
                        <div className='relative group'>
                          <Mail className='absolute left-3 top-2.5 h-5 w-5 text-zinc-500 transition-colors group-focus-within:text-cyan-400' />
                          <Input
                            id='email'
                            name='email'
                            type='email'
                            value={values.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder='name@example.com'
                            className='pl-10 h-11 bg-zinc-900/80 border-white/5 rounded-lg focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all duration-200 text-white placeholder:text-zinc-600'
                          />
                        </div>
                        {errors.email && touched.email && (
                          <p className='text-xs text-red-400 font-medium'>
                            {errors.email}
                          </p>
                        )}
                    </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                         <Label
                          htmlFor='password'
                          className='text-xs font-semibold text-zinc-400'>
                          {t("login:password_label")}
                        </Label>
                        <button
                          type="button"
                          onClick={() => handleForgotPassword(values.email)}
                          className="text-[10px] text-cyan-500 hover:text-cyan-400 font-bold transition-colors"
                        >
                          {t("login:forgot_password")}
                        </button>
                    </div>

                    <div className='relative group'>
                      <Lock className='absolute left-3 top-2.5 h-5 w-5 text-zinc-500 transition-colors group-focus-within:text-cyan-400' />
                      <Input
                        id='password'
                        name='password'
                        type={showPassword ? "text" : "password"}
                        value={values.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder='••••••••'
                        className='pl-10 pr-10 h-11 bg-zinc-900/80 border-white/5 rounded-lg focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all duration-200 text-white placeholder:text-zinc-600'
                      />
                      <button
                        type='button'
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className='absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors'>
                        {showPassword ? (
                          <EyeOff className='h-5 w-5' />
                        ) : (
                          <Eye className='h-5 w-5' />
                        )}
                      </button>
                    </div>
                    {errors.password && touched.password && (
                      <p className='text-xs text-red-400 font-medium'>
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Login Button */}
                  <div className="pt-2">
                    <Button
                      type='submit'
                      size='lg'
                      disabled={isFetching}
                      className='w-full'>
                        {isFetching ? (
                          <Loader2 className='h-5 w-5 animate-spin' />
                        ) : (
                          <span className="flex items-center gap-2">
                            {t("login:submit_button")} <ChevronRight className="w-4 h-4" />
                          </span>
                        )}
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>

            <div className="relative my-4 sm:my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="bg-zinc-900 px-2 text-zinc-400">{t("login:or_continue_with")}</span>
                </div>
            </div>

            <Button
                type='button'
                onClick={googleLogInHandler}
                disabled={isGoogleFetching}
                variant='outline'
                className='w-full border-white/5 rounded-lg bg-zinc-900/50 hover:bg-zinc-800 hover:text-white transition-colors h-11 text-zinc-300'>
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
