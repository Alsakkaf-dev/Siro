import { useState, type FormEvent } from 'react';
import { useApp } from '../core/app-context.js';
import { ApiError, lib } from '../lib/api.js';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, Field, Skeleton } from '../ui/ui.js';
import { fmtWhen, useLibStatus } from '../library/common.js';

export default function LibrarySettings() {
  const { toast } = useApp();
  const { status, reload } = useLibStatus();
  const [root, setRoot] = useState<string | null>(null);
  const [mins, setMins] = useState<string | null>(null);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  if (!status) return <div className="page"><PageHead title="إعدادات المكتبة" icon="sliders" /><Skeleton h={220} r={16} /></div>;
  const rootVal = root ?? status.root;
  const minsVal = mins ?? String(status.auto_minutes);

  const save = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    setErrs({});
    try {
      const body: { root?: string; auto_minutes?: number } = { auto_minutes: Number(minsVal) };
      if (rootVal.trim() !== status.root) body.root = rootVal.trim();
      await lib.settings(body);
      toast('تم حفظ إعدادات المكتبة' + (body.root ? ' — بدأ فحص المجلد' : ''), { kind: 'ok' });
      setRoot(null);
      setMins(null);
      reload();
    } catch (er) {
      if (er instanceof ApiError && Object.keys(er.fields).length) setErrs(er.fields);
      else toast((er as Error).message, { kind: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <PageHead title="إعدادات المكتبة" icon="sliders" />
      <div className="stack" style={{ gap: 'var(--s-5)', maxInlineSize: 760 }}>
        <Card>
          <CardHead title="مجلد المكتبة" icon="folder" />
          <form onSubmit={(e) => void save(e)} className="stack" style={{ gap: 'var(--s-4)' }}>
            <Field label="مسار المجلد" error={errs['root']} hint="مسار كامل على جهازك، مثل C:\Users\…\The_Boots\Bachelor in Software Engineering. يقرأ الموقع هذا المجلد فقط ولا يحذف أو ينقل أو يعدّل أي ملف فيه." htmlFor="lib-root">
              <input id="lib-root" className="input ltr-in" style={{ direction: 'ltr', textAlign: 'start' }} value={rootVal} onChange={(e) => setRoot(e.target.value)} aria-invalid={!!errs['root']} spellCheck={false} autoComplete="off" />
            </Field>
            <p className="row" style={{ gap: 8 }}>
              {status.root_exists && status.root_is_dir ? <Badge tone="ok">المجلد موجود</Badge> : <Badge tone="warn">المجلد غير موجود حاليًا</Badge>}
              {status.root !== status.default_root && <Button size="sm" type="button" variant="ghost" onClick={() => setRoot(status.default_root)}>استعادة الافتراضي</Button>}
            </p>
            <Field label="الفحص التلقائي كل (دقيقة)" error={errs['auto_minutes']} hint="0 = إيقاف الفحص التلقائي (يبقى الفحص اليدوي متاحًا)." htmlFor="lib-mins">
              <input id="lib-mins" className="input" inputMode="numeric" style={{ maxInlineSize: 140 }} value={minsVal} onChange={(e) => setMins(e.target.value)} aria-invalid={!!errs['auto_minutes']} />
            </Field>
            <div className="row">
              <Button variant="primary" type="submit" disabled={busy}>حفظ</Button>
              <Button type="button" icon="refresh" disabled={status.scanning} onClick={() => void lib.scan().then(() => { toast('بدأ الفحص'); reload(); }).catch((er: Error) => toast(er.message, { kind: 'error' }))}>{status.scanning ? 'جارٍ الفحص…' : 'فحص الآن'}</Button>
            </div>
          </form>
        </Card>
        <Card>
          <CardHead title="آخر فحص" icon="clock" />
          {status.last_scan ? (
            <dl className="meta-dl">
              <dt>الوقت</dt><dd>{fmtWhen(status.last_scan.at)}</dd>
              <dt>ملفات مفحوصة</dt><dd className="num">{status.last_scan.scanned}</dd>
              <dt>جديدة / محدّثة / مفقودة</dt><dd className="num">{status.last_scan.added} / {status.last_scan.updated} / {status.last_scan.missing}</dd>
              <dt>أخطاء قراءة</dt><dd className="num">{status.last_scan.errors}</dd>
              <dt>المدة</dt><dd className="num">{status.last_scan.ms} مللي ثانية</dd>
            </dl>
          ) : <p className="muted">لم يُجرَ فحص بعد.</p>}
        </Card>
        <Card>
          <CardHead title="كيف يعمل الفحص؟" icon="info" />
          <ul className="muted" style={{ margin: 0, paddingInlineStart: '1.2em', display: 'grid', gap: 6 }}>
            <li>قراءة فقط: لا حذف ولا نقل ولا تعديل للملفات.</li>
            <li>تُتجاهل المجلدات المخفية و node_modules والملفات المؤقتة، ولا تُتبع الروابط الرمزية.</li>
            <li>الفصل والمادة والتصنيف مُستنتجة من أسماء المجلدات (تقدير) وتُطابَق مع رموز المواد في قسم الدراسة.</li>
            <li>إن اختفى ملف يُعلَّم «مفقود» وتبقى وسومه وملاحظاته إن عاد.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
