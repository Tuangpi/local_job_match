import { useTranslation } from 'react-i18next';

export function JobsPage(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h1 className="text-lg font-semibold text-slate-900">{t('nav.jobs')}</h1>
      <p className="mt-1 text-sm text-slate-600">Job requests arrive with Phase 3.</p>
    </section>
  );
}
