import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../lib/api-client';

interface HealthStatus {
  status: string;
  service: string;
  environment: string;
  timestamp: string;
}

/**
 * Demonstrates the frontend/backend wiring by calling the API health
 * endpoint. Replaced by real feature panels as modules are implemented.
 */
export function HealthPanel(): React.JSX.Element {
  const { t } = useTranslation();

  const { data, isPending, isError } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.get<HealthStatus>('/health'),
    retry: false,
  });

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-2 text-sm font-semibold text-slate-900">{t('health.title')}</h2>

      {isPending && <p className="text-sm text-slate-600">{t('app.loading')}</p>}

      {isError && <p className="text-sm text-red-600">{t('health.failed')}</p>}

      {data && (
        <div className="text-sm text-slate-700">
          <p className="font-medium text-emerald-700">{t('health.ok')}</p>
          <p className="text-slate-500">
            {t('health.checkedAt', { time: new Date(data.timestamp).toLocaleTimeString() })}
          </p>
        </div>
      )}
    </section>
  );
}
