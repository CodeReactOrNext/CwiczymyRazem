import { Button } from "assets/components/ui/button";
import { Checkbox } from "assets/components/ui/checkbox";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import { cn } from "assets/lib/utils";
import { onboardingHref } from "feature/onboarding/analytics/onboardingAnalytics";
import { selectIsFetching } from "feature/user/store/userSlice";
import {
  createAccount,
  logInViaGoogle,
} from "feature/user/store/userSlice.asyncThunk";
import { signupSchema } from "feature/user/view/SingupView/SignUp.schemas";
import { Form, Formik } from "formik";
import { useTranslation } from "hooks/useTranslation";
import { Interpolate } from "lib/i18n/Interpolate";
import {
  trackSignupCompleted,
  trackSignupFormViewed,
} from "lib/signupFunnel";
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
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect,useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { TbGuitarPick } from "react-icons/tb";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { safeNextPath } from "utils/auth/safeNextPath";

export interface SignUpCredentials {
  login: string;
  email: string;
  password: string;
  /** The optional-emails checkbox — unticked unless the player ticks it. */
  emailConsent: boolean;
}

const SingupView = () => {
  const { t } = useTranslation(["common", "signup"]);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const isFetching = useAppSelector(selectIsFetching) === "createAccount";
  const isGoogleFetching = useAppSelector(selectIsFetching) === "google";

  const formikInitialValues: SignUpCredentials = {
    login: "",
    email: "",
    password: "",
    emailConsent: false,
  };

  // Set by links that carried a destination — a song card in the public
  // library, say — so what the visitor picked survives the sign-up form.
  // Everyone else starts on the onboarding.
  const destination = safeNextPath(
    router.query.next,
    onboardingHref("signup"),
  );

  const onSubmit = async (credentials: SignUpCredentials) => {
    try {
      await dispatch(createAccount(credentials)).unwrap();
      trackSignupCompleted(destination);
      // Straight on: the onboarding is the welcome, and it tells phone
      // players about the computer itself.
      await router.push(destination);
    } catch  {
      // Error is handled by global toast in thunk
    }
  };

  const googleLogInHandler = () => {
    dispatch(logInViaGoogle());
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  // The funnel needs "the form was actually on screen" as its own step —
  // /signup also serves redirects, so a pageview is not the same thing.
  useEffect(() => {
    trackSignupFormViewed(destination);
    // Once per mount: re-firing on every destination change would inflate the step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className='relative min-h-screen w-full overflow-hidden bg-zinc-950 text-foreground flex items-center justify-center'>
      {/* Premium Background */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[60vh] w-[80vw] bg-cyan-500/5 blur-[120px] rounded-[100%]' />

        {/* Tiled Pattern Background */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
          <defs>
            <pattern id="auth-bg-pattern-signup" x="0" y="0" width="160" height="160" patternUnits="userSpaceOnUse" patternTransform="rotate(-15)">
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
          <rect x="0" y="0" width="100%" height="100%" fill="url(#auth-bg-pattern-signup)" />
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
               {t("signup:title")}
             </h1>
             <p className="text-zinc-400 text-xs sm:text-sm">
               {t("signup:subtitle")}
             </p>
          </div>

          {/* Card */}
          <div className="rounded-lg  overflow-hidden shadow-2xl border border-white/5 bg-zinc-900/80">
            <div className="p-2">
              {/* Tab Switcher */}
              <div className="flex p-1 bg-zinc-900/50 border border-white/5 rounded-lg mb-4">
                <Link 
                  href="/login" 
                  className="flex-1 py-2.5 text-center text-sm font-bold transition-all text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-white/5"
                >
                  {t("signup:login_link")}
                </Link>
                <Link 
                  href="/signup" 
                  className="flex-1 py-2.5 text-center text-sm font-bold transition-all bg-zinc-800/80 text-white rounded-lg shadow-sm border border-white/5"
                >
                  {t("signup:submit_button")}
                </Link>
              </div>

            <div className="px-4 pb-4">
            <p className="text-xs sm:text-sm text-zinc-400 text-center mb-4">
              {t("signup:value_prop")}
            </p>

            <Button
                type='button'
                onClick={googleLogInHandler}
                disabled={isGoogleFetching}
                variant='outline'
                className='w-full border-white/5 bg-zinc-900/50 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors h-11 text-zinc-300'>
                <span className='flex items-center justify-center gap-2'>
                  {isGoogleFetching ? (
                    <Loader2 className='h-5 w-5 animate-spin' />
                  ) : (
                    <FcGoogle className='h-5 w-5' />
                  )}
                  {t("signup:google_button")}
                </span>
              </Button>

            <div className="relative my-4 sm:my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="bg-zinc-900 px-2 text-zinc-400">{t("signup:email_option")}</span>
                </div>
            </div>

            <Formik
              initialValues={formikInitialValues}
              validationSchema={signupSchema}
              onSubmit={onSubmit}>
              {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => {
                const strength = getPasswordStrength(values.password);
                return (
                <Form className='space-y-3 sm:space-y-4'>
                  {/* Email Field */}
                    <div className="space-y-2">
                        <Label
                          htmlFor='email'
                          className='text-xs font-semibold text-zinc-400'>
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
                            className='pl-10 h-11 bg-black/40 border-white/10 rounded-lg focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all duration-base text-white placeholder:text-zinc-500'
                          />
                        </div>
                        {errors.email && touched.email && (
                          <p className='text-xs text-red-400 font-medium'>
                            {errors.email}
                          </p>
                        )}
                    </div>

                   {/* Username Field */}
                   <div className="space-y-2">
                        <Label
                          htmlFor='login'
                          className='text-xs font-semibold text-zinc-400'>
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
                            className='pl-10 h-11 bg-black/40 border-white/10 rounded-lg focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all duration-base text-white placeholder:text-zinc-500'
                          />
                        </div>
                        {errors.login && touched.login && (
                          <p className='text-xs text-red-400 font-medium'>
                            {errors.login}
                          </p>
                        )}
                        <p className="text-xs text-zinc-400">This is how others will see you.</p>
                    </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                         <Label
                          htmlFor='password'
                          className='text-xs font-semibold text-zinc-400'>
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
                        className='pl-10 pr-10 h-11 bg-black/40 border-white/10 rounded-lg focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all duration-base text-white placeholder:text-zinc-500'
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
                    
                    {/* Password Strength Indicator */}
                    {values.password && (
                        <div className="space-y-1.5 px-0.5">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-zinc-400">Security</span>
                                <span className={cn(
                                    "text-[10px] font-bold",
                                    strength < 50 ? "text-red-400" : strength < 75 ? "text-amber-400" : "text-emerald-400"
                                )}>
                                    {strength < 50 ? "Weak" : strength < 75 ? "Medium" : "Strong"}
                                </span>
                            </div>
                            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                <div 
                                    style={{ width: `${strength}%` }}
                                    className={cn(
                                        "h-full transition-all duration-slow",
                                        strength < 50 ? "bg-red-500" : strength < 75 ? "bg-amber-500" : "bg-emerald-500"
                                    )}
                                />
                            </div>
                        </div>
                    )}

                    {errors.password && touched.password && (
                      <p className='text-xs text-red-400 font-medium'>
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Optional emails — consent has to be a tick the player makes */}
                  <div className='flex items-start gap-3 rounded-lg bg-black/40 p-3'>
                    <Checkbox
                      id='emailConsent'
                      checked={values.emailConsent}
                      onCheckedChange={(checked) =>
                        setFieldValue("emailConsent", checked === true)
                      }
                      className='mt-0.5 border-zinc-600 data-[state=checked]:border-cyan-500 data-[state=checked]:bg-cyan-500 data-[state=checked]:text-zinc-950'
                    />
                    <Label
                      htmlFor='emailConsent'
                      className='cursor-pointer text-xs font-normal leading-relaxed text-zinc-400'>
                      {t("signup:email_consent_label")}
                    </Label>
                  </div>

                  {/* Signup Button */}
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
                            {t("signup:submit_button")}
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        )}
                    </Button>
                  </div>
                </Form>
              )}}
            </Formik>

            <p className='mt-4 text-center text-xs leading-relaxed text-zinc-400'>
              <Interpolate
                text={t("signup:legal_notice")}
                values={{
                  terms: (
                    <Link
                      href='/terms-of-service'
                      className='text-zinc-300 underline underline-offset-2 transition-colors hover:text-white'>
                      {t("signup:terms_link")}
                    </Link>
                  ),
                  privacy: (
                    <Link
                      href='/privacy-policy'
                      className='text-zinc-300 underline underline-offset-2 transition-colors hover:text-white'>
                      {t("signup:privacy_link")}
                    </Link>
                  ),
                }}
              />
            </p>
            </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SingupView;
