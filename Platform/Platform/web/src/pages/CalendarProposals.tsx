import '../styles/kitchen.css';
import '../styles/calendar.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, EmptyState, Segmented } from '../ui/ui.js';
import { Icon } from '../lib/icons.js';
import { useApp } from '../core/app-context.js';
import { useUrlParam } from '../core/useUrlParam.js';
import { addDays, isDate, lineDiff, OP_AR, todayKL } from '../../../shared/calendar/index.js';
import { deleteProposal, exportProposals, fetchProposals, fixGrams, fromPlan, setProposalStatus, type ProposalView } from '../calendar/api.js';
import { fmtDay } from '../calendar/fmt.js';
import { fmtNum } from '../../../shared/kitchen/index.js';

type Filter = 'all' | ProposalView['status'];
const ST: Record<ProposalView['status'], { label: string; tone?: 'ok' | 'warn' | 'danger' }> = { pending: { label: 'معلّق', tone: 'warn' }, approved: { label: 'معتمد', tone: 'ok' }, applied: { label: 'مطبّق', tone: 'ok' }, rejected: { label: 'مرفوض', tone: 'danger' } };

function download(name: string, text: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** طابور اقتراحات Outlook (K-M11، CAL-40…48): فرق قبل/بعد، اعتماد، تصدير لراشد (JSON + نص)، ثم وسم «مطبّق» بعد «رن» عند راشد. لا كتابة في Outlook من هنا. */
export default function CalendarProposals() {
  const { toast, confirm } = useApp();
  const [filter, setFilter] = useUrlParam<Filter>('status', 'all', ['all', 'pending', 'approved', 'applied', 'rejected']);
  const [items, setItems] = useState<ProposalView[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [lastExport, setLastExport] = useState<{ text: string; json: unknown; count: number } | null>(null);
  const load = useCallback(() => { void fetchProposals().then((r) => { setItems(r.proposals); setCounts(r.counts); }).catch(() => setItems([])); }, []);
  useEffect(load, [load]);
  const shown = useMemo(() => (items ?? []).filter((p) => filter === 'all' || p.status === filter), [items, filter]);
  const groups = useMemo(() => { const m = new Map<string, ProposalView[]>(); for (const p of shown) (m.get(p.date) ?? m.set(p.date, []).get(p.date)!).push(p); return [...m]; }, [shown]);
  const act = async (fn: () => Promise<unknown>, ok?: string): Promise<boolean> => { try { await fn(); if (ok) toast(ok, { kind: 'ok' }); load(); return true; } catch (e) { toast(e instanceof Error ? e.message : 'تعذّر التنفيذ', { kind: 'error' }); return false; } };
  const doExport = async (ids?: string[]): Promise<void> => {
    try {
      const r = await exportProposals(ids);
      setLastExport({ text: r.text, json: r.json, count: r.count });
      toast(`صُدِّر ${r.count} اقتراحًا — لم يُكتب شيء في Outlook`, { kind: 'ok' });
      load();
    } catch (e) { toast(e instanceof Error ? e.message : 'تعذّر التصدير', { kind: 'error' }); }
  };
  const copy = (t: string): void => void navigator.clipboard?.writeText(t).then(() => toast('نُسخ النص', { kind: 'ok' }), () => toast('تعذّر النسخ', { kind: 'error' }));
  const approved = counts['approved'] ?? 0;

  return (
    <div className="page kitchen cal-page">
      <PageHead title="اقتراحات Outlook" icon="mail" sub="لا يُكتب شيء في Outlook من المنصة: الاقتراح يُصدَّر لراشد ويُنفَّذ بـ«رن» منفصلة منك عنده، ثم تُوسَم هنا مطبّقة." />
      <GenerateCard onDone={load} />
      <div className="cal-bar">
        <Segmented<Filter> label="التصفية" value={filter} onChange={setFilter} options={[{ value: 'all', label: `الكل ${fmtNum(items?.length ?? 0, 0)}` }, { value: 'pending', label: `معلّقة ${fmtNum(counts['pending'] ?? 0, 0)}` }, { value: 'approved', label: `معتمدة ${fmtNum(approved, 0)}` }, { value: 'applied', label: `مطبّقة ${fmtNum(counts['applied'] ?? 0, 0)}` }, { value: 'rejected', label: `مرفوضة ${fmtNum(counts['rejected'] ?? 0, 0)}` }]} />
        <span className="grow" />
        <Button variant="primary" icon="download" disabled={!approved} onClick={() => void doExport()} data-testid="export-all">صدّر المعتمدة لراشد ({fmtNum(approved, 0)})</Button>
      </div>
      {lastExport && (
        <Card>
          <CardHead title={`آخر تصدير: ${fmtNum(lastExport.count, 0)} اقتراحًا`} icon="mail" />
          <div className="row">
            <Button size="sm" icon="download" onClick={() => download(`siro-calendar-proposals-${todayKL()}.json`, JSON.stringify(lastExport.json, null, 2), 'application/json')} data-testid="dl-json">نزّل JSON لراشد</Button>
            <Button size="sm" icon="copy" onClick={() => copy(lastExport.text)} data-testid="copy-text">انسخ النص العربي</Button>
            <Button size="sm" onClick={() => setLastExport(null)}>أخفِ</Button>
          </div>
          <pre className="kt-body-text" dir="rtl" data-testid="export-text">{lastExport.text}</pre>
          <small className="muted">راشد وحده يكتب في Outlook وبعد «رن» منفصلة. بعد تنفيذه افتح كل اقتراح هنا ووسمه «مطبّق».</small>
        </Card>
      )}
      {items === null ? <p className="muted">جارٍ التحميل…</p> : groups.length === 0 ? <EmptyState icon="mail" title="لا اقتراحات" text="ولّد اقتراحات من يوم محفوظ في الوجبات أو من إصلاحات الأوصاف أعلاه." /> : (
        <div className="stack" data-testid="proposal-list">
          {groups.map(([date, list]) => (
            <section key={date} aria-label={fmtDay(date)}>
              <h3 className="cal-list-h">{fmtDay(date)}</h3>
              <div className="stack">
                {list.map((p) => (
                  <Card key={p.id}>
                    <div className="row cal-det" data-testid="proposal" data-status={p.status}>
                      <Badge>{OP_AR[p.kind]}</Badge>
                      <b>{(p.after ?? p.before)?.title}</b>
                      <small className="muted">{p.calendar}</small>
                      <Badge {...(ST[p.status].tone ? { tone: ST[p.status].tone } : {})}>{ST[p.status].label}</Badge>
                      {p.exported_at && <Badge dashed>صُدِّر</Badge>}
                      {p.lint.ok ? <Badge tone="ok"><Icon name="check" size={11} /> فحص القوانين</Badge> : <Badge tone="danger"><Icon name="x" size={11} /> فحص القوانين</Badge>}
                      <span className="grow" />
                      {p.status === 'pending' && <><Button size="sm" variant="primary" onClick={() => void act(() => setProposalStatus(p.id, 'approved'))}>اعتمد</Button><Button size="sm" onClick={() => void act(() => setProposalStatus(p.id, 'rejected'))}>ارفض</Button></>}
                      {p.status === 'approved' && <><Button size="sm" onClick={() => void doExport([p.id])}>صدّر</Button><Button size="sm" variant="primary" disabled={!p.exported_at} title={p.exported_at ? '' : 'صدِّره لراشد أولًا'} onClick={() => void act(() => setProposalStatus(p.id, 'applied'), 'وُسم مطبّقًا')} data-testid="mark-applied">وسمه مطبّقًا</Button><Button size="sm" onClick={() => void act(() => setProposalStatus(p.id, 'pending'))}>أرجع للمعلّق</Button></>}
                      {p.status === 'rejected' && <Button size="sm" onClick={() => void act(() => setProposalStatus(p.id, 'pending'))}>أعد فتحه</Button>}
                      {(p.status === 'pending' || p.status === 'rejected') && <Button size="sm" icon="trash" aria-label="احذف الاقتراح" onClick={async () => { if (await confirm({ title: 'حذف الاقتراح؟', body: 'يُحذف من المنصة فقط.', confirmLabel: 'احذف' })) void act(() => deleteProposal(p.id)); }} />}
                    </div>
                    <p className="muted">{p.reason}</p>
                    <Diff p={p} />
                    {p.series && <p className="callout" role="note">حدث من سلسلة <bdi>{p.series}</bdi>{p.exceptions.length ? ` — استثناءات تُعاد بعد التعديل: ${p.exceptions.map((e) => `${e.date} (${e.note})`).join('، ')}` : ' — بلا استثناءات مُقرّة.'}</p>}
                    {p.lint.warnings.map((w, i) => <p key={i} className="callout warn" role="note"><Icon name="warn" size={13} /> {w.code}: {w.msg}</p>)}
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Diff({ p }: { p: ProposalView }) {
  const a = p.before;
  const b = p.after;
  const time = (x: { start: string; end: string } | null): string => (x ? `${x.start.slice(11)}–${x.end.slice(11)}` : '—');
  return (
    <div className="stack kt-tight" data-testid="diff">
      {(a?.start !== b?.start || a?.end !== b?.end) && <p>الوقت: <del className="num" dir="ltr">{time(a)}</del> ← <ins className="num" dir="ltr">{time(b)}</ins></p>}
      {a && b && a.title !== b.title && <p>العنوان: <del>{a.title}</del> ← <ins>{b.title}</ins></p>}
      {(a?.description ?? '') !== (b?.description ?? '') && (
        <pre className="kt-body-text cal-diff" dir="rtl" aria-label="فرق الوصف">
          {lineDiff(a?.description ?? '', b?.description ?? '').map((l, i) => <span key={i} className={`dl-${l.op}`}>{l.op === 'del' ? '− ' : l.op === 'add' ? '+ ' : '  '}{l.text}{'\n'}</span>)}
        </pre>
      )}
      {p.kind === 'delete' && <p className="callout danger">يُحذف الحدث بالكامل عند راشد.</p>}
    </div>
  );
}

function GenerateCard({ onDone }: { onDone: () => void }) {
  const { toast } = useApp();
  const [date, setDate] = useState(todayKL());
  const [from, setFrom] = useState(todayKL());
  const [to, setTo] = useState(addDays(todayKL(), 29));
  const [res, setRes] = useState<string[]>([]);
  const [fix, setFix] = useState<{ found: number; n: number } | null>(null);
  const run = async (fn: () => Promise<string[]>): Promise<void> => { try { setRes(await fn()); onDone(); } catch (e) { toast(e instanceof Error ? e.message : 'تعذّر التنفيذ', { kind: 'error' }); } };
  return (
    <Card>
      <CardHead title="ولّد اقتراحات" icon="plus" info="كل اقتراح يمرّ على فحص CAL-10…19 قبل إنشائه؛ الرفض يظهر بسببه." />
      <div className="row kt-filter-row">
        <label className="kt-inline">يوم من الخطة <input className="input" type="date" dir="ltr" value={date} onChange={(e) => setDate(e.target.value)} aria-label="يوم الخطة" /></label>
        <Button size="sm" variant="primary" disabled={!isDate(date)} data-testid="gen-plan" onClick={() => void run(async () => {
          const r = await fromPlan(date);
          return [`أُنشئ ${r.created.length} اقتراحًا`, ...r.skipped.map((s) => `تُخطّي «${s.slot}»: ${s.reason}`), ...r.rejected.map((x) => `رُفض «${x.slot}»: ${x.errors.map((e) => `${e.code} ${e.msg}`).join(' | ')}`), r.note];
        })}>من يوم الخطة</Button>
      </div>
      <div className="row kt-filter-row">
        <label className="kt-inline">إصلاح صياغة الغرام (DEF-10) من <input className="input" type="date" dir="ltr" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="من" /></label>
        <label className="kt-inline">إلى <input className="input" type="date" dir="ltr" value={to} onChange={(e) => setTo(e.target.value)} aria-label="إلى" /></label>
        <Button size="sm" onClick={() => void run(async () => { const r = await fixGrams(from, to, true); setFix({ found: r.found, n: r.list.reduce((s, x) => s + x.changes.length, 0) }); return [`معاينة: ${r.found} حدثًا فيه صياغة غرام خاطئة`]; })}>عاين</Button>
        <Button size="sm" disabled={!fix?.found} onClick={() => void run(async () => { const r = await fixGrams(from, to, false); return [`أُنشئ ${r.created.length} اقتراح إصلاح`, ...r.rejected.map((x) => `رُفض ${x.event_id}: ${x.errors.map((e) => e.msg).join(' | ')}`)]; })}>ولّد اقتراحات الإصلاح</Button>
      </div>
      {res.length > 0 && <ul className="plain stack kt-tight" role="status" data-testid="gen-result">{res.map((r, i) => <li key={i}>{r}</li>)}</ul>}
    </Card>
  );
}
