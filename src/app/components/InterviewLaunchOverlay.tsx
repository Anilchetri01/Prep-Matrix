import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

import {
  APP_INTERVIEW_PREPARING_MESSAGE,
  APP_NAME,
} from '../constants/branding';
import { LinearProgressIndicator } from './LinearProgressIndicator';

const logoIconLight = '/logo-icon-light.png';

interface InterviewLaunchOverlayProps {
  visible: boolean;
  message?: string;
}

const EXIT_DURATION_MS = 320;

export function InterviewLaunchOverlay({
  visible,
  message,
}: InterviewLaunchOverlayProps) {
  const [mounted, setMounted] = useState(visible);
  const shouldReduceMotion = useReducedMotion();
  const supportingText = message || APP_INTERVIEW_PREPARING_MESSAGE;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setMounted(false);
    }, EXIT_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [visible]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#070B14] px-6 select-none transition-opacity ${
        shouldReduceMotion ? 'duration-0' : 'duration-300'
      } ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      role="status"
      aria-live="polite"
      aria-busy={visible}
      aria-label="Interview launch overlay"
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

