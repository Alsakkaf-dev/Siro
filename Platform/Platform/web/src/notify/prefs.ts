/** تفضيلات الإشعارات محليًا (localStorage). لا شيء يُرسل خارج الجهاز؛ الإشعار يُعرض من المتصفح نفسه. */
const KEY = 'platform.notify';
const FIRED = 'platform.notify.fired';

export const notifySupported = (): boolean => typeof Notification !== 'undefined';
export const notifyPermission = (): NotificationPermission | 'unsupported' => (notifySupported() ? Notification.permission : 'unsupported');

export function getNotifyEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}
export function setNotifyEnabled(v: boolean): void {
  try {
    localStorage.setItem(KEY, v ? '1' : '0');
    window.dispatchEvent(new Event('platform-notify'));
  } catch {
    /* تجاهل */
  }
}

/** لا نكرر نفس الإشعار: مفتاح = معرّف التقييم + تاريخه + عدد الأيام المتبقية. نحتفظ بآخر 60 يومًا فقط. */
export function wasFired(key: string): boolean {
  try {
    return key in (JSON.parse(localStorage.getItem(FIRED) ?? '{}') as Record<string, number>);
  } catch {
    return false;
  }
}
export function markFired(key: string): void {
  try {
    const m = JSON.parse(localStorage.getItem(FIRED) ?? '{}') as Record<string, number>;
    const now = Date.now();
    for (const k of Object.keys(m)) if (now - (m[k] ?? 0) > 60 * 86_400_000) delete m[k];
    m[key] = now;
    localStorage.setItem(FIRED, JSON.stringify(m));
  } catch {
    /* تجاهل */
  }
}
