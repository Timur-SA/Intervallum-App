import React, { createContext, useContext, useState } from 'react';

export interface HeaderConfig {
  title: string;
  subtitle?: string;
  canGoBack: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

interface HeaderContextType {
  headerConfig: HeaderConfig;
  setHeaderConfig: (config: HeaderConfig) => void;
}

const HeaderContext = createContext<HeaderContextType | null>(null);

export const HeaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>({
    title: 'Intervallum',
    subtitle: 'Физический практикум',
    canGoBack: false,
  });

  return (
    <HeaderContext.Provider value={{ headerConfig, setHeaderConfig }}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeader = () => {
  const ctx = useContext(HeaderContext);
  if (!ctx) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return ctx;
};
