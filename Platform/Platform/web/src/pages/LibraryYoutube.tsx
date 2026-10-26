import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../core/app-context.js';
import { ApiError, lib } from '../lib/api.js';
import { PageHead } from '../ui/page.js';
import { Button, Card, EmptyState, Field, KebabMenu, Modal, Skeleton } from '../ui/ui.js';
import { CourseBadge, KindTile, ProgressBar, TagChips, fmtWhen, itemPath, pctOf } from '../library/common.js';
import type { LibItem } from '../../../shared/library.js';

function YtForm({ item, onClose, onSaved }: { item?: LibItem; onClose: () => void; onSaved: () => void }) {
  const { toast } = useApp();
  const [url, setUrl] = useState(item ? `https://www.youtube.com/watch?v=${item.video_id}` : '');
  const [title, setTitle] = useState(item?.title ?? '');
  const [course, setCourse] = useState(item?.course_code ?? '');
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    setErrs({});
    try {
      if (item) await lib.editYoutube(item.id, { title, course });
      else await lib.addYoutube({ url, title: title || undefined, course: course || undefined });
      toast(item ? 'تم تحديث الفيديو' : 'تمت إضافة الفيديو', { kind: 'ok' });
      onSaved();
      onClose();
    } catch (er) {
      if (er instanceof ApiError && Object.keys(er.fields).length) setErrs(er.fields);
      else toast((er as Error).message, { kind: 'error' });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={item ? 'تعديل الفيديو' : 'إضافة فيديو YouTube'} onClose={onClose} footer={<><Button onClick={onClose}>إلغاء</Button><Button variant="primary" type="submit" form="yt-form" disabled={busy}>{item ? 'حفظ' : 'إضافة'}</Button></>}>
      <form id="yt-form" onSubmit={(e) => void submit(e)} className="stack" style={{ gap: 'var(--s-4)' }}>
        {!item && (
          <Field label="رابط الفيديو" error={errs['url']} hint="مثل https://www.youtube.com/watch?v=… أو youtu.be/… (يُحفظ المعرّف فقط؛ لا تُحمَّل أي بيانات من يوتيوب حتى تضغط تشغيل)." htmlFor="yt-url">
            <input id="yt-url" className="input" style={{ direction: 'ltr', textAlign: 'start' }} value={url} onChange={(e) => setUrl(e.target.value)} aria-invalid={!!errs['url']} autoFocus spellCheck={false} />
          </Field>
        )}
        <Field label="العنوان" error={errs['title']} hint="اكتبه بنفسك — الموقع لا يتصل بيوتيوب لجلب العنوان." htmlFor="yt-title">
          <input id="yt-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!errs['title']} />
        </Field>
        <Field label="رمز المادة (اختياري)" hint="مثل SCSE3103 ليظهر الفيديو ضمن المادة." htmlFor="yt-course">
          <input id="yt-course" className="input" style={{ direction: 'ltr', textAlign: 'start', maxInlineSize: 200 }} value={course} onChange={(e) => setCourse(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}

export default function LibraryYoutube() {
  const { toast, confirm } = useApp();
  const [items, setItems] = useState<LibItem[] | null>(null);
  const [form, setForm] = useState<{ item?: LibItem } | null>(null);
  const load = useCallback(() => {
    void lib.youtube().then(setItems).catch((e: Error) => toast(e.message, { kind: 'error' }));
  }, [toast]);
  useEffect(load, [load]);

  const del = async (it: LibItem): Promise<void> => {
    const ok = await confirm({ title: 'إزالة الفيديو من المكتبة؟', body: <p>تُحذف ملاحظاتك وعلاماتك وتقدّم المشاهدة لهذا الفيديو من الموقع فقط. لا يتأثر الفيديو على يوتيوب.</p>, confirmLabel: 'إزالة', danger: true });
    if (!ok) return;
    try {
      await lib.delYoutube(it.id);
      toast('أُزيل الفيديو');
      load();
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };

  return (
    <div className="page">
      <PageHead title="فيديوهات YouTube" icon="play" crumbs={[{ to: '/library', label: 'المكتبة' }, { label: 'YouTube' }]} sub="روابط محفوظة محليًا مع ملاحظاتك وعلامات الوقت وتقدّم المشاهدة." actions={<Button variant="primary" icon="plus" onClick={() => setForm({})}>إضافة فيديو</Button>} />
      {!items ? (
        <Skeleton h={180} r={16} />
      ) : items.length === 0 ? (
        <EmptyState icon="play" title="لا فيديوهات بعد" text="أضف رابط فيديو يوتيوب لمادة ما، وسجّل علامات وقت وملاحظات أثناء المشاهدة." action={<Button variant="primary" icon="plus" onClick={() => setForm({})}>إضافة فيديو</Button>} />
      ) : (
        <div className="grid cols-3 stagger">
          {items.map((it, i) => (
            <Card key={it.ref} hover style={{ '--i': i } as never}>
              <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                <KindTile kind="youtube" size={42} />
                <KebabMenu label={`خيارات ${it.title}`} items={[{ label: 'تعديل', icon: 'edit', onClick: () => setForm({ item: it }) }, { label: 'إزالة', icon: 'trash', danger: true, onClick: () => void del(it) }]} />
              </div>
              <h2 className="h3" style={{ marginBlock: 'var(--s-3) var(--s-2)' }}><Link to={itemPath(it)}><bdi>{it.title}</bdi></Link></h2>
              <div className="row" style={{ gap: 8 }}><CourseBadge it={it} /><TagChips tags={it.tags} /></div>
              <div style={{ marginBlockStart: 'var(--s-3)' }}><ProgressBar value={pctOf(it)} /></div>
              <p className="muted" style={{ margin: 'var(--s-2) 0 0', fontSize: 'var(--fs-xs)' }}>{it.opened_at ? `آخر مشاهدة ${fmtWhen(it.opened_at)}` : 'لم يُشاهد بعد'}</p>
            </Card>
          ))}
        </div>
      )}
      {form && <YtForm {...(form.item ? { item: form.item } : {})} onClose={() => setForm(null)} onSaved={load} />}
    </div>
  );
}
