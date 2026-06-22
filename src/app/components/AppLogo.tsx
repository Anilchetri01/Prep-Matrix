import logoFull from '../../assets/branding/logo-full.png';
import logoFullLight from '../../assets/branding/logo-full-light.png';
import logoIconDark from '../../assets/branding/logo-icon-dark.png';
import logoIconLight from '../../assets/branding/logo-icon-light.png';
import { useSettings } from '../contexts/SettingsContext';
import { APP_NAME } from '../constants/branding';

type AppLogoVariant = 'dark' | 'light' | 'full';

interface AppLogoProps {
  variant: AppLogoVariant;
  className?: string;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function AppLogo({ variant, className }: AppLogoProps) {
  const { settings } = useSettings();
  const isDark = settings.darkMode;

  const defaultSize =
    variant === 'full' ? 'h-auto w-full max-w-[320px]' : 'h-10 w-10';

  let logoSrc = logoIconDark;
  if (variant === 'full') {
    logoSrc = isDark ? logoFullLight : logoFull;
  } else if (variant === 'dark') {
    logoSrc = isDark ? logoIconLight : logoIconDark;
  } else if (variant === 'light') {
    logoSrc = logoIconLight;
  }

  return (
    <img
      src={logoSrc}
      alt={APP_NAME}
      className={cx(defaultSize, 'object-contain bg-transparent', className)}
    />
  );
}

