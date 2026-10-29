import { useState, type FormEvent } from 'react';
import { useApp } from '../core/app-context.js';
import { ApiError, life } from '../lib/api.js';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, Field, Modal, Skeleton } from '../ui/ui.js';
import { FreshBadge, fmtAt, Note, useLife, TblWrap } from '../life/lifeKit.js';
import { LIFE_DOCS } from '../../../shared/life.js';

const DOC_AR: Record<string, string> = { 'DATA_DICTIONARY_AR.md': 'قاموس البيانات', 'PROPOSALS.md': 'المقترحات', 'FINANCE_SPEC_AR.md': 'مواصفات المال', 'HABITS_SPEC_AR.md': 'مواصفات العادات', 'SPORTS_CONTENT_AR.md': 'محتوى الرياضة', 'REFRESH_PROTOCOL_AR.md': 'بروتوكول التحديث', 'SITE_IDEAS_AR.md': 'أفكار الموقع' };

export default function LifeSettings() {
  const { toast } = useApp();
  const d = useLife(['finance']);
  const [root, setRoot] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [doc, setDoc] = useState<{ name: string; text: string | null } | null>(null);
  const st = d.status;
  if (!st) return <div className="page"><PageHead title="إعدادات الحياة" icon="sliders" /><Skeleton h={220} r={16} /></div>;
  const val = root ?? st.root;
  const save = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await life.settings(val.trim());
      toast('تم حفظ مسار مجلد راشد', { kind: 'ok' });
      setRoot(null);
      d.reload();
    } catch (er) {
      if (er instanceof ApiError && er.fields['root']) setErr(er.fields['root']);
      else toast((er as Error).message, { kind: 'error' });
    } finally {
      setBusy(false);
    }
  };
  const open = (name: string): void => {
    setDoc({ name, text: null });
    life.doc(name).then((r) => setDoc({ name, text: r.text })).catch((er: Error) => setDoc({ name, text: `تعذّر فتح الوثيقة: ${er.message}` }));
  };
  return (
    <div className="page life-page">
      <PageHead title="إعدادات الحياة" icon="sliders" />
      <div className="stack life-stack" style={{ maxInlineSize: 900 }}>
        <Card>
          <CardHead title="مجلد صادرات راشد" icon="folder" />
          <form onSubmit={(e) => void save(e)} className="stack">
            <Field label="مسار المجلد" error={err} hint="مسار كامل على جهازك، مثل C:\Users\…\The_Boots\Platform\exchange\rashed. الموقع يقرأ الملفات فقط؛ والكتابة الوحيدة المسموحة ملفات المسودات الجديدة في commands بعد تأكيدك." htmlFor="life-root">
              <input id="life-root" className="input" style={{ direction: 'ltr', textAlign: 'start' }} value={val} onChange={(e) => setRoot(e.target.value)} spellCheck={false} aria-invalid={!!err} />
            </Field>
            <p className="row" style={{ gap: 8 }}>
              {st.root_exists ? <Badge tone="ok">المجلد موجود</Badge> : <Badge tone="warn">المجلد غير موجود حاليًا</Badge>}
              {st.commands_dir ? <Badge tone="ok">commands موجود</Badge> : <Badge dashed>commands غير موجود</Badge>}
              {st.root !== st.default_root && <Button size="sm" type="button" variant="ghost" onClick={() => setRoot(st.default_root)}>استعادة الافتراضي</Button>}
            </p>
            <div className="row"><Button variant="primary" type="submit" disabled={busy}>حفظ</Button><Button type="button" icon="refresh" onClick={d.reload}>إعادة القراءة</Button></div>
          </form>
        </Card>
        <Card>
          <CardHead title="حالة الملفات" icon="database" />
          {st.meta ? <p className="muted" style={{ marginBlockStart: 0 }}>exports_meta v{st.meta.version ?? '؟'} — كتب: {st.meta.writer ?? '؟'} — آخر توليد: {fmtAt(st.meta.generated_at)}</p> : <Note tone="warn">{st.meta_error ?? 'exports_meta.json غير متاح'}</Note>}
          <TblWrap label="حالة الملفات">
            <table className="life-tbl">
              <thead><tr><th>الملف</th><th>الحالة</th><th>وقت التوليد</th><th>الحد (ساعة)</th><th>الحجم (meta/فعلي)</th><th>ملاحظة</th></tr></thead>
              <tbody>
                {st.files.map((f) => (
                  <tr key={f.name}>
                    <td><b>{f.label}</b><small className="muted" style={{ display: 'block' }}>{f.name}.json</small></td>
                    <td><FreshBadge f={f} /></td>
                    <td>{fmtAt(f.generated_at)}</td>
                    <td className="num">{f.stale_after_hours ?? '—'}{f.threshold_source === 'protocol-default' && <small className="muted" style={{ display: 'block' }}>افتراضي من البروتوكول</small>}</td>
                    <td className="num"><bdi>{f.bytes_meta ?? '—'} / {f.bytes_actual ?? '—'}</bdi></td>
                    <td>{f.error ?? (f.mtime ? <small className="muted">تعديل الملف: {fmtAt(f.mtime)} (للعلم فقط)</small> : '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TblWrap>
          <Note>القِدم يُحسب من generated_at في exports_meta وحدّ stale_after_hours: قديم بعد الحد، منتهٍ بعد ثلاثة أضعافه. وقت تعديل الملف لا يدخل في الحساب لأن المزامنة تغيّره.</Note>
        </Card>
        <Card>
          <CardHead title="وثائق راشد" icon="book" />
          <div className="row" style={{ gap: 8 }}>
            {LIFE_DOCS.map((n) => <Button key={n} size="sm" icon="file" onClick={() => open(n)}>{DOC_AR[n] ?? n}</Button>)}
          </div>
        </Card>
      </div>
      {doc && (
        <Modal title={DOC_AR[doc.name] ?? doc.name} onClose={() => setDoc(null)} wide>
          {doc.text === null ? <Skeleton h={200} r={12} /> : <pre className="doc-pre">{doc.text}</pre>}
        </Modal>
      )}
    </div>
  );
}
