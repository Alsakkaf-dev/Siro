import { plainText } from '../../../shared/plain.js';
import type { ReactNode } from 'react';
import { Icon, type IconName } from '../lib/icons.js';
import { Badge, Card, CardHead } from '../ui/ui.js';
import { Term } from '../glossary/glossary.js';
import { fmtAt } from '../life/lifeKit.js';
import { TAG_TERM, type FreshRow, type Tag, type Val } from '../../../shared/weekly.js';

const CLS: Record<Tag, string> = { 'مثبت': 't-proven', 'محسوب': 't-calc', 'افتراض': 't-assumed', 'غير مسجل': 't-none' };
/** شارة الثقة: كل واحدة تفتح شرحها من GLOSSARY_AR.json (conf_*). */
export function TagBadge({ tag, title }: { tag: Tag; title?: string }) {
  return (
    <Term id={TAG_TERM[tag]} bare>
      {tag === 'مثبت' || tag === 'محسوب' ? <span className={`trust-dot ${CLS[tag]}`} role="img" aria-label={tag} title={title ? `${tag} — ${title}` : tag} /> : <span className={`trust ${CLS[tag]}`} title={title}>{tag}</span>}
    </Term>
  );
}
/** قيمة بوسمها. النص null ⇒ الشارة «غير مسجل» وحدها (لا صفر ولا شرطة). */
export function V({ text, tag, field, dir }: { text: ReactNode | null; tag: Tag; field?: string; dir?: 'ltr' }) {
  if (text === null || text === undefined || tag === 'غير مسجل') return <TagBadge tag="غير مسجل" title={field ? `الحقل: ${plainText(field).replace(/ › /g, ' ← ')}` : undefined} />;
  return <><bdi className="num" dir={dir}>{text}</bdi> <TagBadge tag={tag} title={field ? `الحقل: ${plainText(field).replace(/ › /g, ' ← ')}` : undefined} /></>;
}
export const VN = ({ v, suffix = '', fmt }: { v: Val<number>; suffix?: string; fmt?: (n: number) => string }) => <V text={v.value === null ? null : `${fmt ? fmt(v.value) : v.value}${suffix}`} tag={v.tag} field={v.field} />;

/** قسم بترويسة: وقت generated_at لكل ملف، وشارة «قديم» إن تجاوز stale_after_hours. */
export function Section({ id, title, icon, files, children, aside }: { id: string; title: string; icon: IconName; files: (FreshRow | undefined)[]; children: ReactNode; aside?: ReactNode }) {
  const rows = files.filter((f): f is FreshRow => !!f);
  return (
    <Card id={id} className="rv-sec">
      <CardHead title={title} icon={icon}>{aside}</CardHead>
      {rows.length > 0 && (
        <p className="rv-src muted">
          {rows.map((f) => (
            <span key={f.name} className="rv-src-i">
              {f.label} · {f.generated_at ? fmtAt(f.generated_at) : 'وقت التوليد غير مسجل'}
              {f.stale && <> <Badge tone={f.state === 'expired' || f.state === 'unavailable' ? 'danger' : 'warn'}><Icon name="warn" size={11} /> قديم</Badge></>}
            </span>
          ))}
        </p>
      )}
      {children}
    </Card>
  );
}
export function Tbl({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="life-tbl-wrap" role="region" aria-label={label} tabIndex={0}>
      <table className="life-tbl rv-tbl">{children}</table>
    </div>
  );
}
export const H3 = ({ children }: { children: ReactNode }) => <h3 className="rv-h">{children}</h3>;
