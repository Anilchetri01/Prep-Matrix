import logoFull from '../../assets/branding/logo-full.png';
import logoIconDark from '../../assets/branding/logo-icon-dark.png';
import logoIconLight from '../../assets/branding/logo-icon-light.png';
import { APP_NAME } from '../constants/branding';

type AppLogoVariant = 'dark' | 'light' | 'full';

interface AppLogoProps {
  variant: AppLogoVariant;
  className?: string;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const variantMap: Record<AppLogoVariant, string> = {
  dark: logoIconDark,
  light: logoIconLight,
  full: logoFull,
};

export function AppLogo({ variant, className }: AppLogoProps) {
  const defaultSize =
    variant === 'full' ? 'h-auto w-full max-w-[320px]' : 'h-10 w-10';

  return (
    <img
      src={variantMap[variant]}
      alt={APP_NAME}
      className={cx(defaultSize, 'object-contain bg-transparent', className)}
    />
  );
}
