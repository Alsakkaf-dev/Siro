import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge, Button, Card, CardHead, EmptyState, Field } from '../ui/ui.js';
import { TagBadge } from '../review/kit.js';
import { ContentPage } from '../life/v8Kit.js';
import { fmtDayFull, money } from '../life/lifeKit.js';
import { useContent } from '../sports/sportsKit.js';
import { Icon } from '../lib/icons.js';
import { EMPTY_LEDGER_FILTER, LEDGER_TYPE_AR, expenseSum, filterLedger, sortLedger, type LedgerDoc, type LedgerFilter, type LedgerSortKey } from '../../../shared/v8.js';

const COLS: { key: LedgerSortKey; label: string }[] = [{ key: 'order', label: '#' }, { key: 'date', label: 'التاريخ' }, { key: 'type', label: 'النوع' }, { key: 'amount', label: 'المبلغ' }, { key: 'wallet', label: 'الصندوق' }];

export default function LifeLedger() {
  const c = useContent<LedgerDoc>('ledger_full.json');
  // فلاتر السجل في الرابط (P7) بـ replace
  const [sp, setSp] = useSearchParams();
  const f: LedgerFilter = { q: (sp.get('q') ?? '').slice(0, 80), type: sp.get('type'), wallet: sp.get('wallet'), from: sp.get('from'), to: sp.get('to'), redactedOnly: sp.get('red') === '1', noBoxOnly: sp.get('nobox') === '1' };
  const setF = (u: LedgerFilter | ((x: LedgerFilter) => LedgerFilter)): void => {
    const n = typeof u === 'function' ? u(f) : u;
    const p = new URLSearchParams();
    if (n.q) p.set('q', n.q);
    for (const k of ['type', 'wallet', 'from', 'to'] as const) if (n[k]) p.set(k, n[k]!);
    if (n.redactedOnly) p.set('red', '1');
    if (n.noBoxOnly) p.set('nobox', '1');
    if (p.toString() !== new URLSearchParams(window.location.search).toString()) setSp(p, { replace: true });
  };
  const [sort, setSort] = useState<{ key: LedgerSortKey; dir: 'asc' | 'desc' }>({ key: 'order', dir: 'desc' });
  const rows = c.data?.rows ?? [];
  const wallets = useMemo(() => [...new Set(rows.map((r) => r.wallet).filter((x): x is string => !!x))], [rows]);
  const types = useMemo(() => [...new Set(rows.map((r) => r.type))], [rows]);
  const shown = useMemo(() => sortLedger(filterLedger(rows, f), sort.key, sort.dir), [rows, f, sort]);
  const sum = useMemo(() => expenseSum(shown), [shown]);
  const set = <K extends keyof LedgerFilter>(k: K, v: LedgerFilter[K]): void => setF((x) => ({ ...x, [k]: v }));
  const dirty = JSON.stringify(f) !== JSON.stringify(EMPTY_LEDGER_FILTER);
  return (
    <ContentPage c={c} title="السجل المالي الكامل" icon="database" label="السجل المالي الكامل" sub="كل صفوف السجل من راشد — للقراءة فقط (لا تعديل ولا حذف من هنا).">
      {(d) => (
        <>
          <div className="life-alert warn" role="note">
            <Icon name="shield" size={20} />
            <div>
              <strong>محلي فقط: لا تشارك هذه الصفحة.</strong> الملاحظات قد تحتوي أسماء أشخاص. {d.redacted_row_count ? `في ${d.redacted_row_count} صفوف استُبدل اسم خدمة بعبارة «أداة ذكاء اصطناعي» في النص (الأرقام والتواريخ كما هي).` : ''}
              {d.source_quirks_ar && <details className="safety-more"><summary>ملاحظة عن المصدر</summary><p>{d.source_quirks_ar}</p></details>}
            </div>
          </div>
          <Card>
            <CardHead title="بحث وتصفية" icon="search">{dirty && <Button size="sm" variant="ghost" icon="x" onClick={() => setF(EMPTY_LEDGER_FILTER)}>مسح</Button>}</CardHead>
            <div className="ledger-filters">
              <Field label="بحث (المعرّف، النص، المبلغ…)" htmlFor="lg-q"><input id="lg-q" className="input" type="search" value={f.q} maxLength={80} onChange={(e) => set('q', e.target.value)} /></Field>
              <Field label="النوع" htmlFor="lg-type"><select id="lg-type" className="select" value={f.type ?? ''} onChange={(e) => set('type', e.target.value || null)}><option value="">الكل</option>{types.map((t) => <option key={t} value={t}>{LEDGER_TYPE_AR[t] ?? t}</option>)}</select></Field>
              <Field label="الصندوق" htmlFor="lg-w"><select id="lg-w" className="select" value={f.wallet ?? ''} onChange={(e) => set('wallet', e.target.value || null)}><option value="">الكل</option>{wallets.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
              <Field label="من تاريخ" htmlFor="lg-from"><input id="lg-from" className="input" type="date" value={f.from ?? ''} onChange={(e) => set('from', e.target.value || null)} /></Field>
              <Field label="إلى تاريخ" htmlFor="lg-to"><input id="lg-to" className="input" type="date" value={f.to ?? ''} onChange={(e) => set('to', e.target.value || null)} /></Field>
            </div>
            <ul className="chips" style={{ marginBlockStart: 'var(--s-3)' }}>
              <li><button type="button" className="chip" aria-pressed={f.noBoxOnly} onClick={() => set('noBoxOnly', !f.noBoxOnly)}>مصروف بدون صندوق</button></li>
              <li><button type="button" className="chip" aria-pressed={f.redactedOnly} onClick={() => set('redactedOnly', !f.redactedOnly)}>نص مُعدَّل</button></li>
            </ul>
          </Card>
          <p role="status" aria-live="polite" style={{ margin: 0 }}>
            يعرض <b className="num">{shown.length}</b> من <b className="num">{rows.length}</b> صفًّا (عدد صفوف السجل <b className="num">{d.total_rows}</b>){rows.length !== d.total_rows && <> <Badge tone="danger">العدد في الملف لا يطابق الصفوف</Badge></>}
            {sum.count > 0 && <> · مجموع مبالغ المصروفات المعروضة ({sum.count}): <b className="num">{money(sum.total)}</b> <TagBadge tag="محسوب" /></>}
          </p>
          {shown.length === 0 ? <EmptyState icon="search" title="لا صفوف بهذه التصفية" text="خفّف التصفية أو امسحها." action={<Button onClick={() => setF(EMPTY_LEDGER_FILTER)}>مسح التصفية</Button>} /> : (
            <div className="life-tbl-wrap" role="region" aria-label="جدول السجل المالي" tabIndex={0}>
              <table className="life-tbl ledger-tbl">
                <thead>
                  <tr>
                    {COLS.map((col) => (
                      <th key={col.key} scope="col" aria-sort={sort.key === col.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                        <button type="button" className="th-btn" onClick={() => setSort((s) => ({ key: col.key, dir: s.key === col.key && s.dir === 'desc' ? 'asc' : 'desc' }))}>{col.label}{sort.key === col.key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}</button>
                      </th>
                    ))}
                    <th scope="col">الأثر على الصندوق</th>
                    <th scope="col">الملاحظة</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.event_id}>
                      <td className="num">{r.order}</td>
                      <td>{fmtDayFull(r.date)}</td>
                      <td>{LEDGER_TYPE_AR[r.type] ?? r.type}</td>
                      <td className="num"><bdi>{money(r.amount)}</bdi></td>
                      <td>{r.wallet ?? <Badge dashed>غير مسجل</Badge>}</td>
                      <td className="num">
                        {typeof r.cash_delta !== 'number' ? <Badge dashed>غير مسجل</Badge> : r.type === 'expense' && r.cash_delta === 0 ? <Badge dashed title="لم يُطبق على صندوق؛ وليس أن المبلغ لم يخرج">بدون صندوق</Badge> : <bdi>{r.cash_delta > 0 ? '+' : ''}{money(r.cash_delta)}</bdi>}
                      </td>
                      <td className="ledger-note"><bdi dir="ltr" className="muted ledger-id">{r.event_id}</bdi><br /><NoteCell text={r.notes} />{r.text_redacted && <> <Badge dashed>نص مُعدَّل</Badge></>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="muted rv-fine">الأثر على الصندوق: «بدون صندوق» يعني أن راشد لم يُطبّق المصروف على أي صندوق بعد، وليس أن المبلغ لم يخرج.</p>
        </>
      )}
    </ContentPage>
  );
}

/** ملاحظات السجل قد تكون طويلة (تحديثات متعددة): نقصّها إلى 3 أسطر مع «المزيد». */
function NoteCell({ text }: { text?: string | undefined }) {
  const [open, setOpen] = useState(false);
  if (!text) return <span className="muted">—</span>;
  const long = text.length > 140;
  return (
    <>
      <span className={long && !open ? 'ledger-clamp' : undefined}>{text}</span>
      {long && <button type="button" className="th-btn ledger-more" aria-expanded={open} onClick={() => setOpen((x) => !x)}>{open ? ' أقل' : ' المزيد'}</button>}
    </>
  );
}
