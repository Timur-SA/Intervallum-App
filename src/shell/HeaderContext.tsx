import React, { createContext, useContext, useState } from 'react';

export interface NavigationConfig {
  canGoBack: boolean;
  onBack?: () => void;
}

interface NavigationContextType {
  navigationConfig: NavigationConfig;
  setNavigationConfig: (config: NavigationConfig) => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [navigationConfig, setNavigationConfig] = useState<NavigationConfig>({
    canGoBack: false,
  });

  return (
    <NavigationContext.Provider value={{ navigationConfig, setNavigationConfig }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return ctx;
};

// Compatibility aliases
export const HeaderProvider = NavigationProvider;
export const useHeader = () => {
  const { navigationConfig, setNavigationConfig } = useNavigation();
  return {
    headerConfig: navigationConfig,
    setHeaderConfig: (cfg: { canGoBack: boolean; onBack?: () => void }) => {
      setNavigationConfig({ canGoBack: cfg.canGoBack, onBack: cfg.onBack });
    },
  };
};
