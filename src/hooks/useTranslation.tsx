import React, { useMemo } from 'react';

// Import all translation files
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

/**
 * Simple translation function that gets a nested value from an object using dot notation
 * e.g., get(obj, 'path.to.value') returns obj.path.to.value
 */
function get(obj: any, path: string): any {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return path; // Return the key itself if not found
    }
  }
  
  return result;
}

/**
 * Simple template replacement for interpolation
 * e.g., "Hello {{name}}" with {name: "World"} becomes "Hello World"
 */
function interpolate(str: string, vars?: Record<string, any>): string {
  if (!vars) return str;
  
  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return vars[key] !== undefined ? String(vars[key]) : match;
  });
}

/**
 * Hook replacement for react-i18next useTranslation
 * Supports single namespace or array of namespaces
 */
export function useTranslation(
  namespace?: TranslationNamespace | TranslationNamespace[]
) {
  const namespaces = useMemo(() => {
    if (!namespace) return ['common'];
    return Array.isArray(namespace) ? namespace : [namespace];
  }, [namespace]);

  const t = useMemo(() => {
    return (key: string, options?: Record<string, any> | string) => {
      // Handle the case where second parameter is a default value string
      const defaultValue = typeof options === 'string' ? options : undefined;
      const vars = typeof options === 'object' ? options : undefined;

      // Handle namespace:key format (e.g. "common:button.submit")
      if (key.includes(':')) {
        const [ns, ...rest] = key.split(':');
        const actualKey = rest.join(':');
        
        // If namespace exists in our translations
        if (ns in translations) {
          const nsData = translations[ns as TranslationNamespace];
          const value = get(nsData, actualKey);
          if (value !== actualKey) {
            return interpolate(typeof value === 'string' ? value : String(value), vars);
          }
        }
      }

      // Try to find the translation in each namespace (for keys without prefix)
      for (const ns of namespaces) {
        const nsData = translations[ns as TranslationNamespace];
        if (nsData) {
          const value = get(nsData, key);
          if (value !== key) {
            return interpolate(typeof value === 'string' ? value : String(value), vars);
          }
        }
      }

      // If not found and default value provided, return it
      if (defaultValue) return defaultValue;
      
      // Return the key itself as fallback
      return key;
    };
  }, [namespaces]);

  return {
    t,
    i18n: {
      language: 'en',
      changeLanguage: () => Promise.resolve(),
    },
  };
}

/**
 * Trans component replacement for react-i18next Trans
 * For now, just renders children or the translation key
 */
export function Trans({ 
  i18nKey,
  children,
}: { 
  i18nKey?: string;
  children?: React.ReactNode;
}) {
  return <>{children || i18nKey}</>;
}
