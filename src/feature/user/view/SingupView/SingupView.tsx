import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import Image from "next/image";
import { selectIsFetching } from "feature/user/store/userSlice";
import {
  createAccount,
  logInViaGoogle,
} from "feature/user/store/userSlice.asyncThunk";
import { signupSchema } from "feature/user/view/SingupView/SignUp.schemas";
import { Form, Formik } from "formik";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Loader2,
  Eye,
  EyeOff,
  ChevronRight,
  ArrowLeft,
  Shield,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FcGoogle } from "react-icons/fc";
import { useAppDispatch, useAppSelector } from "store/hooks";

export interface SignUpCredentials {
  login: string;
  email: string;
  password: string;
  repeat_password: string;
}

const SingupView = () => {
  const { t } = useTranslation(["common", "signup"]);
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const isFetching = useAppSelector(selectIsFetching) === "createAccount";
  const isGoogleFetching = useAppSelector(selectIsFetching) === "google";

  const formikInitialValues = {
    login: "",
    email: "",
    password: "",
    repeat_password: "",
  };

  const onSubmit = (credentials: SignUpCredentials) => {
    dispatch(createAccount(credentials));
  };

  const googleLogInHandler = () => {
    dispatch(logInViaGoogle());
  };

  return (
    <div className='relative min-h-screen w-full overflow-hidden bg-zinc-950 text-foreground flex items-center justify-center'>
      {/* Premium Background */}
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute -left-[10%] -top-[10%] h-[40vh] w-[40vh] rounded-full bg-cyan-500/10 blur-[120px]' />
        <div className='absolute -right-[10%] -bottom-[10%] h-[40vh] w-[40vh] rounded-full bg-cyan-800/10 blur-[120px]' />
      </div>

      <div className='relative z-10 w-full max-w-md p-6'>
         <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className='mb-6'>
            <div className='flex items-center justify-between'>
              <Link
                href='/login'
                className='group inline-flex items-center gap-2 text-sm text-zinc-400 transition-all duration-300 hover:text-cyan-400'>
                <ArrowLeft className='h-4 w-4 transition-transform group-hover:-translate-x-1' />
                {t("signup:back_to_login")}
              </Link>
              <Link
                href='/'
                className='text-sm text-zinc-500 hover:text-zinc-300 transition-colors'>
                {t("common:back")}
              </Link>
            </div>
          </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col gap-6"
        >
          {/* Header Section */}
          <div className="text-center">
             <div className="flex justify-center mb-6">
                 <div className="relative p-3 rounded-2xl bg-zinc-900/50 border border-white/10 shadow-2xl shadow-cyan-500/10">
                    <Image
                      src='/images/logo.svg'
                      alt='Logo'
                      width={48}
                      height={48}
                      className='h-12 w-12 brightness-0 invert'
                    />
                 </div>
             </div>
             <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
               {t("signup:title")}
             </h1>
             <p className="text-zinc-400 text-sm">
               {t("signup:subtitle")}
             </p>
          </div>

          {/* Card */}
          <div className="bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
            <Formik
              initialValues={formikInitialValues}
              validationSchema={signupSchema}
              onSubmit={onSubmit}>
              {({ values, errors, touched, handleChange, handleBlur }) => (
                <Form className='space-y-4'>
                   {/* Username Field */}
                   <div className="space-y-2">
                        <Label
                          htmlFor='login'
                          className='text-xs font-semibold text-zinc-400 uppercase tracking-wider'>
                          {t("signup:username_label")}
                        </Label>
                        <div className='relative group'>
                          <User className='absolute left-3 top-2.5 h-5 w-5 text-zinc-500 transition-colors group-focus-within:text-cyan-400' />
                          <Input
                            id='login'
                            name='login'
                            type='text'
                            value={values.login}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder={t("signup:username_placeholder")}
                            className='pl-10 h-10 bg-zinc-900/50 border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-200 text-white placeholder:text-zinc-600'
                          />
                        </div>
                        {errors.login && touched.login && (
                          <p className='text-xs text-red-400 font-medium'>
                            {errors.login}
                          </p>
                        )}
                    </div>

                  {/* Email Field */}
                    <div className="space-y-2">
                        <Label
                          htmlFor='email'
                          className='text-xs font-semibold text-zinc-400 uppercase tracking-wider'>
                          {t("signup:email_label")}
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
                            className='pl-10 h-10 bg-zinc-900/50 border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-200 text-white placeholder:text-zinc-600'
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
                         <Label
                          htmlFor='password'
                          className='text-xs font-semibold text-zinc-400 uppercase tracking-wider'>
                          {t("signup:password_label")}
                        </Label>

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
                        className='pl-10 pr-10 h-10 bg-zinc-900/50 border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-200 text-white placeholder:text-zinc-600'
                      />
                      <button
                        type='button'
                        onClick={() => setShowPassword(!showPassword)}
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

                  {/* Repeat Password Field */}
                  <div className="space-y-2">
                         <Label
                          htmlFor='repeat_password'
                          className='text-xs font-semibold text-zinc-400 uppercase tracking-wider'>
                          {t("signup:repeat_password_label")}
                        </Label>

                    <div className='relative group'>
                      <Shield className='absolute left-3 top-2.5 h-5 w-5 text-zinc-500 transition-colors group-focus-within:text-cyan-400' />
                      <Input
                        id='repeat_password'
                        name='repeat_password'
                        type={showRepeatPassword ? "text" : "password"}
                        value={values.repeat_password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder='••••••••'
                        className='pl-10 pr-10 h-10 bg-zinc-900/50 border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-200 text-white placeholder:text-zinc-600'
                      />
                      <button
                        type='button'
                        onClick={() =>
                          setShowRepeatPassword(!showRepeatPassword)
                        }
                        className='absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors'>
                        {showRepeatPassword ? (
                          <EyeOff className='h-5 w-5' />
                        ) : (
                          <Eye className='h-5 w-5' />
                        )}
                      </button>
                    </div>
                    {errors.repeat_password && touched.repeat_password && (
                      <p className='text-xs text-red-400 font-medium'>
                        {errors.repeat_password}
                      </p>
                    )}
                  </div>


                  {/* Signup Button */}
                  <div className="pt-2">
                    <Button
                      type='submit'
                      disabled={isFetching}
                      className='w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold h-10 shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]'>
                        {isFetching ? (
                          <Loader2 className='h-5 w-5 animate-spin' />
                        ) : (
                          <span className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            {t("signup:submit_button")}
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        )}
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-zinc-900 px-2 text-zinc-500">{t("signup:or_continue_with")}</span>
                </div>
            </div>

            <Button
                type='button'
                onClick={googleLogInHandler}
                disabled={isGoogleFetching}
                variant='outline'
                className='w-full border-white/10 bg-zinc-900/50 hover:bg-zinc-800 hover:text-white transition-colors h-10 text-zinc-300'>
                <span className='flex items-center justify-center gap-2'>
                  {isGoogleFetching ? (
                    <Loader2 className='h-5 w-5 animate-spin' />
                  ) : (
                    <FcGoogle className='h-5 w-5' />
                  )}
                  {t("signup:google_button")}
                </span>
              </Button>
          </div>

          <div className='text-center'>
              <p className='text-sm text-zinc-400'>
                {t("signup:already_have_account")}{" "}
                <Link
                  href='/login'
                  className='font-bold text-cyan-400 hover:text-cyan-300 transition-colors'>
                  {t("signup:login_link")}
                </Link>
              </p>
            </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SingupView;
