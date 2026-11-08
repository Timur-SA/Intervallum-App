import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppShell } from './shell/AppShell';
import { SettingsProvider } from './shell/SettingsContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsProvider>
      <AppShell />
    </SettingsProvider>
  </React.StrictMode>
);
