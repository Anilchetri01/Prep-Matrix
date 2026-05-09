import { createRoot } from 'react-dom/client';

import App from './app/App.tsx';
import { APP_VERSION } from './lib/browserStorage';
import { clearStoredAuthState } from './lib/supabaseClient';
import './styles/index.css';

const BUILD_RECOVERY_KEY = `build-recovery:${APP_VERSION}`;

function isChunkLoadFailure(error: unknown) {
  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
      ? `${error.name} ${error.message}`
      : '';

  return /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module/i.test(
    message,
  );
}

function reloadAfterClearingStaleState(reason: string) {
  if (typeof window === 'undefined') return;

  try {
    const hasRecovered = window.sessionStorage.getItem(BUILD_RECOVERY_KEY) === '1';
    if (hasRecovered) {
      return;
    }

    window.sessionStorage.setItem(BUILD_RECOVERY_KEY, '1');
  } catch (error) {
    console.warn('[main] Failed to persist build recovery marker.', error);
  }

  console.warn('[main] Recovering from stale client state.', { reason });
  clearStoredAuthState();
  window.location.reload();
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('UNHANDLED PROMISE:', event.reason);
});

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  reloadAfterClearingStaleState('vite_preload_error');
});

window.addEventListener('error', (event) => {
  if (!isChunkLoadFailure(event.error ?? event.message)) {
    return;
  }

  reloadAfterClearingStaleState('chunk_load_error');
});

createRoot(document.getElementById('root')!).render(<App />);
