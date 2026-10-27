import { useEffect, useState } from 'react';
import { useApp } from './app-context.js';
import { Button, Card, CardHead, Segmented } from '../ui/ui.js';
import { getNotifyEnabled, notifyPermission, notifySupported, setNotifyEnabled } from '../notify/prefs.js';

export const ACCENTS: { id: string; label: string; light: string; dark: string }[] = [
  { id: 'indigo', label: 'نيلي', light: '#5B45F0', dark: '#9A8BFF' },
  { id: 'teal', label: 'فيروزي', light: '#0F766E', dark: '#5EEAD4' },
  { id: 'sky', label: 'سماوي', light: '#0369A1', dark: '#7DD3FC' },
  { id: 'emerald', label: 'زمردي', light: '#047857', dark: '#6EE7B7' },
  { id: 'amber', label: 'كهرماني', light: '#B45309', dark: '#FCD34D' },
  { id: 'rose', label: 'وردي', light: '#BE185D', dark: '#F9A8D4' },
];
const ls = (k: string): string | null => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};

export function AppearanceCard() {
  const { theme, themePref, setTheme } = useApp();
  const [accent, setAccent] = useState(() => document.documentElement.getAttribute('data-accent') ?? 'indigo');
  const [motion, setMotion] = useState<'auto' | 'off'>(() => (ls('platform.motion') === 'off' ? 'off' : 'auto'));
  const [density, setDensity] = useState<'comfortable' | 'compact'>(() => (ls('platform.density') === 'compact' ? 'compact' : 'comfortable'));
  useEffect(() => {
    const el = document.documentElement;
    if (density === 'compact') el.setAttribute('data-density', 'compact');
    else el.removeAttribute('data-density');
    try {
      localStorage.setItem('platform.density', density);
    } catch { /* تجاهل */ }
  }, [density]);
  useEffect(() => {
    const el = document.documentElement;
    if (accent === 'indigo') el.removeAttribute('data-accent');
    else el.setAttribute('data-accent', accent);
    try {
      localStorage.setItem('platform.accent', accent);
    } catch { /* تجاهل */ }
  }, [accent]);
  useEffect(() => {
    const el = document.documentElement;
    if (motion === 'off') el.setAttribute('data-motion', 'off');
    else el.removeAttribute('data-motion');
    try {
      localStorage.setItem('platform.motion', motion);
    } catch { /* تجاهل */ }
  }, [motion]);
  return (
    <Card id="appearance">
      <CardHead title="المظهر" icon="sun" />
      <div className="stack">
        <Segmented label="السمة" value={themePref} onChange={setTheme} options={[{ value: 'light', label: 'فاتح', icon: 'sun' }, { value: 'dark', label: 'داكن', icon: 'moon' }, { value: 'system', label: 'حسب النظام' }]} />
        <div>
          <div className="muted" id="accent-lbl" style={{ marginBlockEnd: 6 }}>لون التمييز</div>
          <div className="swatches" role="radiogroup" aria-labelledby="accent-lbl">
            {ACCENTS.map((a) => (
              <button key={a.id} type="button" role="radio" aria-checked={accent === a.id} aria-label={a.label} title={a.label} className="swatch" style={{ ['--sw' as string]: theme === 'dark' ? a.dark : a.light }} onClick={() => setAccent(a.id)} />
            ))}
          </div>
        </div>
        <Segmented label="الحركة" value={motion} onChange={setMotion} options={[{ value: 'auto', label: 'حركات الواجهة' }, { value: 'off', label: 'بدون حركة' }]} />
        <Segmented label="الكثافة" value={density} onChange={setDensity} options={[{ value: 'comfortable', label: 'مريحة' }, { value: 'compact', label: 'مضغوطة (قوائم وجداول أكثف)' }]} />
        <p className="muted" style={{ margin: 0, fontSize: 'var(--fs-sm)' }}>يُحفظ على هذا الجهاز فقط. «بدون حركة» تُطبَّق تلقائيًا أيضًا إن كان نظامك يطلب تقليل الحركة.</p>
      </div>
    </Card>
  );
}

export function NotifyCard() {
  const [on, setOn] = useState(getNotifyEnabled);
  const [perm, setPerm] = useState(notifyPermission);
  const toggle = async (): Promise<void> => {
    if (on) {
      setNotifyEnabled(false);
      setOn(false);
      return;
    }
    if (!notifySupported()) return;
    const p = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    setPerm(p);
    if (p === 'granted') {
      setNotifyEnabled(true);
      setOn(true);
    }
  };
  return (
    <Card>
      <CardHead title="تنبيهات المواعيد" icon="bell" />
      <div className="stack">
        <p className="muted" style={{ margin: 0 }}>الجرس في الأعلى يعرض مواعيد الفصل النشط خلال 7 أيام دائمًا. إشعار المتصفح اختياري: يُعرض مرة واحدة لكل تقييم له تاريخ محدد، يوم الموعد وقبله بيوم. التقييمات المحددة بأسبوع فقط (موعد تقريبي) لا تُنبَّه ولا يُخمَّن لها تاريخ.</p>
        <div className="row">
          <Button {...(on ? {} : { variant: 'primary' as const })} icon="bell" onClick={() => void toggle()} disabled={!notifySupported() || perm === 'denied'}>{on ? 'إيقاف إشعارات المتصفح' : 'تفعيل إشعارات المتصفح'}</Button>
          <span className="muted" role="status">{perm === 'unsupported' ? 'المتصفح لا يدعم الإشعارات' : perm === 'denied' ? 'محظورة من إعدادات المتصفح' : on ? 'مفعّلة — تعمل ما دامت الصفحة أو التطبيق مفتوحًا' : 'متوقفة'}</span>
        </div>
      </div>
    </Card>
  );
}
