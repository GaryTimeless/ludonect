import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import i18n from './plugins/i18n'

// ── Remote Error Logging ────────────────────────────────────────────────────
// POSTs client-side errors to the server so you can debug issues on devices
// you can't physically access (e.g. customer iPhones).
async function logRemoteError(payload: {
  type: string;
  message: string;
  stack?: string;
  url?: string;
}) {
  try {
    await fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        href: location.href,
      }),
    });
  } catch {
    // Never let the logging itself crash the app
  }
}

// Catches unhandled JS exceptions (syntax errors, TypeErrors, etc.)
window.onerror = (message, source, _lineno, _colno, error) => {
  logRemoteError({
    type: 'uncaught_error',
    message: String(message),
    stack: error?.stack,
    url: source || location.href,
  });
  // Show toast in UI
  (window as any).__ludonectShowError?.('Ein unerwarteter Fehler ist aufgetreten. Bitte Seite neu laden.');
  return false; // don't suppress browser default error handling
};

// Catches async errors that weren't caught by try/catch
window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason?.message || String(event.reason);
  logRemoteError({
    type: 'unhandled_rejection',
    message: msg,
    stack: event.reason?.stack,
    url: location.href,
  });
  // Show toast in UI
  (window as any).__ludonectShowError?.(`Netzwerk- oder Serverfehler: ${msg}`);
});
// ───────────────────────────────────────────────────────────────────────────

const app = createApp(App)
  .use(router)
  .use(vuetify)
  .use(i18n)

// Vue-level error handler (catches errors inside Vue components/watchers)
app.config.errorHandler = (err: unknown, _instance, info) => {
  const error = err instanceof Error ? err : new Error(String(err));
  logRemoteError({
    type: 'vue_error',
    message: `${error.message} (${info})`,
    stack: error.stack,
    url: location.href,
  });
  (window as any).__ludonectShowError?.('Ein Fehler in der App ist aufgetreten.');
  console.error('[Vue Error]', error, info);
};

router.isReady().then(() => {
  app.mount('#app')
})

