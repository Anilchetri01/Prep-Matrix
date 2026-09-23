import React, { createContext, useContext, useEffect, useState } from 'react';

import { authService } from '../../services/authService';
import { DEFAULT_APP_SETTINGS, normalizeSettings } from '../../services/serviceUtils';
import { useAuth } from './AuthContext';
import { AppSettings } from '../types';
import { safeGet, safeSet } from '../../lib/browserStorage';

const SETTINGS_STORAGE_KEY = 'prepmatrix_app_settings';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  toggleDarkMode: () => void;
  toggleSound: () => void;
  toggleVoice: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(() => {
    const cached = safeGet<AppSettings>(SETTINGS_STORAGE_KEY);
    const initial = cached ? normalizeSettings(cached) : DEFAULT_APP_SETTINGS;
    if (typeof document !== 'undefined') {
      if (initial.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    return initial;
  });

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      if (!isAuthenticated) {
        return;
      }

      try {
        console.log('[SettingsContext] load:start');
        const cloudSettings = await authService.getSettings();
        if (isMounted) {
          if (cloudSettings) {
            setSettings(cloudSettings);
            safeSet(SETTINGS_STORAGE_KEY, cloudSettings);
            console.log('[SettingsContext] load:cloud-applied', cloudSettings);
          } else {
            // User has no cloud-saved settings yet: preserve active local preferences and sync to Supabase
            const localCached = safeGet<AppSettings>(SETTINGS_STORAGE_KEY);
            const activeSettings = localCached ? normalizeSettings(localCached) : settings;
            authService.updateSettings(activeSettings).catch((err) => {
              console.warn('[SettingsContext] Initial cloud sync warning:', err);
            });
            console.log('[SettingsContext] load:synced-local-to-cloud', activeSettings);
          }
        }
      } catch (error) {
        console.error('[SettingsContext] load:error', error);
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const nextSettings = { ...settings, ...newSettings };
    setSettings(nextSettings);
    safeSet(SETTINGS_STORAGE_KEY, nextSettings);
    console.log('[SettingsContext] update:start', nextSettings);

    if (isAuthenticated) {
      authService.updateSettings(nextSettings).catch((error) => {
        console.error('Unable to persist settings.', error);
      });
    }
  };

  const toggleDarkMode = () => {
    updateSettings({ darkMode: !settings.darkMode });
  };

  const toggleSound = () => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const toggleVoice = () => {
    updateSettings({ voiceEnabled: !settings.voiceEnabled });
  };

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, toggleDarkMode, toggleSound, toggleVoice }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
