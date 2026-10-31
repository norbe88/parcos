import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/open-sans/400.css';
import '@fontsource/open-sans/600.css';
import App from './App';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { TenantProvider } from './context/TenantContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <TenantProvider>
        <App />
      </TenantProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
