import React from 'react';
import ReactDOM from 'react-dom/client';
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
