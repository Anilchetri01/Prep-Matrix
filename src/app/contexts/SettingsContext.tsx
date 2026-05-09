import React, { createContext, useContext, useEffect, useState } from 'react';

import { authService } from '../../services/authService';
import { DEFAULT_APP_SETTINGS } from '../../services/serviceUtils';
import { useAuth } from './AuthContext';
import { AppSettings } from '../types';

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
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      if (!isAuthenticated) {
        setSettings(DEFAULT_APP_SETTINGS);
        return;
      }

      try {
        console.log('[SettingsContext] load:start');
        const nextSettings = await authService.getSettings();
        if (isMounted) {
          setSettings(nextSettings);
        }
        console.log('[SettingsContext] load:success', nextSettings);
      } catch {
        console.error('[SettingsContext] load:error');
        if (isMounted) {
          setSettings(DEFAULT_APP_SETTINGS);
        }
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
