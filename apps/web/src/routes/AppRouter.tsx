import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ExpertsPage } from './ExpertsPage';
import { HomePage } from './HomePage';
import { JobsPage } from './JobsPage';
import { LoginPage } from './LoginPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'experts', element: <ExpertsPage /> },
      { path: 'jobs', element: <JobsPage /> },
      { path: 'login', element: <LoginPage /> },
    ],
  },
]);

export function AppRouter(): React.JSX.Element {
  return <RouterProvider router={router} />;
}
