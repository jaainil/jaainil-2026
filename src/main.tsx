import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/jetbrains-mono';
import App from './App';
import './index.css';
import { ToastProvider } from './providers/ToastProvider';
import { Toaster } from './components/ui/Toast';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
      <Toaster />
    </ToastProvider>
  </StrictMode>,
);
