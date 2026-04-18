import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import { Form, Formik } from "formik";
import { useTranslation } from "hooks/useTranslation";
import {
  ArrowLeft,
  ChevronRight,
  Guitar,
  Headphones,
  Loader2,
  Mail,
  Music,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { TbGuitarPick } from "react-icons/tb";
import { toast } from "sonner";
import { firebaseSendPasswordResetEmail } from "utils/firebase/client/firebase.utils";
import * as Yup from "yup";

const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
});

const ForgotPasswordView = () => {
  const { t } = useTranslation(["common", "login"]);
  const [isFetching, setIsFetching] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const formikInitialValues = {
    email: "",
  };

  const onSubmit = async ({ email }: { email: string }) => {
    setIsFetching(true);
    try {
      await firebaseSendPasswordResetEmail(email);
      setIsSuccess(true);
    } catch {
      toast.error(t("login:reset_password_error") || "Failed to send reset email.");
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className='relative min-h-screen w-full overflow-hidden bg-zinc-950 text-foreground flex items-center justify-center'>
      {/* Premium Background */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[60vh] w-[80vw] bg-cyan-500/5 blur-[120px] rounded-[100%]' />
        
        {/* Tiled Pattern Background */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
          <defs>
            <pattern id="auth-bg-pattern-forgot" x="0" y="0" width="160" height="160" patternUnits="userSpaceOnUse" patternTransform="rotate(-15)">
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
          <rect x="0" y="0" width="100%" height="100%" fill="url(#auth-bg-pattern-forgot)" />
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
               Reset Password
             </h1>
             <p className="text-zinc-400 text-xs sm:text-sm">
               Enter your registered email to recover your account
             </p>
          </div>

          {/* Card */}
          <div className="rounded-lg overflow-hidden shadow-2xl border border-white/5 bg-zinc-900/80">
            <div className="p-6">
              {isSuccess ? (
                <div className="text-center space-y-4">
                  <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-500">
                      <Mail className="h-8 w-8" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Check your email</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                    We've sent password reset instructions to your email address. 
                  </p>
                  <Link href="/login" className="block w-full">
                    <Button className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 text-white border-none font-bold">
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              ) : (
                <Formik
                  initialValues={formikInitialValues}
                  validationSchema={forgotPasswordSchema}
                  onSubmit={onSubmit}>
                  {({ values, errors, touched, handleChange, handleBlur }) => (
                    <Form className='space-y-4'>
                        <div className="space-y-2">
                            <Label
                              htmlFor='email'
                              className='text-xs font-semibold text-zinc-400'>
                              Email Address
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
                                className='pl-10 h-11 bg-black/40 border-white/10 rounded-lg focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all duration-300 text-white placeholder:text-zinc-500'
                              />
                            </div>
                            {errors.email && touched.email && (
                              <p className='text-xs text-red-400 font-medium'>
                                {errors.email}
                              </p>
                            )}
                        </div>

                      {/* Login Button */}
                      <div className="pt-4">
                        <Button
                          type='submit'
                          size='lg'
                          disabled={isFetching}
                          className='w-full'>
                            {isFetching ? (
                              <Loader2 className='h-5 w-5 animate-spin' />
                            ) : (
                              <span className="flex items-center gap-2">
                                Send Reset Link <ChevronRight className="w-4 h-4" />
                              </span>
                            )}
                        </Button>
                      </div>

                      <div className="flex justify-center mt-6">
                        <Link href="/login" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 mt-4">
                           <ArrowLeft className="w-4 h-4" /> Back to Sign In
                        </Link>
                      </div>
                    </Form>
                  )}
                </Formik>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordView;
