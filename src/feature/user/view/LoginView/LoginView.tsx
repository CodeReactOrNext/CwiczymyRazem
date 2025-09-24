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
  Guitar,
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  ChevronRight,
  Sparkles,
  Music,
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
    <div className='min-h-screen bg-zinc-950'>
      {/* Animated Background */}
      <div className='pointer-events-none fixed inset-0 overflow-hidden'>
        <div className='absolute inset-0 opacity-10'>
          <div
            className='h-full w-full'
            style={{
              backgroundImage: `
                linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: "50px 50px",
            }}
          />
        </div>

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className='absolute rounded-full'
            style={{
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `rgba(6, 182, 212, ${Math.random() * 0.5 + 0.2})`,
            }}
            animate={{
              y: [-30, 30],
              x: [-10, 10],
              opacity: [0.2, 0.8, 0.2],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Floating Music Notes */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`note-${i}`}
            className='absolute text-cyan-400/20'
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 20 + 10}px`,
            }}
            animate={{
              y: [-50, 50],
              rotate: [0, 360],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 4,
            }}>
            {["♪", "♫", "♬", "♩"][Math.floor(Math.random() * 4)]}
          </motion.div>
        ))}

        {/* Gradient Orbs */}
        <motion.div
          className='absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-gradient-to-r from-cyan-400/10 to-blue-400/10 blur-3xl'
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className='absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-gradient-to-r from-purple-400/10 to-cyan-400/10 blur-2xl'
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      {/* Main Content */}
      <div className='relative flex min-h-screen items-center justify-center p-4'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className='w-full max-w-md'>
          {/* Login Card */}
          <div className='group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/95 to-zinc-800/95 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:border-cyan-400/30 hover:shadow-cyan-400/20'>
            {/* Multiple Glow Layers */}
            <div className='pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-400/20 via-purple-400/10 to-cyan-400/20 blur-xl transition-opacity duration-500 group-hover:opacity-100' />
            <div className='pointer-events-none absolute -inset-2 rounded-2xl bg-gradient-to-r from-cyan-400/10 via-transparent to-cyan-400/10 blur-2xl' />

            {/* Animated Border */}
            <div
              className='pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100'
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.2), transparent)",
                animation: "border-flow 3s ease-in-out infinite",
              }}
            />

            {/* Header */}
            <div className='relative mb-8 text-center'>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className='mb-6 flex justify-center'>
                <div className='relative'>
                  <div className='flex h-16 w-16 items-center justify-center rounded-xl border border-cyan-400/40 bg-gradient-to-br from-cyan-400/25 to-cyan-900/20 shadow-2xl'>
                    <Image
                      src='/images/logo.svg'
                      alt='Logo'
                      width={32}
                      height={32}
                      className='h-8 w-8'
                    />
                  </div>
                  <div className='absolute -inset-2 rounded-xl bg-gradient-to-r from-cyan-400/30 via-cyan-400/15 to-transparent blur-lg' />
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className='mb-2 text-3xl font-black tracking-tight text-white'>
                Witaj ponownie!
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className='text-sm text-zinc-400'>
                Zaloguj się i kontynuuj swoją muzyczną podróż
              </motion.p>
            </div>

            {/* Form */}
            <Formik
              initialValues={formikInitialValues}
              validationSchema={loginSchema}
              onSubmit={onSubmit}>
              {({ values, errors, touched, handleChange, handleBlur }) => (
                <Form className='space-y-6'>
                  {/* Email Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}>
                    <Label
                      htmlFor='email'
                      className='mb-2 block text-sm font-medium text-zinc-300'>
                      Email
                    </Label>
                    <div className='relative'>
                      <Mail className='absolute left-3 top-3 h-5 w-5 text-zinc-400' />
                      <Input
                        id='email'
                        name='email'
                        type='email'
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder='twoj@email.com'
                        className='w-full border-white/20 bg-zinc-800/50 pl-10 text-white placeholder:text-zinc-500 focus:border-cyan-400 focus:ring-cyan-400'
                      />
                    </div>
                    {errors.email && touched.email && (
                      <p className='mt-1 text-xs text-red-400'>
                        {errors.email}
                      </p>
                    )}
                  </motion.div>

                  {/* Password Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}>
                    <Label
                      htmlFor='password'
                      className='mb-2 block text-sm font-medium text-zinc-300'>
                      Hasło
                    </Label>
                    <div className='relative'>
                      <Lock className='absolute left-3 top-3 h-5 w-5 text-zinc-400' />
                      <Input
                        id='password'
                        name='password'
                        type={showPassword ? "text" : "password"}
                        value={values.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder='••••••••'
                        className='w-full border-white/20 bg-zinc-800/50 pl-10 pr-10 text-white placeholder:text-zinc-500 focus:border-cyan-400 focus:ring-cyan-400'
                      />
                      <button
                        type='button'
                        onClick={() => setShowPassword(!showPassword)}
                        className='absolute right-3 top-3 text-zinc-400 transition-colors hover:text-zinc-300'>
                        {showPassword ? (
                          <EyeOff className='h-5 w-5' />
                        ) : (
                          <Eye className='h-5 w-5' />
                        )}
                      </button>
                    </div>
                    {errors.password && touched.password && (
                      <p className='mt-1 text-xs text-red-400'>
                        {errors.password}
                      </p>
                    )}
                  </motion.div>

                  {/* Login Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className='pt-2'>
                    <Button
                      type='submit'
                      disabled={isFetching}
                      className='group relative w-full overflow-hidden rounded-lg border-2 border-cyan-400 bg-gradient-to-r from-cyan-400 to-cyan-300 py-3 text-base font-bold text-black shadow-xl transition-all duration-300 disabled:opacity-50 hover:scale-[1.02] hover:from-cyan-300 hover:to-cyan-200 hover:shadow-cyan-400/50'>
                      <div className='absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
                      <span className='relative z-10 flex items-center justify-center gap-2'>
                        {isFetching ? (
                          <Loader2 className='h-5 w-5 animate-spin' />
                        ) : (
                          <>
                            Zaloguj się
                            <ChevronRight className='h-5 w-5 transition-transform group-hover:translate-x-1' />
                          </>
                        )}
                      </span>
                    </Button>
                  </motion.div>
                </Form>
              )}
            </Formik>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className='my-6 flex items-center'>
              <div className='flex-1 border-t border-white/20' />
              <span className='px-4 text-xs text-zinc-500'>LUB</span>
              <div className='flex-1 border-t border-white/20' />
            </motion.div>

            {/* Google Login */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}>
              <Button
                type='button'
                onClick={googleLogInHandler}
                disabled={isGoogleFetching}
                variant='outline'
                className='group w-full border-white/20 bg-zinc-800/50 py-3 text-white transition-all duration-300 hover:border-white/30 hover:bg-zinc-700/50'>
                <span className='flex items-center justify-center gap-3'>
                  {isGoogleFetching ? (
                    <Loader2 className='h-5 w-5 animate-spin' />
                  ) : (
                    <FcGoogle className='h-5 w-5' />
                  )}
                  Kontynuuj z Google
                </span>
              </Button>
            </motion.div>

            {/* Sign Up Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className='mt-8 text-center'>
              <p className='text-sm text-zinc-400'>
                Nie masz konta?{" "}
                <Link
                  href='/signup'
                  className='font-semibold text-cyan-400 transition-colors hover:text-cyan-300 hover:underline'>
                  Zarejestruj się
                </Link>
              </p>
            </motion.div>
          </div>

          {/* Bottom Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className='mt-8 flex items-center justify-center gap-8 text-center'>
            <div className='flex items-center gap-2'>
              <Music className='h-4 w-4 text-cyan-400' />
              <span className='text-sm text-zinc-400'>10K+ Użytkowników</span>
            </div>
            <div className='flex items-center gap-2'>
              <Sparkles className='h-4 w-4 text-cyan-400' />
              <span className='text-sm text-zinc-400'>50K+ Godzin Ćwiczeń</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginView;
