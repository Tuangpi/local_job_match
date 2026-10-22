import { useTranslation } from 'react-i18next';
import { LANGUAGES, type Language } from '@ljm/shared';
import { setLanguage } from '../../i18n';

/** Switcher for the Burmese/English UI languages. */
export function LanguageSwitcher(): React.JSX.Element {
  const { t, i18n } = useTranslation();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    setLanguage(event.target.value as Language);
  };

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">{t('app.languageLabel')}</span>
      <select
        aria-label={t('app.languageLabel')}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
        onChange={handleChange}
        value={i18n.language}
      >
        {LANGUAGES.map((language) => (
          <option key={language} value={language}>
            {language === 'my' ? 'မြန်မာ' : 'English'}
          </option>
        ))}
      </select>
    </label>
  );
}
