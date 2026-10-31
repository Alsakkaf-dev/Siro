/**
 * تحديث تلقائي للنسخة القديمة: يقارن بصمة النسخة المبنية في الواجهة (__BUILD_ID__) بما يعلنه الخادم في /api/health.
 * عند الاختلاف (نسخة مخبأة في المتصفح أو عامل الخدمة) يمسح الذاكرة المؤقتة ويعيد التحميل مرة واحدة لكل بصمة.
 */
const SHA = /^[0-9a-f]{7}$/;
const KEY = 'platform.reloadedFor';

async function check(): Promise<void> {
  try {
    const r = await fetch('/api/health', { cache: 'no-store' });
    const b = ((await r.json()) as { build?: string | null }).build;
    if (!b || !SHA.test(b) || !SHA.test(__BUILD_ID__) || b === __BUILD_ID__) return;
    if (sessionStorage.getItem(KEY) === b) return; // لا حلقة إعادة تحميل
    sessionStorage.setItem(KEY, b);
    const regs = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all((regs ?? []).map((g) => g.unregister()));
    if ('caches' in window) await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
    location.reload();
  } catch {
    /* بلا شبكة: تجاهل */
  }
}

export function watchForUpdate(): void {
  if (import.meta.env.DEV) return;
  window.setTimeout(() => void check(), 2500);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void check();
  });
}
