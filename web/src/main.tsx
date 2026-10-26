import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/shell.css';
import './styles/components.css';
import './styles/widgets.css';
import './styles/print.css';
import { App } from './App.js';
import { AppProvider } from './core/app-context.js';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
);

// صدفة التطبيق (PWA): تسريع التحميل وإتاحة التثبيت. لا تخزّن بيانات API (انظر public/sw.js).
if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  // السكربت الرئيسي يُحقن بعد أول رسم فقد يكون حدث load قبل تنفيذنا
  const reg = (): void => void window.setTimeout(() => void navigator.serviceWorker.register('/sw.js').catch(() => undefined), 1500);
  if (document.readyState === 'complete') reg();
  else window.addEventListener('load', reg, { once: true });
}
