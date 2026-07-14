import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { SplashScreen } from './components/SplashScreen';
import { useIsMobile } from './components/ui/use-mobile';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { router } from './routes';

const INITIAL_SPLASH_DURATION_MS = 1800;

export default function App() {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsAppLoading(false);
    }, INITIAL_SPLASH_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <HelmetProvider>
      <Helmet>
        <title>PrepMatrix</title>
        <meta
          name="description"
          content="PrepMatrix is an AI-powered interview preparation platform that helps you prepare smarter, perform better, and get hired across 97+ professional career domains."
        />
        <link rel="canonical" href="https://prep-matrix-lime.vercel.app" />

        {/* Open Graph */}
        <meta property="og:title" content="PrepMatrix" />
        <meta
          property="og:description"
          content="PrepMatrix is an AI-powered interview preparation platform that helps you prepare smarter, perform better, and get hired across 97+ professional career domains."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://prep-matrix-lime.vercel.app" />
        <meta
          property="og:image"
          content="https://prep-matrix-lime.vercel.app/og-image.png"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="PrepMatrix" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="PrepMatrix" />
        <meta
          name="twitter:description"
          content="PrepMatrix is an AI-powered interview preparation platform that helps you prepare smarter, perform better, and get hired across 97+ professional career domains."
        />
        <meta
          name="twitter:image"
          content="https://prep-matrix-lime.vercel.app/og-image.png"
        />
      </Helmet>

      {isAppLoading ? (
        <SplashScreen type="initial" />
      ) : (
        <AuthProvider>
          <SettingsProvider>
            <RouterProvider router={router} />
            {/* Global toast notifications */}
            <Toaster
              position={isMobile ? 'top-center' : 'top-right'}
              mobileOffset={{ top: 68, left: 12, right: 12 }}
              richColors
              closeButton
              expand={false}
              duration={4000}
              toastOptions={{
                style: { borderRadius: '10px', fontSize: '14px' },
              }}
            />
          </SettingsProvider>
        </AuthProvider>
      )}
    </HelmetProvider>
  );
}
