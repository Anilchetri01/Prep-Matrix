import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { SplashScreen } from './components/SplashScreen';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { router } from './routes';

const INITIAL_SPLASH_DURATION_MS = 1800;

export default function App() {
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsAppLoading(false);
    }, INITIAL_SPLASH_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (isAppLoading) {
    return <SplashScreen type="initial" />;
  }

  return (
    <AuthProvider>
      <SettingsProvider>
        <RouterProvider router={router} />
        {/* Global toast notifications */}
        <Toaster
          position="top-right"
          richColors
          closeButton
          expand={false}
          duration={4000}
          toastOptions={{
            style: { borderRadius: '12px', fontSize: '14px' },
          }}
        />
        <SpeedInsights />
      </SettingsProvider>
    </AuthProvider>
  );
}
