const isBrowser = typeof window !== 'undefined';

export const APP_VERSION = 'v1.0.1';
export const APP_VERSION_STORAGE_KEY = 'app_version';

export function safeGet<T = unknown>(key: string): T | null {
  if (!isBrowser) return null;

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch (error) {
    console.warn('[browserStorage] Corrupted localStorage key detected:', key, error);

    try {
      window.localStorage.removeItem(key);
    } catch (removeError) {
      console.warn('[browserStorage] Failed to remove corrupted key:', key, removeError);
    }

    return null;
  }
}

export function safeSet(key: string, value: unknown) {
  if (!isBrowser) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('[browserStorage] Failed to set localStorage key:', key, error);
  }
}

export function safeRemove(key: string) {
  if (!isBrowser) return;

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn('[browserStorage] Failed to remove localStorage key:', key, error);
  }
}

export function clearBrowserStorage() {
  if (!isBrowser) return;

  try {
    window.localStorage.clear();
  } catch (error) {
    console.warn('[browserStorage] Failed to clear localStorage.', error);
  }

  try {
    window.sessionStorage.clear();
  } catch (error) {
    console.warn('[browserStorage] Failed to clear sessionStorage.', error);
  }
}

export function syncAppVersion(targetVersion = APP_VERSION) {
  const storedVersion = safeGet<string>(APP_VERSION_STORAGE_KEY);

  if (storedVersion === targetVersion) {
    return false;
  }

  console.log('[browserStorage] App updated. Clearing old cache...');
  clearBrowserStorage();
  safeSet(APP_VERSION_STORAGE_KEY, targetVersion);
  return true;
}
