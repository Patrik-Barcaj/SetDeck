import { useState, useEffect } from 'react';

export interface AppSettings {
  playlistVisibility: 'public' | 'private';
  showCount: 5 | 10 | 15 | 20;
  autoPreview: boolean;
  tourRegionDetection: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  playlistVisibility: 'private',
  showCount: 10,
  autoPreview: true,
  tourRegionDetection: true,
};

const STORAGE_KEY = 'setdrift_app_settings';

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save settings', e);
      }
      return next;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to reset settings', e);
    }
  };

  return { settings, updateSettings, resetSettings, isLoaded };
}
