import ar from './ar';
import de from './de';
import en from './en';
import es from './es';
import fr from './fr';
import it from './it';
import ja from './ja';
import ko from './ko';
import nl from './nl';
import pl from './pl';
import pt from './pt';
import ru from './ru';
import sv from './sv';
import tr from './tr';
import zh from './zh';

export const translations = {
  en,
  es,
  fr,
  de,
  pt,
  zh,
  ja,
  it,
  ko,
  ru,
  nl,
  pl,
  tr,
  ar,
  sv,
};

export type TranslationKeys = keyof typeof en;
export type LocaleCode = keyof typeof translations;

export const localeNames: Record<LocaleCode, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  zh: '简体中文',
  ja: '日本語',
  it: 'Italiano',
  ko: '한국어',
  ru: 'Русский',
  nl: 'Nederlands',
  pl: 'Polski',
  tr: 'Türkçe',
  ar: 'العربية',
  sv: 'Svenska',
};
