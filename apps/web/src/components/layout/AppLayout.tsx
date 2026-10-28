import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { LanguageSwitcher } from './LanguageSwitcher';

const NAV_ITEMS = [
  { to: '/', key: 'home', labelKey: 'nav.home', end: true },
  { to: '/experts', key: 'experts', labelKey: 'nav.experts', end: false },
  { to: '/jobs', key: 'jobs', labelKey: 'nav.jobs', end: false },
] as const;

/** Application shell: header, navigation, language switcher, and outlet. */
export function AppLayout(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-lg font-semibold text-brand-700">
            {t('app.title')}
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              to="/login"
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white"
            >
              {t('nav.login')}
            </Link>
          </div>
        </div>
        <nav className="mx-auto max-w-5xl px-4">
          <ul className="flex flex-wrap gap-2 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'inline-block border-b-2 px-1 py-2',
                      isActive
                        ? 'border-brand-600 font-medium text-brand-700'
                        : 'border-transparent text-slate-600 hover:text-slate-900',
                    )
                  }
                >
                  {t(item.labelKey)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
