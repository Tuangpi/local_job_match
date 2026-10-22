import { useTranslation } from 'react-i18next';
import { HealthPanel } from '../features/health/HealthPanel';

export function HomePage(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold text-slate-900">{t('app.title')}</h1>
        <p className="mt-1 text-slate-600">{t('app.tagline')}</p>
      </section>
      <HealthPanel />
    </div>
  );
}
