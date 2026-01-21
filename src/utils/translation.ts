
// Import all translation files for usage outside of React hooks
import not_found from '../../public/locales/en/404.json';
import achievements from '../../public/locales/en/achievements.json';
import chat from '../../public/locales/en/chat.json';
import common from '../../public/locales/en/common.json';
import exercises from '../../public/locales/en/exercises.json';
import faq from '../../public/locales/en/faq.json';
import footer from '../../public/locales/en/footer.json';
import leadboard from '../../public/locales/en/leadboard.json';
import login from '../../public/locales/en/login.json';
import practice from '../../public/locales/en/practice.json';
import profile from '../../public/locales/en/profile.json';
import report from '../../public/locales/en/report.json';
import settings from '../../public/locales/en/settings.json';
import signup from '../../public/locales/en/signup.json';
import skills from '../../public/locales/en/skills.json';
import songs from '../../public/locales/en/songs.json';
import timer from '../../public/locales/en/timer.json';
import toast from '../../public/locales/en/toast.json';
import yup_errors from '../../public/locales/en/yup_errors.json';

type TranslationNamespace = 
  | '404'
  | 'achievements'
  | 'chat'
  | 'common'
  | 'exercises'
  | 'faq'
  | 'footer'
  | 'leadboard'
  | 'login'
  | 'practice'
  | 'profile'
  | 'report'
  | 'settings'
  | 'signup'
  | 'skills'
  | 'songs'
  | 'timer'
  | 'toast'
  | 'yup_errors';

const translations: Record<TranslationNamespace, any> = {
  '404': not_found,
  achievements,
  chat,
  common,
  exercises,
  faq,
  footer,
  leadboard,
  login,
  practice,
  profile,
  report,
  settings,
  signup,
  skills,
  songs,
  timer,
  toast,
  yup_errors,
};

function get(obj: any, path: string): any {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return path; 
    }
  }
  
  return result;
}

function interpolate(str: string, vars?: Record<string, any>): string {
  if (!vars) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return vars[key] !== undefined ? String(vars[key]) : match;
  });
}

/**
 * Global translation function for use outside of React components
 */
export const t = (key: string, options?: Record<string, any> | string) => {
  // Try to parse namespace from key, e.g. "profile:stats.spent_time"
  let namespace: TranslationNamespace = 'common';
  let actualKey = key;
  
  if (key.includes(':')) {
    const parts = key.split(':');
    namespace = parts[0] as TranslationNamespace;
    actualKey = parts[1];
  }

  const nsData = translations[namespace];
  if (!nsData) return key;

  const value = get(nsData, actualKey);
  const vars = typeof options === 'object' ? options : undefined;
  
  if (value !== actualKey) {
     return interpolate(typeof value === 'string' ? value : String(value), vars);
  }
  
  return actualKey;
};

// Mock i18n object for backwards compatibility
export const i18n = {
  t,
  language: 'en',
  changeLanguage: () => Promise.resolve(),
};
