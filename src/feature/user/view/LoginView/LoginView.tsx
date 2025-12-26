import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import Image from "next/image";
import { selectIsFetching } from "feature/user/store/userSlice";
import {
  logInViaEmail,
  logInViaGoogle,
} from "feature/user/store/userSlice.asyncThunk";
import { loginSchema } from "feature/user/view/LoginView/Login.schemas";
import { Form, Formik } from "formik";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FcGoogle } from "react-icons/fc";
import { useAppDispatch, useAppSelector } from "store/hooks";

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

  const formikInitialValues = {
    email: "",
    password: "",
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
           <Link
             href='/'
             className='group inline-flex items-center gap-2 text-sm text-zinc-400 transition-all duration-300 hover:text-cyan-400'>
             <ArrowLeft className='h-4 w-4 transition-transform group-hover:-translate-x-1' />
             {t("common:back")}
           </Link>
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
                      src='/images/logolight.svg'
                      alt='Logo'
                      width={48}
                      height={48}
                      className='h-12 w-12'
                    />
                 </div>
             </div>
             <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
               {t("login:title")}
             </h1>
             <p className="text-zinc-400 text-sm">
               {t("login:subtitle")}
             </p>
          </div>

          {/* Card */}
          <div className="radius-premium glass-card overflow-hidden shadow-xl border border-white/5 bg-zinc-900/40 backdrop-blur-md">
            {/* Tab Switcher */}
            <div className="flex border-b border-white/10">
              <Link 
                href="/login" 
                className="flex-1 py-4 text-center text-sm font-bold transition-all relative text-white bg-white/5"
              >
                {t("login:submit_button")}
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" 
                />
              </Link>
              <Link 
                href="/signup" 
                className="flex-1 py-4 text-center text-sm font-bold transition-all text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              >
                {t("login:signup_link")}
              </Link>
            </div>

            <div className="p-6">
            <Formik
              initialValues={formikInitialValues}
              validationSchema={loginSchema}
              onSubmit={onSubmit}>
              {({ values, errors, touched, handleChange, handleBlur }) => (
                <Form className='space-y-4'>
                  {/* Email Field */}
                    <div className="space-y-2">
                        <Label
                          htmlFor='email'
                          className='text-xs font-semibold text-zinc-400 uppercase tracking-wider'>
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
                    <div className="flex items-center justify-between">
                         <Label
                          htmlFor='password'
                          className='text-xs font-semibold text-zinc-400 uppercase tracking-wider'>
                          {t("login:password_label")}
                        </Label>
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

                  {/* Login Button */}
                  <div className="pt-2">
                    <Button
                      type='submit'
                      disabled={isFetching}
                      className='w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold h-10 shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]'>
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

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-zinc-900 px-2 text-zinc-500">{t("login:or_continue_with")}</span>
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
                  {t("login:google_button")}
                </span>
              </Button>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
};

export default LoginView;
