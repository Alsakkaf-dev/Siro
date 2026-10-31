import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../core/app-context.js';
import { ApiError, sports, type AltPick } from '../lib/api.js';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, EmptyState, Skeleton } from '../ui/ui.js';
import { ConfBadge, ContentBanner, useContent } from '../sports/sportsKit.js';
import type { AltsDoc, Alternative, HabitAlts } from '../../../shared/sports.js';
import { Term } from '../glossary/glossary.js';

/** يسحب n عناصر مختلفة؛ يفضّل ما لم يظهر في الضغطة السابقة كي لا تتكرر الاقتراحات. */
function draw(list: Alternative[], n: number, prev: string[], rnd: () => number = Math.random): Alternative[] {
  const pool = [...list].sort(() => rnd() - 0.5);
  const fresh = pool.filter((a) => !prev.includes(a.id));
  const rest = pool.filter((a) => prev.includes(a.id));
  return [...fresh, ...rest].slice(0, n);
}

export default function LifeAlternatives() {
  const c = useContent<AltsDoc>('HABITS_ALTERNATIVES_AR.json');
  const { toast } = useApp();
  const [picks, setPicks] = useState<AltPick[] | null>(null);
  const [habitId, setHabitId] = useState<string | null>(null);
  const [shown, setShown] = useState<Alternative[]>([]);
  const [prev, setPrev] = useState<string[]>([]);
  useEffect(() => {
    sports.altPicks().then(setPicks).catch(() => setPicks([]));
  }, []);
  const habits: HabitAlts[] = useMemo(() => c.data?.habits ?? [], [c.data]);
  const cur = habits.find((h) => h.id === habitId) ?? habits[0];
  const picked = useMemo(() => new Set((picks ?? []).map((p) => p.alt_id)), [picks]);
  const per = Math.max(1, Math.min(6, c.data?.craving_card?.alternatives_per_press ?? 3));
  const press = useCallback((): void => {
    if (!cur) return;
    // نفضّل المختارة عندك أولًا ثم نُكمل من الباقي
    const mine = cur.alternatives.filter((a) => picked.has(a.id));
    const first = draw(mine, per, prev);
    const more = first.length < per ? draw(cur.alternatives.filter((a) => !first.includes(a)), per - first.length, prev) : [];
    const out = [...first, ...more];
    setShown(out);
    setPrev(out.map((a) => a.id));
  }, [cur, picked, per, prev]);
  const toggle = async (a: Alternative, h: HabitAlts): Promise<void> => {
    try {
      setPicks(await sports.pickAlt(a.id, h.id, !picked.has(a.id)));
    } catch (e) {
      toast(e instanceof ApiError ? e.message : (e as Error).message, { kind: 'error' });
    }
  };
  const head = <PageHead title={<Term id="alternative">بدائل العادات</Term>} icon="zap" sub="ماذا أسوي بدل العادة؟ اقتراحات عامة من راشد — وأنت تختار." crumbs={[{ to: '/life', label: 'الحياة' }, { label: 'بدائل العادات' }]} />;
  if (c.loading) return <div className="page sports-page">{head}<Skeleton h={160} r={16} /></div>;
  if (c.error) return <div className="page sports-page">{head}<EmptyState icon="warn" title="تعذّر الاتصال بالخادم" text={c.error} action={<Button onClick={c.reload}>إعادة المحاولة</Button>} /></div>;
  if (!c.rootExists || !c.data || !cur) {
    return (
      <div className="page sports-page">
        {head}
        <ContentBanner status={c.status} label="بدائل العادات" />
        <EmptyState icon="zap" title="بدائل العادات غير متاحة" text={!c.rootExists ? 'مجلد صادرات راشد غير موجود.' : 'ملف بدائل العادات غير متاح أو تغيّر تنسيقه.'} action={<Button to="/settings?tab=sources" icon="sliders">إعدادات الحياة</Button>} />
      </div>
    );
  }
  const card = c.data.craving_card;
  return (
    <div className="page sports-page">
      {head}
      <ContentBanner status={c.status} label="بدائل العادات" />
      <p className="life-note warn"><span>{c.data.note_ar ?? 'كلها اقتراحات عامة.'}</span></p>
      <div className="seg" role="group" aria-label="العادة">
        {habits.map((h) => (
          <button key={h.id} type="button" aria-pressed={h.id === cur.id} onClick={() => { setHabitId(h.id); setShown([]); setPrev([]); }}>{h.name_ar}</button>
        ))}
      </div>
      <section className="craving" aria-label={card?.title_ar ?? 'ماذا أسوي الحين؟'}>
        <h2>{card?.title_ar ?? 'ماذا أسوي الحين؟'}</h2>
        <p className="muted" style={{ margin: 0 }}>اضغط عند <Term id="craving">الاشتهاء</Term> أو الرغبة في «{cur.name_ar}»؛ تظهر {per} بدائل{picked.size ? ' (تُفضَّل المختارة عندك)' : ''}.</p>
        <div><Button variant="primary" icon="zap" onClick={press}>{shown.length ? 'اقتراحات أخرى' : 'اشتهاء الآن — أعطني بدائل'}</Button></div>
        {shown.length > 0 && (
          <ul className="alt-three" aria-live="polite">
            {shown.map((a) => (
              <li key={a.id}>
                <b>{a.title_ar}</b>
                <span>{a.how_ar}</span>
              </li>
            ))}
          </ul>
        )}
        {cur.safety_note_ar && <p className="life-note warn" style={{ margin: 0 }}><span>{cur.safety_note_ar}</span></p>}
      </section>
      <Card>
        <CardHead title={`كل بدائل «${cur.name_ar}»`} icon="list">
          <Badge>{picked.size ? `${cur.alternatives.filter((a) => picked.has(a.id)).length} مختار` : 'لم تختر بعد'}</Badge>
        </CardHead>
        {cur.note_ar && <p className="muted" style={{ marginBlockStart: 0 }}>{cur.note_ar}</p>}
        <ul className="alt-list">
          {cur.alternatives.map((a) => (
            <li key={a.id} className={`alt-item ${picked.has(a.id) ? 'picked' : ''}`}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>{a.title_ar}</h3>
              <span>{a.how_ar}</span>
              <small className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                <ConfBadge c={a.confidence ?? c.data?.confidence} />
                {a.basis_ar && <span>الأساس: {a.basis_ar}</span>}
              </small>
              <div>
                <Button size="sm" variant={picked.has(a.id) ? 'ghost' : undefined} icon={picked.has(a.id) ? 'check' : 'plus'} aria-pressed={picked.has(a.id)} onClick={() => void toggle(a, cur)}>{picked.has(a.id) ? 'مختار عندي' : 'أختاره'}</Button>
              </div>
            </li>
          ))}
        </ul>
        <p className="muted" style={{ marginBottom: 0 }}>{c.data.selection_note_ar ? `اختيار راشد المسجّل: ${Object.keys(c.data.selected_alternatives ?? {}).length ? 'مسجّل' : 'فارغ'} — ` : ''}اختيارك هنا محلي في موقعك فقط ولا يغيّر ملفات راشد.</p>
      </Card>
    </div>
  );
}
