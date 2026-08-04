import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppErrorBoundary } from './AppErrorBoundary';
import { APP_UPDATE_READY_EVENT } from './appEvents';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    const hadController = Boolean(navigator.serviceWorker.controller);
    let updateAnnounced = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || updateAnnounced) {
        return;
      }

      updateAnnounced = true;
      window.dispatchEvent(new Event(APP_UPDATE_READY_EVENT));
    });

    try {
      const registration = await navigator.serviceWorker.register(
        `${import.meta.env.BASE_URL}sw.js`,
        {
          scope: import.meta.env.BASE_URL,
          updateViaCache: 'none',
        },
      );
      window.setInterval(() => registration.update(), 60 * 60 * 1000);
    } catch {
      // The app remains usable when service-worker registration is unavailable.
    }
  });
}
