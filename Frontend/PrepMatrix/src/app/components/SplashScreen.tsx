import { APP_INITIALIZING_MESSAGE, APP_NAME } from '../constants/branding';
import { LinearProgressIndicator } from './LinearProgressIndicator';

const logoIconLight = '/logo-icon-light.png';

interface SplashScreenProps {
  type: 'initial';
  message?: string;
}

export function SplashScreen({ type: _type, message }: SplashScreenProps) {
  const supportingText = message || APP_INITIALIZING_MESSAGE;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#070B14] px-6 select-none"
      role="status"
      aria-live="polite"
      aria-label={`${APP_NAME} splash screen`}
    >
      <div className="flex flex-col items-center text-center">
        <img
          src={logoIconLight}
          alt={APP_NAME}
          className="h-11 w-11 object-contain"
          width={44}
          height={44}
        />
        <span className="mt-4 font-display text-xl font-bold tracking-tight text-[#F4F7FB]">
          {APP_NAME}
        </span>

        <LinearProgressIndicator className="mt-8" />

        <p className="mt-3.5 font-sans text-xs text-[#AAB7CA]">
          {supportingText}
        </p>
      </div>
    </div>
  );
}

