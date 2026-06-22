import { LoaderCircle } from 'lucide-react';

import splashLogo from '../../assets/branding/splash-logo.png';
import {
  APP_INITIALIZING_MESSAGE,
  APP_NAME,
  APP_TAGLINE,
} from '../constants/branding';

interface SplashScreenProps {
  type: 'initial';
}

export function SplashScreen({ type }: SplashScreenProps) {
  const supportingText = APP_INITIALIZING_MESSAGE;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 bg-slate-950/94 backdrop-blur-xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.22),transparent_28%),radial-gradient(circle_at_20%_80%,rgba(14,165,233,0.16),transparent_24%),radial-gradient(circle_at_80%_15%,rgba(99,102,241,0.18),transparent_22%)]" />

      <div className="relative w-full max-w-xl rounded-[32px] border border-white/10 bg-white/[0.04] px-8 py-10 text-center shadow-[0_0_80px_rgba(37,99,235,0.18)]">
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
        <img
          src={splashLogo}
          alt={APP_NAME}
          className="mx-auto h-auto w-full max-w-[260px] bg-transparent object-contain drop-shadow-[0_0_32px_rgba(59,130,246,0.28)]"
        />
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.42em] text-cyan-100/92">
          {APP_TAGLINE}
        </p>
        <p className="mt-4 text-sm text-slate-300">{supportingText}</p>

        <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100">
          <LoaderCircle className="h-4 w-4 animate-spin text-cyan-200" />
          <span className="font-medium">Launching your PrepMatrix session</span>
        </div>
      </div>
    </div>
  );
}
