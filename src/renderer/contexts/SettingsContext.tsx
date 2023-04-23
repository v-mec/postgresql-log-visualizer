import { createContext, ReactNode, useContext, useState } from 'react';

type Settings = {
  fontSize: number;
  isTransactionView: boolean;
  layout: string;
};

const defaultSettings: Settings = {
  fontSize: 5,
  isTransactionView: false,
  layout: 'cose',
};

type SettingsContextType = {
  settings: Settings;
  updateSettings: (settings: Settings) => void;
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
});

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const localStorageSettings = localStorage.getItem('settings');
  const [settings, setSettings] = useState<Settings>(
    localStorageSettings ? JSON.parse(localStorageSettings) : defaultSettings
  );

  const updateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem('settings', JSON.stringify(newSettings));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
export const useSettings = () => useContext(SettingsContext);
